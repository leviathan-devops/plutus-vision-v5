/**
 * E2 — the chain. Code builds it; the model can only subtract.
 * Stage A: 4 independent nouls per candidate. Stage B: new-structure + the licensed Choice.
 * Stage C: energy + hinge zone. Then code walks, assigns days, and builds the alternative.
 */
import type { ShapeLink, Zone } from "../card/schema";
import { Fatal, answer, ask, decide, perItem, type Policy, type Question } from "../steps/clef";
import { must } from "../steps/errors";
import type { Bars } from "../e1/build";

export interface Candidate {
  id: string;
  shape: string;
  target: string;
  targetZfp: number;
  targetRole: string;
  direction: "up" | "down";
  startTs: number;
  endTs: number;
  licensed: string[];
  anatomy: {
    candles: number; bodyFrac: number; rangeRatio: number;
    wickUp: number; wickDown: number; colour: "up" | "down";
    spanCloses: number[];
  };
  prev: string | null;
  p?: number;
  vetoed?: boolean;
  day?: string;
}

const MAX_CANDIDATES = 8;
const MAX_CHAIN = 5;
const MIN_CUM = 0.25;

/** The canon's transition table, on the fine bands. */
export const TRANSITION: Record<string, string> = {
  "BS|<20": "RWL", "BS|20-30": "R", "BS|30-40": "R", "BS|60-80": "PBS", "BS|>80": "PBS",
  "SS|45-60": "BS", "SS|60-80": "BS", "SS|>80": "BS", "SS|<20": "SS", "SS|20-30": "SS",
  "R|20-30": "WL", "R|30-40": "WL", "WL|20-30": "RWL",
  "PBS|20-30": "R", "PBS|30-40": "R",
  "RWL|20-30": "SS", "RWL|30-40": "SS",
  "PWL|20-30": "R", "PWL|30-40": "R",
  "PRWL|20-30": "SS", "PRWL|30-40": "SS",
  "WLS|45-60": "BS", "WLS|60-80": "BS", "WLS|>80": "BS",
};

export function band(z: number): string {
  if (z < 20) return "<20";
  if (z < 30) return "20-30";
  if (z < 40) return "30-40";
  if (z < 45) return "40-45";
  if (z < 60) return "45-60";
  if (z < 80) return "60-80";
  return ">80";
}

const BANDS = ["<20", "20-30", "30-40", "40-45", "45-60", "60-80", ">80"];
for (const key of Object.keys(TRANSITION)) {
  const b = key.split("|")[1] ?? "";
  if (!BANDS.includes(b)) throw new Error(`E2_BAND_UNREACHABLE:${b}`);
}

/** Which shapes the canon licenses for this anatomy at this band. */
export function licensed(anatomy: Candidate["anatomy"], b: string): string[] {
  const out: string[] = [];
  if (b === "<20" && anatomy.candles <= 6 && anatomy.bodyFrac > 0.5) out.push("WL", "BS");
  if (b === "20-30" || b === "30-40") out.push("R", "SS", "PBS");
  if (b === "45-60" || b === "60-80" || b === ">80") out.push("BS", "PBS");
  return out;
}

export function anatomyOf(closes: number[], highs: number[], lows: number[], opens: number[]): Candidate["anatomy"] {
  const n = closes.length;
  const body = closes.map((c, i) => Math.abs(c - (opens[i] ?? c)));
  const rng = highs.map((h, i) => h - (lows[i] ?? h));
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const mr = mean(rng);
  if (mr <= 0) throw new Fatal("E2_ANATOMY_INVALID", {});
  return {
    candles: n,
    bodyFrac: mean(body) / mr,
    rangeRatio: mr / (mr || 1),
    wickUp: mean(highs.map((h, i) => h - Math.max(opens[i] ?? h, closes[i] ?? h))) / mr,
    wickDown: mean(lows.map((l, i) => Math.min(opens[i] ?? l, closes[i] ?? l) - l)) / mr,
    colour: must(closes[n - 1], "E2_SPAN_EMPTY", {}) >= must(opens[0], "E2_SPAN_EMPTY", {}) ? "up" : "down",
    spanCloses: closes,
  };
}

export const Q_E2A: Question[] = [
  { id: "A1", type: "noul", requires: ["candidates[].anatomy", "candidates[].licensed"],
    instructions: "Does candidate.anatomy satisfy every candle clause of at least one shape in candidate.licensed?",
    criteria: { true: "at least one licensed shape's clauses all hold", false: "none holds" } },
  { id: "A2", type: "noul", requires: ["candidates[].direction", "zone_map[].role"],
    instructions: "Does candidate.direction agree with the side of its target zone role, long into support and short into resistance?",
    criteria: { true: "the role opposes the direction", false: "same-side or neutral" } },
  { id: "A3", type: "noul", requires: ["candidates[].prev", "candidates[].startTs"],
    instructions: "Does the candidate continue from its predecessor with no time gap, no overlap, and no re-entry into a traversed zone?",
    criteria: { true: "contiguous and non-repeating", false: "otherwise" } },
  { id: "A4", type: "noul", requires: ["candidates[].anatomy.spanCloses"],
    instructions: "Do the 1H closes inside the span stay inside its high and low for at least 80 percent of its bars?",
    criteria: { true: "the closes stay inside", false: "the span is drawn around price" } },
];

export const Q_E2B: Question[] = [
  { id: "B1", type: "noul", requires: ["candidates[].prev", "zone_map[].role"],
    instructions: "Did price fail to break the previous shape's origin zone before this span began?",
    criteria: { true: "the origin held and the structure is new", false: "the previous origin broke" } },
];

export const Q_E2C: Question[] = [
  { id: "C1", type: "score", requires: ["chain"],
    instructions: "How completely does the chain conserve its energy budget?",
    criteria: ["broken", "significant leak", "minor leak", "on-contract"] },
  { id: "C2", type: "noul", requires: ["zones", "alternative"],
    instructions: "Is the alternative decision zone the one whose failure or hold would most change the week's path?",
    criteria: { true: "this is the hinge zone", false: "another matters more" } },
];

export function walk(cands: Candidate[]): Candidate[] {
  const survivors = cands.filter((c) => !c.vetoed);
  if (!survivors.length) return [];
  const seed = survivors.reduce((a, b) => (a.startTs <= b.startTs ? a : b));
  const chain: Candidate[] = [seed];
  while (chain.length < MAX_CHAIN) {
    const cur = chain[chain.length - 1];
    if (!cur) break;
    if (cur.targetZfp < 20 && cur.targetRole === "CEILING") break;
    if (Math.min(...chain.map((c) => must(c.p, "E2_UNSCORED_LINK", { id: c.id }))) < MIN_CUM) break;
    const next = survivors.find((s) =>
      s.startTs > cur.startTs && !chain.includes(s) &&
      TRANSITION[`${cur.shape}|${band(s.targetZfp)}`] === s.shape);
    if (!next) break;
    chain.push(next);
  }
  verifyOrder(chain, survivors);
  return chain;
}

export function verifyOrder(chain: Candidate[], survivors: Candidate[]): void {
  const first = chain[0];
  const earliest = survivors.reduce((a, b) => (a.startTs <= b.startTs ? a : b));
  if (first && first.startTs !== earliest.startTs) throw new Fatal("E2_CHAIN_START", {});
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const cur = chain[i];
    if (!prev || !cur) continue;
    if (cur.startTs <= prev.startTs) throw new Fatal("E2_CHAIN_ORDER", { i });
    if (chain.slice(0, i).includes(cur)) throw new Fatal("E2_CHAIN_CYCLE", { i });
  }
}

export function alternative(chain: Candidate[], all: Candidate[]): ShapeLink[] | null {
  const hinge = chain.reduce((a, b) => (Math.abs(a.targetZfp - 45) <= Math.abs(b.targetZfp - 45) ? a : b));
  const flipped = all.map((c) =>
    c === hinge ? { ...c, targetZfp: c.targetZfp >= 45 ? 10 : 50 } : c);
  const alt = walk(flipped);
  const same = alt.length === chain.length && alt.every((c, i) => c.shape === chain[i]?.shape);
  if (same) return null;
  return alt.map((c) => linkOf(c, "Mon"));
}

export function linkOf(c: Candidate, day: string): ShapeLink {
  return {
    id: c.id, shape: c.shape, target: c.target, target_zfp: c.targetZfp,
    direction: c.direction, start_ts: c.startTs, end_ts: c.endTs,
    confidence: must(c.p, "E2_UNSCORED_LINK", { id: c.id }), day, clauses: {},
  };
}

const DAY_BUDGET: Record<string, number[]> = {
  SS: [1, 1, 1, 1, 1], BS: [0, 1, 1, 1, 0], R: [1, 1, 0, 1, 1], WL: [0, 0, 1, 0, 0],
  WLS: [0, 1, 0, 1, 0], RWL: [0, 0, 1, 1, 0], PBS: [0, 1, 1, 0, 0], RS: [0, 1, 0, 0, 0],
  PWL: [0, 1, 0, 0, 0], PRWL: [0, 0, 1, 0, 0],
};
const DAY_KIND: Record<string, "continuation" | "new_shape"> = {
  SS: "continuation", R: "continuation", BS: "new_shape", WL: "new_shape",
  WLS: "new_shape", RWL: "new_shape", PBS: "new_shape", RS: "new_shape",
  PWL: "new_shape", PRWL: "new_shape",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function assignDays(chain: Candidate[], calendar: Record<string, "continuation" | "new_shape" | "red_folder">): string[] {
  const used: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
  return chain.map((c, i) => {
    const budget = DAY_BUDGET[c.shape];
    if (!budget) throw new Fatal("E2_DAY_SHAPE_UNKNOWN", { shape: c.shape });
    for (let j = 0; j < DAYS.length; j++) {
      const d = DAYS[j];
      if (!d) continue;
      const kind = calendar[d];
      if (kind === undefined) throw new Fatal("E2_CALENDAR_INCOMPLETE", { day: d });
      if (budget[j] === 1 && used[d] === 0 && kind === DAY_KIND[c.shape]) {
        used[d] = 1;
        c.day = d;
        return d;
      }
    }
    throw new Fatal("E2_DAY_ASSIGNMENT_FAILED", { i, shape: c.shape });
  });
}

export async function e2Chain(
  env: Env, run: string, zones: Zone[], cands: Candidate[],
  calendar: Record<string, "continuation" | "new_shape" | "red_folder">,
  policy: Policy,
): Promise<{ chain: ShapeLink[]; alternative: ShapeLink[] | null; confidence: number }> {
  if (!cands.length) throw new Fatal("E2_NO_CANDIDATES", {});
  const keep = [...cands].sort((a, b) => a.licensed.length - b.licensed.length || a.targetZfp - b.targetZfp)
    .slice(0, MAX_CANDIDATES);

  const subj = (c: Candidate) => ({ candidate_id: c.id, target_zone: c.target });
  const stateA = { zones, candidates: keep };
  const a = await ask(env, run, "E2-STAGE-A", "1.0.0", stateA, perItem(Q_E2A, keep, subj), policy);

  const stateB = { zones, candidates: keep, answers_a: a };
  const b = await ask(env, run, "E2-STAGE-B", "1.0.0", stateB, perItem(Q_E2B, keep, subj), policy);

  for (const c of keep) {
    const clauses = {
      A1: answer(a, `${c.id}.A1`), A2: answer(a, `${c.id}.A2`),
      A3: answer(a, `${c.id}.A3`), A4: answer(a, `${c.id}.A4`),
      B1: answer(b, `${c.id}.B1`),
    };
    const v = decide(clauses, policy);
    c.p = v.overall;
    c.vetoed = v.kind !== "ALLOW";
  }

  const survivors = keep.filter((c) => !c.vetoed);
  if (!survivors.length) throw new Fatal("E2_ALL_FALSIFIED", {});
  let chain = walk(survivors);
  if (!chain.length) throw new Fatal("E2_WALK_EMPTY", {});

  const alt = alternative(chain, survivors);
  const stateC = { chain, zones, alternative: alt };
  const c = await ask(env, run, "E2-STAGE-C", "1.0.0", stateC, Q_E2C, policy);

  const p = (x: Candidate) => must(x.p, "E2_UNSCORED_LINK", { id: x.id });
  const energy = answer(c, "C1");          // score level 0..3
  const confPre = Math.min(...chain.map(p));
  if (energy < 2) {
    chain = chain.slice(0, -1);
    if (!chain.length) throw new Fatal("E2_ENERGY_VETO", { energy });
    if (Math.min(...chain.map(p)) < confPre) throw new Fatal("E2_CONFIDENCE_INVERSION", {});
  }
  if (answer(c, "C2") < policy.act) throw new Fatal("E2_HINGE_UNCONFIRMED", { c2: answer(c, "C2") });

  const days = assignDays(chain, calendar);
  if (!alt) throw new Fatal("E2_ALTERNATIVE_INVALID", {});

  return {
    chain: chain.map((x, i) => linkOf(x, must(days[i], "E2_DAY_UNASSIGNED", { i }))),
    alternative: alt,
    confidence: Math.min(...chain.map(p)),
  };
}
