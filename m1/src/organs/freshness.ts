// freshness.ts — P3 organ: recurrence state machine (freshness.ts donor semantics).
// Events = consecutive qualifying-touch runs before cutoff; gap-through bars never
// open or extend an event (being-left-behind is not depletion). FRESH(0) -> TESTED_1X
// -> TESTED_2X -> DEPLETED(3+) | VIOLATED (a qualifying pierce battle).
import type { Bar } from '../bars';
import { E1Refusal } from '../refusals';
import { classifyTouch, type OrganZone, type TouchEvent } from './candlePressure';

export type FreshnessState = 'FRESH' | 'TESTED_1X' | 'TESTED_2X' | 'DEPLETED' | 'VIOLATED';
export interface FreshnessOut {
  state: FreshnessState; pierced: boolean; events: TouchEvent[]; reactionState: FreshnessState;
}

const BATTLE = new Set(['SWEEP', 'WICK_REJECT', 'BODY_DEFEND', 'CONSOL_DWELL']);

/** Classify pre-cutoff touches into battle events. Bars at/after cutoff throw. */
export function buildFreshness(zone: OrganZone, preBars: Bar[], unit: number, cutoff = Infinity): FreshnessOut {
  for (const b of preBars) {
    if (b.time >= cutoff) throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', `freshness bar ${b.time} at/after cutoff ${cutoff}`);
  }
  const events: TouchEvent[] = [];
  let cur: TouchEvent[] = [];
  const flush = () => {
    if (!cur.length) return;
    const first = cur[0]!;
    events.push({ ...first, exit_bar_id: cur[cur.length - 1]!.test_bar_id,
      pierce: cur.some((e) => e.pierce), reclaim: cur.some((e) => e.reclaim) });
    cur = [];
  };
  for (let i = 0; i < preBars.length; i++) {
    const kind = classifyTouch(zone, i > 0 ? preBars[i - 1]! : null, preBars[i]!,
      i + 1 < preBars.length ? preBars[i + 1]! : null,
      preBars.slice(Math.max(0, i - 2), i + 1), unit, cutoff);
    if (BATTLE.has(kind.kind)) { cur.push(kind); continue; }
    // A pierce-through (non-gap PASS_THROUGH with pierce) is a battle the zone lost.
    if (kind.kind === 'PASS_THROUGH' && kind.pierce && !kind.gap_through) { cur.push(kind); flush(); continue; }
    flush(); // gap-through and unclassified bars end the run without depleting
  }
  flush();
  const pierced = events.some((e) => e.pierce);
  let state: FreshnessState = 'FRESH';
  if (pierced) state = 'VIOLATED';
  else if (events.length >= 3) state = 'DEPLETED';
  else if (events.length === 2) state = 'TESTED_2X';
  else if (events.length === 1) state = 'TESTED_1X';
  return { state, pierced, events, reactionState: state };
}
