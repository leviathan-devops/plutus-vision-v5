// analyst.ts - P4 analyst-level acquisition contract (BUILD_WORKFLOW P1.TURN-03).
// Explicit levels only: a quoted span naming an exact price, an explicit source tier
// (1 ING/forex institutional desk, 2 forex.com/FXStreet desk note, 3 other named outlet),
// never guessed, never paraphrased from an implicit read. Scoring lives in m1/src/p4.ts.
import type { Asset } from '../bars';

export interface AnalystStatement {
  source_id: string;
  source_tier: 1 | 2 | 3;
  published_at: number;
  asset: Asset;
  level: number;
  interpretation: 'support' | 'resistance' | 'range';
  quoted_span: string;
}

/** A raw record is a valid explicit statement only when every contract field is present
 *  with the right shape. Returns null with a reason when it is not explicit evidence. */
export function asAnalystStatement(raw: unknown): { statement: AnalystStatement } | { implicit: string } {
  if (!raw || typeof raw !== 'object') return { implicit: 'not an object - implicit commentary, not an explicit level' };
  const r = raw as Record<string, unknown>;
  if (typeof r.source_id !== 'string' || !r.source_id) return { implicit: 'source_id missing - the source is unnamed' };
  if (r.source_tier !== 1 && r.source_tier !== 2 && r.source_tier !== 3)
    return { implicit: `source_tier ${JSON.stringify(r.source_tier)} is not 1|2|3 - tier is explicit, never guessed` };
  if (typeof r.published_at !== 'number' || !Number.isFinite(r.published_at))
    return { implicit: 'published_at missing - an undated note cannot be cut off' };
  if (r.asset !== 'DXY' && r.asset !== 'EURUSD' && r.asset !== 'GBPUSD')
    return { implicit: `asset ${JSON.stringify(r.asset)} unsupported` };
  if (typeof r.level !== 'number' || !Number.isFinite(r.level) || r.level <= 0)
    return { implicit: `level ${JSON.stringify(r.level)} is not a finite positive price` };
  if (r.interpretation !== 'support' && r.interpretation !== 'resistance' && r.interpretation !== 'range')
    return { implicit: `interpretation ${JSON.stringify(r.interpretation)} is not support|resistance|range` };
  if (typeof r.quoted_span !== 'string' || !r.quoted_span.includes(String(r.level)) && !/\d+\.\d+/.test(r.quoted_span))
    return { implicit: 'quoted_span names no exact price - paraphrased implicit levels are not evidence' };
  return {
    statement: {
      source_id: r.source_id as string,
      source_tier: r.source_tier,
      published_at: r.published_at as number,
      asset: r.asset as Asset,
      level: r.level as number,
      interpretation: r.interpretation as 'support' | 'resistance' | 'range',
      quoted_span: r.quoted_span as string,
    },
  };
}
