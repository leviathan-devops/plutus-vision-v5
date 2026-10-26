/**
 * E3 — the setups. Geometry in code; semantics in the chain.
 * E3 owns exactly four numbers: entry, SL, TP, RRR. Everything else is cited.
 */
import type { Setup, ShapeLink, Zone } from "../card/schema";
import { Fatal, answer, ask, decide, perItem, type Policy, type Question } from "../steps/clef";

export interface GeometryInput {
  redFolderOnDay: boolean;
  shapeAligned: boolean;
  anchorZone: Zone;
  anchorTf: "1H" | "30m" | "15m";
  direction: "LONG" | "SHORT";
  day: string;
  session: string;
  category: string;
  path: Zone[];
}

const BUFFER_PIPS = 3;
const PIP = 0.0001;

export const KILL = {
  rrrFloor: 2.5,
  confidenceGate: 65,
  weeklyCap: 8,
  dailyCap: 3,
} as const;

export function geometry(g: GeometryInput): Setup {
  if (!["1H", "30m", "15m"].includes(g.anchorTf)) throw new Fatal("E3_ANCHOR_TF_INVALID", { tf: g.anchorTf });
  const z = g.anchorZone;
  const entry = g.direction === "LONG" ? z.bottom : z.top;
  const sl = g.direction === "LONG" ? z.bottom - BUFFER_PIPS * PIP : z.top + BUFFER_PIPS * PIP;
  const opposing = g.path
    .filter((p) => p.id !== z.id)
    .filter((p) => (g.direction === "LONG" ? p.mid > entry : p.mid < entry))
    .sort((a, b) => Math.abs(a.mid - entry) - Math.abs(b.mid - entry))[0];
  if (!opposing) throw new Fatal("E3_TP_NULL", { zone: z.id });
  const tp = opposing.mid;
  const rrr = Math.abs(tp - entry) / Math.abs(entry - sl);
  if (!Number.isFinite(rrr) || rrr <= 0) throw new Fatal("E3_GEOMETRY_INVALID", {});

  const setup: Setup = {
    id: `s-${z.id}-${g.day}`, direction: g.direction, entry, sl, tp, rrr,
    confidence: 0, tier: "REJECT", anchor_zone: z.id, day: g.day,
    session: g.session, category: g.category, clauses: {},
  };
  setup.confidence = composite(setup, z, g.redFolderOnDay, g.shapeAligned);
  setup.tier = tierOf(setup);
  return setup;
}

/** The operator's 0-100 composite. All terms are code; the model never supplies a number. */
export function composite(s: Setup, z: Zone, redFolderOnDay: boolean, shapeAligned: boolean): number {
  const base = (Math.min(12, z.confluence) / 12) * 40;
  const option = (Math.min(3.5, z.receipt.tier_inputs.notional_b) / 3.5) * 20;
  const shape = shapeAligned ? 20 : 0;
  const redFolder = redFolderOnDay ? 10 : 0;
  const zfp = (1 - z.zfp / 100) * 10;
  const bom = z.bom_mom === "BoM" ? -10 : z.bom_mom === "MoM" ? 10 : 0;
  return Math.min(100, base + option + shape + redFolder + zfp + bom);
}

export function tierOf(s: Setup): Setup["tier"] {
  if (s.confidence >= 90 && s.rrr >= 3.0) return "GOD_TIER";
  if (s.confidence >= 80 && s.rrr >= 2.5) return "HIGH";
  if (s.confidence >= 65 && s.rrr >= 2.0) return "STANDARD";
  return "REJECT";
}

export function killClauses(
  s: Setup, dayCount: number, weekCount: number, seen: Set<string>,
): { code: string; detail: Record<string, unknown> } | null {
  if (s.rrr < KILL.rrrFloor) return { code: "E3_RRR_BELOW_FLOOR", detail: { rrr: s.rrr } };
  if (s.confidence < KILL.confidenceGate) return { code: "E3_CONFIDENCE_BELOW_GATE", detail: { confidence: s.confidence } };
  if (s.tier !== "GOD_TIER" && s.tier !== "HIGH") return { code: "E3_TIER_NOT_EMITTABLE", detail: { tier: s.tier } };
  if (dayCount >= KILL.dailyCap) return { code: "E3_DAILY_CAP", detail: { dayCount } };
  if (weekCount >= KILL.weeklyCap) return { code: "E3_WEEKLY_CAP", detail: { weekCount } };
  if (seen.has(`${s.anchor_zone}|${s.direction}|${s.day}`)) return { code: "E3_DUPLICATE", detail: {} };
  return null;
}

export const Q_E3A: Question[] = [
  { id: "D1", type: "noul", requires: ["setups[].anchor_zone", "chain[].target"],
    instructions: "Is setup.entry_anchor the same structural element as the chain's day anchor, same zone id and edge?",
    criteria: { true: "identical zone and edge", false: "any differs" } },
  { id: "D2", type: "noul", requires: ["setups[].sl", "zones[].top", "zones[].bottom"],
    instructions: "Would setup.sl be taken out by the structure that created the setup before the entry fills?",
    criteria: { true: "the structure sits beyond the SL", false: "the SL is inside the noise" } },
  { id: "D3", type: "noul", requires: ["setups[].tp", "chain"],
    instructions: "Is setup.tp the nearest opposing zone the chain path must traverse before Friday close?",
    criteria: { true: "nearest opposing on the path", false: "farther, or off the path" } },
  { id: "D4", type: "noul", requires: ["setups[].direction", "chain[].direction"],
    instructions: "Does setup.direction agree with the chain day direction?",
    criteria: { true: "agree", false: "disagree" } },
  { id: "D5", type: "score", requires: ["setups[].confidence", "zones[].zfp"],
    instructions: "How high-probability is this setup given confluence, degree, ZFP and the chain path?",
    criteria: ["rejected", "weak", "standard", "high", "god"] },
];

export const Q_E3B: Question[] = [
  { id: "D6", type: "noul", requires: ["setups[].anchor_zone", "setups[].direction"],
    instructions: "Is this setup materially the same as any setup in existing, same anchor family and direction?",
    criteria: { true: "duplicate", false: "distinct" } },
  { id: "D7", type: "noul", requires: ["setups[].anchor_zone", "zones[].role"],
    instructions: "Does the entry zone role make this a valid reaction point for the setup category?",
    criteria: { true: "valid", false: "not" } },
];

export async function e3Setups(
  env: Env, run: string, zones: Zone[], chain: ShapeLink[], cands: Setup[], policy: Policy,
): Promise<{ setups: Setup[]; refusals: { id: string; code: string; detail: Record<string, unknown> }[] }> {
  const refusals: { id: string; code: string; detail: Record<string, unknown> }[] = [];
  if (!cands.length) return { setups: [], refusals: [{ id: "week", code: "E3_NO_SETUPS", detail: {} }] };

  if (cands.length > 8) throw new Fatal("E3_CANDIDATE_OVERFLOW", { n: cands.length });
  const subj = (s: Setup) => ({ setup_id: s.id, anchor_zone: s.anchor_zone });
  const a = await ask(env, run, "E3-STAGE-A", "1.0.0", { zones, chain, setups: cands },
    perItem(Q_E3A, cands, subj), policy);

  const survivors: Setup[] = [];
  for (const s of cands) {
    const clauses = {
      D1: answer(a, `${s.id}.D1`), D2: answer(a, `${s.id}.D2`),
      D3: answer(a, `${s.id}.D3`), D4: answer(a, `${s.id}.D4`),
    };
    const d5 = answer(a, `${s.id}.D5`);            // score level 0..4
    s.clauses = { ...clauses, D5: d5 };
    if (clauses.D2 < 0.8 || clauses.D3 < 0.8 || d5 < 2) {
      refusals.push({ id: s.id, code: "E3_VETO", detail: { D2: clauses.D2, D3: clauses.D3, D5: d5 } });
      continue;
    }
    const v = decide(clauses, policy);
    if (v.kind !== "ALLOW") {
      refusals.push({ id: s.id, code: "E3_CLAUSE_FAILED", detail: { weakest: v.weakest, p: v.overall } });
      continue;
    }
    survivors.push(s);
  }
  if (!survivors.length) return { setups: [], refusals };

  const b = await ask(env, run, "E3-STAGE-B", "1.0.0", { zones, chain, setups: survivors },
    perItem(Q_E3B, survivors, subj), policy);
  const emitted: Setup[] = [];
  for (const s of survivors) {
    const d6 = answer(b, `${s.id}.D6`);
    const d7 = answer(b, `${s.id}.D7`);
    if (d6 > 0.8) { refusals.push({ id: s.id, code: "E3_DUPLICATE", detail: { D6: d6 } }); continue; }
    if (d7 < 0.8) { refusals.push({ id: s.id, code: "E3_REACTION_INVALID", detail: { D7: d7 } }); continue; }
    s.clauses = { ...s.clauses, D6: d6, D7: d7 };
    emitted.push(s);
  }

  const sorted = emitted.sort((x, y) => y.confidence - x.confidence);
  const capped: Setup[] = [];
  const perDay: Record<string, number> = {};
  for (const s of sorted) {
    const used = s.day in perDay ? (perDay[s.day] as number) : 0;   // a day not yet seen has 0 setups — a count, not a substitute
    if (capped.length >= KILL.weeklyCap || used >= KILL.dailyCap) {
      refusals.push({ id: s.id, code: used >= KILL.dailyCap ? "E3_DAILY_CAP" : "E3_WEEKLY_CAP", detail: {} });
      continue;
    }
    perDay[s.day] = used + 1;
    capped.push(s);
  }
  return { setups: capped, refusals };
}
