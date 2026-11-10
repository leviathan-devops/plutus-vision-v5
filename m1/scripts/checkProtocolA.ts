// checkProtocolA.ts - P1.TURN-02 gate. Validates the real Protocol A fixture
// (m1/evidence/protocol-a/extraction.json) as the legitimate shape, then fires the three
// named rejections: after-cutoff, missing image, bad strike.
import { readFileSync } from 'node:fs';
import { runWindow } from '../src/window';
import { validateProtocolA, fromRawExtraction, type ProtocolAExtraction } from '../src/sources/protocolA';

const ROOT = new URL('../../', import.meta.url).pathname;
const W = runWindow('DXY', '2026-07-06');
const raw = JSON.parse(readFileSync(`${ROOT}m1/evidence/protocol-a/extraction.json`, 'utf8'));
const x = fromRawExtraction(raw);
const status = validateProtocolA(x, W.cutoffUtc);
if (status !== 'BEFORE_CUTOFF') throw new Error(`PROTOCOL_A_STATUS_FAIL: ${status}`);
console.log(`PROTOCOL_A_VALID published_at=${new Date(x.published_at).toISOString()} expiries=${x.expiries.length} pairs=${[...new Set(x.expiries.map(e => e.pair))].join(',')} image=${x.image_sha256.slice(0, 16)}...`);

const after: ProtocolAExtraction = { ...x, published_at: W.cutoffUtc + 1 };
try {
  validateProtocolA(after, W.cutoffUtc);
  throw new Error('AFTER_CUTOFF_ADVERSARIAL_FAIL');
} catch (e) {
  if ((e as Error).message.includes('AFTER_CUTOFF_ADVERSARIAL_FAIL')) throw e;
  if (!(e as Error).message.includes('PROTOCOL_A_AFTER_CUTOFF')) throw e;
  console.log('PROTOCOL_A_AFTER_CUTOFF_REJECTED');
}
const noImage: ProtocolAExtraction = { ...x, image_sha256: 'not-a-hash' };
try {
  validateProtocolA(noImage, W.cutoffUtc);
  throw new Error('IMAGE_ADVERSARIAL_FAIL');
} catch (e) {
  if ((e as Error).message.includes('IMAGE_ADVERSARIAL_FAIL')) throw e;
  if (!(e as Error).message.includes('PROTOCOL_A_IMAGE_MISSING')) throw e;
  console.log('PROTOCOL_A_MISSING_IMAGE_REJECTED');
}
const badStrike: ProtocolAExtraction = { ...x, expiries: x.expiries.map(e => ({ ...e, strikes: e.strikes.map(s => [s[0], s[1]] as [number, number]) })) };
badStrike.expiries[0].strikes[0] = [0, 1_000_000];
try {
  validateProtocolA(badStrike, W.cutoffUtc);
  throw new Error('STRIKE_ADVERSARIAL_FAIL');
} catch (e) {
  if ((e as Error).message.includes('STRIKE_ADVERSARIAL_FAIL')) throw e;
  if (!(e as Error).message.includes('PROTOCOL_A_STRIKE_INVALID')) throw e;
  console.log('PROTOCOL_A_BAD_STRIKE_REJECTED');
}
