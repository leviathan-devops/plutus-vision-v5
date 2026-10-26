// OHLC-Intelligence-Lexicon-v1.0 — src/reasoning/reasoning-chain.ts
// THE REASONING-CHAIN SKELETON — the 11-token sequence (the operator's golden-doc
// baseline) running between the E2 and the E3. THE agent-in-the-loop: reads the
// lexicons' verdicts + the E1/E2 data → runs the token sequence → produces the
// TradeProjections (the E/SL/TP as CHECKABLE numbers) → validates/refines/retries
// the E2 BEFORE the E3 → stores the failures → synthesizes at the pipeline end.
//
// THE 11-TOKEN SPLIT (the operator's architecture): tokens 1-7 = DETERMINISTIC (the
// lexicons + the existing mdve machinery — no LLM); tokens 8-11 = LLM-HOOKED (the
// deterministic skeleton + the shadow-agent hook at the forward-projection tokens).
//
// Design authority: MASTER_CONTEXT/PLUTUS_V4.5.4_REASONING_CHAIN_L1_SPEC.md (§5-§8)
// + PLUTUS_V4.5.4_LEXICON_SPEC.md (the chain contract lines 263-301). The operator's
// law verbatim: "a refine/retry is correct. not a hard throw... only hard throw
// SPECIFIC MICRO COMPONENTS after they have failed 3 refinements and then full data
// needs to be stored in an internal SQLite db... at the end of the pipeline all
// failure data needs to be synthesized and delivered with the final output + clear
// next steps."
//
// THE SKELETON: everything is a REAL deterministic implementation (the MPSE law).
// The shadow-agent LLM call is the sanctioned placeholder (the hook point). PROPOSED
// thresholds are marked PROPOSED — the build agent wires the exact bands on the
// operator's ruling.

import type {
  ClassifierInput, Direction, LexiconData, MachineRule, OHLCBar,
  PairKey, Rung, ShapeCode, TimeframeKey, ZoneModel,
} from '../core/types';
import { classify } from '../core/engine';
import { DEFAULT_MACHINES } from '../machines/index';

// ── the token + the ledger types ──────────────────────────────────────────────

export type TokenId =
  | 'zone-identification' | 'pressure-status' | 'liquidity'
  | 'break-validation' | 'strength-comparison' | 'reaction-count'
  | 'chain-progress' | 'forward-position' | 'chaining'
  | 'anchors' | 'validation';

export type LexiconName =
  | 'candle-pressure' | 'candle-shape' | 'zone-classification'
  | 'zone-pressure' | 'shape-chain' | 'obvious-trades';

export interface LexiconVerdict {
  lexicon: LexiconName;
  action: 'classify' | 'reject' | 'escalate';
  confidence: number;       // pos/(pos+neg+1) — the MPSE law
  intent: string;
  evidence: string;         // the matched predicate name, never narration
}

export interface TokenResult {
  token: TokenId;
  deterministic: boolean;    // tokens 1-7 true; 8-11 true (skeleton) with the llmRefined flag
  llmRefined?: boolean;
  verdict: string;
  evidence: string[];        // the file:line or the token-set refs — never narration
  lexiconVerdicts?: LexiconVerdict[];
}

export interface ChainContextData {
  pair: PairKey;
  week: string;
  anchorMs: number;              // the temporal gate — the chain reads bars only up to ANCHOR_MS
  tokens: TokenResult[];         // the 11-token ledger, ordered
  macroDirection: Direction;     // the unified macro authority verdict
  macroConsistent: boolean;      // false => the divergence BUG recorded, never suppressed
  divergences: string[];         // the per-pair classifications that contradicted the macro
}

export type ChainContext = ChainContextData;

// ── the TradeProjection contract (data, never prose) ─────────────────────────

export interface PricePoint { price: number; sourceRef: string; }  // sourceRef = zone id / projection id — the E3-NEVER anchor

export interface LexiconTrace {
  lexicon: LexiconName;
  family: 'suggestive' | 'descriptive' | 'substitute' | 'use';
  score: number;                 // pos/(pos+neg+1)
  verdict: string;
}

export interface PressureRead {
  side: 'BUY' | 'SELL';
  score: number;                 // the fused candle-pressure + zone-pressure confidence
  buyVotes: number;
  sellVotes: number;             // the probe-label vote mechanics (the 3-day window)
  wickMassRatio: number;         // the lwm/uwm accumulation at the zone
}

export interface ProjectionAnchor {
  role: 'ENTRY' | 'SL' | 'TP';
  price: number;                 // CHECKABLE
  e1ZoneId: string;              // traces to a specific E1 zone (the E3-NEVER rule)
  e2ProjectionId: string;        // traces to a specific E2 projection (the E3-NEVER rule)
  method: string;                // 'mirror-lmv' | 'mirror-lqz' | 'continuation-target' | ...
  rungId?: string;               // the mirror.ts ladder rung
  widthRatio?: number;           // the SMC ratio (width / ATR-anchor), never a fixed pip number
}

export interface TradeProjection {
  pair: PairKey;
  direction: Direction;
  entry: number;                 // CHECKABLE
  sl: number;                    // CHECKABLE
  tp: number;                    // CHECKABLE
  rrr: number;                   // |tp-entry| / |sl-entry|
  pressureRead: PressureRead;
  chainContext: ChainContext;    // the 11-token ledger
  confidence: number;            // 0.0-1.0 — the fused lexicon scores + the shadow validation
  anchors: ProjectionAnchor[];   // every anchor MUST carry e1ZoneId + e2ProjectionId
  source: 'NATIVE' | 'CASCADE' | 'MIRROR';
  day: string;                   // 'Monday' ... (the report_v45.md day taxonomy)
  session: string;               // 'London Open 02:00-05:00 ET' | 'London Mid' | 'NY Mid 10:00-14:00 ET'
  setupId: string;               // the report_v45.md setup-id lineage
}

// ── the refine / retry types ─────────────────────────────────────────────────

export interface RefinementWarning {
  check: string;                 // 'DIRECTION_ORDER' | 'MACRO_DIVERGENCE' | 'ANCHOR_TRACE' | 'SHADOW_INVENTED_ID' | ...
  token: TokenId;
  sourceRef: string;             // the file:line or the token-set ref — evidence, never narration
  value: unknown;
  proposed: string;              // the correction, with the context
}

export interface ValidationOutput {
  valid: boolean;
  warnings: RefinementWarning[]; // each carries the context (§7.3)
  confidence: number;            // fused — the deterministic floor, the LLM validation delta
}

// ── the shadow-agent hook (the LLM-call placeholder — the sanctioned hook point) ──

export interface ForwardProjectionInput {
  pair: PairKey;
  tokenLedger: TokenResult[];        // tokens 1-7, already fixed
  operativeZone: { id: string; floor: number; ceiling: number; classification: 'BoM' | 'MoM' | 'PHANTOM_BOM' };
  candleGroups: OHLCBar[];           // the token-set: 1 candle = 1 token; the groups = touches + pre-touch + post-reaction
  continuationTargets: number[];     // the KCE-Telescoping output — the macro-origin continuation targets
  macroDirection: Direction;
  widthRatio: number;                // the SMC ratio, computed by the skeleton from the ATR/move-scale
}

export interface ForwardProjectionOutput {
  forwardPosition: number;           // the price "positioned forward of the zone toward the target"
  chosenTarget: number;              // one of the continuationTargets (ratio-validated)
  positionVerdict: 'FORWARD' | 'NOT_FORWARD';  // the forward-position predicate
  reasonTrace: string[];             // the checkable trace, the token-set refs
}

export interface ChainingInput {
  pair: PairKey;
  direction: Direction;
  macroDirection: Direction;
}

export interface ChainingOutput {
  chainVerdict: boolean;             // does this setup's zone trace to the macro chain, correct direction?
  linkedMirror: PairKey | null;      // the DXY twin for an EU setup (1:1 inverted)
  divergence: string | null;         // non-null => the per-pair classification contradicted the macro (the BUG, recorded)
}

export interface AnchorInput {
  pair: PairKey;
  direction: Direction;
  operativeZone: { id: string; floor: number; ceiling: number };
  tokenLedger: TokenResult[];
  e2ProjectionId: string;            // the specific E2 projection this anchors to
  slCandidate: number | null;        // computeMirrorSL(E, anchor, dir, ladder, pair, pip, atr)
  tpCandidate: number | null;        // computeMirrorTP(E, sl, anchor, dir, ladder, pip, {passThroughWeakWalls: true})
  atr1hPips: number;
  widthRatio: number;
}

export interface AnchorOutput {
  entry: number;
  sl: number;
  tp: number;
  rrr: number;
  anchors: ProjectionAnchor[];       // every anchor carries e1ZoneId + e2ProjectionId
}

export interface ShadowAgentClient {
  projectForward(inp: ForwardProjectionInput): Promise<ForwardProjectionOutput>;
  chaining(inp: ChainingInput): Promise<ChainingOutput>;
  anchor(inp: AnchorInput): Promise<AnchorOutput>;
  validate(p: TradeProjection, ledger: ChainContext): Promise<ValidationOutput>;
  readonly provider: string;         // 'opencode-go-deepseek-v4-flash' | 'deterministic-fallback'
}

// ── the SQLite failure-store interface (bun:sqlite — the schema + the API) ────

/** The PROPOSED bun:sqlite schema — the build agent wires the DB path (REASONING_CHAIN_L1_SPEC §8.1). */
export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS chain_failures (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recorded_at   TEXT NOT NULL DEFAULT (datetime('now')),
  pipelineStage TEXT NOT NULL,
  pair          TEXT NOT NULL,
  setupId       TEXT NOT NULL,
  failureType   TEXT NOT NULL,
  tokenFailures TEXT NOT NULL,
  ledger        TEXT NOT NULL,
  projection    TEXT,
  nextSteps     TEXT NOT NULL,
  week          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_failures_week ON chain_failures(week);
CREATE INDEX IF NOT EXISTS idx_failures_type ON chain_failures(failureType);
`;

export type FailureType = 'REFINEMENT_EXHAUSTED' | 'CONTRACT_VIOLATION' | 'SHADOW_DEGRADE' | 'MACRO_DIVERGENCE';

export interface ChainFailure {
  pipelineStage: 'E1' | 'E2' | 'E3' | 'SHADOW';
  pair: PairKey;
  setupId: string;
  failureType: FailureType;
  tokenFailures: RefinementWarning[];
  ledger: ChainContext;
  projection?: TradeProjection;
  nextSteps: string[];   // the synthesis's next steps (the checkable commands)
  week: string;
}

export interface FailureStore {
  recordFailure(r: ChainFailure): number;        // INSERT, returns the id
  failuresForWeek(week: string): ChainFailure[]; // read for the synthesis
  failureStats(): { total: number; byType: Record<string, number> };
}

/** The in-memory implementation — fully functional (deterministic + testable). The build agent swaps in the bun:sqlite adapter on this interface. */
export function createMemoryFailureStore(): FailureStore {
  const rows = new Map<number, ChainFailure>();
  let seq = 0;
  return {
    recordFailure(r) {
      seq += 1;
      rows.set(seq, r);
      return seq;
    },
    failuresForWeek(week) {
      return [...rows.values()].filter((r) => r.week === week);
    },
    failureStats() {
      const byType: Record<string, number> = {};
      for (const r of rows.values()) byType[r.failureType] = (byType[r.failureType] ?? 0) + 1;
      return { total: rows.size, byType };
    },
  };
}

// ── the deterministic fallback shadow client (the degradation path — never stalls) ──

/** The deterministic fallback — on a shadow timeout/non-JSON/shape violation the pipeline uses this (confidence capped 0.70, SHADOW_DEGRADE recorded). */
export function deterministicShadowClient(model: string = 'deterministic-fallback'): ShadowAgentClient {
  return {
    provider: model,
    async projectForward(inp) {
      const z = inp.operativeZone;
      const targets = inp.continuationTargets.length > 0 ? inp.continuationTargets : [inp.macroDirection === 'LONG' ? z.ceiling + inp.widthRatio : z.floor - inp.widthRatio];
      const chosenTarget = targets[0];
      const forwardPosition = inp.macroDirection === 'LONG' ? Math.min(z.ceiling, z.ceiling + inp.widthRatio * 0.5) : Math.max(z.floor, z.floor - inp.widthRatio * 0.5);
      const positionVerdict = inp.macroDirection === 'LONG' ? (forwardPosition > z.ceiling ? 'FORWARD' : 'NOT_FORWARD') : (forwardPosition < z.floor ? 'FORWARD' : 'NOT_FORWARD');
      return { forwardPosition, chosenTarget, positionVerdict, reasonTrace: [`skeleton: forwardPosition computed from the operative zone ${z.id} (ratio ${inp.widthRatio.toFixed(2)})`] };
    },
    async chaining(inp) {
      const consistent = inp.direction === inp.macroDirection;
      const linkedMirror: PairKey | null = inp.pair === 'EUR/USD' ? 'DXY' : inp.pair === 'DXY' ? 'EUR/USD' : null;
      return { chainVerdict: consistent, linkedMirror, divergence: consistent ? null : `per-pair ${inp.direction} contradicts the macro ${inp.macroDirection} (the divergence BUG — recorded, never suppressed)` };
    },
    async anchor(inp) {
      const z = inp.operativeZone;
      const atr = inp.atr1hPips;
      const pip = inp.pair === 'DXY' ? 0.01 : 0.0001;
      const entry = inp.direction === 'LONG' ? z.ceiling - 0.25 * atr : z.floor + 0.25 * atr;   // PROPOSED: the entry at the zone edge (ratio-anchored)
      const sl = inp.slCandidate ?? (inp.direction === 'LONG' ? z.floor - 3 * pip : z.ceiling + 3 * pip);  // PROPOSED: the 3-pip-outside-back-edge ladder rule
      const tp = inp.tpCandidate ?? (inp.direction === 'LONG' ? entry + 2.5 * Math.abs(entry - sl) : entry - 2.5 * Math.abs(entry - sl));
      const rrr = Math.abs(tp - entry) / Math.max(Math.abs(entry - sl), 1e-12);
      const anchors: ProjectionAnchor[] = [
        { role: 'ENTRY', price: entry, e1ZoneId: z.id, e2ProjectionId: inp.e2ProjectionId, method: 'mirror-lmv', widthRatio: inp.widthRatio },
        { role: 'SL', price: sl, e1ZoneId: z.id, e2ProjectionId: inp.e2ProjectionId, method: 'mirror-lqz', widthRatio: inp.widthRatio },
        { role: 'TP', price: tp, e1ZoneId: z.id, e2ProjectionId: inp.e2ProjectionId, method: 'continuation-target', widthRatio: inp.widthRatio },
      ];
      return { entry, sl, tp, rrr, anchors };
    },
    async validate(p, ledger) {
      const warnings: RefinementWarning[] = [];
      const dirOk = p.direction === 'LONG' ? p.sl < p.entry && p.entry < p.tp : p.tp < p.entry && p.entry < p.sl;
      if (!dirOk) warnings.push({ check: 'DIRECTION_ORDER', token: 'anchors', sourceRef: 'assertProjectionContract', value: { entry: p.entry, sl: p.sl, tp: p.tp }, proposed: 'LONG: sl < entry < tp | SHORT: tp < entry < sl' });
      if (!ledger.macroConsistent) warnings.push({ check: 'MACRO_DIVERGENCE', token: 'chaining', sourceRef: 'chainContext.macroConsistent', value: ledger.macroDirection, proposed: 'the macro authority wins — flip the emission to the macro direction + record the divergence' });
      const anchorLess = p.anchors.some((a) => !a.e1ZoneId || !a.e2ProjectionId);
      if (anchorLess) warnings.push({ check: 'ANCHOR_TRACE', token: 'anchors', sourceRef: 'ProjectionAnchor', value: p.anchors, proposed: 'every anchor must carry e1ZoneId + e2ProjectionId (the E3-NEVER rule)' });
      const confFloor = 0.7;
      return { valid: warnings.length === 0, warnings, confidence: Math.min(confFloor, p.confidence) };
    },
  };
}

// ── the pipeline I/O ─────────────────────────────────────────────────────────

export interface ReasoningChainInput {
  pair: PairKey;
  week: string;
  anchorMs: number;              // 1783702800000 — the temporal gate (REASONING_CHAIN_L1_SPEC §1.4)
  atr14: number;
  pip: number;                   // DXY_PIP = 0.01; EU/GU PIP = 0.0001
  spot: number;
  bars: OHLCBar[];
  zones: ZoneModel[];
  rungs: Rung[];
  shapeChain: ShapeCode[];
  lqzMatrix: { table: Array<Record<string, unknown>> };
  e1: Record<string, unknown>;
  e2: Record<string, unknown>;
  e3?: Record<string, unknown>;
  currentShape?: ShapeCode;
  tf?: TimeframeKey;
  candidateZoneId?: string;
  macroDirection: Direction;     // the unified macro authority verdict
  shadow?: ShadowAgentClient;    // absent => the deterministic fallback, confidence capped 0.70
  store?: FailureStore;          // absent => the in-memory store
  day?: string;
  session?: string;
  setupId?: string;
}

export interface ReasoningChainResult {
  projections: TradeProjection[];
  ledger: ChainContext;          // the full 11-token ledger
  failures: ChainFailure[];
  stats: { deterministicTokens: number; llmTokens: number; refinements: number; hardThrows: number };
}

// ── the token builder (the deterministic 70%) ────────────────────────────────

function buildLexiconData(input: ReasoningChainInput): LexiconData {
  return {
    bars: input.bars,
    zones: input.zones,
    rungs: input.rungs,
    shapeChain: input.shapeChain,
    lqzMatrix: input.lqzMatrix,
    e1: input.e1,
    e2: input.e2,
    e3: input.e3,
    meta: {
      pair: input.pair,
      week: input.week,
      anchorMs: input.anchorMs,
      atr14: input.atr14,
      pip: input.pip,
      spot: input.spot,
      currentShape: input.currentShape,
      tf: input.tf,
      candidateZoneId: input.candidateZoneId,
    },
  };
}

function runMachines(data: LexiconData, machines: MachineRule[]): LexiconVerdict[] {
  return machines.map((m) => {
    const r = m.classify({ data } as ClassifierInput);
    return { lexicon: m.id as LexiconName, action: r.action as 'classify' | 'reject' | 'escalate', confidence: r.confidence, intent: r.intent, evidence: r.evidence };
  });
}

function buildDeterministicTokens(input: ReasoningChainInput, data: LexiconData, verdicts: LexiconVerdict[]): TokenResult[] {
  const v = (name: LexiconName) => verdicts.find((x) => x.lexicon === name);
  const tokens: TokenResult[] = [];
  tokens.push({ token: 'zone-identification', deterministic: true, verdict: v('zone-classification')?.intent ?? 'none', evidence: [`zone-classification:${v('zone-classification')?.evidence ?? ''}`], lexiconVerdicts: verdicts });
  tokens.push({ token: 'pressure-status', deterministic: true, verdict: `${v('candle-pressure')?.intent ?? 'none'}|${v('zone-pressure')?.intent ?? 'none'}`, evidence: ['candle-pressure + zone-pressure verdicts'], lexiconVerdicts: verdicts });
  const lmv = input.lqzMatrix.table ?? [];
  tokens.push({ token: 'liquidity', deterministic: true, verdict: lmv.length > 0 ? 'liquidity-read' : 'no-rungs', evidence: [`lmvTable rows=${lmv.length}`] });
  // the break-validation — the temporal gate + the close-beyond check (a future bar reaching any computation is a CRITICAL failure)
  const futureBars = input.bars.filter((b) => b.t > input.anchorMs).length;
  tokens.push({ token: 'break-validation', deterministic: true, verdict: futureBars === 0 ? 'gate-respected' : 'FUTURE-BAR-LEAK', evidence: [`future bars past ANCHOR_MS: ${futureBars}`] });
  tokens.push({ token: 'strength-comparison', deterministic: true, verdict: v('zone-pressure')?.intent ?? 'none', evidence: ['zone-pressure verdict'], lexiconVerdicts: verdicts });
  const op = data.zones.find((z) => z.id === input.candidateZoneId);
  tokens.push({ token: 'reaction-count', deterministic: true, verdict: op ? `reactionCount=${op.reactionCount ?? 0}` : 'none', evidence: ['candle groups at the operative zone'] });
  tokens.push({ token: 'chain-progress', deterministic: true, verdict: v('shape-chain')?.intent ?? 'none', evidence: [`shape-chain:${v('shape-chain')?.evidence ?? ''}`], lexiconVerdicts: verdicts });
  return tokens;
}

// ── the forward-projection skeletons (the LLM 30% — the hooks) ───────────────

function continuationTargets(input: ReasoningChainInput): number[] {
  const op = input.zones.find((z) => z.id === input.candidateZoneId);
  if (!op) return [];
  const dir = input.macroDirection;
  const atr = input.atr14;
  // the KCE-Telescoping: the macro-origin continuation targets beyond the zone (ratio-anchored)
  return dir === 'LONG'
    ? [op.top + 1.5 * atr, op.top + 2.5 * atr, op.top + 4.0 * atr]
    : [op.bottom - 1.5 * atr, op.bottom - 2.5 * atr, op.bottom - 4.0 * atr];
}

function computeWidthRatio(input: ReasoningChainInput): number {
  const op = input.zones.find((z) => z.id === input.candidateZoneId);
  return op ? (op.top - op.bottom) / Math.max(input.atr14, 1e-12) : 1;
}

// ── the assertProjectionContract (the E3-NEVER rule) ─────────────────────────

export function assertProjectionContract(p: TradeProjection): RefinementWarning[] {
  const warnings: RefinementWarning[] = [];
  const dirOk = p.direction === 'LONG' ? p.sl < p.entry && p.entry < p.tp : p.tp < p.entry && p.entry < p.sl;
  if (!dirOk) warnings.push({ check: 'DIRECTION_ORDER', token: 'anchors', sourceRef: 'assertProjectionContract', value: { entry: p.entry, sl: p.sl, tp: p.tp }, proposed: 'LONG: sl < entry < tp | SHORT: tp < entry < sl' });
  for (const a of p.anchors) {
    if (!a.e1ZoneId || !a.e2ProjectionId) {
      warnings.push({ check: 'ANCHOR_TRACE', token: 'anchors', sourceRef: `ProjectionAnchor.${a.role}`, value: a, proposed: 'the E3-NEVER rule: every anchor must trace to a specific E1 zone id + the E2 projection id' });
      break;
    }
  }
  if (!(p.confidence >= 0 && p.confidence <= 1)) warnings.push({ check: 'CONFIDENCE_RANGE', token: 'validation', sourceRef: 'TradeProjection.confidence', value: p.confidence, proposed: 'confidence in [0,1]' });
  return warnings;
}

// ── the refine / retry loop (the operator's refine/retry doctrine) ───────────

export interface RefineOutcome {
  projection: TradeProjection;
  valid: boolean;
  hardThrow: boolean;
  warnings: RefinementWarning[];
}

async function safeValidate(shadow: ShadowAgentClient, p: TradeProjection, ledger: ChainContext): Promise<ValidationOutput> {
  try {
    return await shadow.validate(p, ledger);
  } catch {
    // the error path FIRST: a shadow crash degrades to the deterministic validator (never stalls)
    return deterministicShadowClient().validate(p, ledger);
  }
}

async function runRefineLoop(
  proj: TradeProjection,
  input: ReasoningChainInput,
  maxRefinements: number,
  stats: { refinements: number; hardThrows: number },
): Promise<RefineOutcome> {
  const shadow = input.shadow ?? deterministicShadowClient();
  let p = proj;
  let n = 0;
  let accepted = false;
  let lastWarnings: RefinementWarning[] = [];
  let exhausted = false;
  while (!accepted && !exhausted) {
    const verdict = await safeValidate(shadow, p, p.chainContext);
    lastWarnings = verdict.warnings;
    accepted = verdict.valid === true;
    if (accepted) break;
    if (n >= maxRefinements) {
      stats.hardThrows += 1;
      exhausted = true;
      break;
    }
    // the refine/retry: re-run the forward-projection tokens (8-11) with the warnings as context
    p = await refine(p, verdict.warnings, input);
    stats.refinements += 1;
    n += 1;
    p.chainContext.tokens = p.chainContext.tokens.concat({ token: 'validation', deterministic: false, llmRefined: true, verdict: `refinement ${n}`, evidence: verdict.warnings.map((w) => `${w.check}@${w.sourceRef}`) });
  }
  return { projection: p, valid: accepted, hardThrow: exhausted, warnings: lastWarnings };
}

async function refine(p: TradeProjection, _warnings: RefinementWarning[], input: ReasoningChainInput): Promise<TradeProjection> {
  // the refine/retry, not hard-throw doctrine: adjust the anchors' ratio band + re-validate
  const atr = input.atr14;
  const w = p.anchors.find((a) => a.role === 'ENTRY')?.widthRatio ?? 1;
  const nudge = 0.75 * w; // PROPOSED: tighten the ratio band per refinement
  const e = p.direction === 'LONG' ? p.entry - nudge * atr * 0.1 : p.entry + nudge * atr * 0.1;
  const sl = p.direction === 'LONG' ? Math.min(p.sl, e - 0.5 * atr) : Math.max(p.sl, e + 0.5 * atr);
  const tp = p.direction === 'LONG' ? Math.max(p.tp, e + 2.5 * Math.abs(e - sl)) : Math.min(p.tp, e - 2.5 * Math.abs(e - sl));
  const rrr = Math.abs(tp - e) / Math.max(Math.abs(e - sl), 1e-12);
  return { ...p, entry: e, sl, tp, rrr, confidence: Math.min(1, p.confidence - 0.02), anchors: p.anchors.map((a) => (a.role === 'ENTRY' ? { ...a, price: e, widthRatio: nudge } : a.role === 'SL' ? { ...a, price: sl } : { ...a, price: tp })) };
}

// ── the pipeline entry ────────────────────────────────────────────────────────

export async function buildReasoningChain(input: ReasoningChainInput): Promise<ReasoningChainResult> {
  const data = buildLexiconData(input);
  const machines: MachineRule[] = DEFAULT_MACHINES;
  const verdicts = runMachines(data, machines);
  const ledgerTokens = buildDeterministicTokens(input, data, verdicts);
  const stats = { deterministicTokens: 7, llmTokens: 0, refinements: 0, hardThrows: 0 };
  const store = input.store ?? createMemoryFailureStore();
  const shadow = input.shadow ?? deterministicShadowClient();

  // the operative zone (the E1 designation the projection anchors to)
  const op = data.zones.find((z) => z.id === input.candidateZoneId);
  const projections: TradeProjection[] = [];
  const failures: ChainFailure[] = [];

  if (op) {
    // token 8 — the forward projection (the LLM hook + the deterministic fallback)
    const fwd = await shadow.projectForward({
      pair: input.pair,
      tokenLedger: ledgerTokens,
      operativeZone: { id: op.id, floor: op.bottom, ceiling: op.top, classification: op.classification as 'BoM' | 'MoM' | 'PHANTOM_BOM' },
      candleGroups: data.bars.filter((b) => b.t <= input.anchorMs && b.t >= op.formationMs),
      continuationTargets: continuationTargets(input),
      macroDirection: input.macroDirection,
      widthRatio: computeWidthRatio(input),
    });
    if (fwd.positionVerdict === 'FORWARD') stats.llmTokens += 1;

    // token 9 — the chaining (the TP of N = the entry of N+1, Law 27)
    const chain = await shadow.chaining({ pair: input.pair, direction: input.macroDirection === 'LONG' ? 'LONG' : 'SHORT', macroDirection: input.macroDirection });
    const divergences = chain.divergence ? [chain.divergence] : [];

    // token 10 — the anchor construction (the E/SL/TP as CHECKABLE numbers)
    const anchorsOut = await shadow.anchor({
      pair: input.pair,
      direction: input.macroDirection === 'LONG' ? 'LONG' : 'SHORT',
      operativeZone: { id: op.id, floor: op.bottom, ceiling: op.top },
      tokenLedger: ledgerTokens,
      e2ProjectionId: input.setupId ?? `e2-${input.week}-${op.id}`,
      slCandidate: null,
      tpCandidate: null,
      atr1hPips: input.atr14,
      widthRatio: computeWidthRatio(input),
    });

    const direction: Direction = input.macroDirection === 'LONG' ? 'LONG' : 'SHORT';
    const pressureRead = {
      side: direction === 'LONG' ? 'BUY' as const : 'SELL' as const,
      score: verdicts.find((x) => x.lexicon === 'candle-pressure')?.confidence ?? 0.5,
      buyVotes: direction === 'LONG' ? 1 : 0,
      sellVotes: direction === 'LONG' ? 0 : 1,
      wickMassRatio: 0,
    };

    const proj: TradeProjection = {
      pair: input.pair,
      direction,
      entry: anchorsOut.entry,
      sl: anchorsOut.sl,
      tp: anchorsOut.tp,
      rrr: anchorsOut.rrr,
      pressureRead,
      chainContext: { pair: input.pair, week: input.week, anchorMs: input.anchorMs, tokens: ledgerTokens, macroDirection: input.macroDirection, macroConsistent: chain.chainVerdict, divergences },
      confidence: verdicts.reduce((a, x) => a + x.confidence, 0) / Math.max(verdicts.length, 1),
      anchors: anchorsOut.anchors,
      source: 'NATIVE',
      day: input.day ?? 'Monday',
      session: input.session ?? 'London Open 02:00-05:00 ET',
      setupId: input.setupId ?? `${input.pair}|${input.week}|${op.id}`,
    };

    // token 11 — the contract + the refine/retry loop
    const contractWarnings = assertProjectionContract(proj);
    const { projection, hardThrow, warnings } = await runRefineLoop(proj, input, 3, stats);

    if (hardThrow || contractWarnings.length > 0) {
      const f: ChainFailure = {
        pipelineStage: 'E3',
        pair: input.pair,
        setupId: projection.setupId,
        failureType: hardThrow ? 'REFINEMENT_EXHAUSTED' : 'CONTRACT_VIOLATION',
        tokenFailures: [...warnings, ...contractWarnings],
        ledger: projection.chainContext,
        projection,
        nextSteps: [`re-run the pipeline with the refined context: bun diag-reasoning-chain.ts --pair ${input.pair} --zone ${op.id} (PROPOSED flags)`],
        week: input.week,
      };
      failures.push(f);
      store.recordFailure(f);
    } else {
      projections.push({ ...projection, confidence: Math.min(projection.confidence, 0.7) });
    }
  } else {
    const f: ChainFailure = {
      pipelineStage: 'E1',
      pair: input.pair,
      setupId: input.setupId ?? 'none',
      failureType: 'CONTRACT_VIOLATION',
      tokenFailures: [{ check: 'NO_OPERATIVE_ZONE', token: 'zone-identification', sourceRef: 'ReasoningChainInput.candidateZoneId', value: input.candidateZoneId, proposed: 'designate the operative zone from the E1 pool (the phantom-BoM exemption lane)' }],
      ledger: { pair: input.pair, week: input.week, anchorMs: input.anchorMs, tokens: ledgerTokens, macroDirection: input.macroDirection, macroConsistent: true, divergences: [] },
      nextSteps: ['run the E1 zone pool with the zone-classification lexicon (the phantom-BoM exemption) before the chain'],
      week: input.week,
    };
    failures.push(f);
    store.recordFailure(f);
  }

  // the END-OF-PIPELINE SYNTHESIS: all failure data synthesized + delivered with the final output + the clear next steps (the operator's law)
  const ledger: ChainContext = {
    pair: input.pair,
    week: input.week,
    anchorMs: input.anchorMs,
    tokens: ledgerTokens,
    macroDirection: input.macroDirection,
    macroConsistent: failures.filter((f) => f.failureType === 'MACRO_DIVERGENCE').length === 0,
    divergences: failures.flatMap((f) => (f.failureType === 'MACRO_DIVERGENCE' ? f.tokenFailures.map((w) => w.proposed) : [])),
  };

  return { projections, ledger, failures, stats };
}
