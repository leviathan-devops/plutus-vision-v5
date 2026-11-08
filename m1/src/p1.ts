// p1.ts - PILLAR 1: multi-timeframe pivot engine (5.3.3 prompt :967-1059).
// Classic + Fibonacci + Camarilla for the prior week and EACH of the last 3 trading days (plus the
// remaining prior-week days, :983), every set verified with the four mandated checks (:1017-1057).
// No spot-proximity filter (:1015). Scoring: exact <=3 pips = 2 (Technical), zone <=10 pips = 1, legacy +0.5 (:1059).
import type { Ohlc } from './bars';

export type Variant = 'classic' | 'fibonacci' | 'camarilla';
export interface PivotLevel { id: string; pillar: 'P1'; name: string; price: number; source: string; timeframe: 'W' | 'D' | 'H'; variant: Variant; legacy: boolean }
export interface PivotSet { source: string; timeframe: 'W' | 'D' | 'H'; variant: Variant; H: number; L: number; C: number; levels: Record<string, number>; checks: Record<string, boolean>; audit: string }

const EPS = 1e-9;
const eq = (a: number, b: number) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));

export function pivotSet(source: string, timeframe: 'W' | 'D' | 'H', variant: Variant, H: number, L: number, C: number): PivotSet {
  const R = H - L; const PP = (H + L + C) / 3; let lv: Record<string, number>;
  if (variant === 'classic') lv = { PP, R1: 2 * PP - L, S1: 2 * PP - H, R2: PP + R, S2: PP - R, R3: H + 2 * (PP - L), S3: L - 2 * (H - PP) };
  else if (variant === 'fibonacci') lv = { PP, R1: PP + 0.382 * R, S1: PP - 0.382 * R, R2: PP + 0.618 * R, S2: PP - 0.618 * R, R3: PP + R, S3: PP - R };
  else lv = { R4: C + R * 1.1 / 2, S4: C - R * 1.1 / 2, R3: C + R * 1.1 / 4, S3: C - R * 1.1 / 4, R2: C + R * 1.1 / 6, S2: C - R * 1.1 / 6, R1: C + R * 1.1 / 12, S1: C - R * 1.1 / 12 };
  const c: Record<string, boolean> = {};
  if (variant === 'classic') {
    c.formula = eq(lv.R1 + L, 2 * PP) && eq(lv.S1 + H, 2 * PP) && eq(lv.R2 - PP, R) && eq(PP - lv.S2, R);
    c.range = eq(lv.R2 - lv.S2, 2 * R);
  } else if (variant === 'fibonacci') {
    c.formula = eq(lv.R1 - PP, 0.382 * R) && eq(PP - lv.S1, 0.382 * R) && eq(lv.R2 - PP, 0.618 * R) && eq(PP - lv.S2, 0.618 * R);
    c.symmetry = eq(lv.R1 - PP, PP - lv.S1) && eq(lv.R2 - PP, PP - lv.S2);
    c.range = eq(lv.R2 - lv.S2, 1.236 * R);
  } else {
    c.formula = eq(lv.R4 - C, R * 0.55) && eq(C - lv.S4, R * 0.55);
    c.range = eq(lv.R4 - lv.S4, R * 1.1);
  }
  const mid = variant === 'camarilla' ? C : PP;
  c.sanity = R > EPS && lv.R1 > mid + EPS && mid > lv.S1 + EPS && lv.R2 > lv.R1 && lv.S1 > lv.S2 && lv.S2 > lv.S3;
  const f = (x: number) => x.toFixed(5);
  const audit = `Pivot Verification: ${source} ${variant} - H=${f(H)} L=${f(L)} C=${f(C)} | ` +
    (variant === 'camarilla' ? `R4=${f(lv.R4)} S4=${f(lv.S4)} R4-S4=${f(lv.R4 - lv.S4)} 1.1x(H-L)=${f(1.1 * R)}`
      : `PP=${f(PP)} R1=${f(lv.R1)} S1=${f(lv.S1)} | R1+L=${f(lv.R1 + L)} 2xPP=${f(2 * PP)} | R2-S2=${f(lv.R2 - lv.S2)}`) +
    ` | ${Object.entries(c).map(([k, v]) => `${k.toUpperCase()}: ${v ? 'PASS' : 'FAIL'}`).join(' ')}`;
  return { source, timeframe, variant, H, L, C, levels: lv, checks: c, audit };
}

export interface P1Out { sets: PivotSet[]; levels: PivotLevel[]; inputs: Record<string, Ohlc>; audit: string[] }

/** priorWeek: the completed week before the run week. priorDays: the prior week's sessions (chronological).
 *  historic: earlier weeks whose range overlaps the prior week's (:985, up to 4 months back). */
export function pillar1(priorWeek: Ohlc, priorDays: Ohlc[], historic: Ohlc[]): P1Out {
  const variants: Variant[] = ['classic', 'fibonacci', 'camarilla'];
  const sets: PivotSet[] = []; const inputs: Record<string, Ohlc> = {};
  const add = (src: string, tf: 'W' | 'D', o: Ohlc) => { inputs[src] = o; for (const v of variants) sets.push(pivotSet(src, tf, v, o.high, o.low, o.close)); };
  add(`W:${priorWeek.key}`, 'W', priorWeek);
  for (const d of priorDays.slice(-3)) add(`D:${d.key}`, 'D', d);     // step 7 (:1013): daily sets for EACH of the last 3 trading days
  for (const w of historic) add(`H:${w.key}`, 'W', w);
  const failed = sets.filter(s => !Object.values(s.checks).every(Boolean));
  if (failed.length) throw new Error(`P1_VERIFICATION_FAILED: ${failed.map(s => s.audit).join(' || ')}`);
  const levels: PivotLevel[] = [];
  for (const s of sets) for (const [name, price] of Object.entries(s.levels))
    levels.push({ id: `P1|${s.source}|${s.variant}|${name}`, pillar: 'P1', name: `${s.source} ${s.variant} ${name}`, price, source: s.source,
      timeframe: s.source.startsWith('H:') ? 'H' : s.timeframe, variant: s.variant, legacy: s.source.startsWith('H:') });
  return { sets, levels, inputs, audit: sets.map(s => s.audit) };
}

/** Historical weeks (up to 4 months back) whose H-L range overlaps the prior week's range (:985). */
export function overlappingWeeks(weeks: Ohlc[], priorWeek: Ohlc, maxBackDays = 122): Ohlc[] {
  const lo = priorWeek.from - maxBackDays * 86_400_000;
  return weeks.filter(w => w.key < priorWeek.key && w.from >= lo && w.low <= priorWeek.high && w.high >= priorWeek.low);
}
