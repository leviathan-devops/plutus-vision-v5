/** THE CARD — trident-workflow-v2. One document per pair per week. */
export type Role =
  | "CEILING"
  | "UPPER RESISTANCE"
  | "EQUILIBRIUM ZONE"
  | "MID-RANGE SUPPORT"
  | "KEY SUPPORT BAND";

export type Tier = "HARD_WALL" | "STANDARD_WALL" | "POST_EXPIRY_GHOST" | "SOFT_WALL" | "ONE_TOUCH";

export interface Modifier {
  name: string;
  fired: boolean;
  value: number;
  gate: string;
}

export interface Receipt {
  base: number;
  modifiers: Modifier[];
  raw: number;
  clamped: number;
  was_clamped: boolean;
  zfp: number;
  tier: Tier;
  band: [number, number];
  pillar9_bucket: string;
  cross_check: string;
  tier_inputs: {
    notional_b: number;
    pillars: number;
    confluent: boolean;
    structural_memory: boolean;
    expiry_before_week: boolean;
  };
  formula_version: string;
}

export interface Zone {
  id: string;
  top: number;
  bottom: number;
  mid: number;
  confluence: number;
  degree: string;
  role: Role;
  pillars: string[];
  zfp: number;
  receipt: Receipt;
  levels_in_band: number[];
  poi_tier: number;
  bom_mom: "BoM" | "MoM" | "UNATTESTED";
  attest?: { vector: Record<string, number>; score: number; verdict: string };
}

export interface ShapeLink {
  id: string;
  shape: string;
  target: string;
  target_zfp: number;
  direction: "up" | "down";
  start_ts: number;
  end_ts: number;
  confidence: number;
  day: string;
  clauses: Record<string, number>;
}

export interface Setup {
  id: string;
  direction: "LONG" | "SHORT";
  entry: number;
  sl: number;
  tp: number;
  rrr: number;
  confidence: number;
  tier: "GOD_TIER" | "HIGH" | "STANDARD" | "REJECT";
  anchor_zone: string;
  day: string;
  session: string;
  category: string;
  clauses: Record<string, number>;
}

export interface Card {
  schema: "trident-workflow-v2";
  meta: {
    week: string;
    pair: string;
    anchor_ms: number;
    sources: Record<string, string>;
    absent: string[];
    engine: string;
  };
  zones: Zone[];
  chain: ShapeLink[];
  days: string[];
  alternative: { decision_zone: string; flip_at: number; chain: string[] } | null;
  setups: Setup[];
  refusals: { id: string; code: string; detail: Record<string, unknown> }[];
  count: { emitted: number; ceiling: number; evicted: number };
  journal_seed: { run: string };
}

export const CARD_TOKEN_CEILING = 3500;

export function assertCardBudget(card: Card): void {
  const t = Math.ceil(JSON.stringify(card).length / 4);
  if (t > CARD_TOKEN_CEILING) throw new Error(`CARD_OVERFLOW:${t}`);
}
