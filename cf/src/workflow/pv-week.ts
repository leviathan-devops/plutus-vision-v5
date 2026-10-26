/**
 * THE WORKFLOW — pv-week. A fixed graph of durable steps; no step chooses the next step.
 *
 * Workflows rules this file obeys (developers.cloudflare.com/workflows/build/rules-of-workflows):
 *   every side effect is inside step.do        -> replay never repeats a write
 *   step names are static                      -> the cache key is stable across replays
 *   a step returns <= 1 MiB of JSON            -> PNGs go to R2; steps return keys + shas
 *   steps are idempotent                       -> R2 keys are content-addressed; D1 is upsert;
 *                                                 the seal is a Durable Object that writes once
 */
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { Fatal, must } from "../steps/errors";
import { capturePage, readCapture, type Capture } from "../steps/capture";
import { extractCalendar, extractOptions, type CalEvent, type Walls } from "../steps/clairic";
import { attestZones, e1Build, type Bars } from "../e1/build";
import type { Sibling, WeekWindow } from "../e1/context";
import { e2Chain, type Candidate } from "../e2/chain";
import { e3Setups, geometry, killClauses, type GeometryInput } from "../e3/setups";
import { assertCardBudget, type Card, type Setup, type Zone } from "../card/schema";
import { POLICY } from "../gate/policy";
import { requireRulings } from "../gate/rulings";
import { candidatesFrom } from "../e2/candidates";

export interface PvParams {
  pair: string;
  week: string;          // YYYY-MM-DD, the Monday
  optionsUrl: string;    // investinglive options-expiry page for that week
  calendarUrl: string;   // the week's economic calendar
  siblings: { pair: string; inverse: boolean }[];
  knownBadSha: string[];
}

type BarSet = Record<"4H" | "1H" | "30m", Bars>;

const DAY_MS = 24 * 3600 * 1000;
const LEGS: Record<string, string[]> = {
  DXY: ["USD", "EUR", "JPY", "GBP", "CAD", "CHF"],
  EURUSD: ["EUR", "USD"], GBPUSD: ["GBP", "USD"], AUDUSD: ["AUD", "USD"],
};

export function weekWindow(week: string): WeekWindow {
  const monday = Date.parse(`${week}T00:00:00Z`);
  if (!Number.isFinite(monday) || new Date(monday).getUTCDay() !== 1)
    throw new Fatal("W0_WEEK_NOT_MONDAY", { week });
  return {
    open: monday - 2 * 3600 * 1000,          // Sunday 22:00 UTC
    anchor: monday + 8 * 3600 * 1000,        // Monday 09:00 London (BST)
    end: monday + 4 * DAY_MS + 21 * 3600 * 1000, // Friday 21:00 UTC
  };
}

function validateBars(b: Bars, tf: string, anchor: number): void {
  const n = b.ts.length;
  if (n === 0) throw new Fatal("W1_BARS_ABSENT", { tf });
  for (const k of ["open", "high", "low", "close"] as const)
    if (b[k].length !== n) throw new Fatal("W1_BARS_RAGGED", { tf, field: k });
  for (let i = 0; i < n; i++) {
    const t = must(b.ts[i], "W1_BARS_INDEX", { tf, i });
    if (i > 0 && t <= must(b.ts[i - 1], "W1_BARS_INDEX", { tf, i })) throw new Fatal("W1_BARS_UNORDERED", { tf, i });
    const o = must(b.open[i], "W1_BARS_INDEX", { i }), h = must(b.high[i], "W1_BARS_INDEX", { i });
    const l = must(b.low[i], "W1_BARS_INDEX", { i }), c = must(b.close[i], "W1_BARS_INDEX", { i });
    if (![o, h, l, c].every(Number.isFinite)) throw new Fatal("W1_BARS_INVALID", { tf, i });
    if (h < Math.max(o, c) || l > Math.min(o, c)) throw new Fatal("W1_BARS_OHLC", { tf, i });
  }
  if (must(b.ts[n - 1], "W1_BARS_INDEX", {}) * 1000 > anchor) throw new Fatal("W1_LOOKAHEAD", { tf });
}

async function readBars(env: Env, pair: string, week: string, anchor: number): Promise<BarSet> {
  const key = `bars/${pair}/${week}.json`;
  const obj = await env.R2.get(key);
  if (!obj) throw new Fatal("W1_BARS_ABSENT", { key });
  const parsed = JSON.parse(new TextDecoder().decode(await obj.arrayBuffer())) as Partial<BarSet>;
  const set = {
    "4H": must(parsed["4H"], "W1_TF_ABSENT", { pair, tf: "4H" }),
    "1H": must(parsed["1H"], "W1_TF_ABSENT", { pair, tf: "1H" }),
    "30m": must(parsed["30m"], "W1_TF_ABSENT", { pair, tf: "30m" }),
  };
  for (const tf of ["4H", "1H", "30m"] as const) validateBars(set[tf], tf, anchor);
  if (set["4H"].close.length < 200) throw new Fatal("W1_4H_SHORT", { pair, n: set["4H"].close.length });
  if (set["1H"].close.length < 300) throw new Fatal("W1_1H_SHORT", { pair, n: set["1H"].close.length });
  return set;
}

export class PvWeek extends WorkflowEntrypoint<Env, PvParams> {
  override async run(event: WorkflowEvent<PvParams>, step: WorkflowStep): Promise<{ sha: string; created: boolean }> {
    const p = event.payload;
    const runId = `pv-${p.week}-${p.pair}`;
    const w = weekWindow(p.week);
    const legs = must(LEGS[p.pair], "W0_PAIR_UNKNOWN", { pair: p.pair });
    if (p.siblings.length < 2) throw new Fatal("W0_SIBLINGS_SHORT", { have: p.siblings.length });

    // S0 · ARM — the rulings gate first: an unruled constant refuses the whole run.
    const rulings = await step.do("arm", async () => {
      const r = requireRulings();
      const now = new Date().toISOString();
      await this.env.D1.prepare(
        `INSERT INTO runs (id, pair, week, anchor_ms, status, created_at, updated_at)
         VALUES (?,?,?,?,'armed',?,?)
         ON CONFLICT(id) DO UPDATE SET status='armed', updated_at=excluded.updated_at`,
      ).bind(runId, p.pair, p.week, w.anchor, now, now).run();
      return {
        momentumK: r.momentumK.value, strikeRangePct: r.strikeRangePct.value,
        crossPairTolPct: r.crossPairTolPct.value, clusterTolFrac: r.clusterTolFrac.value,
      };
    });

    // S1 · HARVEST — subject + siblings, validated, frozen at the anchor.
    const bars = await step.do("harvest", { retries: { limit: 3, delay: "5 seconds", backoff: "linear" } },
      async () => readBars(this.env, p.pair, p.week, w.anchor));
    const siblingBars = await step.do("harvest.siblings", { retries: { limit: 3, delay: "5 seconds", backoff: "linear" } },
      async () => Promise.all(p.siblings.map(async (s) => ({ ...s, bars: await readBars(this.env, s.pair, p.week, w.anchor) }))));

    // S2/S3 · CAPTURE — Browser Run; bytes to R2, the step returns key + sha.
    const optCap: Capture = await step.do("capture.options", { retries: { limit: 3, delay: "10 seconds", backoff: "linear" } },
      async () => capturePage(this.env, p.optionsUrl, `captures/${p.week}/${p.pair}/options.png`, "table", p.knownBadSha));
    const calCap: Capture = await step.do("capture.calendar", { retries: { limit: 3, delay: "10 seconds", backoff: "linear" } },
      async () => capturePage(this.env, p.calendarUrl, `captures/${p.week}/calendar.png`, "table", p.knownBadSha));

    // S4/S5 · EXTRACT — Clairic; every invariant is a named fatal.
    const walls: Walls = await step.do("extract.options", { retries: { limit: 2, delay: "5 seconds", backoff: "constant" } },
      async () => extractOptions(this.env, await readCapture(this.env, optCap), p.pair, w.open, w.end));
    const events: CalEvent[] = await step.do("extract.calendar", { retries: { limit: 2, delay: "5 seconds", backoff: "constant" } },
      async () => extractCalendar(this.env, await readCapture(this.env, calCap), w.open, w.end));

    // S6 · E1 COMPUTE — code only.
    const zones: Zone[] = await step.do("e1.compute", async () => {
      const siblings: Sibling[] = siblingBars.map((s) => ({
        pair: s.pair, inverse: s.inverse, bars4h: s.bars["4H"], bars1h: s.bars["1H"], bars30m: s.bars["30m"],
      }));
      return e1Build(bars["4H"], bars["1H"], bars["30m"], {
        pair: p.pair, walls, events, siblings, window: w,
        momentumK: rulings.momentumK, strikeRangePct: rulings.strikeRangePct,
        crossPairTolPct: rulings.crossPairTolPct, tolFrac: rulings.clusterTolFrac,
      });
    });

    // S7 · E1 ATTEST — Clef reads the receipts.
    const attested: Zone[] = await step.do("e1.attest", async () => attestZones(this.env, runId, zones, POLICY.e1));

    // S8 · E2 CHAIN — candidates are code; Clef can only subtract.
    const chain = await step.do("e2.chain", async () => {
      const cands: Candidate[] = candidatesFrom(bars["1H"], attested, w);
      const calendar = dayKinds(events, legs, w);
      return e2Chain(this.env, runId, attested, cands, calendar, POLICY.e2);
    });

    // S9 · E3 SETUPS — geometry + kill clauses in code, then two Clef stages.
    const result = await step.do("e3.setups", async () => {
      const cands: Setup[] = [];
      const seen = new Set<string>();
      const perDay: Record<string, number> = {};
      for (const link of chain.chain) {
        const zone = must(attested.find((z) => z.id === link.target), "E3_TARGET_NOT_ATTESTED", { target: link.target });
        const g: GeometryInput = {
          anchorZone: zone, anchorTf: "1H",
          direction: link.direction === "up" ? "LONG" : "SHORT",
          day: link.day, session: "London", category: link.shape, path: attested,
          redFolderOnDay: events.some((e) => e.impact === "high" && legs.includes(e.currency) && dayOf(e.ts) === link.day),
          shapeAligned: true,
        };
        const s = geometry(g);
        const dayCount = link.day in perDay ? (perDay[link.day] as number) : 0;
        const kill = killClauses(s, dayCount, cands.length, seen);
        if (kill) continue;
        seen.add(`${s.anchor_zone}|${s.direction}|${s.day}`);
        perDay[link.day] = dayCount + 1;
        cands.push(s);
      }
      return e3Setups(this.env, runId, attested, chain.chain, cands, POLICY.e3);
    });

    // S10 · SEAL — exactly once per (pair, week).
    return step.do("seal", async () => {
      const card: Card = {
        schema: "trident-workflow-v2",
        meta: {
          week: p.week, pair: p.pair, anchor_ms: w.anchor,
          sources: { options: optCap.sha, calendar: calCap.sha, bars: `bars/${p.pair}/${p.week}.json` },
          absent: [], engine: "e1@3.0/e2@3.0/e3@3.0",
        },
        zones: attested,
        chain: chain.chain,
        days: chain.chain.map((l) => l.day),
        alternative: {
          decision_zone: must(chain.alternative[0], "E2_ALTERNATIVE_EMPTY", {}).target,
          flip_at: 45,
          chain: chain.alternative.map((l) => l.shape),
        },
        setups: result.setups,
        refusals: result.refusals,
        count: { emitted: result.setups.length, ceiling: 8, evicted: 0 },
        journal_seed: { run: runId },
      };
      assertCardBudget(card);
      const out = await this.env.WEEK_SEAL.getByName(`${p.pair}:${p.week}`).writeOnce(card);
      await this.env.R2.put(`cards/${p.week}/${p.pair}.json`, JSON.stringify(card));
      await this.env.D1.prepare(`UPDATE runs SET status='sealed', card_sha=?, updated_at=? WHERE id=?`)
        .bind(out.sha, new Date().toISOString(), runId).run();
      return out;
    });
  }
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dayOf(ts: number): string {
  return must(DAYS[new Date(ts).getUTCDay()], "W0_DAY_INDEX", { ts });
}

/** A day carrying a high-impact print for a pair leg is a new-shape day; otherwise continuation. */
export function dayKinds(events: CalEvent[], legs: string[], w: WeekWindow): Record<string, "continuation" | "new_shape"> {
  const out: Record<string, "continuation" | "new_shape"> = {
    Mon: "continuation", Tue: "continuation", Wed: "continuation", Thu: "continuation", Fri: "continuation",
  };
  for (const e of events)
    if (e.impact === "high" && legs.includes(e.currency) && e.ts >= w.open && e.ts <= w.end) {
      const d = dayOf(e.ts);
      if (d in out) out[d] = "new_shape";
    }
  return out;
}
