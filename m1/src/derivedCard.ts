// derivedCard.ts - P4.TURN-01: the derived organ card (BUILD_WORKFLOW v5.2).
// The base card is IMMUTABLE evidence: organ metadata never writes into it. deriveCard clones the
// base, bumps the schema, records supersedes_sha256, attaches per-zone precision/freshness/pressure
// from the organ plane, lists unassigned LMV precision (rungs with no zone - hidden metadata until
// an operator ruling), and seals the result with a canonical-JSON sha256.
import { createHash } from 'node:crypto';
import { E1Refusal } from './refusals';

export interface DerivedZoneMeta { zoneId: string; freshness: string; reactionState: string; lifecycle: string; operativeDefense: string; pierced: boolean }
export interface DerivedCard {
  schema_version: number;
  supersedes_sha256: string;
  base_card_sha256?: string;
  unassignedPrecision: { center: number; defendedEdge: number; side: string }[];
  zoneMeta: DerivedZoneMeta[];
  sha256?: string;
  [k: string]: unknown;
}

/** Canonical JSON bytes (sorted keys recursively) - the same canonical form as the evidence manifest. */
export function canonicalBytes(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) out[k] = sort((v as Record<string, unknown>)[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(sort(value));
}

export function sha256Hex(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Derive the organ card. The base object is deep-cloned and NEVER mutated (structural sharing is
 *  impossible: deriveCard returns a new object graph). */
export function deriveCard(
  base: { sha256?: string; schema_version?: number; zones?: { id: string }[] } & Record<string, unknown>,
  organs: { zoneMeta: DerivedZoneMeta[]; unassignedLmv: { center: number; defendedEdge: number; side: string }[] },
): DerivedCard {
  if (!base || typeof base.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(base.sha256))
    throw new E1Refusal('E1_CARD_INVALID', `DERIVED_BASE_UNSEALED: the base card carries no valid sha256 (${String(base?.sha256).slice(0, 20)}) - a derived card may only seal a sealed base`);
  const { sha256: baseSealed, ...baseRest } = base;   // the seal covers the card WITHOUT the sha field
  const baseSha = sha256Hex(canonicalBytes(baseRest));
  if (baseSha !== baseSealed)
    throw new E1Refusal('E1_BASE_CARD_MUTATED', `DERIVED_BASE_MUTATED: base sha256 says ${baseSealed!.slice(0, 16)} but its bytes hash to ${baseSha.slice(0, 16)} - the base card changed after sealing`);
  const derived: DerivedCard = {
    ...(structuredClone(base) as Record<string, unknown>),
    schema_version: (base.schema_version ?? 1) + 1,
    supersedes_sha256: base.sha256,
    unassignedPrecision: organs.unassignedLmv,
    zoneMeta: organs.zoneMeta,
  };
  delete (derived as Record<string, unknown>).sha256;           // re-seal below, never inherit
  derived.sha256 = sha256Hex(canonicalBytes(derived));
  return derived;
}
