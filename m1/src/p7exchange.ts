// p7exchange.ts - PILLAR 7 exchange arena source (BUILD_WORKFLOW P1.TURN-04).
// Input: ICE/CME wall snapshots published at/before the cutoff. Filter pair == asset,
// include walls with notional_usd >= 1_500_000_000 (tier-1 only). None -> { arena: null,
// missing: 'P7_NO_TIER1_WALL' }. Else floor = min included price, ceiling = max, with evidence.
// Never silently fall back to the option-wall arena when exchange evidence is configured:
// on acquisition failure record P7_EXCHANGE_SOURCE_MISSING and use the blueprint fallback
// only for this M1 run (pillar7() in m1/src/p6p7.ts), named in the audit.
import { E1Refusal } from './refusals';
import type { Level } from './levels';

export interface ExchangeWall { pair: string; price: number; notional_usd: number }
export interface ArenaInput { source: 'ICE' | 'CME'; published_at: number; walls: ExchangeWall[] }
export interface ExchangeArena { floor: number; ceiling: number; source: 'ICE' | 'CME'; published_at: number; walls: number; basis: string }
export interface P7ExchangeOut {
  arena: ExchangeArena | null;
  levels: Level[];
  missing: { protocol: string; reason: string; impact: string }[] | null;
  missingToken: 'P7_NO_TIER1_WALL' | 'P7_EXCHANGE_SOURCE_MISSING' | null;
  audit: string[];
}

export const TIER1_USD = 1_500_000_000;

/** Run the exchange arena. Refuses E1_CUTOFF_VIOLATION when published after the cutoff. */
export function pillar7Exchange(input: ArenaInput, asset: string, cutoffMs: number): P7ExchangeOut {
  const audit: string[] = [];
  if (!(input.published_at <= cutoffMs))
    throw new E1Refusal('E1_CUTOFF_VIOLATION', `P7_AFTER_CUTOFF: ${input.source} walls published ${new Date(input.published_at).toISOString()} > cutoff ${new Date(cutoffMs).toISOString()} - supplementary exchange data must predate the cutoff`);
  const matched = (input.walls ?? []).filter(w => w.pair === asset);
  const skipped = (input.walls ?? []).length - matched.length;
  if (skipped) audit.push(`P7 excluded ${skipped} wall(s) for other pairs (asset ${asset}) - recorded, never silently merged`);
  const bad = matched.find(w => !Number.isFinite(w.price) || w.price <= 0 || !Number.isFinite(w.notional_usd) || w.notional_usd < 0);
  if (bad) throw new E1Refusal('E1_PILLAR_FAILED', `P7_WALL_INVALID: wall ${JSON.stringify(bad)} is not a finite-positive price with non-negative notional`);
  const included = matched.filter(w => w.notional_usd >= TIER1_USD);
  audit.push(`P7 ${input.source}: ${matched.length} ${asset} wall(s), ${included.length} tier-1 (>= $${TIER1_USD})`);
  if (!included.length)
    return {
      arena: null,
      levels: [],
      missing: [{ protocol: 'P7 exchange arena', reason: `P7_NO_TIER1_WALL: no ${asset} ${input.source} wall >= $1.5bn before the cutoff`, impact: 'no exchange arena; blueprint option-wall fallback applies for this M1 run only' }],
      missingToken: 'P7_NO_TIER1_WALL',
      audit,
    };
  const floor = Math.min(...included.map(w => w.price));
  const ceiling = Math.max(...included.map(w => w.price));
  const basis = `exchange arena: ${input.source} ${included.length} tier-1 ${asset} wall(s) ${new Date(input.published_at).toISOString()} floor ${floor} ceiling ${ceiling}`;
  audit.push(`P7 arena: ${basis}`);
  return {
    arena: { floor, ceiling, source: input.source, published_at: input.published_at, walls: included.length, basis },
    levels: [
      { id: `P7|exchange|${input.source}|floor`, pillar: 'P7', kind: 'arena', price: floor, label: `exchange arena floor ${floor}`, source: [basis] },
      { id: `P7|exchange|${input.source}|ceiling`, pillar: 'P7', kind: 'arena', price: ceiling, label: `exchange arena ceiling ${ceiling}`, source: [basis] },
    ],
    missing: null,
    missingToken: null,
    audit,
  };
}

/** Acquisition failure path: no exchange evidence could be fetched for this M1 run.
 *  Records P7_EXCHANGE_SOURCE_MISSING; the caller applies pillar7() fallback explicitly. */
export function p7ExchangeSourceMissing(reason: string): Pick<P7ExchangeOut, 'arena' | 'levels' | 'missing' | 'missingToken' | 'audit'> {
  return {
    arena: null,
    levels: [],
    missing: [{ protocol: 'P7 exchange acquisition', reason: `P7_EXCHANGE_SOURCE_MISSING: ${reason}`, impact: 'blueprint option-wall fallback (pillar7) applies for this M1 run only; never silent' }],
    missingToken: 'P7_EXCHANGE_SOURCE_MISSING',
    audit: [`P7 acquisition failed: ${reason} - recorded P7_EXCHANGE_SOURCE_MISSING`],
  };
}
