// manifest.ts - immutable evidence manifest (BUILD_WORKFLOW P1.TURN-05).
// One row per prediction source: canonical bytes -> sha256; cutoff_status from published_at
// (null/NaN -> MISSING, <= cutoff -> BEFORE_CUTOFF, else AFTER_CUTOFF). Every prediction
// source must be BEFORE_CUTOFF or buildManifest refuses with E1_CUTOFF_VIOLATION -
// post-cutoff bytes are stored for audit but can never feed the prediction. Canonical bytes
// are JSON with sorted keys so the same source always hashes to the same sha.
import { createHash } from 'node:crypto';
import { E1Refusal } from '../refusals';

export type CutoffStatus = 'BEFORE_CUTOFF' | 'AFTER_CUTOFF' | 'MISSING';
export type SourceKind = 'bars' | 'protocol-a' | 'analyst' | 'exchange' | 'macro' | 'organ';

export interface ManifestSource {
  source_id: string;
  source_kind: SourceKind;
  pillar: string;
  published_at: number | null;
  retrieved_at: string;
  raw_key: string;
  impact: string;
  /** Canonical payload bytes for hashing (stable JSON). */
  bytes: string | Uint8Array;
}

export interface ManifestRow {
  source_id: string;
  source_kind: SourceKind;
  pillar: string;
  sha: string;
  published_at: number | null;
  retrieved_at: string;
  cutoff_status: CutoffStatus;
  raw_key: string;
  impact: string;
}

export function cutoffStatusOf(published_at: number | null | undefined, cutoffMs: number): CutoffStatus {
  if (published_at === null || published_at === undefined || (typeof published_at === 'number' && !Number.isFinite(published_at))) return 'MISSING';
  if (typeof published_at !== 'number') return 'MISSING';
  return published_at <= cutoffMs ? 'BEFORE_CUTOFF' : 'AFTER_CUTOFF';
}

/** Canonical bytes for a JSON-able value: JSON.stringify with object keys sorted recursively. */
export function canonicalBytes(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object' && !(v instanceof Uint8Array)) {
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

export interface RunIdentity { asset: string; week_monday: string; requested_by: string }

/** Build the manifest. Refuses E1_CUTOFF_VIOLATION naming any AFTER_CUTOFF prediction source;
 *  MISSING sources pass with a MISSING row (named, never hashed from thin air). */
export function buildManifest(sources: ManifestSource[], identity: RunIdentity, cutoffMs: number): ManifestRow[] {
  if (!identity || !identity.asset || !identity.week_monday)
    throw new E1Refusal('E1_IDENTITY_INVALID', 'MANIFEST_IDENTITY_INVALID: run identity needs asset + week_monday');
  const rows: ManifestRow[] = sources.map(s => ({
    source_id: s.source_id,
    source_kind: s.source_kind,
    pillar: s.pillar,
    sha: sha256Hex(s.bytes),
    published_at: s.published_at,
    retrieved_at: s.retrieved_at,
    cutoff_status: cutoffStatusOf(s.published_at, cutoffMs),
    raw_key: s.raw_key,
    impact: s.impact,
  }));
  const future = rows.filter(r => r.cutoff_status === 'AFTER_CUTOFF' && r.source_kind !== 'organ');
  if (future.length)
    throw new E1Refusal('E1_CUTOFF_VIOLATION', `MANIFEST_FUTURE: ${future.map(r => `${r.source_id} published ${r.published_at === null ? 'null' : new Date(r.published_at as number).toISOString()} > cutoff ${new Date(cutoffMs).toISOString()}`).join('; ')} - post-cutoff records are audit-only, never prediction inputs`);
  return rows;
}
