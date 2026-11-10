// checkDerivedCard.ts - P4.TURN-01 gate. Derived card: schema advances, supersedes recorded, base
// immutable, unassigned LMV precision carried as hidden metadata. Adversarial: a mutated base and a
// tampered derived seal both refuse with named tokens.
import { deriveCard, canonicalBytes, sha256Hex } from '../src/derivedCard';
import { validateDerivedCard, validateBaseCard } from '../src/validateCard';

const seal = <T extends object>(o: T): T & { sha256: string } => { const rest = o as Record<string, unknown>; delete rest.sha256; return { ...(rest as T), sha256: sha256Hex(canonicalBytes(rest)) }; };
const base = seal({ schema_version: 1, asset: 'EURUSD', week_monday: '2026-07-06', zones: [{ id: 'Z1', score: 8, reactionsPreCutoff: 1, reactionState: 'Active' }, { id: 'Z2', score: 6, reactionsPreCutoff: 0, reactionState: 'Virgin' }] } as { schema_version: number; asset: string; week_monday: string; zones: { id: string; score: number; reactionsPreCutoff: number; reactionState: string }[] });
const organs = { zoneMeta: [{ zoneId: 'Z1', freshness: 'TESTED_1X', reactionState: 'Active', lifecycle: 'ACTIVE_1', operativeDefense: 'PRESSURE_STRUCTURE', pierced: false }], unassignedLmv: [{ center: 1.1400, defendedEdge: 1.1398, side: 'low' }] };
const d = deriveCard(base, organs);
// Schema + supersedes + base immutability.
if (d.schema_version !== 2) throw new Error(`DERIVED_SCHEMA_FAIL: ${d.schema_version}`);
if (d.supersedes_sha256 !== base.sha256) throw new Error('DERIVED_SUPERSEDES_FAIL');
validateDerivedCard(d, base);
if (JSON.stringify(base) !== JSON.stringify(seal({ schema_version: 1, asset: 'EURUSD', week_monday: '2026-07-06', zones: JSON.parse(JSON.stringify(base.zones)) })))
  throw new Error('DERIVED_BASE_MUTATED_FAIL: base object changed');
console.log(`DERIVED_SCHEMA_OK v${d.schema_version} supersedes=${String(d.supersedes_sha256).slice(0, 16)}`);
// Base immutability against a byte-level mutation.
const mutated = structuredClone(base) as typeof base; mutated.zones[0].score = 14; mutated.sha256 = base.sha256;
try { deriveCard(mutated, organs); throw new Error('DERIVED_BASE_FAIL: mutated base accepted'); }
catch (e) { if (!(e as Error).message.includes('E1_BASE_CARD_MUTATED')) throw e; }
console.log('DERIVED_BASE_IMMUTABLE score-tampered base refused with E1_BASE_CARD_MUTATED');
// Supersedes chain: pointing at the wrong base refuses.
const otherBase = seal({ schema_version: 1, asset: 'DXY', week_monday: '2026-07-06', zones: [] as { id: string }[] });
const wrongChain: typeof d = { ...(structuredClone(d) as object), supersedes_sha256: otherBase.sha256 } as typeof d;
try { validateDerivedCard(wrongChain, base); throw new Error('DERIVED_SUPERSEDES_FAIL: wrong chain accepted'); }
catch (e) { if (!(e as Error).message.includes('E1_DERIVED_CHAIN_INVALID')) throw e; }
console.log('DERIVED_SUPERSEDES_OK wrong-base chain refused with E1_DERIVED_CHAIN_INVALID');
// Unassigned precision carried, hidden (no zone references it).
if (d.unassignedPrecision.length !== 1 || Math.abs((d.unassignedPrecision[0] as { center: number }).center - 1.14) > 1e-9)
  throw new Error('UNASSIGNED_FAIL: LMV rung not carried');
if (d.zoneMeta.some(m => !base.zones.some(z => z.id === m.zoneId))) throw new Error('UNASSIGNED_FAIL: zoneMeta references a non-base zone');
// Adversarial: tampering the derived card after sealing breaks the seal.
const tampered = structuredClone(d) as typeof d; (tampered.zones as { id: string; score: number }[])[1].score = 13;
try { validateDerivedCard(tampered, base); throw new Error('DERIVED_SEAL_FAIL: tampered derived accepted'); }
catch (e) { if (!(e as Error).message.includes('E1_DERIVED_CHAIN_INVALID')) throw e; }
console.log('UNASSIGNED_PRECISION_OK 1 LMV rung carried hidden; tampered derived seal refused');
