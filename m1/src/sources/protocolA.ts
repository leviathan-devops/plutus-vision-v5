// protocolA.ts - Protocol A typed evidence (BUILD_WORKFLOW P1.TURN-02).
// The raw fixture lives at m1/evidence/protocol-a/extraction.json (the options.Extraction shape);
// this module is the typed compiler-grade contract: published_at as ms, 64-hex image SHA,
// https source URL, finite-positive spots, known pairs, positive strikes, non-negative notionals,
// and a cutoff classification. Pillar P3/P8 semantics stay in m1/src/options.ts; this module
// owns the input contract and its cutoff/provenance validation. Never paraphrased, never guessed.
import { E1Refusal } from '../refusals';

export interface EvidenceRef {
  source_id: string;
  source_url: string;
  retrieved_at: string;
  published_at: string;
  raw_r2_key: string;
  content_sha256: string;
  extractor: string;
  extractor_version: string;
  span: string;
  confidence: null | number;
  cutoff_status: 'BEFORE_CUTOFF' | 'AFTER_CUTOFF' | 'MISSING';
}

export interface ProtocolAExtraction {
  evidence: EvidenceRef;
  published_at: number;
  spot_at_publication: Record<string, number>;
  expiries: Array<{
    date: string;
    cut: string;
    pair: string;
    notional_ccy: string;
    strikes: Array<[number, number]>;
  }>;
  image_sha256: string;
  source_url: string;
}

const KNOWN_PAIRS: Record<string, true> = { EURUSD: true, USDJPY: true, GBPUSD: true, USDCHF: true, USDCAD: true, AUDUSD: true, NZDUSD: true, EURGBP: true };
const HEX64 = /^[0-9a-fA-F]{64}$/;

/** Validate a Protocol A extraction. Refuses E1_CUTOFF_VIOLATION when published after the
 *  cutoff, E1_EVIDENCE_HASH_MISMATCH on bad image hash / http source, E1_IDENTITY_INVALID
 *  on malformed spots/expiries. Returns 'BEFORE_CUTOFF' when valid. */
export function validateProtocolA(x: ProtocolAExtraction, cutoffMs: number): 'BEFORE_CUTOFF' {
  if (!x || typeof x !== 'object') throw new E1Refusal('E1_IDENTITY_INVALID', 'PROTOCOL_A_MALFORMED: extraction is not an object');
  const xp: unknown = x.published_at;
  if (typeof xp !== 'number' || !Number.isFinite(xp)) throw new E1Refusal('E1_IDENTITY_INVALID', 'PROTOCOL_A_MALFORMED: published_at is not a finite number');
  const published_at: number = xp;
  if (published_at > cutoffMs)
    throw new E1Refusal('E1_CUTOFF_VIOLATION', `PROTOCOL_A_AFTER_CUTOFF: published ${new Date(published_at).toISOString()} > cutoff ${new Date(cutoffMs).toISOString()} - fetch a Protocol A post published before the cutoff`);
  if (typeof x.image_sha256 !== 'string' || !HEX64.test(x.image_sha256))
    throw new E1Refusal('E1_EVIDENCE_HASH_MISMATCH', `PROTOCOL_A_IMAGE_MISSING: image_sha256 is not 64 hex (${JSON.stringify(x.image_sha256)}) - the Protocol A post has no verified table image; re-read the three passes, never proceed imageless`);
  if (typeof x.source_url !== 'string' || !x.source_url.startsWith('https://'))
    throw new E1Refusal('E1_EVIDENCE_HASH_MISMATCH', `PROTOCOL_A_SOURCE_HTTP: source_url is not https (${JSON.stringify(x.source_url)}) - Protocol A evidence must cite an https investinglive page`);
  if (!x.spot_at_publication || typeof x.spot_at_publication !== 'object')
    throw new E1Refusal('E1_IDENTITY_INVALID', 'PROTOCOL_A_MALFORMED: spot_at_publication is not an object');
  for (const [pair, s] of Object.entries(x.spot_at_publication))
    if (typeof s !== 'number' || !Number.isFinite(s) || s <= 0)
      throw new E1Refusal('E1_IDENTITY_INVALID', `PROTOCOL_A_SPOT_INVALID: spot ${pair} is not finite positive (${JSON.stringify(s)})`);
  if (!Array.isArray(x.expiries))
    throw new E1Refusal('E1_IDENTITY_INVALID', 'PROTOCOL_A_MALFORMED: expiries is not an array');
  for (let i = 0; i < x.expiries.length; i++) {
    const e = x.expiries[i];
    if (!e || typeof e.pair !== 'string' || !KNOWN_PAIRS[e.pair])
      throw new E1Refusal('E1_IDENTITY_INVALID', `PROTOCOL_A_PAIR_UNKNOWN: expiries[${i}].pair is not a known pair - add it to KNOWN_PAIRS only with canon authority`);
    if (!Array.isArray(e.strikes))
      throw new E1Refusal('E1_IDENTITY_INVALID', `PROTOCOL_A_MALFORMED: expiries[${i}].strikes is not an array`);
    for (let k = 0; k < e.strikes.length; k++) {
      const row = e.strikes[k];
      const strike: unknown = row[0];
      const notional: unknown = row[1];
      if (typeof strike !== 'number' || !Number.isFinite(strike) || strike <= 0)
        throw new E1Refusal('E1_IDENTITY_INVALID', `PROTOCOL_A_STRIKE_INVALID: expiries[${i}].strikes[${k}] strike must be > 0`);
      if (typeof notional !== 'number' || !Number.isFinite(notional) || notional < 0)
        throw new E1Refusal('E1_IDENTITY_INVALID', `PROTOCOL_A_NOTIONAL_INVALID: expiries[${i}].strikes[${k}] notional must be >= 0`);
    }
  }
  return 'BEFORE_CUTOFF';
}

/** Classify an extraction against the cutoff without refusing: the manifest/status path. */
export function classifyProtocolA(x: ProtocolAExtraction | null | undefined, cutoffMs: number): 'BEFORE_CUTOFF' | 'AFTER_CUTOFF' | 'MISSING' {
  if (!x || typeof x.published_at !== 'number' || !Number.isFinite(x.published_at)) return 'MISSING';
  return x.published_at <= cutoffMs ? 'BEFORE_CUTOFF' : 'AFTER_CUTOFF';
}

/** Raw fixture (options.ts Extraction, published_at ISO) -> typed contract (published_at ms). */
export function fromRawExtraction(raw: {
  published_at: string;
  spot_at_publication: Record<string, number>;
  expiries: ProtocolAExtraction['expiries'];
  image: { sha256: string };
  source_url: string;
}): ProtocolAExtraction {
  const published_at = Date.parse(raw.published_at);
  const evidence: EvidenceRef = {
    source_id: 'investinglive-protocol-a',
    source_url: raw.source_url,
    retrieved_at: raw.published_at,
    published_at: raw.published_at,
    raw_r2_key: `e1/protocol-a/${raw.published_at}.json`,
    content_sha256: raw.image.sha256,
    extractor: 'clairic-protocol-a',
    extractor_version: 'v5.2-p1',
    span: 'full Protocol A table, three-pass read',
    confidence: null,
    cutoff_status: 'BEFORE_CUTOFF',
  };
  return {
    evidence,
    published_at,
    spot_at_publication: { ...raw.spot_at_publication },
    expiries: raw.expiries.map(e => ({ ...e, strikes: e.strikes.map(s => [s[0], s[1]] as [number, number]) })),
    image_sha256: raw.image.sha256,
    source_url: raw.source_url,
  };
}
