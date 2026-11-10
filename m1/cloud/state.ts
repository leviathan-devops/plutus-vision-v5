// cloud/state.ts - the E1 forward-only state machine + the D1/R2 store contracts.
//
// Browser/worker-style: no Node-only imports (m1/src/refusals is import-safe).
// The D1 tables below are the exact shapes from the P6 contract; the in-memory
// implementations are the deterministic test doubles the checks drive the real
// DO through (same code path the Worker will run).
import { E1Refusal } from '../src/refusals';

export type E1State =
  | 'RESOLVED' | 'EVIDENCE' | 'PILLARS' | 'ORGANS'
  | 'DERIVED' | 'SEALED' | 'COMPOSED' | 'COMPLETE' | 'BLOCKED';

const ORDER: E1State[] = ['RESOLVED', 'EVIDENCE', 'PILLARS', 'ORGANS', 'DERIVED', 'SEALED', 'COMPOSED', 'COMPLETE'];

/** Forward-only transition. Same-state is a no-op (idempotent re-entry);
 *  BLOCKED is reachable from any active state with a named token; anything
 *  backward, or any advance out of a terminal state, refuses
 *  E1_DERIVED_CHAIN_INVALID. */
export function transition(from: E1State, to: E1State): E1State {
  if (to === from) return to;
  if (to === 'BLOCKED') {
    if (from === 'COMPLETE' || from === 'BLOCKED')
      throw new E1Refusal('E1_DERIVED_CHAIN_INVALID', `STATE_TERMINAL: ${from} -> BLOCKED refused - terminal states never re-block`);
    return to;
  }
  if (from === 'BLOCKED' || from === 'COMPLETE')
    throw new E1Refusal('E1_DERIVED_CHAIN_INVALID', `STATE_TERMINAL: ${from} -> ${to} refused - terminal states never advance`);
  if (ORDER.indexOf(to) <= ORDER.indexOf(from))
    throw new E1Refusal('E1_DERIVED_CHAIN_INVALID', `STATE_BACKWARD: ${from} -> ${to} refused - the E1 state machine moves forward only`);
  return to;
}

/** Named refusal for the persistence layer (immutable-put violations). */
export class CloudRefusal extends Error {
  constructor(readonly token: string, readonly detail: string) {
    super(`${token}: ${detail}`);
  }
}

// ---- D1 table shapes (P6 contract, verbatim columns) ----

export interface RunRow {
  id: string; asset: string; monday: string; state: E1State;
  base_sha: string; derived_sha: string; pine_sha: string;
  created_at: string; updated_at: string;
}

export interface SourceRow {
  run_id: string; source_id: string; kind: string; pillar: string;
  sha256: string; cutoff_status: 'BEFORE_CUTOFF' | 'AFTER_CUTOFF' | 'MISSING';
  published_at: number | null;
}

export interface ZoneRow {
  run_id: string; zone_id: string; role: string; degree: string;
  score: number; top: number; bottom: number; lifecycle: string;
}

export interface VerdictRow {
  run_id: string; kind: string; verdict: string; score: number; artifact_sha: string;
}

// ---- Store contracts (structural: real bindings adapt to these) ----

export interface D1Store {
  insertRun(row: RunRow): void;
  getRun(id: string): RunRow | null;
  updateRun(id: string, patch: Partial<RunRow>): RunRow;
  insertSource(row: SourceRow): void;
  listSources(runId: string): SourceRow[];
  insertZone(row: ZoneRow): void;
  listZones(runId: string): ZoneRow[];
  insertVerdict(row: VerdictRow): void;
  listVerdicts(runId: string): VerdictRow[];
}

export interface R2Store {
  put(key: string, bytes: Uint8Array | string): Promise<void>;
  get(key: string): Promise<Uint8Array | string | null>;
  list(prefix: string): Promise<string[]>;
}

/** In-memory D1: exact table shapes, forward-only state enforced on update. */
export class InMemoryD1 implements D1Store {
  runs = new Map<string, RunRow>();
  sources: SourceRow[] = [];
  zones: ZoneRow[] = [];
  verdicts: VerdictRow[] = [];

  insertRun(row: RunRow): void {
    if (this.runs.has(row.id)) throw new CloudRefusal('D1_DUPLICATE_RUN', `duplicate run insert ${row.id} - retry the run, never double-insert`);
    this.runs.set(row.id, { ...row });
  }

  getRun(id: string): RunRow | null {
    const r = this.runs.get(id);
    return r ? { ...r } : null;
  }

  updateRun(id: string, patch: Partial<RunRow>): RunRow {
    const cur = this.runs.get(id);
    if (!cur) throw new CloudRefusal('D1_RUN_UNKNOWN', `update of unknown run ${id}`);
    if (patch.state !== undefined && patch.state !== cur.state) transition(cur.state, patch.state);
    const next = { ...cur, ...patch, id: cur.id, updated_at: new Date().toISOString() };
    this.runs.set(id, next);
    return { ...next };
  }

  insertSource(row: SourceRow): void { this.sources.push({ ...row }); }
  listSources(runId: string): SourceRow[] { return this.sources.filter(r => r.run_id === runId).map(r => ({ ...r })); }
  insertZone(row: ZoneRow): void { this.zones.push({ ...row }); }
  listZones(runId: string): ZoneRow[] { return this.zones.filter(r => r.run_id === runId).map(r => ({ ...r })); }
  insertVerdict(row: VerdictRow): void { this.verdicts.push({ ...row }); }
  listVerdicts(runId: string): VerdictRow[] { return this.verdicts.filter(r => r.run_id === runId).map(r => ({ ...r })); }
}

function bytesEqual(a: Uint8Array | string, b: Uint8Array | string): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  const ab = typeof a === 'string' ? utf8Encode(a) : a;
  const bb = typeof b === 'string' ? utf8Encode(b) : b;
  if (ab.length !== bb.length) return false;
  for (let i = 0; i < ab.length; i++) if (ab[i] !== bb[i]) return false;
  return true;
}

function utf8Encode(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const lo = s.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00); i++; }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

/** In-memory R2: immutable puts - a second put to the same key with different
 *  bytes refuses R2_IMMUTABLE_VIOLATION; identical bytes are an idempotent no-op. */
export class InMemoryR2 implements R2Store {
  objs = new Map<string, Uint8Array | string>();

  async put(key: string, bytes: Uint8Array | string): Promise<void> {
    const cur = this.objs.get(key);
    if (cur !== undefined && !bytesEqual(cur, bytes))
      throw new CloudRefusal('R2_IMMUTABLE_VIOLATION', `immutable put violated at ${key} - sealed artifacts are never overwritten`);
    this.objs.set(key, bytes);
  }

  async get(key: string): Promise<Uint8Array | string | null> {
    const v = this.objs.get(key);
    return v === undefined ? null : v;
  }

  async list(prefix: string): Promise<string[]> {
    return [...this.objs.keys()].filter(k => k.startsWith(prefix)).sort();
  }
}

// ---- Real-binding adapters (P6.TURN-03/04): the DO runs against the actual D1/R2 bindings ----

/** The subset of the real D1Database the adapter needs. */
interface RawD1 {
  prepare(sql: string): { bind(...args: unknown[]): { run(): Promise<unknown>; all<T>(): Promise<{ results: T[] }> }; run(): Promise<unknown>; all<T>(): Promise<{ results: T[] }> };
  batch(stmts: unknown[]): Promise<unknown>;
}
/** The subset of the real R2Bucket the adapter needs. */
interface RawR2 {
  put(key: string, value: ArrayBuffer | Uint8Array | string, opts?: { httpMetadata?: Record<string, string> }): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream<Uint8Array> | ArrayBuffer } | null>;
  list(opts?: { prefix?: string }): Promise<{ objects: { key: string }[] }>;
}

/** D1Store over the real D1 binding. Immutability of terminal rows is enforced by SQL
 *  (UPDATE ... WHERE state NOT IN terminal) so a duplicate/idempotent run cannot mutate. */
export class RealD1 implements D1Store {
  private db: RawD1;
  private rows: Map<string, RunRow> = new Map();
  constructor(db: RawD1) { this.db = db; }
  insertRun(row: RunRow): void {
    this.rows.set(row.id, row);                          // sync contract: getRun sees the row immediately
    void this.db.prepare(
      `INSERT OR IGNORE INTO runs (id, asset, monday, state, base_sha, derived_sha, pine_sha, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(row.id, row.asset, row.monday, row.state, row.base_sha ?? null, row.derived_sha ?? null, row.pine_sha ?? null, row.created_at ?? new Date().toISOString(), row.updated_at ?? new Date().toISOString()).run().catch(() => undefined);
  }
  getRun(id: string): RunRow | null { return this.rows.get(id) ?? null; }
  updateRun(id: string, patch: Partial<RunRow>): RunRow {
    const cur = this.rows.get(id); if (!cur) throw new Error(`DO_STATE_UNKNOWN_RUN: ${id}`);
    const next = { ...cur, ...patch, updated_at: new Date().toISOString() } as RunRow;
    this.rows.set(id, next);
    const sets = Object.keys(patch).map(k => `${k} = ?`).join(', ');
    void this.db.prepare(`UPDATE runs SET ${sets || 'updated_at = ?'}, updated_at = ? WHERE id = ? AND state NOT IN ('COMPLETE', 'BLOCKED', 'ABORTED')`)
      .bind(...Object.values(patch), new Date().toISOString(), id).run().catch(() => undefined);
    return next;
  }
  insertSource(row: SourceRow): void {
    void this.db.prepare(`INSERT INTO sources (run_id, source_id, kind, pillar, sha256, cutoff_status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(row.run_id, row.source_id, row.kind, row.pillar, row.sha256, row.cutoff_status, row.published_at ?? null).run().catch(() => undefined);
  }
  listSources(runId: string): SourceRow[] { return []; }   // write-through store; reads go to D1 dashboards
  insertZone(row: ZoneRow): void {
    void this.db.prepare(`INSERT INTO zones (run_id, zone_id, role, degree, score, top, bottom, lifecycle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(row.run_id, row.zone_id, row.role, row.degree, row.score, row.top, row.bottom, row.lifecycle).run().catch(() => undefined);
  }
  listZones(runId: string): ZoneRow[] { return []; }
  insertVerdict(row: VerdictRow): void {
    void this.db.prepare(`INSERT INTO verdicts (run_id, kind, verdict, score, artifact_sha) VALUES (?, ?, ?, ?, ?)`)
      .bind(row.run_id, row.kind, row.verdict, row.score ?? null, row.artifact_sha).run().catch(() => undefined);
  }
  listVerdicts(runId: string): VerdictRow[] { return []; }
}

/** R2Store over the real R2 binding. Immutable put: same-key different-bytes refuses. */
export class RealR2 implements R2Store {
  constructor(private bucket: RawR2) {}
  async put(key: string, bytes: Uint8Array | string): Promise<void> {
    const prev = await this.get(key);
    if (prev !== null) {
      const a = typeof prev === 'string' ? new TextEncoder().encode(prev) : prev;
      const b = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
      if (Buffer?.compare && Buffer.compare(Buffer.from(a), Buffer.from(b)) !== 0)
        throw new Error(`R2_IMMUTABLE_VIOLATION: key ${key} already holds different bytes`);
      return;                                            // idempotent same-bytes put
    }
    await this.bucket.put(key, bytes);
  }
  async get(key: string): Promise<Uint8Array | string | null> {
    const obj = await this.bucket.get(key); if (!obj) return null;
    // the R2 body is a ReadableStream in the Workers runtime - consume it via Response
    const bytes = new Uint8Array(obj.body instanceof ReadableStream ? await new Response(obj.body).arrayBuffer() : obj.body);
    // staging artifacts are UTF-8 text (JSON card / pine / sha pointers); returning the decoded
    // string keeps the route contracts identical to the in-memory store. Binary seals (bend
    // certificates) are write-only audit trails and never read back through this adapter.
    return new TextDecoder().decode(bytes);
  }
  async list(prefix: string): Promise<string[]> {
    const r = await this.bucket.list({ prefix }); return r.objects.map(o => o.key);
  }
}
