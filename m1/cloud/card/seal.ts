// cloud/card/seal.ts - R2/D1 key layout and seal/compose writers.
//
// KEYS (P6 contract):
//   cards/{asset}/{monday}/{sha}.json
//   derived/{asset}/{monday}/{sha}.json
//   pine/{asset}/{monday}/{sha}.pine
//   raw/{source}/{asset}/{monday}/{sha}
// D1 tables: runs(id, asset, monday, state, base_sha, derived_sha, pine_sha,
//   created_at, updated_at); sources(...); zones(...); verdicts(...).
// Bend is NOT the E1 runtime: it is an optional proof-certificate layer the DO
// invokes only when a proof request is present. Import-safe: no Node imports.
import type { D1Store, R2Store } from '../state';

export const keys = {
  card: (asset: string, monday: string, sha: string) => `cards/${asset}/${monday}/${sha}.json`,
  derived: (asset: string, monday: string, sha: string) => `derived/${asset}/${monday}/${sha}.json`,
  pine: (asset: string, monday: string, sha: string) => `pine/${asset}/${monday}/${sha}.pine`,
  raw: (source: string, asset: string, monday: string, sha: string) => `raw/${source}/${asset}/${monday}/${sha}`,
  latestCard: (asset: string, monday: string) => `cards/${asset}/${monday}/latest`,
  latestPine: (asset: string, monday: string) => `pine/${asset}/${monday}/latest`,
};

export function validateKeyKind(key: string): 'cards' | 'derived' | 'pine' | 'raw' {
  if (key.startsWith('cards/')) return 'cards';
  if (key.startsWith('derived/')) return 'derived';
  if (key.startsWith('pine/')) return 'pine';
  if (key.startsWith('raw/')) return 'raw';
  throw new Error(`SEAL_KEY_UNKNOWN: ${key} - keys are cards/|derived/|pine/|raw/ only`);
}

/** Seal the base card: immutable put + D1 row. Returns the object key. */
export async function sealBaseCard(
  r2: R2Store, d1: D1Store,
  args: { runId: string; asset: string; monday: string; sha: string; canonicalBody: string },
): Promise<string> {
  const key = keys.card(args.asset, args.monday, args.sha);
  await r2.put(key, args.canonicalBody);
  await r2.put(keys.latestCard(args.asset, args.monday), args.sha);
  return key;
}

/** Seal the derived card: immutable put + D1 row update. Returns the key. */
export async function sealDerivedCard(
  r2: R2Store,
  args: { asset: string; monday: string; sha: string; canonicalBody: string },
): Promise<string> {
  const key = keys.derived(args.asset, args.monday, args.sha);
  await r2.put(key, args.canonicalBody);
  return key;
}

/** Seal the composed Pine layer: immutable put. Returns the key. */
export async function sealPine(
  r2: R2Store,
  args: { asset: string; monday: string; sha: string; pine: string },
): Promise<string> {
  const key = keys.pine(args.asset, args.monday, args.sha);
  await r2.put(key, args.pine);
  await r2.put(keys.latestPine(args.asset, args.monday), args.sha);
  return key;
}

/** Store one raw source payload under the raw/ key shape. */
export async function sealRaw(
  r2: R2Store,
  args: { source: string; asset: string; monday: string; sha: string; bytes: Uint8Array | string },
): Promise<string> {
  const key = keys.raw(args.source, args.asset, args.monday, args.sha);
  await r2.put(key, args.bytes);
  return key;
}

function b64Encode(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!, b = i + 1 < bytes.length ? bytes[i + 1]! : 0, c = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    const n = (a << 16) | (b << 8) | c;
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + (i + 1 < bytes.length ? chars[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? chars[n & 63] : '=');
  }
  return out;
}

/** Optional Bend proof certificate — never the E1 runtime. A caller that wants a
 *  proof attaches { bendProof: b64 } to the run input; the DO stores it raw and
 *  records verdict kind=bend. The certificate never influences pillars/organs. */
export async function sealBendProof(
  r2: R2Store, d1: D1Store,
  args: { runId: string; asset: string; monday: string; proofBytes: Uint8Array | string },
): Promise<{ key: string; sha: string }> {
  const bytes = typeof args.proofBytes === 'string' ? args.proofBytes : b64Encode(args.proofBytes);
  const sha = await digestHex(typeof bytes === 'string' ? bytes : b64Encode(args.proofBytes as Uint8Array));
  const key = keys.raw('bend-proof', args.asset, args.monday, sha);
  await r2.put(key, bytes);
  d1.insertVerdict({ run_id: args.runId, kind: 'bend', verdict: 'PROOF_SEALED', score: 1, artifact_sha: sha });
  return { key, sha };
}

/** Worker-safe hex digest hook: the DO injects the real SHA-256 at runtime.
 *  The module default below is the deterministic FNV-1a fallback used ONLY by
 *  the local checks (never shipped as a seal over production artifacts). */
export let digestHex: (s: string) => Promise<string> = async (s: string) => {
  let h1 = 0x811c9dc5, h2 = 0x811c9dc5 ^ 0xdead;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ (c + 31), 16777619) >>> 0;
  }
  const h = (n: number) => ('00000000' + n.toString(16)).slice(-8);
  return (h(h1) + h(h2) + h(Math.imul(h1 ^ h2, 16777619) >>> 0) + h(Math.imul(h1 + h2, 16777619) >>> 0)).repeat(2).slice(0, 64);
};

export function setDigestHex(fn: (s: string) => Promise<string>): void { digestHex = fn; }
