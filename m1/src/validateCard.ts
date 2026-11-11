// validateCard.ts - the card validator (workflow PROOF CONTRACT: base immutable SHA, derived
// supersedes SHA, source provenance, cutoff conservation, level conservation, score bounds,
// reaction mapping). Refuses with named E1 tokens; never returns a soft pass.
import { E1Refusal } from './refusals';
import { canonicalBytes, sha256Hex } from './derivedCard';

export interface CardLike { sha256?: string; schema_version?: number; supersedes_sha256?: string; zones?: { id: string; score?: number; reactionsPreCutoff?: number; reactionState?: string }[]; [k: string]: unknown }

/** Validate a BASE card: sealed sha matches its canonical bytes; zones carry bounded scores and
 *  consistent reaction mappings (0 Virgin, 1-2 Active, 3+ Depleted). */
export function validateBaseCard(card: CardLike): void {
  if (typeof card.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(card.sha256))
    throw new E1Refusal('E1_CARD_INVALID', `BASE_UNSEALED: no valid sha256 (${String(card?.sha256).slice(0, 20)})`);
  const { sha256, ...rest } = card;
  if (sha256Hex(canonicalBytes(rest)) !== sha256)
    throw new E1Refusal('E1_BASE_CARD_MUTATED', `BASE_MUTATED: bytes hash to ${sha256Hex(canonicalBytes(rest)).slice(0, 16)} != sealed ${sha256!.slice(0, 16)}`);
  for (const z of card.zones ?? []) {
    if (typeof z.score === 'number' && (z.score < 0 || z.score > 14))
      throw new E1Refusal('E1_CARD_INVALID', `SCORE_BOUNDS: zone ${z.id} score ${z.score} outside 0..14`);
    if (typeof z.reactionsPreCutoff === 'number' && typeof z.reactionState === 'string') {
      const want = z.reactionsPreCutoff === 0 ? 'Virgin' : z.reactionsPreCutoff <= 2 ? 'Active' : 'Depleted';
      if (z.reactionState !== want)
        throw new E1Refusal('E1_CARD_INVALID', `REACTION_MAP: zone ${z.id} ${z.reactionsPreCutoff} reactions -> ${z.reactionState}, expected ${want}`);
    }
  }
}

/** Validate a DERIVED card: chain to its sealed base, supersedes recorded, base untouched, and
 *  every zone the base had is still present (level conservation at the zone grain). */
export function validateDerivedCard(derived: CardLike, base: CardLike): void {
  validateBaseCard(base);
  if (typeof derived.supersedes_sha256 !== 'string' || derived.supersedes_sha256 !== base.sha256)
    throw new E1Refusal('E1_DERIVED_CHAIN_INVALID', `SUPERSEDES_MISMATCH: derived supersedes ${String(derived.supersedes_sha256).slice(0, 16)} != base ${String(base.sha256).slice(0, 16)}`);
  if (typeof derived.schema_version !== 'number' || derived.schema_version <= (base.schema_version ?? 1))
    throw new E1Refusal('E1_DERIVED_CHAIN_INVALID', `SCHEMA_NOT_ADVANCED: derived ${derived.schema_version} <= base ${base.schema_version ?? 1}`);
  const baseZoneIds = new Set((base.zones ?? []).map(z => z.id));
  for (const id of baseZoneIds) if (!(derived.zones ?? []).some(z => z.id === id))
    throw new E1Refusal('E1_DERIVED_CHAIN_INVALID', `ZONE_LOST: base zone ${id} absent from the derived card`);
  const { sha256 } = derived;
  if (typeof sha256 === 'string' && /^[0-9a-f]{64}$/.test(sha256)) {
    const { sha256: _s, ...rest } = derived;
    if (sha256Hex(canonicalBytes(rest)) !== sha256)
      throw new E1Refusal('E1_DERIVED_CHAIN_INVALID', `DERIVED_SEAL_BROKEN: bytes hash to ${sha256Hex(canonicalBytes(rest)).slice(0, 16)} != sealed ${sha256.slice(0, 16)}`);
  }
}
