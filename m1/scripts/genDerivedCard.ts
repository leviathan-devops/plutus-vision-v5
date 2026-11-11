// genDerivedCard.ts - produce m1/out/e1-derived-<asset>-<monday>.json (P8.TURN-01's second
// frozen artifact). Same contract as the engine deriveCard (P4.TURN-01: clone, schema+1,
// supersedes = the base's seal, zone metadata, canonical re-seal), bound to the base card's
// ACTUAL seal convention: run.ts seals sha256 over JSON.stringify(card, null, 1). The
// envelope reproduction check below IS the base-immutability proof for that convention (the
// engine's canonical-bytes variant is exercised by checkDerivedCard against canonically-sealed
// fixtures; both refuse a mutated base by name).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readCard } from '../src/card';
import { canonicalBytes, sha256Hex } from '../src/derivedCard';

const [asset = 'EURUSD', monday = '2026-07-06'] = process.argv.slice(2);
const sealed = readCard(readFileSync(`m1/out/e1-card-${asset}-${monday}.json`, 'utf8'));
// 1. base immutability: the file's seal must reproduce from its own body (run.ts convention)
const sealedBody = JSON.stringify(sealed.card, null, 1);
const resealed = createHash('sha256').update(sealedBody).digest('hex');
if (resealed !== sealed.sha256) throw new Error(`E1_BASE_CARD_MUTATED: envelope says ${sealed.sha256.slice(0, 16)} but the body hashes to ${resealed.slice(0, 16)} (run.ts seal convention)`);
// 2. derive (P4.TURN-01): clone, advance schema, supersede, attach zone metadata
const base = sealed.card as unknown as Record<string, unknown>;
const zoneMeta = ((base.zones as { id: string; reactionState: string }[]) ?? []).map((z) => ({
  zoneId: z.id, freshness: 'UNOBSERVABLE_OFFLINE', reactionState: z.reactionState,
  lifecycle: 'UNOBSERVABLE_OFFLINE', operativeDefense: 'UNOBSERVABLE_OFFLINE', pierced: false,
}));
const derived = {
  ...structuredClone(base),
  schema_version: ((base.schema_version as number) ?? 1) + 1,
  supersedes_sha256: sealed.sha256,
  unassignedPrecision: [] as unknown[],
  zoneMeta,
} as Record<string, unknown>;
delete derived.sha256;
// 3. canonical re-seal of the derived body
derived.sha256 = sha256Hex(canonicalBytes(derived));
const out = `m1/out/e1-derived-${asset}-${monday}.json`;
writeFileSync(out, JSON.stringify(derived, null, 1) + '\n');
console.log(`derived ${out} supersedes=${sealed.sha256.slice(0, 16)} sha=${String(derived.sha256).slice(0, 16)}`);
