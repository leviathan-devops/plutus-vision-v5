// checkP4.ts - P1.TURN-03 gate. Explicit DXY statements score; post-cutoff is excluded;
// two independent tier1/2 sources at one level give dimension 2; one valid source gives 1;
// an implicit (paraphrased, price-less) note never becomes a level (P4_NO_PROXY).
import { runWindow } from '../src/window';
import { asAnalystStatement, type AnalystStatement } from '../src/sources/analyst';
import { pillar4 } from '../src/p4';

const W = runWindow('DXY', '2026-07-06');
const H = 3_600_000;
const cut = W.cutoffUtc;
const mk = (o: Partial<AnalystStatement> & { source_id: string }): AnalystStatement => ({
  source_tier: 1,
  published_at: cut - 24 * H,
  asset: 'DXY',
  level: 100,
  interpretation: 'resistance',
  quoted_span: 'resistance at 100.00',
  ...o,
} as AnalystStatement);
// Legitimate: one explicit pre-cutoff statement emits one level.
const one = pillar4([mk({ source_id: 'ing', source_tier: 1, level: 99.5, quoted_span: 'ING sees resistance at 99.50' })], 'DXY', cut);
if (one.levels.length !== 1 || one.levels[0].price !== 99.5 || one.levels[0].pillar !== 'P4' || one.levels[0].kind !== 'analyst' || one.levels[0].formedAt !== cut - 24 * H)
  throw new Error(`P4_LEVEL_FAIL: ${JSON.stringify(one.levels)}`);
console.log('P4_EXPLICIT_LEVEL_OK id=P4|analyst|ing|99.5 dimension=' + one.dimension);
// Adversarial: a post-cutoff statement is excluded and named in the audit.
const late = pillar4([mk({ source_id: 'ing', published_at: cut + H, level: 99.5, quoted_span: 'ING sees resistance at 99.50' })], 'DXY', cut);
if (late.levels.length !== 0 || !late.audit.some(a => a.includes('after cutoff'))) throw new Error(`P4_CUTOFF_FAIL: ${JSON.stringify(late)}`);
console.log('P4_CUTOFF_REJECT');
// Consensus: two independent tier1/2 sources within 5 pips -> dimension 2.
const two = pillar4([
  mk({ source_id: 'ing', source_tier: 1, level: 99.5, quoted_span: 'ING resistance at 99.50' }),
  mk({ source_id: 'forex.com', source_tier: 2, level: 99.53, quoted_span: 'forex.com caps at 99.53' }),
], 'DXY', cut);
if (two.dimension !== 2) throw new Error(`P4_CONSENSUS_FAIL: ${JSON.stringify(two.groups)}`);
console.log('P4_CONSENSUS_2 groups=1 independent=2 dimension=2');
// Single source -> dimension 1 (still evidence, not consensus).
if (one.dimension !== 1) throw new Error(`P4_SINGLE_FAIL: dimension=${one.dimension}`);
// Adversarial: one source cannot manufacture consensus - same source twice counts once.
const same = pillar4([
  mk({ source_id: 'ing', source_tier: 1, level: 99.5, quoted_span: 'ING resistance at 99.50' }),
  mk({ source_id: 'ing', source_tier: 1, level: 99.52, quoted_span: 'ING also 99.52' }),
], 'DXY', cut);
if (same.groups[0].independent !== 1 || same.dimension !== 1) throw new Error(`P4_SAME_SOURCE_FAIL: ${JSON.stringify(same.groups)}`);
console.log('P4_SINGLE_SOURCE_NO_FALSE_CONSENSUS independent=1');
// No proxy: an implicit note (no exact price in the span) never becomes a statement.
const parsed = asAnalystStatement({ source_id: 'blog', source_tier: 3, published_at: cut - H, asset: 'DXY', level: 99.5, interpretation: 'resistance', quoted_span: 'price may face headwinds somewhere above' });
if (!('implicit' in parsed)) throw new Error('P4_PROXY_FAIL: price-less paraphrase parsed as explicit evidence');
const empty = pillar4([], 'DXY', cut);
if (empty.dimension !== 0 || !empty.missing.length) throw new Error('P4_MISSING_FAIL: empty input must score 0 with a missing_data row');
console.log('P4_NO_PROXY implicit="' + parsed.implicit + '" missing_rows=' + empty.missing.length);
