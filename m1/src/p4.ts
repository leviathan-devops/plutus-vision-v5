// p4.ts - PILLAR 4: analyst consensus from explicit pre-cutoff levels (BUILD_WORKFLOW P1.TURN-03).
// Input: explicit AnalystStatements (m1/src/sources/analyst.ts). Filter: asset match,
// published_at <= cutoff, finite positive level. Each valid statement emits one Level
// (pillar=P4, kind=analyst, formed_at=published_at). Levels group within 5 pips (5 * pip);
// a group with 2+ independent tier-1/2 sources scores dimension 2, one valid source scores 1,
// else 0 with a missing_data row. Rules: no paraphrased implicit levels, no averaging of
// contradictory levels (each level stands), one source may support several separated levels,
// tiers explicit never guessed.
import type { Asset } from './bars';
import { pipFor } from './units';
import type { Level } from './levels';
import type { AnalystStatement } from './sources/analyst';

export type { AnalystStatement } from './sources/analyst';

export interface P4Group { price: number; members: AnalystStatement[]; tiers: (1 | 2 | 3)[]; independent: number; dimension: 0 | 1 | 2 }
export interface P4Out { levels: Level[]; groups: P4Group[]; dimension: 0 | 1 | 2; missing: { protocol: string; reason: string; impact: string }[]; audit: string[] }

const TIER_WEIGHT: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

/** Run pillar 4 over explicit statements for one asset. Post-cutoff and non-matching
 *  statements are excluded with an audit line - never silently, never averaged. */
export function pillar4(statements: AnalystStatement[], asset: Asset, cutoffMs: number): P4Out {
  const pip = pipFor(asset);
  const audit: string[] = [];
  const missing: P4Out['missing'] = [];
  const valid: AnalystStatement[] = [];
  for (const s of statements) {
    if (s.asset !== asset) { audit.push(`P4 excluded: ${s.source_id} targets ${s.asset}, not ${asset}`); continue; }
    if (!(s.published_at <= cutoffMs)) {
      audit.push(`P4 excluded: ${s.source_id} published ${new Date(s.published_at).toISOString()} after cutoff ${new Date(cutoffMs).toISOString()}`);
      continue;
    }
    if (!Number.isFinite(s.level) || s.level <= 0) { audit.push(`P4 excluded: ${s.source_id} level is not finite positive`); continue; }
    if (s.source_tier !== 1 && s.source_tier !== 2 && s.source_tier !== 3) { audit.push(`P4 excluded: ${s.source_id} tier is not explicit 1|2|3`); continue; }
    valid.push(s);
  }
  const levels: Level[] = valid.map(s => ({
    id: `P4|analyst|${s.source_id}|${s.level}`,
    pillar: 'P4',
    kind: 'analyst',
    price: s.level,
    label: `${s.source_id} T${s.source_tier} ${s.interpretation} ${s.level} (${new Date(s.published_at).toISOString().slice(0, 10)})`,
    formedAt: s.published_at,
    source: [`${s.source_id} tier ${s.source_tier}: "${s.quoted_span}"`],
    side: s.interpretation === 'range' ? undefined : s.interpretation,
    meta: { tier: s.source_tier, weight: TIER_WEIGHT[s.source_tier], published_at: s.published_at, quoted_span: s.quoted_span },
  }));
  // Group within 5 pips, cheapest deterministic pass: sort by price, open a new group when the
  // gap from the group anchor exceeds 5 pips. Contradictory levels are never averaged - the
  // group price is the tier-weighted median of its members, recorded as such.
  const tol = 5 * pip;
  const sorted = [...valid].sort((a, b) => a.level - b.level);
  const groups: P4Group[] = [];
  for (const s of sorted) {
    const g = groups.length ? groups[groups.length - 1] : null;
    if (g && Math.abs(s.level - g.price) <= tol + 1e-12) {
      g.members.push(s);
    } else {
      groups.push({ price: s.level, members: [s], tiers: [], independent: 0, dimension: 0 });
    }
  }
  let dimension: 0 | 1 | 2 = 0;
  for (const g of groups) {
    const bySource = new Map<string, AnalystStatement[]>();
    for (const m of g.members) {
      const arr = bySource.get(m.source_id);
      if (arr) arr.push(m);
      else bySource.set(m.source_id, [m]);
    }
    const counted = [...bySource.entries()].filter(([, arr]) => arr.some(m => m.source_tier === 1 || m.source_tier === 2));
    g.independent = counted.length;
    g.tiers = [...bySource.values()].map(arr => arr[0].source_tier).sort() as (1 | 2 | 3)[];
    const w = [...bySource.values()].map(arr => arr[0]).sort((a, b) => a.level - b.level);
    g.price = w[Math.floor(w.length / 2)].level;
    g.dimension = g.independent >= 2 ? 2 : g.members.length >= 1 ? 1 : 0;
    if (g.dimension > dimension) dimension = g.dimension as 0 | 1 | 2;
    audit.push(`P4 group @${g.price}: ${g.members.length} statement(s), ${g.independent} independent tier1/2 source(s) [${g.tiers.join(',')}] -> dimension ${g.dimension}`);
  }
  if (!valid.length)
    missing.push({ protocol: 'P4 analyst levels', reason: `no explicit pre-cutoff ${asset} S/R levels from tiered sources`, impact: 'Analyst Consensus dimension = 0 for every level' });
  return { levels, groups, dimension, missing, audit };
}
