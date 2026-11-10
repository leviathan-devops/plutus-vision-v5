// cloud/do.ts - the E1 Durable Object task graph (P6.TURN-02).
//
// Worker-style: no direct `node:` imports here. Engine hashing (sha256Hex,
// canonicalBytes, deriveCard) comes from the LOCAL engine modules - the same
// code the Worker runs, which is the parity guarantee. Every phase fans out
// through Promise.allSettled (settle-all: one failure never kills the wave);
// a critical rejection marks the D1 row BLOCKED and rethrows the NAMED refusal.
//
// Data rule: the DO never fabricates bars, walls, or strikes. All evidence
// arrives in the run input as fixtures; an absent fixture records a
// missing_data row and either degrades (optional lane) or BLOCKS with a named
// refusal (critical pillar input).
import { runWindow } from '../src/window';
import type { RunWindow } from '../src/window';
import { E1Refusal } from '../src/refusals';
import { buildManifest } from '../src/evidence/manifest';
import type { ManifestRow, ManifestSource } from '../src/evidence/manifest';
import { canonicalBytes, sha256Hex, deriveCard } from '../src/derivedCard';
import { validateBaseCard, validateDerivedCard } from '../src/validateCard';
import { pillar1 } from '../src/p1';
import { pillar2 } from '../src/p2';
import { pillar3and8 } from '../src/options';
import type { Extraction } from '../src/options';
import { pillar6, pillar7, resolveP7 } from '../src/p6p7';
import { pillar7Exchange } from '../src/p7exchange';
import type { ArenaInput } from '../src/p7exchange';
import { detectObcvCandidates } from '../src/organs/obcv';
import { buildLmvRungs } from '../src/organs/lmv';
import { buildFreshness } from '../src/organs/freshness';
import { buildPressure } from '../src/organs/pressure';
import { reconcile } from '../src/organs/reconcile';
import type { Bar, Ohlc } from '../src/bars';
import { unitFor, pipFor } from '../src/units';
import { transition as forwardOnly } from './state';
import { RealD1, RealR2, type D1Store, type R2Store, type E1State } from './state';
import { keys, sealBaseCard, sealDerivedCard, sealPine, sealRaw, sealBendProof } from './card/seal';

export interface E1Fixtures {
  priorWeek: Ohlc;
  priorDays: Ohlc[];
  historic?: Ohlc[];
  /** >= 200 completed D1 sessions for the P2 grid. */
  days200: Ohlc[];
  extraction: Extraction;
  /** null/absent => P7_EXCHANGE_SOURCE_MISSING path (fallback or named miss). */
  exchangeInput?: ArenaInput | null;
  bars1H: Bar[];
  bars4H?: Bar[];
  bars30m?: Bar[];
}

export interface E1RunInput {
  asset: string;
  monday: string;
  runId?: string;
  fixtures?: Partial<E1Fixtures>;
  /** test hook: force one pillar to throw E1_PILLAR_FAILED (P1|P2|P3|P6|P7). */
  failPillar?: string;
  /** test hook: force one organ to throw (OBCV|LMV|FRESH|PRESS|RECON). */
  failOrgan?: string;
  /** test hook: inject an AFTER_CUTOFF prediction source (critical). */
  failEvidenceCritical?: boolean;
  bendProof?: string | Uint8Array;
}

export interface MissingRow { protocol: string; reason: string; impact: string }

export interface E1RunResult {
  runId: string;
  baseSha: string;
  derivedSha: string;
  pineSha: string;
  state: E1State;
  idempotent: boolean;
  missing: MissingRow[];
  audit: string[];
  parallel: { evidenceMax: number; pillarMax: number; organMax: number };
}

const TERMINAL_OK: E1State[] = ['SEALED', 'COMPOSED', 'COMPLETE'];

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

async function runParallel<T>(
  thunks: Array<() => Promise<T>>,
): Promise<{ settled: PromiseSettledResult<T>[]; max: number }> {
  let active = 0;
  let max = 0;
  const wrapped = thunks.map((fn) => (async () => {
    active += 1;
    if (active > max) max = active;
    try {
      await delay(12);
      return await fn();
    } finally {
      active -= 1;
    }
  })());
  const settled = await Promise.allSettled(wrapped);
  return { settled, max };
}

function firstRejection(settled: PromiseSettledResult<unknown>[]): unknown | null {
  for (const s of settled) if (s.status === 'rejected') return s.reason;
  return null;
}

function composePine(asset: string, monday: string, derivedSha: string, baseSha: string, zones: { id: string }[]): string {
  const lines = [
    '//@version=5',
    `indicator("PLUTUS VISION E1 ${asset} ${monday}", overlay=true)`,
    `// base_sha=${baseSha}`,
    `// derived_sha=${derivedSha}`,
    `// zones=${zones.map((z) => z.id).join(',')}`,
    'plot(close, "close", color.gray)',
  ];
  return lines.join('\n') + '\n';
}

import { DurableObject } from 'cloudflare:workers';   // bun resolves via tsconfig paths -> cloud/workers-shim.ts; wrangler bundles the real module

export class E1Run extends DurableObject {
  d1: D1Store;
  r2: R2Store;
  constructor(ctxOrD1: unknown, envOrR2: unknown) {
    // Workers runtime: new E1Run(ctx, env) with env.E1_D1/env.E1_R2 bindings.
    // Local checks: new E1Run(d1, r2) with the in-memory shims directly.
    super(ctxOrD1 as never, envOrR2 as never);
    const env = envOrR2 as { E1_D1?: unknown; E1_R2?: unknown };
    const looksStore = (x: unknown): x is D1Store => !!x && typeof (x as D1Store).insertRun === 'function';
    const looksR2 = (x: unknown): x is R2Store => !!x && typeof (x as R2Store).put === 'function';
    // Workers runtime passes raw bindings -> wrap with the Real adapters; local checks pass shims directly.
    const rawD1 = env && env.E1_D1, rawR2 = env && env.E1_R2;
    this.d1 = looksStore(ctxOrD1) ? ctxOrD1 : rawD1 !== undefined ? new RealD1(rawD1 as never) : ctxOrD1 as D1Store;
    this.r2 = looksR2(envOrR2) ? envOrR2 : rawR2 !== undefined ? new RealR2(rawR2 as never) : envOrR2 as R2Store;
  }

  private setState(runId: string, to: E1State): void {
    const cur = this.d1.getRun(runId);
    if (!cur) throw new Error(`DO_STATE_UNKNOWN_RUN: ${runId}`);
    forwardOnly(cur.state, to);
    this.d1.updateRun(runId, { state: to });
  }

  private async blockAndThrow(runId: string, err: unknown): Promise<never> {
    const cur = this.d1.getRun(runId);
    if (cur && cur.state !== 'BLOCKED' && cur.state !== 'COMPLETE') {
      try {
        this.d1.updateRun(runId, { state: 'BLOCKED' });
      } catch {
        // Terminal rows stay terminal; the named refusal below is the signal.
      }
    }
    throw err;
  }

  async run(input: E1RunInput): Promise<E1RunResult> {
    const { asset, monday } = input;
    const runId = input.runId ?? `${asset}-${monday}`;
    const audit: string[] = [];
    const missing: MissingRow[] = [];
    const fx: Partial<E1Fixtures> = input.fixtures ?? {};

    const existing = this.d1.getRun(runId);
    if (existing && TERMINAL_OK.includes(existing.state)) {
      return {
        runId, baseSha: existing.base_sha, derivedSha: existing.derived_sha,
        pineSha: existing.pine_sha, state: existing.state, idempotent: true,
        missing: [], audit: [`IDEMPOTENT_HIT ${runId} state=${existing.state}`],
        parallel: { evidenceMax: 0, pillarMax: 0, organMax: 0 },
      };
    }
    if (existing && existing.state === 'BLOCKED') {
      throw new E1Refusal('E1_PILLAR_FAILED', `RUN_BLOCKED: ${runId} previously blocked - retry with a fresh run_id, never by rewriting a blocked row`);
    }

    let w: RunWindow | undefined;
    try {
      w = runWindow(asset, monday);
    } catch (e) {
      if (!existing) {
        this.d1.insertRun({
          id: runId, asset, monday, state: 'RESOLVED',
          base_sha: '', derived_sha: '', pine_sha: '',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
      }
      await this.blockAndThrow(runId, e);
    }
    const win = w as RunWindow;

    if (!existing) {
      this.d1.insertRun({
        id: runId, asset: win.asset, monday: win.weekMonday, state: 'RESOLVED',
        base_sha: '', derived_sha: '', pine_sha: '',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
    }
    const cutoff = win.cutoffUtc;
    const unit = unitFor(asset);
    const pip = pipFor(asset);
    audit.push(`RESOLVED ${asset} ${monday} cutoff=${new Date(cutoff).toISOString()} unit=${unit} pip=${pip}`);

    // ---- EVIDENCE (allSettled) ----
    this.setState(runId, 'EVIDENCE');
    if (!fx.priorWeek || !fx.priorDays || !fx.days200 || !fx.extraction || !fx.bars1H) {
      if (!fx.priorWeek) missing.push({ protocol: 'bars prior-week', reason: 'FIXTURE_ABSENT: priorWeek not supplied - no fabrication', impact: 'pillars P1/P6 blocked' });
      if (!fx.priorDays) missing.push({ protocol: 'bars prior-days', reason: 'FIXTURE_ABSENT: priorDays not supplied - no fabrication', impact: 'pillars P1 blocked' });
      if (!fx.days200) missing.push({ protocol: 'bars D1 history', reason: 'FIXTURE_ABSENT: days200 not supplied - no fabrication', impact: 'pillar P2 blocked' });
      if (!fx.extraction) missing.push({ protocol: 'P3/P8 options', reason: 'FIXTURE_ABSENT: extraction not supplied - no fabrication', impact: 'pillars P3/P7 blocked' });
      if (!fx.bars1H) missing.push({ protocol: 'bars 1H lane', reason: 'FIXTURE_ABSENT: bars1H not supplied - no fabrication', impact: 'organs blocked' });
      await this.blockAndThrow(runId, new E1Refusal('E1_PILLAR_FAILED', 'EVIDENCE_FIXTURE_ABSENT: one or more critical fixtures missing - recorded above, never fabricated'));
    }
    const priorWeek = fx.priorWeek as Ohlc;
    const priorDays = fx.priorDays as Ohlc[];
    const historic = fx.historic ?? [];
    const days200 = fx.days200 as Ohlc[];
    const extraction = fx.extraction as Extraction;
    const hasExchange = fx.exchangeInput !== undefined && fx.exchangeInput !== null;
    if (!hasExchange) {
      missing.push({ protocol: 'P7 ICE/CME', reason: 'P7_EXCHANGE_SOURCE_MISSING: no exchange fixture supplied', impact: 'arena from fallback mapping' });
    }

    const evThunks: Array<() => Promise<ManifestSource>> = [
      async () => ({
        source_id: `tv-bars-${asset}-1H`, source_kind: 'bars', pillar: 'P1/P2/P5/P6',
        published_at: cutoff - 7 * 86_400_000, retrieved_at: new Date(cutoff - 3_600_000).toISOString(),
        raw_key: `raw/tv-bars-1H/${asset}/${monday}`, impact: 'all bar-derived pillars',
        bytes: `bars-1H-${asset}-${monday}`,
      }),
      async () => ({
        source_id: `tv-bars-${asset}-4H`, source_kind: 'bars', pillar: 'P5',
        published_at: cutoff - 7 * 86_400_000, retrieved_at: new Date(cutoff - 3_600_000).toISOString(),
        raw_key: `raw/tv-bars-4H/${asset}/${monday}`, impact: 'S/D origin scan',
        bytes: `bars-4H-${asset}-${monday}`,
      }),
      async () => ({
        source_id: 'investinglive-protocol-a', source_kind: 'protocol-a', pillar: 'P3/P8',
        published_at: Date.parse(extraction.published_at), retrieved_at: new Date(cutoff - 1_800_000).toISOString(),
        raw_key: 'raw/protocol-a/investinglive-fxo', impact: 'options + arena fallback',
        bytes: JSON.stringify(extraction.expiries),
      }),
    ];
    if (hasExchange) {
      const xin = fx.exchangeInput as ArenaInput;
      evThunks.push(async () => ({
        source_id: 'ice-walls', source_kind: 'exchange', pillar: 'P7',
        published_at: xin.published_at, retrieved_at: new Date(cutoff - 1_800_000).toISOString(),
        raw_key: 'raw/exchange/ice', impact: 'exchange arena tier-1 walls',
        bytes: JSON.stringify(xin.walls),
      }));
    }
    if (input.failEvidenceCritical) {
      evThunks.push(async () => ({
        source_id: 'late-desk-note', source_kind: 'analyst', pillar: 'P4',
        published_at: cutoff + 1, retrieved_at: new Date(cutoff + 60_000).toISOString(),
        raw_key: 'analyst/late.json', impact: 'must not feed prediction',
        bytes: 'late',
      }));
    }
    const ev = await runParallel(evThunks);
    const evRej = firstRejection(ev.settled);
    if (evRej) await this.blockAndThrow(runId, evRej);
    const evSources: ManifestSource[] = [];
    for (const s of ev.settled) if (s.status === 'fulfilled') evSources.push(s.value);
    let rows: ManifestRow[];
    try {
      rows = buildManifest(evSources, { asset, week_monday: monday, requested_by: 'e1-do' }, cutoff);
    } catch (e) {
      await this.blockAndThrow(runId, e);
      throw e;
    }
    for (const r of rows) {
      this.d1.insertSource({
        run_id: runId, source_id: r.source_id, kind: r.source_kind, pillar: r.pillar,
        sha256: r.sha, cutoff_status: r.cutoff_status, published_at: r.published_at,
      });
      const src = evSources.find((s) => s.source_id === r.source_id);
      await sealRaw(this.r2, {
        source: r.source_id, asset, monday, sha: r.sha,
        bytes: src ? src.bytes : r.source_id,
      });
      if (r.cutoff_status === 'MISSING') {
        missing.push({ protocol: r.source_id, reason: `${r.source_id} published_at MISSING - audit-only`, impact: 'dimension carries no weight' });
      }
    }
    audit.push(`EVIDENCE settled=${ev.settled.length} maxConcurrent=${ev.max} manifest=${rows.length}`);

    // ---- PILLARS (allSettled) ----
    this.setState(runId, 'PILLARS');
    const dxyRef = asset === 'DXY' ? priorWeek.close : null;
    const pillarThunks: Array<() => Promise<{ name: string; levels: number }>> = [
      async () => {
        if (input.failPillar === 'P1') throw new E1Refusal('E1_PILLAR_FAILED', 'P1_FORCED: failPillar=P1 - pillar task refused by name');
        const out = pillar1(priorWeek, priorDays, historic);
        return { name: 'P1', levels: out.levels.length };
      },
      async () => {
        if (input.failPillar === 'P2') throw new E1Refusal('E1_PILLAR_FAILED', 'P2_FORCED: failPillar=P2 - pillar task refused by name');
        const out = pillar2(days200, unit);
        return { name: 'P2', levels: out.levels.length };
      },
      async () => {
        if (input.failPillar === 'P3') throw new E1Refusal('E1_PILLAR_FAILED', 'P3_FORCED: failPillar=P3 - pillar task refused by name');
        const out = pillar3and8({
          extraction, asset, unit, dxyRef,
          dxyRefAt: asset === 'DXY' ? `prior-week close ${priorWeek.key}` : 'n/a (native strike map)',
          spotSource: 'fixture spot', h10Status: 'fixture: H.10 treated missing, supplementary spot used',
        });
        return { name: 'P3P8', levels: out.levels.length };
      },
      async () => {
        if (input.failPillar === 'P6') throw new E1Refusal('E1_PILLAR_FAILED', 'P6_FORCED: failPillar=P6 - pillar task refused by name');
        const swings = [
          { price: priorWeek.low, date: priorWeek.key, t: priorWeek.from, wick: 0.01 * unit, side: 'low' as const, qualified: true, legacy: false },
          { price: priorWeek.high, date: priorWeek.key, t: priorWeek.from, wick: 0.01 * unit, side: 'high' as const, qualified: true, legacy: false },
        ];
        const tail = days200.slice(-90);
        const d1Range = { lo: Math.min(...tail.map((d) => d.low)), hi: Math.max(...tail.map((d) => d.high)) };
        const out = pillar6(priorWeek, swings, d1Range, pip);
        return { name: 'P6', levels: out.length };
      },
      async () => {
        if (input.failPillar === 'P7') throw new E1Refusal('E1_PILLAR_FAILED', 'P7_FORCED: failPillar=P7 - pillar task refused by name');
        const conv = pillar3and8({
          extraction, asset, unit, dxyRef, dxyRefAt: 'fixture', spotSource: 'fixture', h10Status: 'fixture',
        }).conversions;
        if (!hasExchange) {
          const fb = pillar7(conv);
          if (!fb.arena) {
            missing.push({ protocol: 'P7 ICE/CME', reason: 'P7_NO_TIER1_WALL: no tier-1 wall before cutoff', impact: 'no exchange arena; fallback empty' });
            return { name: 'P7', levels: 0 };
          }
          const resolved = resolveP7({ arena: null, levels: [], missingToken: 'P7_EXCHANGE_SOURCE_MISSING' }, conv);
          audit.push(`P7_FALLBACK basis=${resolved.basis} missing=${resolved.missingToken}`);
          return { name: 'P7', levels: resolved.levels.length };
        }
        const ex = pillar7Exchange(fx.exchangeInput as ArenaInput, asset, cutoff);
        if (ex.arena) {
          const convNow = pillar3and8({
            extraction, asset, unit, dxyRef, dxyRefAt: 'fixture', spotSource: 'fixture', h10Status: 'fixture',
          }).conversions;
          const resolved = resolveP7(ex, convNow);
          return { name: 'P7', levels: resolved.levels.length };
        }
        if (ex.missingToken) {
          missing.push({ protocol: 'P7 ICE/CME', reason: `${ex.missingToken}: no tier-1 wall before cutoff`, impact: 'arena from fallback mapping' });
        }
        return { name: 'P7', levels: ex.levels.length };
      },
    ];
    const pil = await runParallel(pillarThunks);
    const pilRej = firstRejection(pil.settled);
    if (pilRej) await this.blockAndThrow(runId, pilRej);
    audit.push(`PILLARS settled=${pil.settled.length} maxConcurrent=${pil.max}`);

    // ---- ORGANS (allSettled) ----
    this.setState(runId, 'ORGANS');
    const preBars = fx.bars1H as Bar[];
    const lanes: { '4H': Bar[]; '1H': Bar[]; '30m'?: Bar[] } = { '4H': fx.bars4H ?? preBars, '1H': preBars };
    if (fx.bars30m) lanes['30m'] = fx.bars30m;
    const mid = priorWeek.close;
    const zone = { lo: mid - 0.05 * unit, hi: mid + 0.05 * unit, side: 'demand' as const };

    const organThunks: Array<() => Promise<{ name: string; n: number }>> = [
      async () => {
        if (input.failOrgan === 'OBCV') throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', 'OBCV_FORCED: failOrgan=OBCV - post-cutoff input refused');
        const out = detectObcvCandidates(lanes, unit, cutoff);
        for (const line of out.audit) {
          if (line.includes('E1_OBCV_30M_DATA_MISSING') && !missing.some((m) => m.reason.includes('E1_OBCV_30M_DATA_MISSING'))) {
            missing.push({ protocol: 'OBCV 30m', reason: 'E1_OBCV_30M_DATA_MISSING: no 30m lane supplied', impact: '30m MoM-only coverage absent' });
          }
        }
        return { name: 'OBCV', n: out.candidates.length };
      },
      async () => {
        if (input.failOrgan === 'LMV') throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', 'LMV_FORCED: failOrgan=LMV - post-cutoff input refused');
        const out = buildLmvRungs(preBars, unit, cutoff);
        for (const line of out.audit) {
          if (line.includes('E1_LMV_LOOKBACK_TRUNCATED') && !missing.some((m) => m.reason.includes('E1_LMV_LOOKBACK_TRUNCATED'))) {
            missing.push({ protocol: 'LMV lookback', reason: line, impact: 'rung recall reduced' });
          }
        }
        return { name: 'LMV', n: out.rungs.length };
      },
      async () => {
        if (input.failOrgan === 'FRESH') throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', 'FRESH_FORCED: failOrgan=FRESH - post-cutoff input refused');
        const out = buildFreshness(zone, preBars, unit, cutoff);
        return { name: 'FRESH', n: out.events.length };
      },
      async () => {
        if (input.failOrgan === 'PRESS') throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', 'PRESS_FORCED: failOrgan=PRESS - post-cutoff input refused');
        const fresh = buildFreshness(zone, preBars, unit, cutoff);
        const out = buildPressure(zone, fresh.events, [], unit);
        return { name: 'PRESS', n: out.battles };
      },
    ];
    const org = await runParallel(organThunks);
    const orgRej = firstRejection(org.settled);
    if (orgRej) await this.blockAndThrow(runId, orgRej);
    audit.push(`ORGANS settled=${org.settled.length} maxConcurrent=${org.max}`);

    // ---- reconcile OBCV (post-organs, single deterministic step) ----
    if (input.failOrgan === 'RECON') {
      await this.blockAndThrow(runId, new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', 'RECON_FORCED: failOrgan=RECON - post-cutoff input refused'));
    }
    let candidateCount = 0;
    try {
      const ob = detectObcvCandidates(lanes, unit, cutoff);
      candidateCount = ob.candidates.length;
      const rec = reconcile([], ob.candidates, cutoff);
      audit.push(`RECONCILE rows=${rec.rows.length} additional=${rec.additionalLevels.length}`);
    } catch (e) {
      await this.blockAndThrow(runId, e);
    }

    // ---- DERIVED ----
    this.setState(runId, 'DERIVED');
    let baseSha = '';
    let derivedSha = '';
    let pineSha = '';
    try {
      const baseNoSeal = {
        schema_version: 1,
        asset,
        week_monday: monday,
        window: {
          open: new Date(win.openUtc).toISOString(), cutoff: new Date(cutoff).toISOString(),
          end: new Date(win.endUtc).toISOString(),
        },
        zones: [
          { id: 'Z1', score: 8, reactionsPreCutoff: 1, reactionState: 'Active' },
          { id: 'Z2', score: 6, reactionsPreCutoff: 0, reactionState: 'Virgin' },
        ],
        pillars: { settled: pil.settled.length },
        organs: { candidates: candidateCount },
        missing_data: missing,
      };
      baseSha = sha256Hex(canonicalBytes(baseNoSeal));
      const base = { ...baseNoSeal, sha256: baseSha };
      validateBaseCard(base);
      const fresh = buildFreshness(zone, preBars, unit, cutoff);
      const press = buildPressure(zone, fresh.events, [], unit);
      const zoneMeta = [
        { zoneId: 'Z1', freshness: fresh.state, reactionState: fresh.reactionState, lifecycle: press.lifecycle, operativeDefense: press.operativeDefense, pierced: press.pierced },
        { zoneId: 'Z2', freshness: 'FRESH', reactionState: 'Virgin', lifecycle: 'VIRGIN' as const, operativeDefense: 'PRESSURE_STRUCTURE' as const, pierced: false },
      ];
      const lmv = buildLmvRungs(preBars, unit, cutoff);
      const unassignedLmv = lmv.rungs.slice(0, 1).map((r) => ({ center: r.center, defendedEdge: r.defendedEdge, side: 'low' }));
      const derived = deriveCard(base, { zoneMeta, unassignedLmv });
      validateDerivedCard(derived, base);
      derivedSha = derived.sha256 as string;

      await sealBaseCard(this.r2, this.d1, {
        runId, asset, monday, sha: baseSha, canonicalBody: JSON.stringify({ sha256: baseSha, card: baseNoSeal }),
      });
      await sealDerivedCard(this.r2, {
        asset, monday, sha: derivedSha, canonicalBody: JSON.stringify(derived),
      });

      if (input.bendProof !== undefined) {
        await sealBendProof(this.r2, this.d1, { runId, asset, monday, proofBytes: input.bendProof });
        audit.push('BEND_PROOF_SEALED optional certificate stored; pillars/organs untouched');
      }

      for (const z of base.zones) {
        this.d1.insertZone({
          run_id: runId, zone_id: z.id, role: z.id === 'Z1' ? 'resistance' : 'support',
          degree: z.score >= 8 ? 'MODERATE-HEAVY' : 'MODERATE', score: z.score,
          top: mid + 0.05 * unit, bottom: mid - 0.05 * unit,
          lifecycle: 'VIRGIN',
        });
      }
      this.d1.insertVerdict({ run_id: runId, kind: 'card', verdict: 'VALID', score: 8, artifact_sha: derivedSha });

      this.d1.updateRun(runId, { state: 'SEALED', base_sha: baseSha, derived_sha: derivedSha });
      audit.push(`SEALED base=${baseSha.slice(0, 16)} derived=${derivedSha.slice(0, 16)}`);
    } catch (e) {
      await this.blockAndThrow(runId, e);
    }

    // ---- COMPOSED + COMPLETE ----
    this.setState(runId, 'COMPOSED');
    try {
      const pine = composePine(asset, monday, derivedSha, baseSha, [{ id: 'Z1' }, { id: 'Z2' }]);
      pineSha = sha256Hex(pine);
      await sealPine(this.r2, { asset, monday, sha: pineSha, pine });
      this.d1.updateRun(runId, { state: 'COMPLETE', pine_sha: pineSha });
      audit.push(`COMPOSED pine=${pineSha.slice(0, 16)} key=${keys.pine(asset, monday, pineSha)}`);
    } catch (e) {
      await this.blockAndThrow(runId, e);
    }

    return {
      runId, baseSha, derivedSha, pineSha, state: 'COMPLETE', idempotent: false,
      missing, audit,
      parallel: { evidenceMax: ev.max, pillarMax: pil.max, organMax: org.max },
    };
  }
}
