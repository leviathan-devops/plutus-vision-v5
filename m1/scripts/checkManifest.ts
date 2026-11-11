// checkManifest.ts - P1.TURN-05 gate. Canonical bytes hash stably; pre-cutoff rows
// pass; a post-cutoff prediction source refuses; a MISSING source names itself in a row.
import { readFileSync } from 'node:fs';
import { runWindow } from '../src/window';
import { buildManifest, canonicalBytes, cutoffStatusOf, sha256Hex, type ManifestSource } from '../src/evidence/manifest';

const ROOT = new URL('../../', import.meta.url).pathname;
const W = runWindow('DXY', '2026-07-06');
const H = 3_600_000;
// Legitimate: the real Protocol A image bytes hash, stably, to the fixture sha.
const img = readFileSync(`${ROOT}m1/evidence/protocol-a/investinglive-fxo-2026-07-06.jpg`);
const imgSha = sha256Hex(img);
const fixtureSha = JSON.parse(readFileSync(`${ROOT}m1/evidence/protocol-a/extraction.json`, 'utf8')).image.sha256;
if (imgSha !== fixtureSha) throw new Error(`MANIFEST_IMAGE_SHA_FAIL: ${imgSha} != fixture ${fixtureSha}`);
console.log(`MANIFEST_SHA_OK image_sha256=${imgSha.slice(0, 16)}... bytes=${img.length}`);
// Stable canonical bytes: key order never changes the hash.
const a = canonicalBytes({ b: 1, a: [3, 2, { y: 1, x: 2 }] });
const b = canonicalBytes({ a: [3, 2, { x: 2, y: 1 }], b: 1 });
if (sha256Hex(a) !== sha256Hex(b)) throw new Error('MANIFEST_CANONICAL_FAIL: key order changed the hash');
console.log('MANIFEST_CANONICAL_STABLE');
const base: ManifestSource[] = [
  { source_id: 'tv-bars-DXY-1H', source_kind: 'bars', pillar: 'P1/P2/P5/P6', published_at: W.cutoffUtc - 7 * 24 * H, retrieved_at: '2026-07-06T08:00:00Z', raw_key: 'tv-bars/TVC_DXY/60/2026-07.json', impact: 'all bar-derived pillars', bytes: 'bars-bytes' },
  { source_id: 'investinglive-protocol-a', source_kind: 'protocol-a', pillar: 'P3/P8', published_at: Date.parse('2026-07-06T05:47:00Z'), retrieved_at: '2026-07-06T06:00:00Z', raw_key: 'e1/protocol-a/2026-07-06.json', impact: 'options + arena fallback', bytes: img },
];
const rows = buildManifest(base, { asset: 'DXY', week_monday: '2026-07-06', requested_by: 'p1-gate' }, W.cutoffUtc);
if (!rows.every(r => r.cutoff_status === 'BEFORE_CUTOFF') || rows.some(r => r.sha.length !== 64)) throw new Error(`MANIFEST_ROWS_FAIL: ${JSON.stringify(rows)}`);
console.log('MANIFEST_CUTOFF_OK rows=' + rows.length);
// Adversarial: a post-cutoff prediction source refuses by name.
try {
  buildManifest([...base, { source_id: 'late-desk-note', source_kind: 'analyst', pillar: 'P4', published_at: W.cutoffUtc + 1, retrieved_at: '2026-07-06T09:00:00Z', raw_key: 'analyst/late.json', impact: 'must not feed prediction', bytes: 'late' }],
    { asset: 'DXY', week_monday: '2026-07-06', requested_by: 'p1-gate' }, W.cutoffUtc);
  throw new Error('MANIFEST_FUTURE_ADVERSARIAL_FAIL');
} catch (e) {
  if ((e as Error).message.includes('MANIFEST_FUTURE_ADVERSARIAL_FAIL')) throw e;
  if (!(e as Error).message.includes('MANIFEST_FUTURE')) throw e;
  console.log('MANIFEST_FUTURE_REJECTED');
}
// Named absence: a source with no publication time gets a MISSING row, never a silent pass.
const withMissing = buildManifest([...base, { source_id: 'ice-walls', source_kind: 'exchange', pillar: 'P7', published_at: null, retrieved_at: '2026-07-06T08:00:00Z', raw_key: 'exchange/ice.json', impact: 'no walls acquired', bytes: 'absent' }],
  { asset: 'DXY', week_monday: '2026-07-06', requested_by: 'p1-gate' }, W.cutoffUtc);
const m = withMissing.find(r => r.source_id === 'ice-walls');
if (!m || m.cutoff_status !== 'MISSING') throw new Error(`MANIFEST_MISSING_FAIL: ${JSON.stringify(withMissing)}`);
if (cutoffStatusOf(undefined, W.cutoffUtc) !== 'MISSING') throw new Error('MANIFEST_MISSING_CLASSIFY_FAIL');
console.log('MANIFEST_MISSING_NAMED source_id=ice-walls');
