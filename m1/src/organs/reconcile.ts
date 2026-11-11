// reconcile.ts — P3 organ: OBCV canonical reconciliation (BUILD_WORKFLOW P3.TURN-05).
// For each OBCV candidate find the origin-equivalent current zone (same side+timeframe,
// origin within one TF bar); equivalent -> overlap=intersection/min(width) >=0.5 AGREED
// else EDGE_CONFLICT; no equivalent -> OBCV_ADDITIONAL (becomes a P5 Level; canonical
// assemble decides zone creation). FORBIDDEN: direct zone creation, geometry replacement
// on edge conflict, duplicate addition. Rejected inputs throw, never silently score.
import type { SdZone } from '../p5';
import { E1Refusal } from '../refusals';
import type { ObcvCandidate, ObcvTf } from './obcv';
import type { Level } from '../levels';

export type ReconcileClass = 'AGREED' | 'EDGE_CONFLICT' | 'OBCV_ADDITIONAL';
export interface ReconcileRow { candidateId: string; class: ReconcileClass; zoneId: string | null; overlap: number }
export interface ReconcileOut {
  rows: ReconcileRow[]; additionalLevels: Level[]; audit: string[];
}

const TF_MS: Record<ObcvTf, number> = { '4H': 4 * 3_600_000, '1H': 3_600_000, '30m': 30 * 60_000 };

/**
 * Reconcile OBCV candidates against the current P5 S/D zones.
 * equivalent(zone, cand) <=> same side/timeframe AND |zone.t - cand.originTime| <= one TF bar.
 * Failed gates (NaN geometry, unknown TF/side, post-cutoff origins) throw E1Refusal — never scored.
 */
export function reconcile(current: SdZone[], candidates: ObcvCandidate[], cutoff: number): ReconcileOut {
  const rows: ReconcileRow[] = []; const additionalLevels: Level[] = []; const audit: string[] = [];
  const seen = new Set<string>();
  for (const z of current) {
    if (!(z.hi > z.lo) || !Number.isFinite(z.hi) || !Number.isFinite(z.lo)) {
      throw new E1Refusal('E1_CARD_INVALID', `reconcile zone geometry invalid ${z.date}`);
    }
  }
  for (const c of candidates) {
    if (c.originTime >= cutoff) throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', `reconcile candidate ${c.id} at/after cutoff`);
    if (!(c.hi > c.lo) || !Number.isFinite(c.hi) || !Number.isFinite(c.lo)) {
      throw new E1Refusal('E1_CARD_INVALID', `reconcile candidate geometry invalid ${c.id}`);
    }
    const wantSide = c.side;
    const match = current.find((z) =>
      (z.side === wantSide) && (`${z.tf}` === c.tf) && Math.abs(z.t - c.originTime) <= TF_MS[c.tf]);
    if (!match) {
      const key = `${c.side}|${c.lo.toFixed(5)}|${c.hi.toFixed(5)}`;
      if (seen.has(key)) throw new E1Refusal('E1_CARD_INVALID', `reconcile duplicate candidate ${c.id}`);
      seen.add(key);
      rows.push({ candidateId: c.id, class: 'OBCV_ADDITIONAL', zoneId: null, overlap: 0 });
      additionalLevels.push({ id: c.id, pillar: 'P5', kind: c.tf === '4H' ? 'sd-4h' : 'sd-1h',
        price: (c.lo + c.hi) / 2, label: `${c.classification} ${c.tf} ${c.side} ${(c.lo).toFixed(5)}-${c.hi.toFixed(5)}`,
        timeframe: c.tf, formedAt: c.originTime, source: ['obcv-reconcile'],
        side: c.side === 'demand' ? 'support' : 'resistance',
        meta: { lo: c.lo, hi: c.hi, classification: c.classification } });
      audit.push(`ADDITIONAL ${c.id}`);
      continue;
    }
    const inter = Math.max(0, Math.min(match.hi, c.hi) - Math.max(match.lo, c.lo));
    const overlap = inter / Math.min(match.hi - match.lo, c.hi - c.lo);
    const cls: ReconcileClass = overlap >= 0.5 ? 'AGREED' : 'EDGE_CONFLICT';
    rows.push({ candidateId: c.id, class: cls, zoneId: `${match.side} ${match.date}`, overlap: Math.round(overlap * 1000) / 1000 });
    audit.push(`${cls} ${c.id} overlap=${overlap.toFixed(3)}`);
  }
  return { rows, additionalLevels, audit };
}
