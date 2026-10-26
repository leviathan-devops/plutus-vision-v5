# MATHEXPR RULECARD ARCHITECTURE BIBLE v1.0

TRIGGER: any work that authors, compiles, calibrates, discharges, or audits a MathExpr
RuleCard — the Plutus 5.0 predicate/oracle substrate (specs/mpse, jesl/mpse, the E3
Trade Computer Kernel gates).

DUTY: the complete law of the rule-card circuit — what a RuleCard IS, the 28-tag
MathExpr grammar it is written in, the compile→registry→calibrate→discharge pipeline,
the failure vocabulary, and the trading-gate mappings. Read fully. Then operate.

ONE-SHOT PROTOCOL: a fresh agent with zero prior context reads this file alone and can
author, compile, calibrate, and discharge RuleCards without opening any other doc.

THE OPERATOR'S MANDATES (verbatim): "MathExpr RuleCards" — the operator's naming of the
Plutus 5.0 predicate substrate. "GET THE CORRECT FUCKING DATA OR THROW ERROR. BLACK AND
WHITE, NO MIDDLE GROUND, NO FALLBACK FABRICATED BULLSHIT." (honest-data law, V4.5.2
BUILD_REPORT:240). "Doctrine is QUOTED, never synthesized." (D13, Bible 4.5:703-705).

THE THREE SENTENCES OF DISCIPLINE:
1. A rule that cannot be expressed as MathExpr with a declared oracle does not exist.
2. A float comparison without a declared tolerance is a refusal, not a bug.
3. A predicate that has never fired on its violation-fixture is not live — it is FLAGGED.

CORPUS LINEAGE (all anchors verified by absorption waves, 2026-09-10/11):
- JESL mpse bridge: /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/MIMOCODE/JESL/jesl/mpse/{parser,oracle,rule-cards,calibrate,kernel-emit}.ts (source tree forked from Trident_Agent/Active_Projects/JESL)
- Plutus instantiation: .../Plutus_Agent/specs/mpse/ (S-1..S-7, compile.ts, calibrate.ts, oracle-registry.ts 19KB, battery.json 46 predicates, d17-report.json, fixtures golden-week.json + 9 mutants)
- Theory: KNOWLEDGE_LIBRARY/MPSE/KB-MPSE-{00,01,02,03} (12,458L) + LASME MPSE_COMPLETE_ENGINEERING_BIBLE.md (1,771L)
- Runtime nodes: jesl/nodes/{math-eval,oracle-gate,mpse-discharge,gate}.ts

## §1 CRITICAL RULES — THE LAW OF THE RULE CARD

### 1A — THE LOSSLESSNESS LAW
1. ALWAYS express a rule as MathExpr BEFORE writing any enforcing code. The prose form
   is the SPEC (entropy H>0); the MathExpr form is the CONTRACT (H=0); the code is a
   thin adapter over the contract. (KB-MPSE-01 Losslessness Theorem; MPSE bible:128-137
   Iron Laws L1-L10.)
2. NEVER let a prose rule be the only form of a trading law. The founding derailment —
   "each pair should mirror DXY setups in inverse direction" producing 40+13 setups vs
   the intended 8/8/8=24 (MPSE bible:34-45) — was a SPEC-entropy failure: the prose
   admitted 53 valid outputs; f(T)=N×(1+P)=24 admits exactly one count.
3. MUST carry the count invariant wherever a set is produced: `card(setups)`,
   `gte(card(setups), 24)`, `forall(t in trades, withinTol(t))`. A rule over a
   collection without a cardinality predicate is INCOMPLETE — reject it at review.

### 1B — THE RULECARD SHAPE LAW
1. ALWAYS author a RuleCard with the full typed shape (rule-cards.ts:16-25):
   `{ id, math, expected, tolerance?, severity?, provenance }` — id ALL_CAPS_SNAKE
   naming the CONDITION; math a MathExpr AST; expected the oracle value; tolerance
   mandatory for every float; severity INFO|HIGH|CRITICAL; provenance the verbatim
   doctrine quote + doc.md:line anchor.
2. NEVER omit `expected`. compileRule refuses with `[JESL ORACLE-MISSING]`
   (rule-cards.ts:29-38, 97-106). A card without an oracle is a wish, not a rule.
3. NEVER invent a threshold. Every numeric constant in `math` traces to a provenance
   quote (D13). Unnamed magic numbers are the MPSE magic-ladder slop signature
   (ISE_T1.md:22-27) — the review gate rejects them.

### 1C — THE FLOAT-TOLERANCE LAW
1. ALWAYS declare `tolerance` (epsilon) on every float comparison. compileRule refuses
   float-without-epsilon with FLOAT_EPSILON_MISSING (rule-cards.ts:43-50).
2. ALWAYS make tolerance positive and finite (refused otherwise, rule-cards.ts:51-60).
3. NEVER let display tolerance differ from verdict tolerance. The v4.5.4 Monday-gold
   checkpoint displayed 3p while G1 evaluated at 2p internally (golden-gate.ts
   constants; forensic brief M1) — under 2p the 5/5 was 4/5. ONE constant, in ONE
   card, referenced by name. This is the theatrical class the substrate exists to kill.

### 1D — THE ORACLE REGISTRY LAW
1. ALWAYS register cards through compileOracle — the registry is an append-only Map,
   first-registration-wins (oracle.ts:173-211).
2. NEVER re-register an id with different math. Re-registration throws
   OracleConflictError (oracle.ts:47-53, 180-198). The conflict is a fork in the law —
   resolve it at authoring, never at runtime.
3. MUST treat the registry as the single law object. The NO-DRIFT law (MPSE
   bible:1037-1045): pre/post/inv/temporal are ONE shared object with thin adapters —
   the day two files each define "RRR floor", one of them is already wrong.

### 1E — THE DISCHARGE SEMANTICS LAW
1. ALWAYS discharge per type (oracle.ts:124-171): int==int is strict equality; float
   REQUIRES the declared tolerance; bool compares exactly; arrays element-wise.
2. NEVER ship NaN or non-finite values into discharge — they map to CONTRADICTED
   (oracle.ts:129-134), which rolls up as FAIL. A NaN reaching an oracle means an
   upstream predicate divided by zero or read an absent field: fix the producer.
3. MUST know the verdict ladder: PASS / FAIL / CONTRADICTED (→FAIL) / UNVERIFIABLE and
   EXCLUDED (→INCONCLUSIVE) (calibrate.ts:149-153; oracle-gate.ts:16-23). A gate
   reporting "PASS" on an UNVERIFIABLE sample is a false green — audit it.

### 1F — THE CALIBRATION LAW
1. ALWAYS calibrate before live: every predicate must FIRE on its violation-fixture
   and stay SILENT on the golden fixture, else it is FLAGGED
   (dead / false-positive / incoherent) and MUST NOT go live (CORBELL manual:316-328).
2. MUST treat bornOff fixtures as EXCLUDED, not FAIL (D17 rule, calibrate.ts:135-139,
   99-101) — intentionally-wrong samples exist to prove the detector fires, not to
   poison the verdict rollup.
3. NEVER accept a battery below full calibration. The Plutus d17-report stands at
   ~20/46 calibrated; the remainder are evidence-only/born-off. 46/46 calibrated is
   the 5.0 gate (spec §5b).

### 1G — THE CONTENT-ADDRESS LAW
1. ALWAYS derive the CompiledPredicate id as sha256(anchor|bindings)[:12] — the id IS
   the provenance fingerprint (CORBELL manual:200-205). Two cards quoting the same
   law with the same bindings get the same id; any edit changes the id.
2. NEVER bind a template without values. An unbound template discharges HONEST SILENT
   [] — silence, never noise (CORBELL profile.yaml:408-409).
3. MUST re-compile on fingerprint change (auto-recompile law, CORBELL:350-355). The
   machine code NEVER changes when a card is edited — only the registry row does.

### 1H — THE GRAMMAR LAW
1. ALWAYS write math in the 28-tag MathExpr IR (parser.ts:36-43): arithmetic
   add/sub/mul/div/mod; comparisons eq/neq/lt/lte/gt/gte; boolean and/or/not(+neg);
   if; call(abs/min/max); list/index; quantifiers forall/exists; temporal
   prev/eventually/globally/until; set/count card/subset/member/setLit/sumAggr.
2. NEVER exceed DEPTH 256 or DOMAIN 10000 (parser.ts:3-4) — deep expressions are a
   smell: decompose into named cards.
3. MUST know div-by-zero yields `undefined` at eval (math-eval.ts:27) — guard
   denominators with an if/not(eq(...,0)) wrapper or accept CONTRADICTED downstream.
4. NEVER leave a symbol unbound: unbound vars eval INCONCLUSIVE UNBOUND_SYMBOL
   (math-eval.ts:138-141); a missing expr is INCONCLUSIVE NO_EXPR (math-eval.ts:115).

### 1I — THE GATE-NOT-TOKEN LAW
1. ALWAYS let a predicate FAIL as a verdict with the delta in the evidence anchor —
   NEVER as a new refusal token (gate.ts:49,63). The 8 frozen JESL refusal tokens are
   closed (D15); predicate failure is data, not refusal.
2. NEVER author an empty assert set — empty asserts PASS vacuously (gate.ts:54); a
   gate node with no asserts is theater.
3. MUST name vias after upstream output fields (warhead-registry-guard.json:85-97) —
   a via naming a nonexistent field severs the circuit at compile (VIA_MISSING).

### 1J — THE MATHCONTRACT LADDER LAW
1. MUST classify every contract role before wiring (MPSE bible:1088-1116): PRE→REJECT
   (the action never ran); POST→THROW (discard the output); INV→DIE (no restart — the
   invariant break is systemic); TEMPORAL→ESCALATE (retry with backoff).
2. ALWAYS prefer the abort idiom for set-shape divergence (MPSE bible:176-187):
   `|card(all_setups) - 24| > bound → ABORT` — ~70% of derailments caught, zero false
   positives measured.
3. NEVER engineer a fallback that produces a DIFFERENT artifact and marks it valid —
   the loud-fail-or-clear-pass law (MPSE bible Part-G; Warhead 10).

### 1K — THE PAPER-ANCHOR BAN
1. NEVER compare an output against itself. SL/TP validation reads ORACLE rows, never
   the emissions (the Monday-gold M7 finding: TTE SL/TP came "never from the golden",
   diag:693-696 — structurally incapable of validating placement).
2. MUST gate provenance: `member(projection, oracleRows)` on every anchor-bearing
   output; INVENTED ids fail the totality gate (failures.db W-5_E1ZONE_ID_REAL ×73
   are the empirical class).

### 1L — THE COMPILATION-SURFACE LAW
1. ALWAYS declare cards where the compiler can find them: compileDoc scans node
   configs for keys math/expr/expression + expected/oracle/value (rule-cards.ts:73-113).
   A card living outside those keys is invisible to discharge.
2. ALWAYS extract ```math fences for prose-adjacent specs (parser.ts:58-67) — the
   fence IS the binding between doc and registry.

### 1M — THE PERSISTENCE LAW (T2/T1/T0)
1. MUST persist contracts in the T2/T1/T0 pyramid (MPSE bible:1262-1270): math lives
   in T2 (parser-extracted), 16-byte refs survive compaction in T1, execution traces
   in T0. HALT on lost T2 — a session without its math layer is unaccountable.
2. NEVER let a compaction silently drop a registry fingerprint. The mathManifest
   records registry ids; rebuild verifies against it.

### 1N — THE 35-AP BAN
1. NEVER ship a card matching the 35 anti-patterns (MPSE bible:1279-1316) — top
   offenders for this substrate: prose-only rule (AP-1), fitted calibration (the
   golden-levels-as-inputs trap), missing count invariant, fail-open default branch.
2. MUST run the BANNED_WORDS screen on any gateIdea (MPSE bible:1319-1333) — "should",
   "approximately", "reasonable" in a rule text mark it pre-math.

### 1O — THE TEMPORAL LAW
1. MUST express sequence rules in the temporal tags (parser.ts:28-30): `prev` for
   bar-to-bar state; `eventually`/`globally`/`until` for LTL properties over the bar
   stream. The zone lifecycle (VIRGIN→ACTIVE→DEPLETED→FORTRESS, recurrence
   stateₙ₊₁=f(stateₙ,touch)) and the third-mitigation rule ("zones usually fail on
   the THIRD mitigation") are temporal predicates, not per-bar ifs.
2. NEVER unroll a temporal property into per-bar imperative code — the unrolled form
   cannot discharge against an oracle and drifts from the doc (the prose-to-code
   drift class). `globally(zone.reactionCount < 3 → next(state) != BROKEN)` is the
   card; the state machine consumes it as a guard (KB-MPSE-03 math-backed XState
   guards, L239-268 ADT + guard pre-conditions).

### 1P — THE EMPIRICAL-SEED LAW
1. ALWAYS seed new gate cards from the measured failure corpus before inventing
   predicates: plutus-reasoning-failures.db (20,322 rows) is the empirical lexicon —
   RRR_BELOW_GATE ×3,410; MACRO_DIVERGENCE ×1,840; ADM_REJECT + NO_STRUCTURAL_TP ×909
   each; DEGENERATE_TP_CAP_FAILED ×702; W-1_FORWARD_POSITION_NUMERIC ×620;
   CONTRACT_VIOLATION + W-3_DIRECTION_ORDER ×213 each; W-5_E1ZONE_ID_REAL ×73.
   Every class with ≥50 rows gets a card; the count is the severity signal.
2. NEVER ship a card whose failure class has zero observed instances AND zero doctrine
   quote — it is speculative enforcement (flagged at review, severity INFO maximum).

## §2 CORRECT / WRONG PAIRS — THE LEARNED DISCIPLINE

### P2-1 — PROSE RULE vs RULECARD
WRONG: `// R9: trades below 2.5RR are invalid` — untestable, unattributable, drifts
silently; the RRR floor existed as FOUR conflicting constants in the legacy tree
(1.5/2.0 legacy, 2.5 macro-era, 3.0 emission floor) because every consumer re-read
the prose (trading-constants.ts:140-147 vs Bible 4.5:570).
CORRECT:
```json
{ "id": "RRR_FLOOR_VIOLATION",
  "math": ["gte", ["div", ["call","abs",["sub",["var","TP"],["var","E"]]],
                        ["call","abs",["sub",["var","E"],["var","SL"]]]], 3.0],
  "expected": true, "severity": "CRITICAL",
  "provenance": { "quote": "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE",
                  "anchor": "PLUTUS_ARCHITECTURE_BIBLE_4.5.md:570" } }
```
FIX: one card in the registry; every consumer references RRR_FLOOR_VIOLATION by id.

### P2-2 — STRICT FLOAT EQUALITY vs TOLERANCE
WRONG: `eq(entry, 1.14110)` — FX floats at 5dp never compare clean; the predicate
flaps between runs and "determinism ×2" fails on the second hash.
CORRECT: `lte(call abs, sub(entry, oracleEntry))` with `"tolerance": 0.0003` (3 pips
at EU scale) and expected `true`. FIX: 1C law; FLOAT_EPSILON_MISSING is the compiler
catching this at authoring time.

### P2-3 — KEYWORD DETECTION vs MATHEXPR PREDICATE
WRONG: a classifier that greps setup notes for "confirmed" and passes the zone gate —
the regex-only-detection slop signature (ISE_T1.md:22-27); it fired 4.9% of the time
on theater in the failures corpus (generic "looks good" strings BLOCKED at
engine.ts:1377-1380 in the old firewall).
CORRECT: the evidence predicate `zoneAnalysis` carries ZONE| lines whose every row
must satisfy `member(zoneId, zoneMap.zones)` — membership in a closed set, discharged
against the registry. FIX: detectors detect, MathExpr decides (LASME wiring law).

### P2-4 — MISSING COUNT INVARIANT vs CARD/FORALL
WRONG: the mirror doctrine "EU and GU CANNOT have LESS trades than DXY" existed as
prose while the gold run emitted GU 1 (+1 REJECT) vs DXY 2 and the gate said /6 while
measuring /5 (forensic X4/X8).
CORRECT: `gte(card(mirrorTrades), card(dxyTrades))` + `forall(t, member(t,
oracleRows))` + the denominator discipline card `eq(add(card(emitted),card(rejected)),
card(oracle))`. FIX: counts as data (spec §5c).

### P2-5 — TOLERANCE SPLIT vs ONE PINNED CONSTANT
WRONG: ORACLE_TOLERANCE_PIPS=3 displayed at the harness while G1_ENTRY_TOLERANCE_PIPS=2
evaluated the verdict (injector §5D carried both; DXY LONG Δ2.7p passed one and failed
the other).
CORRECT: one card `GOLDEN_ENTRY_TOL` with tolerance 0.0003 (or DXY 0.03); the harness
READS the card, never re-declares. Any second declaration = OracleConflictError by 1D.
FIX: the conflict throw is the feature.

### P2-6 — INVENTED DEFAULT vs ORACLE-MISSING REFUSAL
WRONG: a card whose author left `expected` blank "to fill in later" and the loader
substituted `expected: true` — the card then validated anything (the self-blessing
harness class, CORBELL manual:51).
CORRECT: `[JESL ORACLE-MISSING]` refusal at compile, exit 2, zero artifacts. The
refusal names the card id and the remedy. FIX: 1B law — refuse-before-spend.

### P2-7 — UNCALIBRATED LIVE vs CALIBRATE-GATED
WRONG: promoting all 46 battery predicates to live because the battery "ran green" —
a dead predicate (never fires) is green in the exact same run (the green-harness
blind spot, FAILURE_LOG F7).
CORRECT: the d17 calibration report per predicate: FIRE-on-mutant + SILENT-on-golden
→ CALIBRATED; else FLAGGED{dead|false-positive|incoherent} → stays offline. FIX: 1F
law; the 5.0 acceptance is 46/46 CALIBRATED.

## §3 STEP-BY-STEP PROCEDURES

### P3-1 — AUTHOR A RULECARD (from doctrine quote to live predicate)
1. Locate the verbatim doctrine quote + its doc.md:line anchor (D13). No quote, no card.
2. Draft the math in the 28-tag grammar over named vars (E, SL, TP, setups, ...).
3. Type every comparison; add tolerance to every float (1C).
4. Write the card JSON per 5B.
5. Compile: `bun run specs/mpse/compile.ts cards/<id>.json` — refusal = fix at
   authoring (ORACLE-MISSING / FLOAT_EPSILON_MISSING / OracleConflictError).
6. Dry-run calibrate (P3-3). Curate. Register live. Record the fingerprint.
Commands (Plutus 5.0 tree):
```
bun run specs/mpse/compile.ts cards/RRR_FLOOR_VIOLATION.json
bun run specs/mpse/calibrate.ts --dry cards/RRR_FLOOR_VIOLATION.json
```

### P3-2 — COMPILE A DOC'S CARDS (node-binding surface)
1. Confirm every card sits in a node config under keys math|expr|expression with
   expected|oracle|value (rule-cards.ts:73-113). Cards outside the keys are invisible.
2. Run compileDoc over the workflow JSON; inspect the resolved registry ids.
3. On fingerprint change the registry auto-recompiles; machine code never changes.

### P3-3 — CALIBRATE THE BATTERY
1. Fixtures in: golden-week.json (SILENT expected) + mutants/*.json (FIRE expected,
   classified bornOff → EXCLUDED from rollup).
2. `bun run specs/mpse/calibrate.ts --battery specs/mpse/battery.json`
3. Read d17-report.json: per-predicate status CALIBRATED|FLAGGED{reason}|EXCLUDED.
4. FLAGGED → repair the math or the bindings → re-run. NEVER delete a failing
   fixture to go green (the fitted-calibration AP).
5. Promote only CALIBRATED predicates to live.

### P3-4 — DISCHARGE AT RUNTIME
Single rule: oracle-gate node (oracle-gate.ts:25-95) with ruleId + expected in
config, actual from inbound field actual|value|data|input|first.
Battery: mpse-discharge node (mpse-discharge.ts:70-147) resolving cards + samples;
verdict FAIL if fail|contradict>0 else INCONCLUSIVE if unverifiable>0 else PASS.
Compute first: math-eval node evaluates the expression; the gate compares — never
let the gate node also compute (separation of compute vs assert).

### P3-5 — CONVERT A PROSE DOCTRINE CORPUS (PATH-B, the 19-doc fork)
1. Extract blockquotes + declared classifications from the canon docs (corbell
   PATH-B scanner, CORBELL:70-80).
2. Map classification → template: DOMAIN→domain.numeric-threshold;
   PROCESS→gates-measure-outputs-not-logic; ARCH→contract.must-implement;
   LOGIC→provenance.traces-to-source (CORBELL:194-198).
3. Bind template variables to real symbols/paths (the bindings are the power field).
4. Compile + calibrate + curate per P3-1/P3-3. Unbound → HONEST SILENT [].

### P3-6 — WIRE THE E3 TRADE-COMPUTE GATES
The kernel's math-eval → oracle-gate chain per the trading predicate table (5C):
RRR (compute) → RRR_FLOOR_VIOLATION (assert); outcome sim → W/L cards; SL quality →
MAE bands; counts → card()/forall(); risk → circuit-breaker bracket floor 0.6
(profiles/trading.ts:10). Every assert reads a registry id — zero inline thresholds.

## §4 TROUBLESHOOTING MATRIX

| ERROR / SYMPTOM | CAUSE | FIX |
|---|---|---|
| [JESL ORACLE-MISSING] at compile | card lacks `expected` | author the oracle value; never default it (P2-6) |
| FLOAT_EPSILON_MISSING | float compare without tolerance | add positive finite tolerance (1C) |
| OracleConflictError on re-register | same id, different math | resolve the fork at authoring; registry is append-only (1D) |
| CONTRADICTED verdict | NaN/non-finite reached discharge | fix producer: absent field or div-by-zero upstream (1E) |
| div-by-zero → undefined | unguarded denominator | wrap with if(not(eq(den,0)), ...) or pre-validate (1H) |
| UNBOUND_SYMBOL (INCONCLUSIVE) | var never seeded into scope | check node vias name the upstream field (1I) |
| NO_EXPR (INCONCLUSIVE) | math-eval node config empty | supply math under the scanned keys (1L) |
| CHANNEL-UNSET fail | gate asserts reference unknown $.path | fix the path or seed the channel (gate.ts:59) |
| Predicate FAIL with delta | oracle mismatch — real signal | read the delta in the evidence anchor; fix the data or the trade |
| Vacuous PASS on gate | empty asserts array | never ship an assert-less gate (1I) |
| FLAGGED{dead} | predicate never fired on mutant | math too narrow OR mutant not touching it; repair pair |
| FLAGGED{false-positive} | fires on golden | tolerance too tight or bindings overbroad |
| FLAGGED{incoherent} | fires on both golden and mutant | predicate contradicts itself — rewrite |
| Battery green but drift in prod | dead predicates counted as green (F7) | only CALIBRATED counts; audit d17 report (1F) |
| EXCLUDED floods the report | mutants misclassified as live samples | mark bornOff fixtures properly (D17) |
| PASS on UNVERIFIABLE sample | gate rolled up wrong tier | oracle-gate maps UNVERIFIABLE→INCONCLUSIVE; never report PASS (1E) |
| Tolerance flap across runs | two declarations of the same epsilon | single card; conflict throw enforces (P2-5) |
| Count drift (5/6 vs 23) | no cardinality invariant | add card()/eq(add(emitted,rejected),oracle) (P2-4) |
| SL/TP "validated" against emissions | self-sourced oracle (M7) | bind oracle rows, member() gate (1K) |
| INVENTED zone id accepted | membership gate absent | member(zoneId, zoneMap.zones) on every designation (1K) |
| Registry id changed silently | anchor or bindings edited | content-address by design (1G); re-pin + re-calibrate |
| Card invisible to discharge | outside scanned keys | move into math/expr/expression + expected/oracle/value (1L) |
| Deep expression rejected | DEPTH>256 / DOMAIN>10000 | decompose into named cards (1H) |
| Math lost after compaction | T2 not persisted / manifest missing | halt-on-lost-T2; rebuild from mathManifest (1M) |

## §5 QUICK REFERENCE

### 5A — THE 28-TAG MATHEXPR GRAMMAR (parser.ts:36-43; limits :3-4)
| Class | Tags | Notes |
|---|---|---|
| arithmetic | add sub mul div mod | div-by-zero → undefined |
| comparison | eq neq lt lte gt gte | floats need tolerance |
| boolean | and or not neg | short-circuit |
| control | if call list index | call: abs min max |
| quantifier | forall exists | over lists |
| temporal | prev eventually globally until | LTL over bar streams |
| set/count | card subset member setLit sumAggr | the invariant toolkit |

### 5B — THE RULECARD JSON CONTRACT (author verbatim)
```json
{ "id": "UPPER_SNAKE_CONDITION_NAME",
  "math":  ["gte", ["div", ["call","abs",["sub",["var","TP"],["var","E"]]],
                          ["call","abs",["sub",["var","E"],["var","SL"]]]], 3.0],
  "expected": true,
  "tolerance": 0.0,
  "severity": "CRITICAL",
  "provenance": { "quote": "<verbatim doctrine>", "anchor": "<doc>.md:<line>" } }
```
Required: id, math, expected. tolerance REQUIRED on any float-bearing comparison
(refusal otherwise). severity INFO|HIGH|CRITICAL. Registry: append-only,
first-wins, sha256(anchor|bindings)[:12] ids.

### 5C — THE TRADING PREDICATE TABLE (Plutus 5.0 E3 mapping)
| Gate | MathExpr (surface form) | Card |
|---|---|---|
| RRR floor | div(abs(TP−E), abs(E−SL)) ≥ 3.0 | RRR_FLOOR_VIOLATION |
| Entry tolerance | abs(entry − oracleE) ≤ tol | GOLDEN_ENTRY_TOL (the ONE constant) |
| Long trigger | lte(LOW,E) ∧ gt(firstBar,E) | TRIGGER_LONG |
| Short trigger | gte(HIGH,E) ∧ lt(firstBar,E) | TRIGGER_SHORT |
| Outcome R | if(win, R, −1.0); same-bar TP+SL → LOSS | OUTCOME_CONSERVATIVE |
| SL too-wide | div(MAE, E−SL) < 0.40 | SL_QUALITY_WIDE |
| SL too-early | div(MAE, E−SL) > 0.70 | SL_QUALITY_EARLY |
| Count floor | card(setups) ≥ 24 (f(T)=N×(1+P)) | COUNT_FLOOR_F_OF_T |
| Mirror floor | card(mirrorTrades) ≥ card(dxyTrades) | MIRROR_FLOOR |
| Denominator | emitted + rejected = card(oracle) | DENOMINATOR_DISCIPLINE |
| Provenance | member(anchorId, oracleRows) | PAPER_ANCHOR_BAN |
| Totality | forall((day,dir), exists1(designation)) | DESIGNATION_TOTALITY |

### 5D — THE CIRCUIT (compile → registry → calibrate → discharge)
```
┌──────────────────────────────────────────────────────┐
│ PROSE DOCTRINE (canon docs, verbatim quotes)         │
└──────────────────────────────────────────────────────┘
   │  P3-1/P3-5 (author / PATH-B convert)
   ▼
┌──────────────────────────────────────────────────────┐
│ RULECARD {id, math, expected, tolerance, provenance} │
└──────────────────────────────────────────────────────┘
   │  compileRule (refusals: ORACLE-MISSING,
   │  FLOAT_EPSILON_MISSING, conflict)
   ▼
┌──────────────────────────────────────────────────────┐
│ ORACLE REGISTRY (append-only, sha256 ids)            │
└──────────────────────────────────────────────────────┘
   │  fixtures: golden (SILENT) + mutants (FIRE)
   ▼
┌──────────────────────────────────────────────────────┐
│ CALIBRATE → d17 report (CALIBRATED / FLAGGED)        │
└──────────────────────────────────────────────────────┘
   │  only CALIBRATED promotes
   ▼
┌──────────────────────────────────────────────────────┐
│ LIVE REGISTRY ── bound to node configs               │
│ (keys: math/expr/expression + expected/oracle/value) │
└──────────────────────────────────────────────────────┘
   │  runtime cast
   ▼
┌───────────────────────┐  ┌──────────────────────────┐
│ math-eval (compute)   │─►│ oracle-gate / discharge  │
└───────────────────────┘  └───────────┬──────────────┘
                                       ▼
                       ┌──────────────────────────────┐
                       │ PASS / FAIL(delta) /         │
                       │ CONTRADICTED / UNVERIFIABLE  │
                       │ → journal (hash chain)       │
                       └──────────────────────────────┘
```

### 5E — REAL PATHS (ground truth)
| What | Path |
|---|---|
| mpse bridge | MIMOCODE/JESL/jesl/mpse/{parser,oracle,rule-cards,calibrate}.ts |
| discharge nodes | MIMOCODE/JESL/jesl/nodes/{math-eval,oracle-gate,mpse-discharge,gate}.ts |
| trading profile | MIMOCODE/JESL/jesl/profiles/trading.ts (caps Http; kinds http-request, math-eval, oracle-gate, circuit-breaker, evidence-gate; tier 2; breaker floor 0.6) |
| Plutus battery | Plutus_Agent/specs/mpse/ (oracle-registry.ts, battery.json 46 preds fp 8acfe74f, d17-report.json, S-1..S-7) |
| fixtures | Plutus_Agent/specs/fixtures/ (golden-week.json + 9 D17 mutants) |
| theory | KNOWLEDGE_LIBRARY/MPSE/KB-MPSE-{00,01,02,03} + LASME MPSE_COMPLETE_ENGINEERING_BIBLE.md |
| card exemplar | JESL/jesl/algorithms/warhead-registry-guard.json |
| proof harness | JESL/jesl/tests/warhead-registry-card.test.ts (7 legs) |

### 5F — DOCTRINE QUOTES (verbatim; the law, never paraphrased)
- "GET THE CORRECT FUCKING DATA OR THROW ERROR. BLACK AND WHITE, NO MIDDLE GROUND, NO
  FALLBACK FABRICATED BULLSHIT." — honest-data law (V4.5.2 BUILD_REPORT:240)
- "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE" — RRR floor (Bible 4.5:570)
- "Doctrine is QUOTED, never synthesized." — D13 (Bible 4.5:703-705)
- "NOT A SINGLE ONE OF MY TRADES IS BELOW RRR = 3.5." — executed standard (4.5:561)
- "The spec owns the derailment." — Iron Law 10 essence (MPSE:42-43)
- "RRR is the #1 metric; win rate is #2 as long as win rate is 70%+" (4.5:563)

### 5G — VERDICT + FAILURE LADDERS
Discharge: PASS → FAIL(delta) → CONTRADICTED(→FAIL) → UNVERIFIABLE/EXCLUDED(→INCONCLUSIVE).
Calibration: CALIBRATED → FLAGGED{dead|false-positive|incoherent} → EXCLUDED(bornOff).
Contract roles: PRE→REJECT / POST→THROW / INV→DIE / TEMPORAL→ESCALATE (MPSE:1088-1116).
Refusal tokens (closed 8, never extended for predicates): UNKNOWN-NODE, CYCLE,
TIER-VIOLATION, UNBRACKETED-GENERATION, CAP-UNBOUND, ORACLE-MISSING, CHANNEL-UNSET,
NO-SEED.

## §6 THE ZERO-TRUST AUDIT (delivery gate)
Re-read as a fresh agent: grounding — every anchor names a real file:line verified by
the absorption waves (JESL mpse/nodes/specs read 2026-09-11; MPSE/KB read 2026-09-10;
d17/battery state measured). Self-containment — a fresh agent authors, compiles,
calibrates, discharges from §1-§5 alone. Density — law-format rules with mechanisms;
7 worked pairs; 23 troubleshooting rows each with cause+fix; 7 procedures with
copy-pasteable commands. Doctrine verbatim in 5F. Open items carried: battery stands
~20/46 calibrated (the 5.0 completion target); MIMOCODE/JESL fork verified present
2026-09-11 (deep-reader: JESL round-2 absorption). Verdict: no unresolvable gaps.

### P3-7 — TRACE THE FULL CIRCUIT (the end-to-end walk, one golden trade)
The full pipeline on ONE predicate (RRR floor), quote to journal row:
1. CANON: Bible 4.5:570 carries the quote "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE".
2. AUTHOR: P3-1 → card RRR_FLOOR_VIOLATION (5B shape, severity CRITICAL, no float
   tolerance needed — the comparison is over computed R vs 3.0; the ENTRY/SL/TP floats
   feed div() whose RESULT is the compared value; if you compare raw prices instead,
   tolerance becomes mandatory — see P2-2).
3. COMPILE: compileRule → registry id sha256(anchor|bindings)[:12]; refusals absent.
4. CALIBRATE: golden-week.json — EU #1 RRR 3.18 (SILENT: 3.18 ≥ 3.0 passes, predicate
   correctly silent); mutant d17-rrr-below — a projection with RRR 1.59 (the exact
   DXY Mon BS LONG 1H|100.654 failure from the corpus, ×3,410 class) → FIRE.
   Status CALIBRATED. (bornOff mutant → EXCLUDED from rollup.)
5. BIND: the E3 kernel's trade-compute node config carries
   `"math": <RRR expr>, "expected": true` (1L keys) — the card is now visible.
6. RUNTIME: math-eval computes div(abs(TP−E), abs(E−SL)) per projection →
   oracle-gate discharges RRR_FLOOR_VIOLATION with actual=the computed value.
7. VERDICT: PASS (≥3.0) or FAIL with delta in the evidence anchor ("RRR 1.59 < 3.0,
   SL 28p TP 39p" — the remedy format from the corpus) → journal row (hash-chained,
   2 rows/node invoke+verdict) → any FAIL rolls the kernel verdict to FAIL, exit 1.
8. AUDIT: the journal replays by runId; the registry fingerprint in the cast receipt
   proves WHICH law version judged the run. Tamper-evident end to end.

### 5H — THE EMPIRICAL CLASS → CARD TABLE (failures.db → 5.0 gates)
| failures.db class (rows) | 5.0 card | severity |
|---|---|---|
| RRR_BELOW_GATE (3,410) | RRR_FLOOR_VIOLATION + L3 anchor verify | CRITICAL |
| MACRO_DIVERGENCE (1,840) | CASCADE_DIVERGENCE_EXCEEDED (≤0.35) + chainsContradict | HIGH |
| ADM_REJECT (909) | ANCHOR_DECISION_REJECT (logged, refine path) | HIGH |
| NO_STRUCTURAL_TP (909) | DEGENERATE_TP_CAP (capability absence) | HIGH |
| DEGENERATE_TP_CAP_FAILED (702) | DEGENERATE_TP_CAP | HIGH |
| W-1_FORWARD_POSITION_NUMERIC (620) | STEP_B_FORWARD_POSITION_NUMERIC | HIGH |
| CONTRACT_VIOLATION (213) | E3_NEVER_CONTRACT | CRITICAL |
| W-3_DIRECTION_ORDER (213) | DIRECTION_ORDER_GEOMETRY | HIGH |
| W-5_E1ZONE_ID_REAL (73) | PAPER_ANCHOR_BAN (member gate) | CRITICAL |
| W-4 / W-6 (12 each) | STEP_B_SCHEMA / PROJECTION_ID_REAL | INFO |
| REFINEMENT_EXHAUSTED (399, attempts=4) | REFINEMENT_BUDGET_3 (escalate, D36) | INFO |
| SHADOW_DEGRADE (10,919 — degrade path) | AETHER_DEGRADE_CONF_CAP (0.70 cap card) | INFO |

## §7 VERSION HISTORY
- v1.0 (2026-09-11): authored as bible §1 of the Plutus 5.0 MPSE substrate, from the
  JESL round-2 + V5/OHLC/MPSE absorption waves + the theatrical-checkpoint forensics.
  Section 2 (deep-research on MIMOCODE/JESL architecture enhancements) gated on this
  section's completion — now unblocked.
