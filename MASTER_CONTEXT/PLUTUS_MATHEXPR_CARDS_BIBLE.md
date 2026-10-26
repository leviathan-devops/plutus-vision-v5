# KNOWLEDGE BIBLE: PLUTUS MATHEXPR CARDS

Version: 5.0-pure-1 | Scope: the Plutus-native MathExpr card substrate — the
S-corpus, the compile gate, the oracle registry, the calibration battery, the
discharge contract — as a standalone system with ZERO external-runtime coupling.
Effective date: 2026-09-11. Author: primary agent (session ses_-ffe5f73f384beffeg7537uiYT).
Supersession authority: NONE (this documents what IS; the companion
MATHEXPR_RULECARD_ARCHITECTURE_BIBLE.md documents the runtime-bridged view).

> SECTION 1 of this file is the pure-Plutus bible (the 11-section artifact).
> SECTION 2 (appended after the artifact, clearly fenced) is the operator-ordered
> meta-analysis: where an external kernel architecture could enhance Section 1.

## Table of Contents
1. Status Banner
2. Table of Contents
3. The Red Pill
4. Architecture Map
5. Design Principles and Key Decisions
6. Technical Deep-Dives (Part 1: corpus + compile + oracles; Part 2: calibration + registry walkthrough + discharge contract + the MathExpr language)
7. Registries
8. Failure Modes
9. Appendices
10. Iron Laws
11. Conclusion and Compaction Recovery Guide
12. SECTION 2 — META ANALYSIS (fenced; external-architecture enhancements)

## 3. The Red Pill
### What you think this system is (WRONG) vs what it actually is (CORRECT)

| # | Myth (WRONG) | Reality (CORRECT) | Evidence |
|---|---|---|---|
| 1 | "The MathExpr cards are a test framework — they check code after the fact." | The cards ARE the spec. Prose doctrine is raw material; the card corpus is the only form of the law that can be mechanically discharged. Code is audited AGAINST the cards, never the reverse. | S-1-cascade-law.md:9-15 (every block carries expr + oracle + fixtures); compile.ts:1 ("the W0 gate harness, step 1") |
| 2 | "The cards need a runtime kernel to mean anything." | Fully standalone: compile.ts (270L) and calibrate.ts (711L) import ONLY node builtins (fs/crypto/path/url). Runs under `bun`, zero dependencies, produces battery.json + d17-report.json. Any kernel is a CONSUMER, not a dependency. | compile.ts:20-23; calibrate.ts:34-41; oracle-registry.ts:14 ("No external deps — node builtins only (this file imports nothing)") |
| 3 | "Tolerances are configurable per gate — each check picks its own epsilon." | Every numeric comparison is pip-QUANTIZED: values scale to integer buckets (Math.round(v/quantum)) and ONLY integers compare. Float-ordering false positives impossible BY CONSTRUCTION. Exactly one sanctioned tolerance (3 pips — "the only metric"). | oracle-registry.ts:33-42 (quantize), :5-8 (header law); calibrate.ts:57 |
| 4 | "A predicate that never fires is harmless." | An unexercised predicate is NOT live. The calibration report separates calibrated (19) from evidence_only (27); evidence_only is recorded, never gating. A green battery with dead predicates is the named false-green class. | d17-report.json:5-28, :29-56; calibrate.ts:15-17 |
| 5 | "The golden levels are training data." | Golden levels are VALIDATION anchors, never inputs. The founding VALID control is synthesized from the fixture's DECLARED sanctioned truth — "never a literal in this file". A pipeline read-path to golden constants is the hardcode derailment. | calibrate.ts:19-22 |
| 6 | "Quotes are documentation garnish on the math." | The quote IS the legal authority. compile.ts refuses to emit a battery for a block whose quote is empty or whose anchor is not doc:line — D13 enforced mechanically, exit 1. | compile.ts:130-146 (D13_VIOLATION); S-5-rrr-regime.md:7-11 (D-R1 ratification recorded ABOVE the math, never replacing it) |
| 7 | "46 predicates means 46 green checks." | 46 = 19 calibrated + 27 evidence-only. Evidence-only exists because their fixtures are oracle-row sections of golden-week (real-data evidence), not synthetic mutants. The 5.0 completion target: author mutants to move evidence-only → calibrated. | d17-report.json:3-4, :29-56 |

The dominant misconception is Myth 2 — that this substrate is half of something,
waiting for its runtime. It is not waiting. It compiles, calibrates, and reports
today, standalone; its outputs (battery.json, d17-report.json) are the contract
every downstream consumer must satisfy.

### The one-page map (entry to terminal, counted borders)

```
┌──────────────────────────────────────────────────────┐
│ S-CORPUS — S-1..S-7 markdown law docs                │
│ every block: quote, anchor, kind,                    │
│ expr, oracle, fixtures                               │
└──────────────────────────────────────────────────────┘
   │
   ▼  bun specs/mpse/compile.ts
┌──────────────────────────────────────────────────────┐
│ COMPILE GATE (compile.ts, 270L) — the D13 law        │
│ refuses: empty quote · anchor not doc:line ·         │
│ dup keys · bad kind · malformed header               │
└──────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────┐
│ battery.json {fingerprint sha256 over ids+quotes,    │
│ blockCount == predicateCount (46/46)}                │
└──────────────────────────────────────────────────────┘
   │
   ▼  bun specs/mpse/calibrate.ts
┌──────────────────────────────────────────────────────┐
│ ORACLE REGISTRY (394L): 10 pure oracles + 2          │
│ composed · quantized integer compares ·              │
│ OracleError fail-closed (crash counts AGAINST)       │
└──────────────────────────────────────────────────────┘
   │            ┌──────────────────────────────────────┐
   │            │ FIXTURES specs/fixtures/ — mutants   │
   └───────────►│ (expect FIRE) + golden-week sections │
                │ (expect SILENT/VALID/evidence-only)  │
                └──────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────┐
│ d17-report.json — 19 CALIBRATED · 27 EVIDENCE-ONLY · │
│ 0 flagged · 0 born-off · founding VALID controls     │
└──────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────┐
│ CONSUMERS: trade-computer gates, state-machine       │
│ guards, audits — all READ the battery; none          │
│ re-declares a threshold                              │
└──────────────────────────────────────────────────────┘
```

### Component-role table (every box → its deep-dive)

| Component | Role | Inputs | Outputs | Runtime | Deep-dive |
|---|---|---|---|---|---|
| S-corpus (S-1..S-7) | the law in card form | operator doctrine quotes + anchors | blocks: quote/anchor/kind/expr/oracle/fixtures | static markdown | §6.1 |
| compile.ts (270L) | the D13 gate + battery writer | S-*.md files | battery.json (fingerprint, 46 predicates) | `bun specs/mpse/compile.ts`, exit 0/1 | §6.2 |
| battery.json (496L) | the compiled law inventory | compile output | predicate descriptors id/spec/block/kind/oracle/fixtures | read by calibrate + consumers | §6.3 |
| oracle-registry.ts (394L) | the typed oracle implementations | input records | FIRE/SILENT, VALID/CONTRADICTED, ROW verdicts | imported by calibrate; pure functions | §6.4 |
| specs/fixtures/ | the evidence corpus | mutant definitions + golden-week sections | fixture records with expect + sanctioned values | read by calibrate | §6.5 |
| calibrate.ts (711L) | the D17 discharge harness | battery + fixtures | d17-report.json; exit 0 = all calibrated-or-born-off | `bun specs/mpse/calibrate.ts` | §6.6 |
| d17-report.json (554L) | the calibration state of record | calibrate output | calibrated/evidence_only/flagged/born_off + founding controls | read by gates + audits | §6.7 |
| MathExpr language | the expression authority for every expr: | the KB-MPSE-03 ADT (28 tags) | total, parseable predicate expressions | authoring surface + eval semantics | §6.9 |

## 5. Design Principles and Key Decisions
Every decision: Decision → Chosen → Rejected Alternative → Why rejected → Cost of reversal.

| # | Decision | Chosen | Rejected alternative | Why rejected | Cost of reversal |
|---|---|---|---|---|---|
| D001 | The FORM of a trading law | MathExpr card (quote+anchor+expr+oracle+fixtures) in the S-corpus | Prose spec + downstream tests | Prose entropy admitted 53 valid mirror outputs (the founding 40+13-vs-24 derailment); tests judge code, cards judge law | Full corpus re-derivation — 7 specs, 46 blocks, every quote re-anchored |
| D002 | Numeric comparison semantics | Pip-quantized INTEGER buckets: Math.round(v/quantum), ints only (oracle-registry.ts:33-42) | Epsilon-banded float compares configured per check | Configurable epsilons drift per gate (the 2p-display/3p-verdict split class); float ordering flaps across runs | Re-author every oracle compare; re-calibrate all 46 |
| D003 | Quote authority | D13 at compile: empty quote or anchor not doc:line → D13_VIOLATION, exit 1 (compile.ts:130-146) | Quotes as optional metadata | Unattributable thresholds = the magic-ladder slop class; doctrine silently reworded | None — mechanically enforced; a reversal IS a violation |
| D004 | Battery identity | fingerprint = sha256 over concatenated block ids + quotes; files alphabetical, blocks in document order; NO timestamps (compile.ts:10-14) | mtime/version-stamped batteries | Byte-comparability of two compile runs is the determinism guarantee; timestamps break it | Regenerate every report; consumers re-pin fingerprints |
| D005 | Oracle failure semantics | Fail-closed: malformed input THROWS OracleError; "a crashing predicate counts AGAINST, never silently passes" (oracle-registry.ts:8-9) | Fail-open default branches | A default pass on malformed input is the silent false-green | Re-calibrate entire battery; audit every gate built on a pass |
| D006 | Intermediate calibration states | Three live tiers: calibrated / evidence_only / born_off (calibrate.ts:15-17; d17-report.json:5-56) | Binary live/dead | 27 predicates have golden-week oracle rows, not synthetic mutants — honest middle tier beats pretending live or silently dropping | Author mutants to promote; low mechanical cost |
| D007 | Where sanctioned thresholds live | IN the fixture data (expectedSetups, slCeilingPips, sanctionedTolerancePips, sanctionedFloor); spec D.4 constants are FALLBACK only (calibrate.ts:12-14, 48-59) | Constants baked in the harness | The fixture carries its own declared truth — the harness never hardcodes the answer it checks | Low — move values, re-run |
| D008 | Block-to-predicate cardinality | 1:1 invariant, predicateCount === blockCount enforced in the battery (compile.ts:11-12, battery.json:3-4) | N predicates per block | Count discipline: the battery count IS the law count; aggregation hides dropouts | None — the invariant blocks the reversal |
| D009 | Harness dependency posture | Zero external deps: node:fs/crypto/path/url only; runs under bun (compile.ts:20-23; oracle-registry.ts:14) | Test-framework-dependent harness | The substrate must outlive any consumer; a framework import couples law to tooling | Low — but re-audit the import graph |
| D010 | The founding VALID control | Synthesized from the fixture's declared expectedSetups "never a literal in this file" (calibrate.ts:19-22) | Hardcoded 24 in the harness | The hardcode ban applies to the harness itself; a literal 24 could mask a fixture regression | None |
| D011 | Expression authoring surface | S-file `expr:` lines in readable math, total over the BLOCK_KINDS vocabulary {piecewise, forall, exists-unique, equality, inequality, recurrence, subset, process} (compile.ts:28-32); eval authority = the KB-MPSE-03 ADT | Free-form prose exprs; or code-only predicates | Parsability + totality: every expr parses to a known kind or compile refuses; prose exprs re-introduce D001's entropy | Re-author every expr |
| D012 | Calibration verdict contract | expect ∈ {FIRE, SILENT, VALID, CONTRADICTED, row-produced}; match → calibrated, mismatch → recorded + EXIT 1 (calibrate.ts:4-7) | Best-effort scoring with warnings | Exit 0 must MEAN all-calibrated-or-born-off — a warning tier would let mismatches ride | None — exit code is the truth channel |

Decision-ledger narrative (the WHY chain): D001 exists because the operator was
burned by prose (the founding derailment). D002+D003 exist because the burn
repeated in a new form (tolerance split, magic thresholds). D004 exists because
two byte-identical runs are the only determinism a fresh agent can verify alone.
D005+D006 exist because "green" lied twice (self-blessing harnesses, dead
predicates riding a green battery). D009 exists so that D001-D008 can never be
held hostage by tooling. Every rejection above names a real incident class, not
a hypothetical.

<!-- anchor consumed: BB-CHUNK-5 -->


## 6. Technical Deep-Dives — Part 1 (corpus, compile gate, oracle registry)
### §6.1 The S-corpus (S-1..S-7, 437L measured)

WHAT: seven markdown law files, each `# S-<n> — <title>` + `spec:`/`form:`/`sources:`
keys + `### B-<n>-<slug> — <title>` blocks carrying FIXED-ORDER key lines
`quote: anchor: kind: expr: oracle: fixtures:` (compile.ts:3-8 states the contract).
HOW: a block is ONE law: the quote carries legal authority (D13), the anchor
carries provenance (doc.md:line, comma-separated allowed), the kind must be one of
8 BLOCK_KINDS, the expr is the math, the oracle names the verdict code, fixtures
name the evidence. WHERE: specs/mpse/S-1-cascade-law.md (55L) … S-7 (57L).
WHY: markdown is the diffable, greppable, quote-faithful carrier; the fixed order
is what makes the line-oriented parser an Order-2 mechanism (calibrate.ts:24-29
carries the mechanical-detector justification note verbatim).

Corpus map (line counts measured): S-1 cascade-law 55L (6 blocks: side-match,
mirror-floor, divergence, sequencing-requires, consumption-forbids, loop-detection)
· S-2 designation-totality 47L (5) · S-3 e3-anchor-rules 89L (12) · S-4
pressure-laws 70L (7) · S-5 rrr-regime 67L (6, under the D-R1 ratification header)
· S-6 telescoping-law 52L (5) · S-7 determinism-honesty 57L (5). 6+5+12+7+6+5+5=46 ✓.

The D-R1 discipline (S-5:7-11, verbatim): "D-R1 RATIFICATION (binding on every
block below): RRR floor 2.5 / target 4R+ per ZR-6C. The executed expectation is
recorded, not built on: the operator ran the golden week at 'MINIMUM 3 RRR
NOTHING LESS IS ACCEPTABLE' and every golden row landed >= 2.92, but the BUILD
CONSTANT is 2.5 — the floor below records 2.5 and this header records D-R1 as its
authority. No block below trades the ratified constant for the executed-expectation
quote." This is the model for recording tension WITHOUT resolving it silently.

### §6.2 The compile gate (compile.ts, 270L)

WHAT: parses every S-*.md, enforces D13, writes battery.json. Exit 0 = battery
written; exit 1 = LOUD named failure; "No external deps" (compile.ts:19-23).
HOW: header regex `^#\s+(S-\d+)\s+—\s+(.+)$` (:76); spec-line/header agreement
checked (:88-91); form must be one of FORM_KINDS {piecewise, forall,
predicate-family, process} (:92-94); blocks split on `### ` (:96-108); block
header regex `^(B-\d+-[A-Za-z0-9_-]+)\s+—\s+(.+)$` (:113); per-block key lines
parsed by `^(quote|anchor|kind|expr|oracle|fixtures):\s?(.*)$` with DUPLICATE-key
refusal (:121-127); D13 gate: quote must match `"(.+)"` non-empty (:130-137),
anchor parts must each match `.+:\d+$` (:138-146); kind must be one of BLOCK_KINDS
{piecewise, forall, exists-unique, equality, inequality, recurrence, subset,
process} (:28-32, :147-150).
WHERE: every behavior above is compile.ts at the cited lines.
WHY: the error catalog names the FILE and BLOCK in every message — a refusal is a
remedy, not a rejection.

### §6.3 battery.json (496L) — the compiled law inventory

{fingerprint: sha256, blockCount: 46, predicateCount: 46, predicates: [{id:
"S-<n>/B-<n>-<slug>", spec, block, kind, oracle, fixtures[]}]} — measured
fingerprint `8acfe74f272bf736de101e297b731cfa97c9fdd4a1684e63363489f116af7b7e`
(battery.json:2, identical in d17-report.json:2 — the chain-of-custody link).
The 1:1 invariant (D008) is IN the artifact: blockCount === predicateCount.
The full 46-row registry is §7.1 (row-for-row, forensic F11).

### §6.4 The oracle registry (oracle-registry.ts, 394L)

WHAT: "The ten canonical oracles every S-file expr: references, plus two composed
evaluators" — every oracle a PURE function over its input record (:1-5).
THE QUANTIZE LAW (:33-42): `Math.round(value/quantum)`; non-finite value or
non-positive quantum THROWS OracleError — "All comparisons use these" (:33).
THE FAIL-CLOSED LAW (:5-9): malformed input throws; "a crashing predicate counts
AGAINST, never silently passes".
Measured surfaces: mirror_floor (:83-93, VALID iff actual===expected else
CONTRADICTED — overgen AND undergen both contradict, per the founding 40/13/24
case in the comment :75-78); side_match (:102-106, LONG must hold DEMAND / SHORT
must hold SUPPLY else FIRE — the D50 rule via sideConsistent :71-73);
divergence_le (:117+, FIRE iff value exceeds bound at quantum, default 1e-9);
plus (from the calibrate import list, calibrate.ts:38-41) totality_forall,
rrr_floor, sl_ceiling, sl_min, containment_subset, tf_restriction, no_wall_clock,
and the composed shape_gate, near_edge — each a typed pure function with the same
laws. OracleError carries {oracle, field} so the remedy names the field (:22-31).

### §6.5 The fixture corpus (specs/fixtures/)

9 mutants (measured ls): mutant-1-40setup · mutant-2-13setup ·
mutant-3-sideinversion-v452 · mutant-4-sideinversion-v453-silent · mutant-5-tpcap
· mutant-6-eu4-deep-rung · mutant-7-tolerance-drift · mutant-8-rrr-drift ·
mutant-9-eu2-near-edge — plus golden-week.json (single-line JSON; the real-data
oracle-row sections). Fixture records carry {id, class, data{sanctioned values},
expect, expectedRow} (calibrate.ts:72-79); the `class` field selects the oracle
dispatch (12 classes: mirror-floor, side-inversion, tp-cap, shape-gate,
tolerance-drift, rrr-drift, near-edge, sl-min, tf-restriction, wall-clock,
containment, totality — calibrate.ts:10-12).

## 6. Technical Deep-Dives — Part 2 (calibration, the 46-predicate walkthrough, discharge contract, MathExpr language)
### §6.6 The calibration harness (calibrate.ts, 711L)

WHAT: loads battery.json + fixtures/, discharges every predicate against its
declared fixtures, compares the oracle verdict to the fixture's `expect`
(FIRE|SILENT|VALID|CONTRADICTED|row-produced); match → calibrated, mismatch →
recorded + EXIT 1 (calibrate.ts:4-7). "the gate reads exit 0 as
ALL-CALIBRATED-OR-BORN-OFF" (:6-7).
HOW: fixture resolution has three kinds — records / embedded sections /
unresolved (:86-89); a predicate with NO fixtures is born_off
(EXCLUDED_BORN_OFF — "never silently armed", :15-17); fixture refs resolving to
expect-less golden-week sections are EVIDENCE-ONLY — recorded, never gating
(:17-18). Sanctioned thresholds ride IN fixture data; D.4 constants are fallback
defaults "ONLY when a fixture carries none... each fallback use is logged to
stderr for auditability" (:48-50). The founding VALID control is synthesized from
the resolved fixtures' declared expectedSetups (:19-22).
WHERE: cited lines throughout; FALLBACK table verbatim at :51-59 (expectedSetups
24 = "MIRROR_FLOOR_FORMULA f(T) = N×(1+P) = 24"; divergenceMax 0.35; rrrFloor 2.5
"(D-R1 ratified)"; slCeilingPips 36; slMinPips 4; tolerancePips 3 "the only
metric"; fxPip 0.0001).
WHY exit-code truth: a report file can be stale; an exit code cannot.

### §6.7 d17-report.json (554L) — the state of record

Measured: batteryFingerprint identical to battery.json:2 (chain of custody);
blockCount/predicateCount 46/46; calibrated = 19 ids; flagged = []; born_off = [];
evidence_only = 27 ids; foundingControls beginning with mirror-floor-24
(expectedSetups 24). The 19 calibrated, verbatim order: S-1/B-1-side-match,
S-1/B-2-mirror-floor, S-1/B-6-loop-detection, S-2/B-3-exists-unique,
S-2/B-4-exhaustiveness-d8, S-2/B-5-golden-instantiation, S-3/B-1-E1-entry-lqz-
near-edge, S-3/B-12-shape-gating, S-3/B-2-E2-ss-nested-liquidity-long,
S-3/B-3-E3-rwl-bs-deep-rung, S-3/B-5-S1-ladder-steps-sl, S-3/B-7-S3-atr-floor,
S-3/B-8-S4-golden-sl-min, S-3/B-9-T1-strength-driven-edge,
S-4/B-5-third-mitigation-inequality, S-5/B-1-floor-inequality,
S-5/B-3-ceiling-predicate, S-5/B-5-consequence-law, S-5/B-6-filter-law,
S-7/B-5-x2-determinism. THE COMPLETION TARGET: 27 evidence-only → calibrated by
authoring dedicated mutants (each evidence-only predicate names its missing
mutant class).

### §6.8 The discharge contract (what any consumer MUST do)

1. READ the battery by predicate id; NEVER re-declare a threshold the battery
   carries (the single-declaration law — a second declaration is a fork in the law).
2. Compare via the registry's quantized semantics; a consumer-side float compare
   of a battery value re-opens D002's rejection.
3. Treat exit codes as truth over report files.
4. Respect the tiers: evidence_only predicates are recorded, never gating; born_off
   never silently armed.
5. On OracleError: fail-closed — the malformed input is the finding; never catch
   and default.
6. Pin the fingerprint: a consumer run must name the battery fingerprint it
   discharged against, or its verdict is unattributable.

### §6.9 The MathExpr language (the expression authority)

The eval authority is the ADT documented in the MPSE substrate corpus
(KB-MPSE-03, lines 239-268): arithmetic add/sub/mul/div/mod; comparisons
lt/le/gt/ge/eq/ne; boolean and/or/not; if; card/sum/max/min; member/subset/setLit;
forall/exists; prev; eventually/globally (LTL). The S-corpus authors exprs in
readable math over this vocabulary; compile enforces every expr parses to a known
BLOCK_KIND (the authoring-level totality); the oracle registry implements the
comparison semantics. Limits inherited from the substrate: depth 256, domain
10000. The KIND→ADT mapping: piecewise↔if/match, forall↔forall, exists-unique↔
exists+card, equality↔eq, inequality↔lt/le/gt/ge, recurrence↔prev, subset↔subset,
process↔process ordering.

## 7. Registries
### 7.1 THE FULL 46-PREDICATE REGISTRY (row-for-row from battery.json + d17-report.json; C=calibrated, E=evidence-only)

| # | id | kind | oracle | tier |
|---|---|---|---|---|
| 1 | S-1/B-1-side-match | piecewise | SIDE_INVERSION_VIOLATION | C |
| 2 | S-1/B-2-mirror-floor | equality | MIRROR_FLOOR_CONTRADICTED | C |
| 3 | S-1/B-3-divergence | inequality | CASCADE_DIVERGENCE_EXCEEDED | E |
| 4 | S-1/B-4-sequencing-requires | process | DESIGNATION_INCOMPLETE | E |
| 5 | S-1/B-5-consumption-forbids | subset | CASCADE_DIVERGENCE_EXCEEDED | E |
| 6 | S-1/B-6-loop-detection | recurrence | MIRROR_FLOOR_CONTRADICTED | C |
| 7 | S-2/B-1-bounded-forall | forall | DESIGNATION_INCOMPLETE | E |
| 8 | S-2/B-2-dual-sided | equality | DESIGNATION_INCOMPLETE | E |
| 9 | S-2/B-3-exists-unique | exists-unique | E3_DISOBEYED_E2 | C |
| 10 | S-2/B-4-exhaustiveness-d8 | forall | DESIGNATION_INCOMPLETE | C |
| 11 | S-2/B-5-golden-instantiation | equality | DESIGNATION_INCOMPLETE | C |
| 12 | S-3/B-1-E1-entry-lqz-near-edge | exists-unique | golden-week-discharge | C |
| 13 | S-3/B-2-E2-ss-nested-liquidity-long | inequality | d17-eu2-near-edge-row-produced | C |
| 14 | S-3/B-3-E3-rwl-bs-deep-rung | piecewise | d17-eu4-deep-silent | C |
| 15 | S-3/B-4-E4-supply-side-symmetry-short | equality | golden-week-discharge | E |
| 16 | S-3/B-5-S1-ladder-steps-sl | piecewise | golden-week-discharge | C |
| 17 | S-3/B-6-S2-operative-defense-switch | piecewise | golden-week-discharge | E |
| 18 | S-3/B-7-S3-atr-floor | inequality | d17-tolerance-drift-fire | C |
| 19 | S-3/B-8-S4-golden-sl-min | inequality | golden-week-discharge | C |
| 20 | S-3/B-9-T1-strength-driven-edge | piecewise | golden-week-discharge | C |
| 21 | S-3/B-10-T2-opposing-zone-internal-lqz | exists-unique | golden-week-discharge | E |
| 22 | S-3/B-11-T3-tp-timeframe-floor | inequality | golden-week-discharge | E |
| 23 | S-3/B-12-shape-gating | piecewise | d17-side-inversion-pair | C |
| 24 | S-4/B-1-lifecycle-recurrence | recurrence | O-0.3 | E |
| 25 | S-4/B-2-battle-count-guard | recurrence | O-0.3 | E |
| 26 | S-4/B-3-death-scope-piecewise | piecewise | O-0.3 | E |
| 27 | S-4/B-4-fortress-invariant | inequality | O-0.3 | E |
| 28 | S-4/B-5-third-mitigation-inequality | inequality | O-0.3 | C |
| 29 | S-4/B-6-broken-with-battle | piecewise | O-0.3 | E |
| 30 | S-4/B-7-shield-relation | subset | O-0.3 | E |
| 31 | S-5/B-1-floor-inequality | inequality | O-0.6 | C |
| 32 | S-5/B-2-target-statement | equality | O-0.3 | E |
| 33 | S-5/B-3-ceiling-predicate | inequality | O-0.6 | C |
| 34 | S-5/B-4-min-sl | inequality | O-0.3 | E |
| 35 | S-5/B-5-consequence-law | equality | O-0.6 | C |
| 36 | S-5/B-6-filter-law | piecewise | O-0.3 | C |
| 37 | S-6/B-1-nesting-subset | subset | O-0.3 | E |
| 38 | S-6/B-2-bom-origin-restriction | subset | O-0.3 | E |
| 39 | S-6/B-3-thirty-minute-mom-only | subset | O-0.3 | E |
| 40 | S-6/B-4-lqz-tf-mapping | subset | O-0.3 | E |
| 41 | S-6/B-5-hierarchy-authority | subset | O-0.3 | E |
| 42 | S-7/B-1-no-wall-clock | process | O-0.8 | E |
| 43 | S-7/B-2-content-hash | equality | O-0.7 | E |
| 44 | S-7/B-3-honest-data | process | O-0.3 | E |
| 45 | S-7/B-4-no-fabricated-defaults | equality | O-0.3 | E |
| 46 | S-7/B-5-x2-determinism | equality | O-0.6 | C |

Tier arithmetic: 19 C + 27 E = 46 ✓ (matches d17-report.json:3-4). Kind census:
inequality 12 · piecewise 11 · subset 8 · equality 8 · recurrence 3 · forall 2 ·
exists-unique 3 · process 2 (=46 ✓). Spec census: S-1 6 · S-2 5 · S-3 12 · S-4 7
· S-5 6 · S-6 5 · S-7 5.

### 7.2 CONSTANTS REGISTRY (all values verbatim from source)

| Constant | Value | Where | Authority |
|---|---|---|---|
| fingerprint | 8acfe74f272bf736de101e297b731cfa97c9fdd4a1684e63363489f116af7b7e | battery.json:2 = d17-report.json:2 | sha256 over ids+quotes |
| blockCount / predicateCount | 46 / 46 (1:1) | battery.json:3-4 | D008 |
| expectedSetups (f(T)) | 24 = N×(1+P) | calibrate.ts:52 | spec B.W3.4 founding formula |
| DIVERGENCE_MAX | 0.35 | calibrate.ts:53 | spec D.4 |
| RRR_FLOOR | 2.5 (D-R1 ratified) | calibrate.ts:54 | ZR-6C; tension w/ executed 3.0 recorded at S-5:7-11 |
| SL_CEILING_PIPS | 36 | calibrate.ts:55 | spec D.4 |
| GOLDEN_SL_MIN_PIPS | 4 | calibrate.ts:56 | spec D.4 |
| sanctionedTolerancePips | 3 — "the only metric" | calibrate.ts:57 | T5 |
| fxPip | 0.0001 | calibrate.ts:58 | pip quantum |
| quantize | Math.round(v/quantum), ints only | oracle-registry.ts:34-42 | D002 |
| FORM_KINDS | piecewise, forall, predicate-family, process | compile.ts:28 | file-level form |
| BLOCK_KINDS | piecewise, forall, exists-unique, equality, inequality, recurrence, subset, process | compile.ts:29-32 | block-level totality |
| verdict vocab (expect) | FIRE, SILENT, VALID, CONTRADICTED, row-produced | calibrate.ts:5 | D012 |
| fixture classes | 12 (mirror-floor…totality) | calibrate.ts:10-12 | dispatch |
| tiers | calibrated / evidence_only / flagged / born_off | d17-report.json keys | D006 |

### 7.3 FILE MANIFEST (all line counts measured this session)

| File | Lines | Role |
|---|---|---|
| specs/mpse/S-1-cascade-law.md | 55 | the cascade law (6 blocks) |
| specs/mpse/S-2-designation-totality.md | 47 | totality law (5) |
| specs/mpse/S-3-e3-anchor-rules.md | 89 | anchor doctrine (12) |
| specs/mpse/S-4-pressure-laws.md | 70 | pressure lifecycle (7) |
| specs/mpse/S-5-rrr-regime.md | 67 | RRR regime under D-R1 (6) |
| specs/mpse/S-6-telescoping-law.md | 52 | telescoping TF law (5) |
| specs/mpse/S-7-determinism-honesty.md | 57 | determinism+honesty (5) |
| specs/mpse/compile.ts | 270 | the D13 gate + battery writer |
| specs/mpse/calibrate.ts | 711 | the D17 harness |
| specs/mpse/oracle-registry.ts | 394 | 10 oracles + 2 composed |
| specs/mpse/jspec-check.ts | 79 | companion structural checker |
| specs/mpse/battery.json | 496 | compiled inventory (46) |
| specs/mpse/d17-report.json | 554 | calibration state of record |
| specs/fixtures/golden-week.json | single-line JSON | real-data oracle rows |
| specs/fixtures/mutants/mutant-1..9 | 9 files | the FIRE corpus |
| TOTAL (S-corpus + harness + artifacts) | 2,941 (wc) | the substrate |

## 8. Failure Modes
### 8.1 The compile error catalog (every refusal, verbatim class from compile.ts)

| Symptom (the throw) | Root cause | Fix | Prevention |
|---|---|---|---|
| `file not readable '<path>'` | missing/locked S-file | restore the file; never skip it | corpus integrity check before compile |
| `missing '# S-<n> — <title>' header` | header line absent/malformed | restore the em-dash header format | the format contract (§9.1) |
| `malformed header '<line>'` | regex miss (spacing, dash variant) | fix to `# S-<n> — Title` | copy an existing S-file as template |
| `missing 'spec: S-<n>' line` | spec key absent | add `spec: S-<n>` | fixed-order keys |
| `spec line 'X' disagrees with header 'Y'` | two identities in one file | reconcile; one file one spec | header/spec agreement check is the guard |
| `missing/invalid 'form:' line` | form not in FORM_KINDS | set form: piecewise\|forall\|predicate-family\|process | author from template |
| `zero '### B-…' blocks` | empty corpus file | author blocks or delete the file | 1:1 law needs blocks |
| `malformed block header` | slug regex miss | `B-<n>-<slug> — Title` | template |
| `malformed line '<t>' (want key: value…)` | stray prose inside a block | move prose OUT of blocks | blocks carry ONLY the 6 keys |
| `duplicate '<key>:' line` | same key twice in a block | merge; one value per key | duplicate refusal is the drift-catcher |
| `D13_VIOLATION … missing quote: line` | no quote key | quote the operator verbatim | no law without provenance |
| `D13_VIOLATION … empty quote` | empty or unquoted string | wrap the verbatim quote in `"…"` | D13 |
| `D13_VIOLATION … missing anchor: line` | no anchor | cite doc.md:line | D13 |
| `D13_VIOLATION … malformed anchor '<a>'` | anchor lacks `:line` | every anchor part must be doc:line | D13 |
| `missing/invalid kind:` | kind outside BLOCK_KINDS | pick from the 8 kinds | totality |

### 8.2 The oracle error catalog (oracle-registry.ts, fail-closed)

| Symptom | Root cause | Fix | Prevention |
|---|---|---|---|
| `[quantize] value: expected finite number` | NaN/∞ reached a compare | fix the PRODUCER (absent field / div-zero upstream) | fail-closed by design — never catch-and-default |
| `[quantize] quantum: expected positive` | bad quantum passed | fix the caller | oracles own their quanta |
| `[… oracle] direction: expected LONG\|SHORT` | direction parse fail | emit the closed enum | typed inputs |
| `[… oracle] zoneType: expected DEMAND\|SUPPLY` | zone type parse fail | emit the closed enum | typed inputs |
| `mirror_floor setupCount: non-negative integer` | count not an int | counts are ints by contract | count discipline |

### 8.3 The calibration failure classes (calibrate.ts + corpus history)

| Symptom | Root cause | Fix | Prevention |
|---|---|---|---|
| exit 1, `mismatch` rows in report | oracle verdict ≠ fixture expect | the predicate OR the fixture is wrong — investigate, never align by fiat | exit-code truth (D012) |
| predicate stuck evidence_only | its only fixtures are golden-week sections (no expect) | author a dedicated mutant for it | §6.7 completion target |
| `EXCLUDED_BORN_OFF` surprises | predicate with zero fixtures | author fixtures or accept exclusion explicitly | never silently armed |
| founding VALID control fails | fixture's declared expectedSetups contradicts discharge | the fixture declared a truth its own data breaks | the control is synthesized from the fixture (:19-22) |
| fallback constant fired (stderr log) | fixture missing its sanctioned value | put the value IN the fixture (D007) | fallbacks are audit-logged |
| fingerprint drift between battery and report | compile re-run between calibrate runs | re-run calibrate against the new battery; re-pin | chain of custody |

### 8.4 The historical derailments this substrate exists to prevent (the lesson ledger)

| Incident | Mechanism | The card that kills it |
|---|---|---|
| founding DXY 40+13 vs intended 24 | prose mirror rule admitted 53 outputs | S-1/B-2-mirror-floor (40→CONTRADICTED, 13→CONTRADICTED, 24→VALID) |
| side-inversion ignored (3 stacked checks) | LONG consumed supply zone | S-1/B-1-side-match (FIRE) + mutant-3/mutant-4 pair |
| duplicate re-fire cascade | same translation re-fired | S-1/B-6-loop-detection |
| RRR floor drift (1.5→1.0 eras) | constants re-declared per consumer | S-5/B-1 floor + mutant-8-rrr-drift |
| degenerate 36p+ SLs | cap arithmetic instead of defense | S-5/B-3-ceiling (36.0 SILENT / 36.4 FIRES, mutant-5) |
| tolerance split (3p shown / 2p judged) | per-gate epsilon config | quantize law + single sanctionedTolerancePips=3 (mutant-7) |
| fabricated data / proxies | fallback fabrication | S-7/B-3-honest-data + B-4-no-fabricated-defaults |
| non-deterministic reports | wall-clock/ordering | S-7/B-1-no-wall-clock + B-2-content-hash + B-5-x2 |
| price-anchored cascades | hardcoded levels | S-1 quotes: "NOTHING SHOULD BE PRICE ANCHORED EVER" |
| green harness lying | self-blessed checks | exit-code truth + tier honesty (D005/D006/D012) |

### 8.5 What is BROKEN vs WORKING right now (measured)

WORKING: compile (battery regenerates, fingerprint stable) · calibration harness
(exit semantics live) · 19 predicates calibrated incl. the founding pair · the
9-mutant corpus · determinism/honesty spine (S-7/B-5 calibrated).
BROKEN/OPEN: 27 evidence-only predicates lack synthetic mutants (§6.7 target) ·
S-5 floor tension (2.5 ratified vs 3.0 executed) is RECORDED not resolved — an
operator ruling is pending · the discharge contract (§6.8) has no standalone
consumer-side verifier yet — consumers are trusted to obey it until the trade
computer lands · golden-week.json is a single-line JSON (parseable but hostile to
diff review; reformatting would churn every fixture hash).

## 9. Appendices
### 9.1 THE S-FILE TEMPLATE (verbatim contract; copy for every new spec)

```
# S-<n> — <Title>

spec: S-<n>
form: piecewise|forall|predicate-family|process
sources: <doc>.md:<line>[, <doc>.md:<line>…]

## Blocks

### B-<n>-<slug> — <Title>
quote: "<verbatim operator doctrine>"
anchor: <doc>.md:<line>
kind: piecewise|forall|exists-unique|equality|inequality|recurrence|subset|process
expr: <the math over the ADT vocabulary>
oracle: <verdict code or fixture oracle id>
fixtures: [fixture-id[, fixture-id…]]
```

Rules: fixed key order · one quote per block (dupe = refusal) · every anchor part
doc:line · blocks split ONLY on `### ` · no prose inside blocks (malformed-line
refusal) · header spec must equal spec: line.

### 9.2 THE ORACLE INVENTORY (dispatch by fixture `class`)

| class → oracle fn | semantics | verdicts |
|---|---|---|
| mirror-floor → mirror_floor | actual===expected → VALID else CONTRADICTED (both over and under) | VALID/CONTRADICTED |
| side-inversion → side_match | LONG∧DEMAND / SHORT∧SUPPLY → SILENT else FIRE | FIRE/SILENT |
| divergence / tolerance-drift → divergence_le | quantized value ≤ bound → SILENT else FIRE | FIRE/SILENT |
| totality → totality_forall | ∀(day,dir) ∃! designation | row/CONTRADICTED |
| rrr-drift → rrr_floor | quantized rrr ≥ floor | FIRE/SILENT |
| tp-cap → sl_ceiling | pips ≤ ceiling (36.0 silent, 36.4 fires) | FIRE/SILENT |
| sl-min → sl_min | pips ≥ 4 | FIRE/SILENT |
| containment → containment_subset | inputs ⊆ authorized set | FIRE/SILENT |
| tf-restriction → tf_restriction | origin TF in allowed set (BoM 4H/1H only…) | FIRE/SILENT |
| wall-clock → no_wall_clock | decisions wall-clock-free | FIRE/SILENT |
| shape-gate → shape_gate (composed) | shape-conditioned entry rules | row/CONTRADICTED |
| near-edge → near_edge (composed) | entry at zone edge within tolerance | row/CONTRADICTED |

### 9.3 DOCTRINE QUOTES (verbatim, from the S-corpus — the law, never paraphrased)

- "NOTHING SHOULD BE PRICE ANCHORED EVER. THIS IS THE EXACT HARDCODED DEGENERATE
  GARBAGE THAT IS FORBIDDEN. NEEDS TO BE ZONE ANCHORED." (S-1/B-1, anchor
  PLUTUS_V5_FULL_BUILD_SPEC.md:2002)
- "PROPERLY TANGIBLY LEGIT BASED ON MACRO CONCEPTS AND MECHANICS NOT STUPID
  FUCKING HARDCODED PRICE GARBAGE" (S-1/B-2, :2017)
- "the GU's E2 chain is LITERALLY the EU's — THERE SHOULD BE 0 DIVERGENCE AT
  THIS LEVEL." (S-1/B-3 + B-5, :2004)
- "E2 designates, E3 obeys" (S-1/B-6, :59)
- "RRR ≥ 2.5 (floor) / 4R+ (target)" (S-5/B-1, :1341)
- "anything that is 2.5 RR or above is valid as long as it is high probability.
  However the TARGET is always 4R+ i dont want the machine optimizing everything
  for low R just to pass the filter" (S-5/B-2, .trident/wave-plan.md:10)
- "GATE: classifyAggregate fires when total pos > total neg AND RRR ≥ 2.5"
  (S-5/B-6, :861)
- "E3 is a natural RESULT we ARRIVE AT from E1 + 2 being done properly... 90% of
  the work is in E1 + E2" (S-5/B-5, :2005)
- "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE" (executed expectation, recorded in
  the S-5 D-R1 header — held in tension, not substituted)

### 9.4 COMMAND REFERENCE (copy-pasteable, zero deps)

```
bun specs/mpse/compile.ts                 # gate path: compile S-*.md → battery.json
bun specs/mpse/compile.ts S-1-cascade-law.md --out /tmp/b.json   # selftest path
bun specs/mpse/calibrate.ts               # D17: battery+fixtures → d17-report.json
bun specs/mpse/calibrate.ts --battery <p> --fixtures <dir> --out <p>
```
Exit contract: 0 = success (battery written / all calibrated-or-born-off);
1 = LOUD named failure. No other exit states exist.

### 9.5 THE EXPRESSION VOCABULARY (authoring ↔ eval mapping)

| authoring kind | ADT tags (substrate) | example shape |
|---|---|---|
| inequality | lt/le/gt/ge + quantize | q(rrr) >= q(2.5) |
| equality | eq + quantize | actual === expected → VALID |
| piecewise | if / CASE-match | LONG→demand ONLY; violation→FIRE |
| forall | forall over rows | ∀(day,dir) ∃! designation |
| exists-unique | exists + card==1 | the near-edge entry rule |
| recurrence | prev / stateₙ₊₁=f(stateₙ) | lifecycle + loop-detection |
| subset | subset/member | GU inputs ⊆ ACTIVE-EU mirrors |
| process | ordering/requires | EU designated AFTER DXY-inverse exists |

## 10. Iron Laws
1. ALWAYS express a trading law as a card BEFORE enforcing code. A prose-only
   law is unspecified entropy — the founding 40+13-vs-24 derailment is the proof.
   Violation consequence: the law admits outputs you never intended.
2. NEVER omit the quote or the doc:line anchor. compile refuses (D13_VIOLATION,
   exit 1). Violation consequence: an unattributable threshold is magic, and magic
   drifts.
3. ALWAYS quantize before compare — Math.round(v/quantum), integers only. NEVER
   float-compare a battery value. Violation consequence: ordering flaps and the
   2p/3p tolerance-split class returns.
4. NEVER re-declare a constant the battery carries. One declaration, one
   fingerprint. Violation consequence: two "RRR floors" — one already wrong.
5. ALWAYS fail closed: malformed input throws; a crashing predicate counts
   AGAINST. NEVER catch-and-default. Violation consequence: a false green.
6. NEVER treat an unexercised predicate as live. evidence_only records; born_off
   excludes; only calibrated gates. Violation consequence: dead weight reported
   as coverage.
7. ALWAYS let exit codes speak over report files. Files go stale; exits cannot.
   Violation consequence: a stale d17 report blessing a regressed battery.
8. ALWAYS pin the fingerprint in any consumer run. Violation consequence: an
   unattributable verdict.
9. ALWAYS carry the count invariant: blockCount === predicateCount, and any
   set-producing rule carries a cardinality predicate. Violation consequence:
   silent dropouts and the /6-vs-/5 denominator drift.
10. ALWAYS record doctrinal tension explicitly (the D-R1 pattern), NEVER resolve
    it silently by picking a side in code. Violation consequence: the executed
    expectation overwrites the ratified build constant without authority.
11. NEVER let golden levels become inputs. They are validation anchors; a read
    path from the pipeline to golden constants is the hardcode derailment.
    Violation consequence: a fixture-fitted machine that fails on any other week.
12. ALWAYS keep the harness dependency-free (node builtins only). Violation
    consequence: the law is hostage to tooling churn.
13. NEVER extend the block vocabulary without a corpus-wide compile. The 8 kinds
    are the totality; a new kind is a spec event, not an edit. Violation
    consequence: unparsable corpus, split batteries.
14. ALWAYS author the mutant when promoting evidence-only → calibrated. The
    mutant IS the proof the detector fires. Violation consequence: a "promotion"
    that is paperwork.

## 11. Conclusion and Compaction Recovery Guide
### Read this first after context loss.

WHAT THIS SYSTEM IS (one paragraph): a standalone, dependency-free predicate
substrate that converts the operator's trading doctrine into 46 dischargeable
MathExpr cards (S-1..S-7), compiles them under a mechanical quote-law gate
(D13) into battery.json (fingerprint 8acfe74f…, 46/46), implements typed oracles
with pip-quantized integer compares and fail-closed semantics, and calibrates
every predicate against a 9-mutant + golden-week fixture corpus into
d17-report.json (19 calibrated / 27 evidence-only / 0 flagged / 0 born-off).
It runs under `bun` with two commands and nothing else.

RECOVERY CHECKLIST (execute in order):
1. `cd` into the project; confirm the corpus exists: `ls specs/mpse/S-*.md`
   (expect 7 files, 437L total).
2. Regenerate + verify identity: `bun specs/mpse/compile.ts` → exit 0, and the
   battery.json fingerprint must equal 8acfe74f272bf736de101e297b731cfa97c9fdd
   4a1684e63363489f116af7b7e — if it DIFFERS, the corpus was edited: diff the
   S-files before trusting anything downstream.
3. `bun specs/mpse/calibrate.ts` → exit 0 expected; open d17-report.json:
   calibrated count must be ≥19, flagged must be [] — a non-empty flagged list
   means a regression, exit 1 already told you.
4. Read §7.1 (the 46-row registry) for the per-predicate state; read §8.5 for
   the current broken-vs-working ledger.
5. Any new work: author cards per §9.1, promote per Iron Law 14, never re-declare
   constants (Law 4), never float-compare (Law 3).

KEY FACTS RESTATED: fingerprint 8acfe74f… · 46/46 · 19C+27E+0F+0B · sanctioned
tolerance 3 pips (the ONLY metric) · RRR floor 2.5 ratified / 3.0 executed
(tension RECORDED at S-5:7-11, ruling pending) · SL ceiling 36 / min 4 ·
f(T)=24 founding formula · quantize-then-compare everywhere · exit codes are
truth · the substrate depends on NOTHING and waits for NO ONE.

### §6.10 THE COMPLETE ORACLE WALKTHROUGH (every surface, first-hand, oracle-registry.ts:121-393)

The DECLARED-TRUTH PATTERN: most oracles accept multiple input shapes so the
fixture can declare its own sanctioned values rather than lean on harness
constants — the mechanical form of decision D007. Every oracle below is a pure
function; every numeric path quantizes before compare; every malformed input
throws OracleError naming the oracle and field.

1. totality_forall (:124-153). Two shapes: {actual, expected} direct, or
   {designationCount, days, pairs, directions} with expected computed as
   days×pairs×directions (positive integers enforced per-field :142-146).
   VALID iff actual===expected else CONTRADICTED. The 90-row designation
   totality (5×3×2) rides this oracle (spec B.W3.5).
2. rrr_floor (:155-182). THREE shapes: {rrr, floor} carried; {entry, sl, tp,
   floor} computed — risk=|entry−sl| with a zero-risk THROW ("zero risk
   distance — entry equals SL", :175) and rrr=|tp−entry|/risk; and
   {claimedFloor, sanctionedFloor} — the drift detector (mutant-8): a consumer
   claiming a floor BELOW the sanctioned one FIRES. Compare at quantum 1e-9.
3. sl_ceiling (:184-209). THREE shapes: {widthPips, ceilingPips};
   {entry, sl, pip, ceilingPips} — width=|quantize(entry,pip)−quantize(sl,pip)|;
   {riskPips, slCeilingPips} — the mutant-5 calibration shape (36.4 vs 36).
   Compare at quantum 0.1. FIRE iff width exceeds ceiling.
4. sl_min (:211-231). Two shapes; same quantize-at-0.1 semantics; FIRE iff
   width tighter than min (4p golden floor).
5. containment_subset (:233-273). Bands {floor, ceiling} with INVERTED-BAND
   refusal (floor>ceiling throws, :251-253); inner⊆outer SILENT else FIRE;
   entry-within-rung sugar {entry, rung, top} builds the outer band from
   min/max (:262-266). All four edges pip-quantized. Serves S-6 telescoping
   (LQZ nesting) and the paper-anchor containment checks.
6. tf_restriction (:275-289). Closed-set membership: timeframe ∈ allowed[]
   (upper-cased, non-empty enforced) else FIRE. Serves "LQZ detection NEVER on
   4H" (doctrine register #8, comment :276) and BoM-origin restrictions.
7. no_wall_clock (:291-325). The determinism detector: bounded-depth (10),
   cycle-safe traversal (seen-set :305-313) over the record; WALL_CLOCK_KEYS
   squashed-key set {timestamp, wallclock, datetime, date, createdat, now,
   epochms, clocktime, generatedat, runat, …} (:296-300); any hit → FIRE.
   Content hashes / session ids / analysis-point constants are NOT in the set —
   SILENT (comment :292-294).
8. divergence_le (:108-122). Generic ceiling: quantized value>bound → FIRE.
   Default quantum 1e-9; pips use quantum 1. Serves DIVERGENCE_MAX 0.35 and
   the 3p sanctioned tolerance (mutant-7).
9. mirror_floor (:75-93) and side_match (:95-106) — documented in §6.4 above.
10. Composed shape_gate (:327-340): side-consistency core over nature-declared
   zone class (mutant-6: the EU #4 deep rung is a LEGAL deep demand entry →
   SILENT; a SHORT claiming deep demand → FIRE).
11. Composed near_edge (:342-379): ROW iff entry within [min(rung,top),
   max(rung,top)] pip-quantized; DECLARED-DELTA cross-check throws when
   |computed−declared|>0.05 (:363-372) — the fixture cannot lie about its own
   delta; expectedEntry mismatch → CONTRADICTED (mutant-9: rung 1.14100, top
   1.14120, Δ1.0p).
12. ORACLES export (:381-392): the frozen ten as a const record — the registry
   surface every dispatcher imports.

### §9.6 FIXTURE ANATOMY (the evidence record, verbatim)

A mutant is a single-line JSON record (measured, mutant-1-40setup.json):
{class, data{day, expectedSetups, setupCount}, description, expect,
predicateTargets} — verbatim example:
`{"class":"mirror-floor","data":{"day":"Tuesday","expectedSetups":24,
"setupCount":40},"description":"The Tuesday D2 overgeneration: the NL mirror
rule admitted many readings and produced 40 setups against the f(T)=N x (1+P)=24
truth (spec D.2 mutant 1; wave-plan O-0.6).","expect":"CONTRADICTED",
"id":"mirror-floor-40","predicateTargets":["mirror-floor"]}`
Read: the class selects the oracle dispatch (§9.2); data carries the SANCTIONED
truth (expectedSetups 24 — the founding formula, declared IN the fixture);
expect names the required verdict; predicateTargets routes the record to its
predicates; the description cites the incident class it reproduces. The
expectedSetups field is exactly what the founding VALID control reads
(calibrate.ts:19-22) — the fixture is self-certifying, the harness certifies
nothing from its own literals.

### §9.7 THE THREE-SHAPE LAW (why oracles accept variant inputs)

Every multi-shape oracle exists for the same reason: the CHECKER must meet the
CHECKED where it lives. A live pipeline emits {entry, sl, tp}; a calibration
mutant carries {riskPips, slCeilingPips}; a drift probe carries
{claimedFloor, sanctionedFloor}. One oracle, three doors — but ONE quantized
comparison behind all of them. Adding a fourth shape is a spec event (Iron Law
13 applies to oracle surfaces as well as block kinds).

## 12. SECTION 2 — META ANALYSIS: EXTERNAL-KERNEL ENHANCEMENT PROPOSALS
> FENCE: everything above this line is SECTION 1 — the pure-Plutus bible, zero
> external-runtime references. Everything below is SECTION 2 — the operator-
> ordered meta-analysis, where the external kernel architecture (the JSON-card
> kernel system absorbed in this session's waves: card→compile→dataflow-cast→
> hash-chained journal→receipt, frozen refusal tokens, tier discipline, trading
> profile with math-eval/oracle-gate/circuit-breaker/evidence-gate kinds) is
> compared AGAINST Section 1 to propose enhancements. Adopt patterns, not
> dependencies — every proposal below must preserve Iron Law 12 (zero-dep).

### E1 — Hash-chained discharge journal (from: the journal chain law)
SECTION 1 TODAY: chain of custody is the fingerprint link between battery.json:2
and d17-report.json:2 — file-to-file, declarative (§6.3, §6.7, §6.8 item 6).
THE MECHANISM: the kernel's journal — canonicalSerialize (sorted keys, skip
self+ts) + self = hash(payload + \0 + prev) + verifyChain recomputing all rows;
two rows per adjudication (invoke + verdict).
THE ENHANCEMENT: every calibrate/discharge run appends per-predicate
invoke+verdict rows to a persistent chain; "pin the fingerprint" becomes
cryptographic (chainVerified) instead of declarative. Any past verdict replayable.
COST/RISK: a vendored ~60-line node:crypto-only journal module — D009 preserved.

### E2 — Idempotent run identity (from: runId = hash(docHash:seed))
TODAY: re-running calibrate re-executes and rewrites; identity is the battery
fingerprint alone (§6.6).
MECHANISM: the kernel's runId = hash(docHash + \0 + seed)[0:16] with
restore-or-start: same battery+fixtures+seed → same run; existing rows → verify →
replay receipt invoked:0.
ENHANCEMENT: calibration runs become replayable by identity — an auditor asks
"what did run X conclude?" and gets the chain, not a re-execution. Structural
support for S-7/B-5-x2-determinism beyond byte-equality of two fresh runs.
COST: seed plumbing through the CLI.

### E3 — Two-tier refusal vs verdict (from: the frozen 8-token discipline)
TODAY: refusals are exception classes (CompileError/OracleError) and exit 1
lumps "law malformed" with "law violated" (§8.1-8.3, D012).
MECHANISM: the kernel separates refusal (exit 2, token + remedy, ZERO artifacts)
from runtime fail (exit 1, verdict with delta) — "refuse-before-spend".
ENHANCEMENT: compile/calibrate gain exit 2 for malformed corpus/fixtures (never
ran) vs exit 1 for verdict mismatches (ran, found). Consumers distinguish "the
law is broken" from "the law was violated". Machine-parsable refusal codes.
COST: an error-code registry; small.

### E4 — Cards as executable assertion units (from: the guard-card pattern)
TODAY: §8.5 names the gap — "the discharge contract has no standalone
consumer-side verifier; consumers are trusted to obey §6.8".
MECHANISM: the kernel's algorithm cards are RUNNABLE law: {meta, nodes, edges,
asserts {path,op,value}, sink}, with vias naming upstream output fields, plus a
7-leg proof harness (structure/validate/run/CLI-cast/negative/mutation/adversarial).
ENHANCEMENT: compile emits, per S-block, an executable assertion unit (load
fixture → invoke oracle fn → assert verdict vs expect → journal row); the
battery becomes not just an inventory but a runnable proof, and §6.8 stops being
trust and becomes machinery. The 7-leg harness becomes the promotion gate for
Iron Law 14 (evidence-only → calibrated).
COST: the largest change — an emit step (S-corpus stays the source of truth;
compiled units are artifacts under the fingerprint). Preserve D008 (1:1) by
emitting exactly one unit per block.

### E5 — Tier enforcement of Iron Law 6 (from: tier discipline)
MECHANISM: the kernel's cross-constraint audits (tier-1 ⟹ no generation kinds;
bracket required for tier-2) are compile-time refusals, not conventions.
ENHANCEMENT: the battery carries tier per predicate (calibrated = gating tier;
evidence_only = recorded tier) and compile/calibrate REFUSE a gating-tier
consumer that references a non-calibrated predicate — Law 6 becomes mechanical.
COST: a tier field + one check.

### E6 — Explicit verdict rollup (from: FAIL > INCONCLUSIVE > PASS)
TODAY: per-predicate verdicts listed; exit is all-or-nothing (§6.6, D012).
MECHANISM: the kernel's rollup: any FAIL → FAIL; else any INCONCLUSIVE →
INCONCLUSIVE; else PASS.
ENHANCEMENT: whole-battery discharge returns ONE verdict under the
strictest-wins order — FAIL (a mutant missed) > INCONCLUSIVE (evidence-only
present) > PASS. Matches the tier honesty of D006 instead of collapsing it.
COST: small; calibrate nearly implements it.

### E7 — Bounded execution caps (from: the caps pre-check law)
MECHANISM: the kernel checks caps per batch BEFORE firing; unbound → whole-run
refusal, never a half-run.
ENHANCEMENT: batch calibration refuses up-front (fixture-count cap, per-predicate
time budget) rather than partially discharging — kills partial-report ambiguity.
COST: small.

### E8 — Defect lessons the kernel corpus already paid for
(a) Unconditional outbound writes on FAIL (the kernel's known open defect):
adopt the INVERSE — evidence rows for failed discharges must be explicitly
verdict-gated sections, never ambient. (b) The silent-refusal trio (errors that
landed only in a log): calibrate's stderr fallback-use logging (§8.3) must ALSO
surface in the report JSON (a lastError field) — no refusal is ever log-only.
COST: small; both are hardening of §8.

### E9 — Cast receipts (from: the CastRecord birth certificate)
MECHANISM: {name, verdict, batches, journalRowCount, chainVerified, durationMs}
+ content-addressed manifest per run.
ENHANCEMENT: every calibrate run emits a receipt into a run manifest — the run
registry §6.8 wants; with E1+E2, receipts are chain-verified and idempotent.
COST: small.

### E10 — The circuit breaker (from: the trading profile's risk kind)
MECHANISM: CLOSED/OPEN/HALF_OPEN per-key store; threshold 3; OPEN blocks
downstream without invoking; bracket repair 1, floor 0.6.
ENHANCEMENT: an operational risk-kill for the calibration loop itself — N
consecutive exit-1 runs on the same fingerprint → OPEN → block live promotion of
anything from that battery until human reset. Protects against a broken fixture
silently poisoning repeated runs.
COST: one small module; optional but cheap insurance.

### ADOPTION ORDER + THE STANDING CAVEAT
Adopt first: E8 (quick hardening) → E3 + E6 (verdict/refusal tiers) → E1 + E2 +
E9 (the journal spine) → E5 (tier law) → E4 (the structural upgrade, its own
wave) → E7 + E10 (bounds + breaker). CAVEAT, recorded honestly: the kernel
corpus carries its own known defects (the outbound-writes defect, the silent
refusals, a spec-vs-code divergence in its compiler layer) — adopt the PATTERNS
as specified, never an import; Iron Law 12 (zero-dep) governs every proposal,
and each vendored module is node-builtin-only by contract.

<!-- completion anchor: none remaining -->


---

## §12B — SECTION 2 CONTINUED: THE MPSE CIRCUIT (the full deep-research, 2026-09-12)

> Operator thesis, adopted verbatim: "MPSE can become embedded nodes on a JESL
> card… we can take the exact same circuit design that created aether computer
> chips and we can compress the same architecture into a digital microprocessor —
> runs on the JESL Card itself and the microcomponent is MPSE… instead of aether
> agent meta layers we have MathExpr cards and a whole suite of MPSE Gate
> Architecture functioning the same at the micro level as the aether gates do on
> the macro circuit. these MPSE Circuits can be Embedded Logic systems on the
> JESL card itself just like the Aether Circuits are Embedded Agent systems on
> the JESL Kernel."

### 12B.1 THE DOCTRINE FOUND (the chip-mask spec, first-hand)

The v3 master kernel spec IS the digital-hardware doctrine: "THE CHIP MASK SET"
(title, v3:1); the operator's founding framing verbatim at v3:54 — "the effect
program structure is electricity, the aether machine is intelligence nodes —
design the circuit board. the code audit chip is gen 1." The electricity map
(v3:75): Layers = power rails · Fibers = clocked signal paths · Context tags =
the bus · Channels = traces · the registry = pin mux · ONE runPromise edge = the
single clock tree · the journal = the die's execution trace. The intelligence
map (v3:76): each Aether subsystem "becomes a NodeImpl block on the die — plain
logic behind an Effect-typed pin contract". The separation law (v3:77): the die
never contains a model; intelligence nodes never touch the rails. The die
already names block [D] DETERMINISTIC ALU — "COMBINATIONAL — no LLM, no clock"
(v3:88-99) — the MPSE Circuit is that ALU's gate-level realization. Fusion, not
inheritance (v3:73) — and the Aether formal embedding statement already lives in
the tree: "Aether_Machine_Boilerplate (Embedded_Agent_Systems…) EMBEDDED inside
the JESL Master Kernel" (.trident/wave-spec.json:20).

### 12B.2 THE MACRO↔MICRO CORRESPONDENCE (the compression law)

The operator's compression thesis, made exact — every Aether macro block has an
MPSE micro-gate realization, and the SEMANTICS ARE IDENTICAL at both levels
because both ride the same executor:

| Aether macro (embedded AGENT system) | MPSE micro (embedded LOGIC system) | Shared semantic (the executor gives both) |
|---|---|---|
| MetaGate: N workers × 1 meta adjudication (meta-gate.ts:83, allSettled + stagger) | mpse-oracle array: N predicates × 1 discharge rollup | allSettled batches — a failing worker/oracle NEVER kills siblings (executor.ts:179-211,224) |
| Worker micro-loop FSM (xstate v5, 498L) | mpse-gate chain (assert → next gate ready) | readiness = inbound ⊆ written — the state advance is the dataflow (executor.ts:147-155) |
| FINDING grammar adjudication (UPHELD/OVERTURNED/UNCLEAR) | DischargeStatus (PASS/FAIL/CONTRADICTED/UNVERIFIABLE/EXCLUDED) | verdict-from-rows, never prose (jesl-run.ts:46-64) |
| god-loop PLL (maxCycles 50, scoreTarget 96) | breaker feedback (3×exit-1 → OPEN) + calibration yield gate | quality loop K feeds back into D/E (v3:85-99) |
| rpm ledger / key pool (EXILE_MS 45s) | caps pre-check (CAP-UNBOUND, refuse-before-spend) | budget/rail discipline, loud on exhaustion |
| report-writer rail (Bearer, 15×3s retry, GENERATION_FAILED) | bracket LLM slots (repair ≤2, floor 0.85) — the ONLY rail touch | the model NEVER lives on the die (v3:77) |
| journal = the die's execution trace (macro) | SAME hash chain, namespaced runId parent:wf:node:depth | sub-cast rows land in the parent chain (workflow-machine.ts:91, executor.ts:107-134) |

### 12B.3 THE TWO EMBEDDING SHAPES (both exist today, verified)

SHAPE A — MPSE NODES AS FIRST-CLASS KINDS (flat microfabric): register
{mpse-gate, mpse-compute, mpse-oracle, mpse-quantize, mpse-mux} in ALL_KINDS
(append-only, registry.ts:34-73), impl via replaceStubSync (the
mpse-discharge.ts:149 precedent — a decision-family node ALREADY proves the
composition), requiredCaps: [] (pure tier-1; the cap machinery is bypassed
entirely, executor.ts:159-178). The 46 battery predicates become 46 gate nodes
on the parent card; vias route pip-quantized records between them.

SHAPE B — THE MICROPROCESSOR (the compressed chip ON the card): one
workflow-machine node whose config.doc carries the ENTIRE MPSE circuit
(config is Schema.Unknown — the sub-workflow rides inside config.workflow /
config.doc, workflow-machine.ts:27-35). Registry-truth child resolution (D27 —
no pass-through), depth cap 3, caps inherit ONE-WAY (a sub-cast never gains
what the card lacked, :99), budget flows down or defaults {600s, 15 firing}
(:101), worst-wins rollup FAIL>INCONCLUSIVE>PASS (:130-135), journal coverage
TOTAL — every micro-gate's invoke+verdict rows land in the parent's hash chain.
THIS is the literal "digital microprocessor running on the JESL card": the
macro card sees ONE node; the die trace sees every micro-gate.

### 12B.4 WHAT THE RUNTIME GIVES FREE vs WHAT GETS BUILT (measured, executor-anchored)

FREE (zero runtime code): 15-wide concurrent batches · per-node Effect.exit
isolation · invoke+verdict journal rows sha256-chained · Triplet
{pattern,state,anchor} plumbing (MPSE provenance maps 1:1 onto anchor) ·
per-node timing · verdict rollup from rows · JeslRun idempotency (docHash:seed,
covers() replay, invoked:0) · via-channel routing + {ok:1} defaults · pre-fire
schema gate (unknown kind/cycle/dangling edge) · tier-1 determinism · durable
ask (if an oracle ever needs a human).

BUILD: 5 node impls (the mpse family, mpse-discharge.ts:70-147 as the template)
· 5 ALL_KINDS rows · the registration wiring (module-bottom or the
nodes/index.ts:81-105 single wiring authority) · profiles/mpse.ts DomainModule
{name:"mpse", caps:[], kinds:[…], defaultTier:1, brackets:{}} · the circuit
compilers (battery.json → circuit doc; the E4 emit) · tests (readiness/rollup/
concurrency incl. one FAIL oracle beside PASS siblings). NOT needed: any
executor/channels/journal/caps change. ONE TRAP: requiredCaps must stay [] (or
the cap joins boundCapsFor — handlers.ts:94-98 — else the whole run dies
pre-fire, executor.ts:167-174).

### 12B.5 THE MPSE CIRCUIT CARD (the artifact shape)

```json
{ "meta": { "name": "mpse-rrr-floor", "tier": 1,
    "description": "the RRR floor discharge circuit — 46-battery predicate S-5/B-1" },
  "nodes": [
    { "id": "load", "type": "file-io", "class": "execution" },
    { "id": "q", "type": "mpse-quantize", "class": "deterministic" },
    { "id": "alu", "type": "mpse-compute", "class": "deterministic" },
    { "id": "discharge", "type": "mpse-oracle", "class": "deterministic" },
    { "id": "sink", "type": "journal-sink", "class": "evidence" } ],
  "edges": [
    { "from": "load", "to": "q", "via": "fixture" },
    { "from": "q", "to": "alu", "via": "quantized" },
    { "from": "alu", "to": "discharge", "via": "rrr" },
    { "from": "discharge", "to": "sink", "via": "verdict" } ] }
```
Embedded on a parent tier-2 card as one workflow-machine node (Shape B), or
flattened onto it (Shape A). Fixtures = golden-week.json (SILENT) + the 9
mutants (FIRE) — v3 LAW 3: "test vectors are manufactured, never canned".

### 12B.6 THE VERDICT OF THE RESEARCH

The operator's thesis is not an analogy — it is the v3 die architecture applied
one level down. The Aether embedding (agents as NodeImpl blocks behind pin
contracts) and the MPSE embedding (oracles as NodeImpl blocks behind pin
contracts) are THE SAME MECHANISM at different altitudes: intelligence rides
nodes at the macro level, law rides nodes at the micro level, and both run on
one electricity (the Effect substrate) under one clock (runProgram), one journal
(the chain), one separation law (no model on the die; no float without
tolerance on the gates). The full presentation artifact:
reports/MPSE_Circuit_ShowMe.md (BLUEPRINT spine).

---

## §12C — SECTION 3: THE FULL CIRCUIT→KERNEL→REPORT FLOW (2026-09-12, preserved verbatim per the operator order)

# THE MPSE CIRCUIT → THE TRADE COMPUTER KERNEL → THE LEVIATHAN REPORT

**SPINE: EXPLAIN.** Summary: the MPSE Circuit is a tier-1 logic die embedded inside one node of a JESL card (bible §12B, Shape B); that card enters the Plutus Trade Computer Kernel (built: `src/kernel/`, 2,962L w/ tests), where `card-loader` validates the E1/E2 card, five meta-layers (L1 telescope → L2 pressure → L3 fib → L4 cascade → L5 TI-graph) each stamp a typed verdict per setup, `trade-computer` fuses them into TradeProjections with full provenance, `report-model/rules/render` enforce the 52 Leviathan rules over 25+5 sections, and the journal seals the causal chain harvest→report. What it PRODUCES: a vetted Leviathan Trading Report PDF whose every number traces to a card anchor and every rule check to a severity.

## 1 · The MPSE Circuit inside the JESL card (Shape B embed)

```
┌────────────────────────────────────────────────────────┐
│ JESL CARD plutus-trade-compute · tier 2                │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ EMBEDDED MPSE CIRCUIT (tier 1, the die)      │     │
│  │ load → mpse-quantize → mpse-compute          │     │
│  │   → mpse-oracle → journal-sink               │     │
│  │ fixtures: golden-week + 9 mutants            │     │
│  │ verdicts → PARENT hash chain                 │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│ the macro card sees ONE node; the die trace            │
│ sees every micro-gate (runId parent:wf:node:depth)     │
└────────────────────────────────────────────────────────┘
```

Mechanism (workflow-machine.ts:27-45, 87-101): the circuit rides inside `config.doc`; child kinds resolve registry-truth (D27); caps inherit one-way; depth ≤3; every micro-gate's invoke+verdict row lands in the parent's sha256 chain. The gates themselves: `mpse-quantize` (int buckets, oracle-registry.ts:34-42), `mpse-compute` (the 28-tag MathExpr ALU), `mpse-oracle` (discharge vs expected — FAIL carries the delta). The circuit's output channel feeds the card's next macro node.

## 2 · The card enters the Trade Computer Kernel

```
┌──────────────────────────────────────────────────────┐
│ PLUTUS CARD (E1 zones + E2 designations + the        │
│ MPSE discharge verdicts)                             │
└──────────────────────────────────────────────────────┘
   │
   ▼  card-loader.ts (schema+provenance gate)
┌──────────────────────────────────────────────────────┐
│ L1 TELESCOPE  l1-telescope.ts — zone WHERE          │
├──────────────────────────────────────────────────────┤
│ L2 PRESSURE   l2-pressure.ts — fortress 4+,         │
│               phantom ALL-4, lifecycle state        │
├──────────────────────────────────────────────────────┤
│ L3 FIB        l3-fib.ts — 1.272 / 1.618 / 2.618     │
│               spiderweb rungs                        │
├──────────────────────────────────────────────────────┤
│ L4 CASCADE    l4-cascade.ts — no DXY inverse =      │
│               CASCADE_NO_INVERSE FAIL, loud;        │
│               GU reads ACTIVE EU mirrors only       │
├──────────────────────────────────────────────────────┤
│ L5 TI-GRAPH   l5-ti-graph.ts — macro structural     │
│               grading score (not arithmetic)        │
└──────────────────────────────────────────────────────┘
   │
   ▼  trade-computer.ts:301L, RRR_FLOOR 2.5 (:13)
┌──────────────────────────────────────────────────────┐
│ TRADE-COMPUTE — fuses L1..L5 verdicts into           │
│ TradeProjection{E, SL, TP, RRR} + provenance{        │
│ cardSetupId, cardZoneId, cardDesignationId,          │
│ l1TelescopeZoneId, l4DxyInverseZoneId, l5Score}      │
└──────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────┐
│ REPORT: model(sections) → rules(52) → render         │
│ journal.ts seals harvest→report causal chain         │
└──────────────────────────────────────────────────────┘
```

## 3 · Runtime trace — one EU trade becoming a Leviathan page

```
TIMELINE (context converging):
┌──────────────────────────────────────────────┐
│ E1 zone map + E2 designation (card) + MPSE   │
│ discharge: SILENT on EU #1 RRR 3.18 (floor   │
│ 2.5, quantized compare) — the quiet case     │
└──────────────────────────────────────────────┘
```

```
STEP 1-2: LOAD + L1/L2
┌──────────────────────────────────────────────┐
│ card-loader: schema valid, provenance set    │
│ L1 telescope: entry zone = 1H UM demand     │
│   1.14145-1.14000 → telescope verdict        │
│ L2 pressure: zone ACTIVE-1, no fortress     │
│   conflict → pressure verdict                │
└───────────────┬──────────────────────────────┘
STEP 3-5: L3/L4/L5 + COMPUTE
┌──────────────────────────────────────────────┐
│ L3 fib: no spiderweb rung in reach → N/A     │
│   verdict (fib is reinforcement-only)        │
│ L4 cascade: DXY inverse EXISTS (Tue BS       │
│   short ↔ EU long); GU lane untouched        │
│ L5 TI-graph: score 8/14 pillars              │
│ trade-computer: E=1.14110 SL=1.13990         │
│   TP=1.14460 → RRR 2.92 ≥ 2.5 floor PASS     │
│   provenance: every id real, from the card   │
└───────────────┬──────────────────────────────┘
```

```
ROUTING (the report gates, evaluation shown):
┌──────────────────────────────────────────────┐
│ Q: RRR ≥ floor? 2.92 vs 2.5 → PASS          │
│ Q: provenance total? cardZoneId +            │
│   designationId + l1/l4 ids all non-null     │
│   → PASS (paper-anchor ban held)             │
│ Q: section contract? 25+5 sections present,  │
│   ids 1..30 in order → PASS                  │
│ → projection ADMITTED to the report model    │
└──────────────────────────────────────────────┘
```

```
DELIVERY:
┌──────────────────────────────────────────────┐
│ report-render: the 52 Leviathan rules run —  │
│   rule 8: prices 4dp; rule 9: EVERY cell     │
│   TA_CENTER (CRITICAL); rule 10: table       │
│   width ≤ 6.55in; rule 1: K-factor audit     │
│   trail in Section 1 … → PDF emitted         │
│ journal.ts: causal row harvest→report,       │
│   replayable by causationId                  │
└──────────────────────────────────────────────┘
```

```
OBSERVER (the loud case — the gates prove teeth):
┌──────────────────────────────────────────────┐
│ A DXY-inverse-less trade would FAIL at L4:   │
│ "trade '<id>' (EUR/USD LONG) has no DXY      │
│ SHORT inverse — layer FAILS" (l4-cascade     │
│ :151) — the projection NEVER reaches the     │
│ report; the journal row records WHY.         │
└──────────────────────────────────────────────┘
```

## 4 · The numbers (measured this session)

```
src/kernel/: 12 source files + 9 test files = 2,962L total
trade-computer.ts 301L (RRR_FLOOR 2.5 at :13)
report-rules.ts 158L (52 REPORT_RULES; rule 9 CRITICAL)
report-render.ts 236L · report-model.ts 105L
l4-cascade.ts 174L (CASCADE_NO_INVERSE law :6-7)
mpse substrate: battery 46/46 fp 8acfe74f…, 19C/27E
Leviathan template: 25 sections + 5 trade sections (26-30), per V5 W6
```

## 5 · Open gaps

1. The MPSE-Circuit-as-nodes (§12B Shape A/B) is designed, not built — today the substrate discharges via the standalone harness; the embed is the L2 wave on GO. 2. `report-render` emits the model; the Leviathan PDF path (python-template port) is the V5 W6 decision recorded as TS-ported. 3. `SECTION_COUNT` enforced at report-rules.ts:47 — the exact 25-vs-30 section count per report-mode should be verified against report-model.ts when the port lands.

**Self-check:** SPINE: EXPLAIN named · ingredients loaded via skill tool in-session (5/5) · visuals ruler-passed: card-shell inner 56/border col 58 (embedded die inner 46), kernel column inner 54, trace boxes inner 46 — all ≤76, arrows terminate at borders · claims anchored: trade-computer.ts:13/:301, l4-cascade.ts:6-7/:133/:151, report-rules.ts:47/:57-67 (rules 1-11 verbatim), report-model SECTION_COUNT, workflow-machine.ts:27-45, oracle-registry.ts:34-42, battery 46/46 fp measured · caps: none truncated.
