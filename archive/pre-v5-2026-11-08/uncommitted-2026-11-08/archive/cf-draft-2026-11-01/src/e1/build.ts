/**
 * E1 — the zone map. Code computes; a chain attests.
 * Every number here is arithmetic over declared inputs. The judge sees the RECEIPT.
 */
import type { Role, Zone } from "../card/schema";
import { Fatal, answer, ask, decide, perItem, sha256, type Policy, type Question } from "../steps/clef";
import { must } from "../steps/errors";
import { compute, crosscheck, validate, type ZoneIn } from "./zfp";
import { contextFor, failedBeforeAnchor, type ContextInputs } from "./context";

export interface Bars {
  ts: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
}

export interface Level {
  price: number;
  type: string;
  tf: "4H" | "1H" | "30m";
}

const TOL_FRAC = 0.00004;
const GRID = 0.5;

export function pivots(bars: Bars, type: string, tf: Level["tf"]): Level[] {
  const out: Level[] = [];
  for (let i = 2; i < bars.high.length - 2; i++) {
    const h = must(bars.high[i], "E1_BAR_INDEX", { i });
    const l = must(bars.low[i], "E1_BAR_INDEX", { i });
    if (h === Math.max(...bars.high.slice(i - 2, i + 3))) out.push({ price: h, type, tf });
    if (l === Math.min(...bars.low.slice(i - 2, i + 3))) out.push({ price: l, type, tf });
  }
  return out;
}

export function ema200(bars: Bars): number | undefined {
  if (bars.close.length < 200) return undefined;
  const k = 2 / 201;
  let e = bars.close.slice(0, 200).reduce((a, b) => a + b, 0) / 200;
  for (const c of bars.close.slice(200)) e = c * k + e * (1 - k);
  return e;
}

export function orderBlocks(bars: Bars): Level[] {
  const out: Level[] = [];
  for (let i = 1; i < bars.close.length - 1; i++) {
    const prev = must(bars.close[i - 1], "E1_BAR_INDEX", { i });
    const cur = must(bars.close[i], "E1_BAR_INDEX", { i });
    const next = must(bars.close[i + 1], "E1_BAR_INDEX", { i });
    if (prev > cur && next > cur) out.push({ price: must(bars.low[i], "E1_BAR_INDEX", { i }), type: "ob_4h", tf: "4H" });
    if (prev < cur && next < cur) out.push({ price: must(bars.high[i], "E1_BAR_INDEX", { i }), type: "ob_4h", tf: "4H" });
  }
  return out;
}

export function levels(bars4h: Bars, bars1h: Bars, bars30m: Bars): Level[] {
  const out: Level[] = [];
  for (const [bars, tf] of [[bars4h, "4H"], [bars1h, "1H"], [bars30m, "30m"]] as const) {
    out.push(...pivots(bars, "weekly_swing", tf));
    const e = ema200(bars);
    if (e !== undefined) out.push({ price: e, type: "ema200", tf });
    out.push(...orderBlocks(bars));
    const lo = Math.min(...bars.low);
    const hi = Math.max(...bars.high);
    for (let g = Math.floor(lo / GRID) * GRID; g <= hi; g += GRID)
      out.push({ price: g, type: "round", tf });
  }
  if (!out.length) throw new Fatal("E1_NO_LEVELS", {});
  return out;
}

export interface Cluster {
  mid: number;
  top: number;
  bottom: number;
  members: Level[];
}

export function cluster(ls: Level[], tol: number): Cluster[] {
  const out: Cluster[] = [];
  for (const l of [...ls].sort((a, b) => a.price - b.price)) {
    const last = out[out.length - 1];
    if (last && Math.abs(l.price - last.mid) <= tol) {
      last.members.push(l);
      last.mid = last.members.reduce((a, m) => a + m.price, 0) / last.members.length;
      last.top = Math.max(last.top, l.price);
      last.bottom = Math.min(last.bottom, l.price);
    } else {
      out.push({ mid: l.price, top: l.price, bottom: l.price, members: [l] });
    }
  }
  return out;
}

export function confluence(c: Cluster): number {
  const types = new Set(c.members.map((m) => m.type));
  let s = types.size + Math.min(1, 0.5 * (c.members.length - types.size));
  if (types.has("weekly_swing")) s += 2;
  if (types.has("daily_liquidity")) s += 1;
  if (s < 0 || s > 14) throw new Fatal("E1_CONFLUENCE_OUT_OF_RANGE", { s });
  return s;
}

export const DEGREE: Record<number, string> = {
  14: "EXTREME", 13: "EXTREME", 12: "EXTREME",
  11: "HEAVY", 10: "HEAVY",
  9: "MODERATE-HEAVY", 8: "MODERATE-HEAVY",
  7: "MODERATE", 6: "MODERATE",
  5: "LIGHT", 4: "LIGHT",
  3: "MINIMAL", 2: "MINIMAL", 1: "MINIMAL", 0: "MINIMAL",
};

export function assignRoles(zones: Zone[], spot: number): Zone[] {
  const above = zones.filter((z) => z.mid > spot).sort((a, b) => a.mid - b.mid);
  const below = zones.filter((z) => z.mid <= spot).sort((a, b) => b.mid - a.mid);
  const eq = [...zones].sort((a, b) => Math.abs(a.mid - spot) - Math.abs(b.mid - spot))[0];
  const ceiling = above[above.length - 1];
  const ksb = below[0];
  const upper = above[0];
  const midSupport = below[1];
  if (!eq || !ceiling || !ksb || !upper || !midSupport) throw new Fatal("E1_ROLE_MISSING", {});
  const role = (z: Zone, r: Role) => { z.role = r; };
  role(eq, "EQUILIBRIUM ZONE");
  role(ceiling, "CEILING");
  role(ksb, "KEY SUPPORT BAND");
  role(upper, "UPPER RESISTANCE");
  role(midSupport, "MID-RANGE SUPPORT");
  const five = [eq, ceiling, ksb, upper, midSupport];
  if (new Set(five.map((z) => z.id)).size !== 5) throw new Fatal("E1_ROLE_COUNT", {});
  return zones;
}

export function e1Build(
  bars4h: Bars,
  bars1h: Bars,
  bars30m: Bars,
  inp: Omit<ContextInputs, "spot" | "b1">,
): Zone[] {
  if (bars4h.close.length < 200) throw new Fatal("W1_4H_SHORT", { n: bars4h.close.length });
  const spot = must(bars1h.close[bars1h.close.length - 1], "W1_1H_EMPTY", {});
  if (!Number.isFinite(spot)) throw new Fatal("W1_BARS_INVALID", {});
  const ctxIn: ContextInputs = { ...inp, spot, b1: bars1h };
  const tol = spot * inp.tolFrac;

  const clusters = cluster(levels(bars4h, bars1h, bars30m), tol);
  if (!clusters.length) throw new Fatal("E1_NO_ZONES", {});
  if (inp.walls.strikes.length === 0) throw new Fatal("W2_NO_STRIKES", {});

  const draft = clusters.map((c, i) => {
    const types = [...new Set(c.members.map((m) => m.type))];
    const conf = confluence(c);
    let nearest = 0;
    for (let k = 1; k < inp.walls.strikes.length; k++)
      if (Math.abs(must(inp.walls.strikes[k], "W2_I1_ALIGNMENT", { k }) - c.mid) <
          Math.abs(must(inp.walls.strikes[nearest], "W2_I1_ALIGNMENT", { k }) - c.mid)) nearest = k;
    const zin: ZoneIn = {
      id: `z${i}`, top: c.top + tol / 2, bottom: c.bottom - tol / 2,
      pillarTypes: types, confluent: conf >= 8,
      structuralMemory: types.some((t) => t === "weekly_swing" || t === "ob_4h"),
      direction: c.mid > spot ? "up" : "down",
    };
    return { c, zin, conf, notional: must(inp.walls.notionals_b[nearest], "W2_I1_ALIGNMENT", { nearest }) };
  });

  // Pass 1 — the cascade-free ZFP of every zone. By definition a cascade cannot be triggered by a
  // cascade, so a failed zone contributes the ZFP it carries without that modifier.
  const failed = failedBeforeAnchor(draft.map((d) => d.zin), bars1h, inp.window);
  const pass1 = new Map<string, number>();
  for (const d of draft) pass1.set(d.zin.id, compute(d.zin, contextFor(d.zin, d.notional, ctxIn, [])).zfp);
  const prior = draft
    .filter((d) => failed.has(d.zin.id))
    .map((d) => ({ zfp: must(pass1.get(d.zin.id), "E1_PASS1_MISSING", { id: d.zin.id }), direction: d.zin.direction }));

  // Pass 2 — the receipts that ship.
  const zones: Zone[] = draft.map((d) => {
    const receipt = compute(d.zin, contextFor(d.zin, d.notional, ctxIn, prior));
    validate(receipt);
    const degree = must(DEGREE[Math.floor(d.conf)], "E1_DEGREE_UNMAPPED", { conf: d.conf });
    crosscheck(receipt, degree);
    return {
      id: d.zin.id, top: d.zin.top, bottom: d.zin.bottom, mid: d.c.mid,
      confluence: d.conf, degree, role: "EQUILIBRIUM ZONE", pillars: d.zin.pillarTypes,
      zfp: receipt.zfp, receipt, levels_in_band: d.c.members.map((m) => m.price),
      poi_tier: d.zin.pillarTypes.length >= 3 ? 1 : d.zin.pillarTypes.length === 2 ? 2 : 3,
      bom_mom: "UNATTESTED",
    };
  });

  const zs = zones.map((z) => z.zfp);
  const mean = zs.reduce((a, b) => a + b, 0) / zs.length;
  const sd = Math.sqrt(zs.reduce((a, b) => a + (b - mean) ** 2, 0) / zs.length);
  if (zs.length >= 3 && sd < 1) throw new Fatal("E1_ZFP_FLAT", { sd });
  return assignRoles(zones, spot);
}

export const Q_E1A: Question[] = [
  { id: "Z1", type: "noul", requires: ["zones[].pillars", "zones[].levels_in_band"],
    instructions: "For every entry in zone.pillars, does the evidence contain at least one level of that type inside the zone band?",
    criteria: { true: "every claimed pillar is backed in-range", false: "at least one is not" } },
  { id: "Z2", type: "noul", requires: ["zones[].receipt.modifiers"],
    instructions: "For every modifier with fired true, does its gate string state evidence that satisfies that modifier's rule in canon.b2?",
    criteria: { true: "every fired gate is satisfied", false: "at least one is not" } },
  { id: "Z3", type: "noul", requires: ["zones[].receipt.modifiers"],
    instructions: "For every modifier with fired false, does its gate string name a condition that is absent from the zone and bars summary?",
    criteria: { true: "every declined gate names a real absence", false: "a declined condition was present" } },
  { id: "Z4", type: "noul", requires: ["zones[].receipt.tier_inputs", "zones[].receipt.tier"],
    instructions: "Does zone.receipt.tier satisfy every conjunct of its canon definition on the tier inputs shown?",
    criteria: { true: "every conjunct holds", false: "at least one does not" } },
];

export async function attestZones(
  env: Env, run: string, zones: Zone[], policy: Policy,
): Promise<Zone[]> {
  if (zones.length === 0) throw new Fatal("E1_NO_ZONES", {});
  if (zones.length > 16) throw new Fatal("E1_ATTEST_BATCH", { n: zones.length, max: 16 });
  const state = { run, zones: zones.map((z) => ({
    id: z.id, pillars: z.pillars, levels_in_band: z.levels_in_band,
    receipt: z.receipt, tier: z.receipt.tier, tier_inputs: z.receipt.tier_inputs,
  })) };
  const questions = perItem(Q_E1A, zones, (z) => ({ zone_id: z.id }));
  const a = await ask(env, run, "E1-ATTEST-A", "1.0.0", state, questions, policy);
  const kept: Zone[] = [];
  for (const z of zones) {
    const clauses = {
      Z1: answer(a, `${z.id}.Z1`), Z2: answer(a, `${z.id}.Z2`),
      Z3: answer(a, `${z.id}.Z3`), Z4: answer(a, `${z.id}.Z4`),
    };
    const v = decide(clauses, policy);
    z.attest = { vector: clauses, score: v.overall, verdict: v.kind };
    if (v.kind === "ALLOW") kept.push(z);
  }
  if (kept.length / zones.length < 0.8)
    throw new Fatal("E1_ATTESTATION_DRIFT", { kept: kept.length, of: zones.length });
  if (kept.length < 5) throw new Fatal("E1_TOO_FEW_ZONES", { kept: kept.length });
  return kept;
}

export const zoneMapHash = (zones: Zone[]): Promise<string> =>
  sha256(JSON.stringify(zones.map((z) => ({ id: z.id, zfp: z.zfp, role: z.role }))));
