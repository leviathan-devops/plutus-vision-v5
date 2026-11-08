# OHLC-Intelligence-Lexicon-v1.0 — the trading lexicon machine boilerplate (fork)

**What This Is:** a copy-and-customize boilerplate fork of the
`IntelligenceLexicon-Edition-v1.0` machine architecture, pre-loaded with the SIX
TRADING LEXICONS (candle-pressure, candle-shape, zone-classification, zone-pressure,
shape-chain, obvious-trades) + the 11-token REASONING-CHAIN skeleton. It is the
**skeleton scaffolding template** the operator demanded: all the LOGIC AND INTELLIGENCE
AND MACRO ARCHITECTURE pre-built as pseudocode + deterministic predicates, so a new
project forks THIS and builds on top — without re-deriving the design.

The fork = the IntelligenceLexicon machine substrate (the MachineRule / PatternFamily /
semantic-scoring `pos/(pos+neg+1)` / two-phase enforcement / escape hatches /
escalation) + the SIX TRADING LEXICONS as machine skeletons + the REASONING-CHAIN
skeleton (the 11-token sequence) — all as PSEUDOCODE with the MPSE math-logic
annotations.

**Origin:** the operator's directive (2026-08-06) — "a skeleton scaffolding template of
pseudocode that the full implementation can be built from and THAT I CAN FORK FOR OTHER
PROJECTS using the same architecture." Design authority:
`MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` + `PLUTUS_V4.5.4_REASONING_CHAIN_L1_SPEC.md`
+ `Plutus_Shark_Operator_Audit_Process.md`.

## Architecture

| Component | File | Purpose |
|---|---|---|
| Registry | `src/core/engine.ts` | `LexiconRegistry` + the scoring classifier + the enforcement + the state store |
| Types | `src/core/types.ts` | the machine form + the trading data contracts (`OHLCBar`/`ZoneModel`/`LqzZoneMatrix`/`LexiconData`/`Predicate`) |
| Classifier | `src/core/engine.ts` | `classify()` (per-family best) + `classifyAggregate()` (the obvious-trades form); `confidence = pos/(pos+neg+1)` |
| Enforcement | `src/core/engine.ts` | `buildBlock`/`buildRefineWarning` — the loud block with the named remedy + the refinement count |
| State | `src/core/engine.ts` | per-session trackers (blockCount + refinementCount + auditTrail) + `'default'` dual-write + `globalThis` backing |
| Machines | `src/machines/*.ts` | the SIX trading lexicon machines (lexicon + classifier + rule per machine) |
| Machine index | `src/machines/index.ts` | `DEFAULT_MACHINES` — the six registered MachineRules |
| Lexicon pseudocode | `src/lexicons/*.md` | the six lexicons' FULL design as pseudocode + the operator's doctrine + the MPSE forms |
| Reasoning chain | `src/reasoning/reasoning-chain.ts` | the 11-token sequence + the `TradeProjection` contract + the shadow-agent hook + the refine/retry loop + the SQLite failure-store interface |
| Tests | `tests/properties.ts`, `tests/per-machine.test.ts` | the property skeletons (range/totality/determinism) + the per-machine classify/reject cases |
| Fixtures | `tests/fixtures.ts` | the hand-computed `LexiconData` fixtures (incl. the phantom-BoM `[1.14145-1.14000]`) |

## The core abstraction — MachineRule (the trading form)

```typescript
interface PatternFamily {
  group: 'candle-predicate' | 'zone-predicate' | 'chain-predicate' | 'projection-predicate';
  descriptive: Predicate[];   // the EVIDENCE AGAINST the semantic intent (weight +1)
  suggestive: Predicate[];    // the EVIDENCE FOR the semantic intent (weight +1)
  substitute?: Predicate[];   // the MISLEADING SURFACE patterns (the "regex without the psychology") (weight +2)
  use?: Predicate[];          // the LEGITIMATE EXEMPTORS (the negative short-circuit) (weight +3)
}
// Predicate = a deterministic function over the OHLC/zone data: (data: LexiconData) => boolean
// The MPSE law: every predicate is a numeric comparison / a set membership / a piecewise branch.

interface MachineRule {
  id: string;                          // 'candle-pressure' | 'candle-shape' | ... | 'obvious-trades'
  families: PatternFamily[];
  classify(input: ClassifierInput): ClassifierResult;   // {intent, confidence, action: 'classify'|'reject'|'escalate'}
  enforce(result: ClassifierResult, phase: 'A' | 'B'): void;
  // Phase A = the E1/E2/E3 boundary (the refine/retry warning; the hard-throw ONLY after 3)
  // Phase B = the OUTPUT MUTATION (the classification demand appended to the stage's output)
  escapeHatchTool: string;             // the pipeline's re-run / the audit tool (never blocked)
  escalationThreshold: number;         // 3
}
```

## The six trading lexicons

| Lexicon | Machine | The semantic intent |
|---|---|---|
| **1. candle-pressure** | `src/machines/candle-pressure.ts` | WHO won each battle — defend/reject/sweep/dwell from the candle groups (the touches + the pre-touch storyline + the post-reaction) |
| **2. candle-shape** | `src/machines/candle-shape.ts` | the per-candle shape grammar — SS/BS/R/WL/RWL/WLS from the anatomy tokens (the token-set: 1 candle = 1 token; the SET = the context) |
| **3. zone-classification** | `src/machines/zone-classification.ts` | the BoM/MoM/IP/LSZ identity + **THE PHANTOM BoM** (the type-2 virgin MoM = the fortress — the death-rule exemption) + the fortress-BoM (the proven BoM — separate!) |
| **4. zone-pressure** | `src/machines/zone-pressure.ts` | the lifecycle recurrence VIRGIN→ACTIVE→DEPLETED→FORTRESS→BROKEN + the "third mitigation" + the refined death-rule scope + the tf-hierarchy (4H King / 1H General / 30m Captain) |
| **5. shape-chain** | `src/machines/shape-chain.ts` | the fractal chains (SS→BS→R→WL→SS) + the UNIFIED MACRO AUTHORITY (the divergence = the bug; the macro signal has authority) |
| **6. obvious-trades** | `src/machines/obvious-trades.ts` | the forward-reasoning tokens (the operator's golden-doc analyses as the baseline) — the AGGREGATE classifier — THE MISSING LAYER |

Each machine's FULL design (the purpose, the data contracts, the concrete pseudocode
predicates, the scoring, the enforcement, the MPSE form) lives in
`src/lexicons/<lexicon>-lexicon.md` — the intelligence pre-built.

## The reasoning chain (the 11-token sequence — the agent-in-the-loop)

`src/reasoning/reasoning-chain.ts` — runs between the E2 and the E3:

| Token | Stage | Deterministic? |
|---|---|---|
| 1 zone-identification | the E1 zone + the pressure read (Lexicons 1+3+4) | ✅ deterministic |
| 2 pressure-status | the lifecycle/zfp/fortress/absorption (Lexicon 4) | ✅ |
| 3 liquidity | the nested LQZ + the shield rungs (the LMV table) | ✅ |
| 4 break-validation | the E1 pressure validates the structure break (the temporal gate) | ✅ |
| 5 strength-comparison | the opposing impulses (the OBCV gates) | ✅ |
| 6 reaction-count | the mitigation math (the candle groups) | ✅ |
| 7 chain-progress | the shape chain's position (Lexicon 5 + KCE-Telescoping) | ✅ |
| 8 forward-position | the price's position relative to the designation + the reaction probability | ⚡ LLM-hooked |
| 9 chaining | the TP of N = the entry of N+1 (Law 27) + the DXY mirror | ⚡ |
| 10 anchors | the E/SL/TP as CHECKABLE numbers (the E3-NEVER rule) | ⚡ |
| 11 validation | the confluence alignment + the refine/retry loop | ⚡ |

The output = the `TradeProjection` contract: `{pair, direction, entry, sl, tp, rrr,
pressureRead, chainContext, confidence, anchors, source, day, session, setupId}` —
every anchor traces to a specific E1 zone id + the E2 projection id (`assertProjectionContract`).

**The enforcement law (verbatim):** "a refine/retry is correct. not a hard throw... only
hard throw SPECIFIC MICRO COMPONENTS after they have failed 3 refinements and then full
data needs to be stored in an internal SQLite db... at the end of the pipeline all
failure data needs to be synthesized and delivered with the final output + clear next
steps."

- The shadow-agent hook (`ShadowAgentClient`) is the sanctioned LLM-call placeholder
  (`provider: 'opencode-go-deepseek-v4-flash'`); the `deterministicShadowClient()`
  fallback degrades on timeout (confidence capped 0.70, never stalls).
- The SQLite failure-store interface (`FailureStore` + `SQLITE_SCHEMA`) with the
  fully-functional in-memory implementation to swap for bun:sqlite.

## The operator's doctrine (the law the fork embeds)

- **The mapping law:** "zones/candles = regex · pressure mechanics = semantic intent ·
  shape chains = semantically intelligent algorithmic systems · E1/E2/E3 pipeline =
  Trident deep planning L2 · trade setups = tool outputs"
- **The semantics law:** "the rendered artifacts are the candles/zones/OHLC data ~ first
  principles macro context is the pressure mechanics, shape chain, etc — you must see
  what GENERATED the rendered artifact. the artifact itself is just the trigger."
- **The token-set law:** "1 candle = 1 token. 1 token by itself does not provide any
  meaningful data. A set of tokens in a structured dataset = relevant context (TTE shapes)"
- **The candle-group law:** "the group of relevant candles near a zone are the candles
  that actually touch the zone and the context/storyline of the candles BEFORE they touch
  the zone + what is going to happen after they touch (post reaction move)"
- **The phantom-BoM law:** "a phantom BoM zone... a MoM-disguised BoM... functions as a
  BoM zone" — the type-2 virgin MoM (the large-OB + the fakeout + the pre-formation
  reaction + the macro-origin continuation).
- **The unified-macro-authority law:** "they ARE allowed to have their own mechanics but
  unified macro signal has authority"
- **The tf-hierarchy (Q3/Q4):** the 4H King (the E2 chain) · the 1H General (the E3
  setups) · the 30m Captain (the per-trade context) — "HTF > LTF".
- **The death-rule scope (Q3):** the death rule applies to the 30m virgin MoM zones +
  the 1H TYPE-1 virgin MoMs — the 4H zones are NEVER death zones.

## How to customize (fork THIS for another project — no source reading required)

```
1. cp -r OHLC-Intelligence-Lexicon-v1.0 <your-project>/lexicon
2. Add your machine: src/machines/<your-machine>.ts — a MachineRule with the
   PatternFamily groups (descriptive/suggestive/substitute/use) whose predicates are
   deterministic functions over YOUR data contract (adapt LexiconData in
   src/core/types.ts — the bars/zones/rungs/shapeChain/e1/e2/meta union).
3. Register it: export it in src/machines/index.ts (DEFAULT_MACHINES array).
4. (Optional) Write the lexicon's pseudocode: src/lexicons/<your-machine>-lexicon.md —
   the purpose/inputs/outputs/families/scoring/enforcement/MPSE-form (copy the shape
   of the six included files).
5. Wire the reasoning chain: src/reasoning/reasoning-chain.ts's
   buildDeterministicTokens() maps tokens 1-7 to the machines' verdicts — add your
   machine's verdict to the ledger; the shadow client + the refine loop stay.
6. Test: bun test tests/properties.ts (the property skeletons) + the per-machine cases.
7. Typecheck: bunx tsc --noEmit (the fork ships its own tsconfig — it compiles clean).
```

The customization path is self-contained: the six included machines + the six lexicon
pseudocode files ARE the reference implementation for your new machine.

## The 8 family principles (inherited from the IntelligenceLexicon machine substrate)

1. **Block the CLAIM, not the WORK** — the read-only data gathering always allowed; only
   the classification claims gate (the refine/retry).
2. **Opposed signal groups + semantic scoring** — the predicate triggers initiate; the
   opposed predicates decide; `confidence = pos/(pos+neg+1)`.
3. **Two-phase enforcement** — Phase A = the boundary refine/retry warning; the hard-throw
   ONLY after 3; Phase B = the output mutation; the escape-hatch tool is NEVER blocked.
4. **Escalation ladder** — refine → count → threshold(3) → the problem-solving dispatch;
   the real pipeline re-run clears the state.
5. **Session-scoped state** — Map-per-session + `'default'` dual-write + `globalThis`
   backing (the hot-reload hazard).
6. **Deterministic + scoring hybrid** — NO LLM calls at enforcement time; fast,
   replayable, testable (the MPSE law).
7. **The refine/retry doctrine** — the hard-throw is DATA (the failure store), never a
   crash; the end-of-pipeline synthesis delivers the failures + the next steps.
8. **The temporal gate** — the chain reads bars only up to ANCHOR_MS; a future bar
   reaching any computation is a CRITICAL failure.

## How to test

- Property-based: `bun test tests/properties.ts` — the confidence range [0,1] + the
  totality (no throw) + the determinism (same data → same verdict, 500 runs) + the
  aggregate coherence — expect `fail === 0`.
- Per-machine: `bun test tests/per-machine.test.ts` — every machine has a case that
  CLASSIFIES + a case that REJECTS (a firewall that never fires is theater) — expect
  `fail === 0`.
- Reasoning-chain smoke: run `buildReasoningChain()` with a fixture — the
  TradeProjections pass `assertProjectionContract` (the E3-NEVER rule).
- Container-only runtime verification: deploy to a fresh container, run the pipeline,
  observe the classifications — the container test IS the test.

## License / notes

- Reverse-engineered from the `IntelligenceLexicon-Edition-v1.0` (the operator's
  2026-08-02 directive) + the Plutus v4.5.4 six-lexicon design (the operator's
  2026-08-06 directive).
- The fork adds `tsconfig.json` (the source ships none — a bare `bunx tsc --noEmit`
  from a subdirectory picks up the parent workspace's broken tsconfig; the fork scopes
  the compile to itself).
- Sources: `MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` · `PLUTUS_V4.5.4_REASONING_CHAIN_L1_SPEC.md`
  · `Plutus_Shark_Operator_Audit_Process.md` (the doctrine register).
