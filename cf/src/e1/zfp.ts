/**
 * ZFP — fail-closed. Port of the verified Python (24/24 mutations, 3 calibration controls).
 * No default tier. No coercion. No NaN. Boolean gates at fixed points. Clamp 0..99 half-up.
 */
import type { Modifier, Receipt, Tier } from "../card/schema";
import { Fatal } from "../steps/errors";

export const TIER_BAND: Record<Tier, [number, number]> = {
  HARD_WALL: [5, 15],
  STANDARD_WALL: [15, 30],
  POST_EXPIRY_GHOST: [20, 40],
  SOFT_WALL: [30, 50],
  ONE_TOUCH: [50, 70],
};

export const MOD_POINT = {
  spring_release: 25,
  macro_catalyst: 20,
  momentum: 15,
  cross_pair: 20,
  cascade: 25,
  regime_change: 20,
} as const;

export const MOD_ORDER = [
  "spring_release", "macro_catalyst", "momentum", "cross_pair", "cascade", "regime_change",
] as const;

export const PILLARS = new Set([
  "round", "ema200", "weekly_swing", "ob_4h", "daily_liquidity", "cluster",
  "intraday_swing", "minor", "institutional_pressure", "prior_day", "supply_demand",
]);

const RAW_MAX = 185;

export const PAIR_LEGS: Record<string, string[]> = {
  DXY: ["USD", "EUR", "JPY", "GBP", "CAD", "CHF"],
  EURUSD: ["EUR", "USD"],
  GBPUSD: ["GBP", "USD"],
  AUDUSD: ["AUD", "USD"],
};
const halfUp = (x: number): number => Math.floor(x + 0.5);

export interface TierInputs {
  notional_b: number;
  pillars: number;
  confluent: boolean;
  structural_memory: boolean;
  expiry_before_week: boolean;
}

export interface GateCtx {
  pair: string;
  notional_b: number;
  spot: number;
  expiryTs: number;
  strikeRangePct: number;
  events: { ts: number; impact: "high" | "medium" | "low"; currency: string }[];
  momentumK: number;
  roc5: number;
  atr20: number;
  toward: -1 | 0 | 1;
  crossMids: Record<string, number[]>; // sibling zone positions in their week range, 0..1
  zonePos: number;                      // this zone's position in its own week range, 0..1
  tol: number;
  priorFailures: { zfp: number; direction: "up" | "down" }[];
  ema200Crossed: boolean;
  weekStart: number;
  weekEnd: number;
}

export interface ZoneIn {
  id: string;
  top: number;
  bottom: number;
  pillarTypes: string[];
  confluent: boolean;
  structuralMemory: boolean;
  direction: "up" | "down";
}

const fin = (x: number, name: string): number => {
  if (!Number.isFinite(x)) throw new Fatal("ZFP_INPUT_INVALID", { name, value: x });
  return x;
};

export function classifyTier(z: ZoneIn, c: GateCtx): Tier {
  for (const p of z.pillarTypes) if (!PILLARS.has(p)) throw new Fatal("ZFP_PILLAR_UNKNOWN", { pillar: p });
  const n = new Set(z.pillarTypes).size;
  const notional = fin(c.notional_b === undefined ? NaN : c.notional_b, "notional_b");
  if (notional < 0) throw new Fatal("ZFP_INPUT_INVALID", { notional });
  if (c.expiryTs < c.weekStart && z.structuralMemory) return "POST_EXPIRY_GHOST";
  if (notional >= 1.5 && n >= 3 && z.confluent) return "HARD_WALL";
  if (notional >= 0.85 && n >= 2) return "STANDARD_WALL";
  if (notional < 0.85 && n <= 1) return "ONE_TOUCH";
  if (notional < 0.85 && n <= 2) return "SOFT_WALL";
  if (notional >= 0.85 && n < 2) return "SOFT_WALL";
  throw new Fatal("ZFP_TIER_UNCLASSIFIED", { notional, pillars: n });
}

export function compute(z: ZoneIn, c: GateCtx): Receipt {
  if (z.top <= z.bottom) throw new Fatal("ZFP_INPUT_INVALID", { top: z.top, bottom: z.bottom });
  if (c.strikeRangePct <= 0) throw new Fatal("ZFP_INPUT_INVALID", { strikeRangePct: c.strikeRangePct });
  if (c.atr20 <= 0) throw new Fatal("ZFP_INPUT_INVALID", { atr20: c.atr20 });
  if (c.tol <= 0) throw new Fatal("ZFP_INPUT_INVALID", { tol: c.tol });

  const tier = classifyTier(z, c);
  const [lo, hi] = TIER_BAND[tier];
  const base = (lo + hi) / 2;
  const mid = (z.top + z.bottom) / 2;

  const inWeek = c.weekStart <= c.expiryTs && c.expiryTs <= c.weekEnd;
  const dist = Math.abs(mid - c.spot);
  const spring = inWeek && dist <= c.spot * c.strikeRangePct;

  // The release outcome (and so its side) is unknowable at the anchor; using it would be
  // lookahead. The gate fires on a high-impact print for a leg currency inside the week.
  const legs = PAIR_LEGS[c.pair];
  if (legs === undefined) throw new Fatal("ZFP_PAIR_UNKNOWN", { pair: c.pair });
  const against = c.events.filter(
    (e) => e.impact === "high" && legs.includes(e.currency) && c.weekStart <= e.ts && e.ts <= c.weekEnd,
  );
  const macro = against.length > 0;
  const momentum = Math.abs(c.roc5) > c.momentumK * c.atr20 && c.roc5 * c.toward > 0;
  const matched = Object.values(c.crossMids).filter((ls) => ls.some((l) => Math.abs(l - c.zonePos) <= c.tol)).length;
  const cross = matched >= 2;
  const cascade = c.priorFailures.some((p) => p.direction === z.direction && p.zfp > 45);
  const regime = c.ema200Crossed;

  const fired: [keyof typeof MOD_POINT, boolean, string][] = [
    ["spring_release", spring, `expiry=${c.expiryTs} in_week=${inWeek} dist=${dist.toFixed(5)} <= ${(c.spot * c.strikeRangePct).toFixed(5)}`],
    ["macro_catalyst", macro, `against_zone_events=${against.length}`],
    ["momentum", momentum, `|ROC5|=${Math.abs(c.roc5).toFixed(5)} vs ${(c.momentumK * c.atr20).toFixed(5)} toward=${c.toward}`],
    ["cross_pair", cross, `pairs_matched=${matched} of ${Object.keys(c.crossMids).length} tol=${c.tol}`],
    ["cascade", cascade, `same_direction_prior_failures=${c.priorFailures.filter((p) => p.direction === z.direction && p.zfp > 45).length}`],
    ["regime_change", regime, `ema200_crossed_this_week=${regime}`],
  ];

  const modifiers: Modifier[] = fired.map(([name, on, gate]) => ({
    name, fired: on, value: on ? MOD_POINT[name] : 0, gate,
  }));

  const raw = base + modifiers.reduce((a, m) => a + m.value, 0);
  if (raw < 0 || raw > RAW_MAX) throw new Fatal("ZFP_OUT_OF_RANGE", { raw });
  const clamped = Math.max(0, Math.min(99, raw));
  const zfp = halfUp(clamped);
  if (zfp < 0 || zfp > 99) throw new Fatal("ZFP_OUT_OF_RANGE", { zfp });

  const receipt: Receipt = {
    base, modifiers, raw, clamped, was_clamped: raw > 99,
    zfp, tier, band: [lo, hi],
    pillar9_bucket: degreeFromZfp(zfp),
    cross_check: "consistency",
    tier_inputs: {
      notional_b: c.notional_b, pillars: new Set(z.pillarTypes).size,
      confluent: z.confluent, structural_memory: z.structuralMemory,
      expiry_before_week: c.expiryTs < c.weekStart,
    },
    formula_version: "appendix-b@2.1.0",
  };
  return receipt;
}

export const DEGREE_MID: Record<string, number> = {
  EXTREME: 5, HEAVY: 17.5, "MODERATE-HEAVY": 27.5, MODERATE: 37.5, LIGHT: 50, MINIMAL: 70,
};
export const DEGREE_ORDER = Object.keys(DEGREE_MID);

export function degreeFromZfp(z: number): string {
  let best = "EXTREME";
  for (const [d, m] of Object.entries(DEGREE_MID)) {
    const bm = DEGREE_MID[best] as number;
    if (Math.abs(m - z) < Math.abs(bm - z)) best = d;
  }
  return best;
}

export function crosscheck(receipt: Receipt, degree: string): string {
  const ri = DEGREE_ORDER.indexOf(degree);
  if (ri < 0) throw new Fatal("ZFP_DEGREE_UNKNOWN", { degree });
  const zi = DEGREE_ORDER.indexOf(degreeFromZfp(receipt.zfp));
  const verdict = Math.abs(ri - zi) <= 1 ? "consistency" : `CONFLICT degree=${degree} zfp=${receipt.zfp}`;
  receipt.cross_check = verdict;
  return verdict;
}

export function validate(r: Receipt): void {
  const [lo, hi] = TIER_BAND[r.tier];
  if (r.band[0] !== lo || r.band[1] !== hi) throw new Fatal("ZFP_BAND_MISMATCH", { band: r.band });
  if (Math.abs(r.base - (lo + hi) / 2) > 1e-9) throw new Fatal("ZFP_BASE_MISMATCH", { base: r.base });
  if (r.modifiers.map((m) => m.name).join() !== MOD_ORDER.join()) throw new Fatal("ZFP_MODIFIER_SET", {});
  for (const m of r.modifiers) {
    const want = m.fired ? MOD_POINT[m.name as keyof typeof MOD_POINT] : 0;
    if (m.value !== want) throw new Fatal("ZFP_MODIFIER_VALUE", { name: m.name, value: m.value, want });
    if (!m.gate) throw new Fatal("ZFP_MODIFIER_NO_GATE", { name: m.name });
  }
  const total = r.base + r.modifiers.reduce((a, m) => a + m.value, 0);
  if (Math.abs(total - r.raw) > 1e-9) throw new Fatal("ZFP_RAW_MISMATCH", { total, raw: r.raw });
  const clamped = Math.max(0, Math.min(99, r.raw));
  if (Math.abs(clamped - r.clamped) > 1e-9) throw new Fatal("ZFP_CLAMP_MISMATCH", {});
  if (r.was_clamped !== r.raw > 99) throw new Fatal("ZFP_CLAMP_FLAG", {});
  const want = halfUp(clamped);
  if (r.zfp !== want) throw new Fatal("ZFP_VALUE_MISMATCH", { got: r.zfp, want });
  if (r.pillar9_bucket !== degreeFromZfp(r.zfp)) throw new Fatal("ZFP_BUCKET_MISMATCH", {});
}
