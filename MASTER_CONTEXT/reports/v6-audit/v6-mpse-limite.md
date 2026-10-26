# V6 MPSE/Limite Fusion — Limite as Math-Spec Layer, Limite Gates, Anti-Theatrical Predicates
**Status:** DESIGN (no code changed) · **Date:** 2026-09-23 · **Author slice:** V6MPSE-2
**Target path:** `/tmp/kg-overhaul/v6-mpse-limite.md` · **Assignment:** design the MPSE/Limite fusion

## 0. Grounding + honest absence ledger

### 0.1 What the assignment named vs what exists on disk
The assignment lists five target inputs:

| # | Named target | Search result on this host |
|---|---|---|
| 1 | `MASTER_CONTEXT/PLUTUS_MATHEXPR_CARDS_BIBLE.md` | ABSENT — `glob **/*MATHEXPR*` = zero hits under `/home/leviathan/.omp/wt/plutus-main-66dfa4c`; `PLUTUS/agent/MASTER_CONTEXT/` contains only `PLUTUS_MASTER_CONTEXT_INJECTOR.md`, `PLUTUS_V5_DETAILED_BUILD_ARCHITECTURE.md`, `PLUTUS_V5_FULL_BUILD_SPEC.md`, `INJECTOR_NAVIGATION_MANIFEST.json`, `Plutus_JESL_Blueprints.md`, `plutus-reasoning-failures.db*` |
| 2 | `MASTER_CONTEXT/MATHEXPR_RULECARD_ARCHITECTURE_BIBLE.md` | ABSENT — same glob, zero hits |
| 3 | `11_Token_Reasoning_Chain_Design.md` | ABSENT — `glob **/*Token*Reasoning*`, `**/*11_Token*` = zero hits |
| 4 | `PLUTUS_GOLDEN_CASCADE_23.md` | ABSENT — `glob **/*CASCADE*` = zero hits |
| 5 | `reports/Plutus_V6_Master_Blueprint_v1.md` | ABSENT — `glob **/*V6*Blueprint*`, `**/*Master_Blueprint*` = one unrelated hit only (`GM_Cards/home/reports/GoalmodeCards_Master_Blueprint_v1.md`); `PLUTUS/agent/reports/` holds only `Plutus_V5_omp-worker-1_Engineering_Report_v1.md` |

No claim below is sourced from those five files. Every Plutus-internal claim traces to files actually read this session (§14 anchors). The design recovers the *intent* of the missing bibles from the live W0 MPSE harness (`PLUTUS/agent/specs/mpse/`, 7 S-files + 4 harness files, all read) plus the V6 canon (`PLUTUS/V6/00_CANON_CONTEXT.md` + `03_TRADING_ENGINE_DPL1.md`, read) plus the MPSE knowledge library (`KNOWLEDGE_LIBRARY/MPSE/*`, injection prompt read full) plus the three skill canons (`mpse-systems`, `lasme-systems`, `paragon-substrate`, all loaded).

### 0.2 External models: what Kev and Limite actually are (web-verified this session)
- **Kev** = open-source family of Jev-compatible System-One *decision* models (Jared Palmer, `github.com/jaredpalmer/kev`, Apache-2.0). Same `/v1/systemone` API as TypeSafe Jev. Three primitives: **noul** (yes/no + P(yes)), **choice** (pick-1-of-N + distribution), **score** (position on ordered rubric + per-level probs). Prefill-only, single forward pass off a pointer head; LoRA r=16 on frozen Qwen3.5 bases. Sizes: Kev-0.8B / Kev-4B (recommended balance) / Kev-9B (best calibration). Decisions-not-strings: schema-guaranteed typed values, no text to parse. Sources: [kev README](https://github.com/jaredpalmer/kev) · [jevtypesafe.org](https://jevtypesafe.org/) · [OpenRouter Jev guide](https://openrouter.ai/docs/guides/community/jev).
- **Limite 1B Violetto** = Paradigma dense ~1B-parameter *math-specialist* SLM (Sept 2026, Apache-2.0). Custom `LimiteForCausalLM`, 131,072-token context, pretrained from scratch on <300B curated tokens, post-trained with synthetic SFT + RL, deliberately minimal assistant persona. Served via custom vLLM plugin (`paradigma-inc/limite-violetto`; Python 3.12, vLLM 0.26.0, torch 2.11 + CUDA 13.0). Recommended sampling `temperature=0.6, top_p=0.95`. Benchmarks (vendor-reported): AIME 2026 **94.01**, HMMT Feb 2026 **83.62**, APEX Shortlist **50.80**, BeyondAIME **74.25** — beating models 2–30x larger on contest math. Sibling `limite-1b-value-model` (1.035B) scores token-level correctness of math solutions. LIMITATION (load-bearing for this design): single-turn math only; reinterprets non-math prompts as math tasks; not a chat/instruction model. Sources: [official blog](https://paradigma.inc/blog/limite-1b-violetto/) · [HF model card](https://huggingface.co/paradigma-inc/limite-1b-violetto) · [serving README](https://github.com/paradigma-inc/limite-violetto/blob/main/README.md) · [value model](https://huggingface.co/paradigma-inc/limite-1b-value-model).

### 0.3 Live W0 baseline this design stands on (all measured, not quoted from memory)
- `battery.json`: fingerprint `8acfe74f272bf736de101e297b731cfa97c9fdd4a1684e63363489f116af7b7e`, 46 blocks → 46 predicates, 1:1 invariant.
- `d17-report.json`: **20 calibrated / 26 evidence-only / 0 flagged / 0 born_off** (canon prose says "19C/27E" in older docs — the live file lists 20 calibrated ids; §14 notes the drift).
- `oracle-registry.ts`: 10 pure oracles + 2 composed evaluators (`shape_gate`, `near_edge`), all pip-quantized integer compares, fail-closed `OracleError`.
- `compile.ts` (D13 gate, fingerprint over block-ids+quotes) + `calibrate.ts` (data-driven dispatch by fixture `class`, sanctioned thresholds ride in fixture data, founding VALID control synthesized from fixtures, exit 0/1) + `jspec-check.ts` (S-file format contract, D-R2 zero-PROPOSED rule).
- Fixtures: `golden-week.json` (evidence-only corpus, ORACLE_ISOLATION doctrine) + 9 mutants (`mutant-1-40setup` … `mutant-9-eu2-nearedge`).
- V6 canon pins: dist `261343a9`, gates 11/11, battery 646/0/59,865/46, graph pin `bc6ce1a0584a`, JESL 8 kinds + `MAX_NODES_FIRING=15` + `RUN_DEADLINE_MS=60000` + eq-only `GATE-FAILED`, failure DB 20,322 rows (SHADOW_DEGRADE 10,919 / GROUNDING_WARN 8,913 / REFINEMENT_EXHAUSTED 399 / MACRO_DIVERGENCE 91), golden levels DXY 100.945/101.14 · EU 1.14395/1.14110 · GU 1.33330, tolerances ORACLE 3p / G1 2p / wall 5min, frozen pair SHAs `91294083…` / `33914c89…`.

---
## 1. Fusion thesis (the one-paragraph version + the triangle)

MPSE is a *discipline*: math is the spec, code is the implementation, tests are the proof. Its weakness in Plutus W0 is not the discipline but the *verifier bandwidth*: 10 hand-written oracles + 9 hand-written mutants cover 20 of 46 predicates; the other 26 sit evidence-only because no human wrote the adversarial case that would arm them. Limite 1B Violetto is a *math-native verifier* with contest-grade reasoning (AIME 2026 94.01, HMMT 83.62, BeyondAIME 74.25 at 1B params) that runs cheap at high throughput behind a vLLM plugin. Kev is a *typed decision head* (noul/choice/score + calibrated probs, no prose to parse) for the places where the answer is genuinely uncertain. The fusion triangle:

```
                    MPSE (the law)
              math-spec · oracles · gates
                  /                \
                 /                  \
  LIMITE (math judge)        KEV (uncertainty judge)
  offline/CI · single-turn   online/router · typed probs
  proves the math is right    routes what math cannot settle
```

Three non-negotiable separations (violating any one collapses the fusion into theater):

| # | Separation law | Rationale |
|---|---|---|
| F-1 | Limite NEVER decides a trade, NEVER gates a live verb | Limite is single-turn math-only, reinterprets non-math prompts as math (vendor-documented limitation). It judges *predicates*, never *positions*. The live path stays deterministic: oracle code + exit codes. |
| F-2 | Kev NEVER proves math | Kev outputs calibrated belief, not proof. A `noul` at P=0.97 that RRR>=2.5 is routing signal, never a discharge. Only `calibrate.ts` exit 0 + oracle verdicts discharge. |
| F-3 | No Limite/Kev prose enters `specs/mpse/` as authority | S-files carry `quote:` + `anchor: doc:line` (D13) + zero PROPOSED (D-R2). Model output may *propose* mutants, translations, audits — a human-authored fixture + oracle verdict *disposes*. Model text is evidence-candidate, never evidence. |

How Limite unlocks MPSE as a quality key (thesis in one line): **MPSE states the law; Limite supplies the second signature that the law is correctly stated and adversarially tested — turning 20/46 calibrated into 46/46 plus a standing regression army, which is what makes "math-spec" a shippable quality claim instead of a posture.**

## 2. Limite as math-spec layer (where it sits in idea→math→spec→code→test)

The MPSE injection prompt mandates the pipeline `idea → math → spec → code → test` (MPSE_KNOWLEDGE_INJECTION_PROMPT.md, read full this session). Limite inserts at four joints — always as *checker/generator*, never as *authority*:

### 2.1 Joint A — idea→math: the mathiness gate (G-LIM-01)
**Problem it kills:** D1 misinterpretation + the banned-word class (`gateIdea()` in mpse-systems skill Step 5) — NL rules with no denotation ("high probability", "properly legit", "about 8 setups") that today rely on human review.
**Limite role:** given the candidate math + the NL commentary, Limite discharges three single-turn checks per S-block:
1. `WELL-FORMED(expr)`: the `expr:` parses under the closed MathExpr grammar (piecewise/forall/predicate-family/process + inequality/equality/subset/recurrence/exists-unique kinds from battery.json `kind` values). Malformed → REJECT with the offending token named.
2. `DENOTED(expr)`: every NL content word in `quote:` maps to a symbol/binding in `expr:` — the word with no denotation is named (the `gateIdea()` output, mechanized).
3. `COUNT-PINNED(expr)`: if the block constrains cardinality, the exact integer is present (`f(T)=24`, `90 rows`, `60 zone-IDs`, `36p`, `4p`, `2.5`, `0.35`, `6 states`). "About/roughly" → REJECT.
**Why Limite fits:** each check is a single-turn structured-reasoning task over a short prompt (block text + grammar), exactly Limite's trained shape; temperature=0.6/top_p=0.95 per vendor generation config; 131k context is headroom, prompts stay <2k tokens by construction (one block per call).
**Authority:** G-LIM-01 emits ADVISORY findings consumed by the S-author; `jspec-check.ts` + human ratification remain the admission gate (D13/D-R2 unchanged). A Limite PASS never admits a block; a Limite REJECT always requires author disposition (fix or documented override).

### 2.2 Joint B — spec→code: the translation-fidelity gate (G-LIM-02)
**Problem it kills:** D5 hallucinated bindings + D7 brand drift — the oracle implements something adjacent to the spec (e.g. comparing floats with `<` instead of pip-quantized `q(a)<=q(b)`, or accepting a wall-clock-adjacent field like `sessionId` vs rejecting `Date.now`).
**Limite role:** given `expr:` + the oracle function body (`oracle-registry.ts` §§1–10 + 2 composed), Limite proves or refutes: (a) every comparison in the oracle is integer-compared post-`quantize()` (the file's own stated law); (b) every input path is finite-checked (`needFinite`) or string-checked (`needNonEmptyString`) with `OracleError` on malformed (fail-closed); (c) no float equality without epsilon/quantum. Output is a per-oracle verdict triple `{entanglement: which expr lines map to which code lines, gap: any expr clause with no code counterpart, surplus: any code behavior with no expr counterpart}`.
**Authority:** advisory to the oracle author; the *proof* stays mechanical — the mutant that kills the gap must FIRE through `calibrate.ts` (see §3, G-LIM-03).

### 2.3 Joint C — code→test: the mutant-generation engine (G-LIM-03, the highest-value joint)
**Problem it kills:** 26 evidence-only predicates with no killing fixture. Each is a law nobody can violate on purpose — i.e. an unproven law.
**Limite role:** per evidence-only block, generate 1–3 minimal mutants (single-field perturbations of golden-week rows or synthetic records with the block's `class` shape) in the exact fixture JSON shape `{id, class, data, expect, predicateTargets?, description}`. Generation prompt = the block's `quote:` + `expr:` + 2 exemplar mutants of the same `kind` (few-shot; Limite's base model is explicitly few-shot-strong on math). Then the *mechanical* filter applies: the mutant lands in `specs/fixtures/mutants/` IFF (i) `calibrate.ts` routes it to the intended oracle via `class`, (ii) the oracle verdict equals `expect`, (iii) the golden SILENT twin still discharges SILENT/VALID (the D17 twin requirement — every FIRE needs its SILENT twin), (iv) no other calibrated predicate flips (no friendly fire). Rejected mutants are logged with the oracle's actual verdict, never hand-edited to pass.
**Throughput math:** 26 blocks × ≤3 candidates = ≤78 Limite calls per sweep; each <2k tokens in, <1k out; at 1B-scale vLLM throughput this is a minutes-scale CI job, not a session-scale activity. This is the joint that converts 20/46 → 46/46.
**Authority:** `calibrate.ts` exit code. Limite proposes; the oracle disposes.

### 2.4 Joint D — test→trust: the calibration-adjudication gate (G-LIM-04)
**Problem it kills:** ambiguous `d17-report.json` states — `evidence_only` as a permanent parking lot, `flagged`/`born_off` drift, founding-control rot.
**Limite role:** on each `d17-report.json` write, Limite audits the report (not the code): (a) every `evidence_only` id names its missing-killing-fixture class (or is challenged for promotion/deletion); (b) every `calibrated` id has ≥1 FIRE + ≥1 SILENT/VALID leg (the twin rule); (c) `batteryFingerprint` matches `battery.json:fingerprint`; (d) no `flagged` id persists across two sweeps without an owner + date. Output = the promotion/deletion worklist, consumed by W-MPSE wave planning.
**Authority:** the worklist is a planning input; promotion still requires the G-LIM-03 mechanical filter.

## 3. Limite-based gates (concrete gate specs — names, inputs, verdicts, wiring)

Gate naming: `G-LIM-0X` (Limite-judged, advisory-or-promotion) vs existing `G1–G10` (golden-gate.ts, mechanical) — no namespace collision. Every G-LIM gate emits a JSON verdict row `{gate, subject, verdict, evidence, ts}` appended to a Limite-gate ledger (PROPOSED path `specs/mpse/limite-gate-ledger.jsonl`; newline-delimited so concurrent sweeps append without merge conflicts). No G-LIM gate returns exit codes consumed by wave gates; only `compile.ts`/`calibrate.ts`/`jspec-check.ts` exits gate waves.

| Gate | Subject | Input (exact) | Limite verdict set | Mechanical anchor (what makes it non-theatrical) |
|---|---|---|---|---|
| G-LIM-01 mathiness | each new/edited S-block | `quote:` + `expr:` + `kind:` + closed-grammar token list | `WELL-FORMED` / `UNDENOTED(word)` / `UNPINNED-COUNT` / `PASS` | `jspec-check.ts` exit 0 still required; UNDENOTED/UNPINNED findings must be dispositioned in the authoring PR (fix or override-with-reason) |
| G-LIM-02 translation-fidelity | each oracle in `oracle-registry.ts` | `expr:` + oracle function source | `{entangled, gap[], surplus[]}` | every `gap` must gain a killing mutant through G-LIM-03 or a written why-not; `surplus` with no expr counterpart is a spec-patch obligation (math wins — patch the spec first, mpse-systems law) |
| G-LIM-03 mutant-admission | each candidate mutant JSON | candidate + target block + exemplar mutants | `ADMIT-CANDIDATE` (Limite self-check only) | admission = the 4-condition mechanical filter (§2.3): route-ok + verdict==expect + twin-silent + no-friendly-fire via `calibrate.ts`; Limite's opinion is not admission |
| G-LIM-04 calibration-audit | `d17-report.json` per sweep | full report + battery.json ids | promotion/deletion worklist | promotion executes only via G-LIM-03 filter; `flagged` aging rule enforced by a 5-line script, not by Limite prose |
| G-LIM-05 tolerance-proof | any threshold change (3p/2.5/36/4/0.35/24/90/60) | diff + affected S-blocks + D-R1/D-R2 citations | `CONSISTENT` / `DRIFT(name, old, new)` | `jspec-check.ts` D-R2 zero-PROPOSED + `calibrate.ts` re-run green; DRIFT without ratification reference = wave STOP |
| G-LIM-06 golden-twin | every FIRE mutant admitted | mutant + its SILENT/VALID twin | `TWINNED` / `UNTWINNED` | UNTWINNED mutants are quarantined (land in `mutants/quarantine/`, never in the calibrate path) until the twin exists |
| G-LIM-07 report-honesty | any status/battery prose citing MPSE | prose + `d17-report.json` + `battery.json` | `GROUNDED(x/y)` / `UNGROUNDED(claim)` | UNGROUNDED = the claim must be reworded to the measured numbers before the doc lands (mechanical string check: the numbers `20`, `26`, `46`, `8acfe74f` appear or the claim is rejected) |

### Wiring diagram (where G-LIM gates run)

```
S-author edits S-*.md
  → jspec-check.ts (mechanical, exit-gated) ──PASS──→ G-LIM-01 (advisory)
  → compile.ts → battery.json (fingerprint)
  → calibrate.ts ──exit 0──→ d17-report.json
  → G-LIM-04 (worklist) → G-LIM-03 sweep (mutant candidates)
       → candidate ──4-filter──→ mutants/ ──re-calibrate──→ exit 0 → promoted
       → candidate ──filter-fail──→ quarantine + actual-verdict log
Oracle edit → G-LIM-02 (gap/surplus) → gap-closing mutants via G-LIM-03
Threshold edit → G-LIM-05 (drift check) → re-calibrate full battery
Any MPSE-citing doc → G-LIM-07 (grounding check)
```

CI placement: G-LIM-01/02/05/07 run per-PR (fast: ≤10 Limite calls); G-LIM-03/04/06 run nightly + on-demand (bounded ≤78 calls/sweep). Limite served from the pinned vLLM plugin deployment (`paradigma-inc/limite-violetto`, generation config temperature=0.6/top_p=0.95); prompts versioned beside the gate scripts so a Limite upgrade replays the same prompt set (prompt SHA recorded in each ledger row).

## 4. MPSE anti-theatrical criteria as Limite-verifiable predicates

The V6 canon verification law (§5: container-first, tool-result-bound tokens, receipts, no test theater) plus the three skill canons yield a closed anti-theatrical criterion set. Each criterion below is stated as a *predicate Limite can verify over artifacts* — Limite reads files/JSON/logs and returns a verdict; the verdict is then mechanically re-checkable by a script (the predicate's `mech-check` column) so Limite's judgment is itself audited.

### 4.1 The criterion table (AT-01 … AT-10)

| ID | Anti-theatrical criterion (prose form) | Limite-verifiable predicate (formal input → verdict) | mech-check (script re-verification) |
|---|---|---|---|
| AT-01 twin-rule | every FIRE claim has a SILENT/VALID twin | `TWINNED(mutantId) ⟺ ∃ twin: oracle(twin)=SILENT/VALID ∧ twin≠mutant ∧ sameOracle` over `d17-report.json` + fixture corpus | `grep -c` twin refs per calibrated id; UNTWINNED → quarantine |
| AT-02 no-friendly-fire | a new mutant flips only its target | `ISOLATED(mutant) ⟺ ∀ calibrated p≠target: verdict_p(post)=verdict_p(pre)` over pre/post `d17-report.json` diff | diff the two reports; any extra flip = reject |
| AT-03 sanctioned-in-data | thresholds ride in fixture data, never in prose | `SANCTIONED(fixture) ⟺ data carries {expectedSetups|slCeilingPips|sanctionedTolerancePips|sanctionedFloor} ∨ ledger shows FALLBACK-logged` | `calibrate.ts` already logs `CALIBRATE_NOTE` per fallback; count NOTES per sweep |
| AT-04 founding-VALID | the mirror-floor VALID leg is synthesized from fixtures, never literal | `FOUNDED(report) ⟺ VALID-leg input read from resolved mirror-floor fixtures` | code-review anchor: `calibrate.ts` founding-control synthesis block (read this session, §14) |
| AT-05 integer-compare | no float ordering without quantum | `QUANTIZED(oracle) ⟺ every numeric compare in oracle body is post-quantize integer compare` over `oracle-registry.ts` source | `grep -n '<\|>\|<=\|>=' oracle-registry.ts` → each hit must sit below a `quantize(` call in the same function |
| AT-06 fail-closed | malformed input THROWS, never passes | `FAILCLOSED(oracle) ⟺ ∀ malformed-class ∈ {NaN, Inf, missing, wrong-type}: evaluate → OracleError` | adversarial harness: 4 malformed inputs × 12 oracles, all must throw |
| AT-07 evidence-never-gating | evidence-only predicates gate nothing | `UNGATED(block) ⟺ block ∈ evidence_only ⟹ no consumer reads its verdict as PASS/FAIL` | `grep -rn <block-id> src/ pipeline/ jesl/` must be zero (the RULES.md inherited-consumer-claim law: run the grep, quote it) |
| AT-08 fingerprint-pinned | battery identity is content-derived | `PINNED(sweep) ⟺ battery.json:fingerprint == d17-report.json:batteryFingerprint == sha256(block-ids+quotes)` | recompute fingerprint in CI, string-compare |
| AT-09 no-PROPOSED | zero unratified thresholds in S-files | `RATIFIED(corpus) ⟺ count(PROPOSED)==0` over `specs/mpse/S-*.md` | `jspec-check.ts` already enforces; Limite adds the semantic half: flags near-synonyms ("tentative", "TBD", "placeholder", bare future numbers) that evade the string check |
| AT-10 report-grounded | prose numbers equal measured numbers | `GROUNDED(doc) ⟺ every {calibrated, evidence-only, total, fp} numeral in doc == live JSON values` | extract numerals via script, compare to `battery.json`+`d17-report.json` (catches the 19C/27E-vs-20/26 drift noted in §0.3) |

### 4.2 Why Limite (not Kev, not regex) for AT-01…AT-10
- AT-05/08/09-string-half are pure scripts today; Limite covers the *semantic* remainder (AT-09 synonyms, AT-02 diff adjudication when a flip is a legitimate cascade vs friendly fire, AT-10 numeral-to-claim binding in flowing prose).
- Kev is the wrong tool for all ten: its outputs are beliefs about uncertain states, while each AT predicate is decidable over artifacts — Limite's contest-math shape (quantified statements, edge cases, proof structure) matches decidable-predicate adjudication.
- Every AT predicate keeps its `mech-check`: Limite accelerates and semantically extends, but the script remains the appeal court. A Limite PASS with a failing mech-check is a Limite bug report, not a pass.

## 5. How Limite unlocks MPSE as a quality key (the acceptance question, answered directly)

"Quality key" = the property that lets a downstream consumer (V6 engine verbs, trade review, shell intelligence, RSI loops) TRUST an MPSE predicate without re-reading its proof. Trust has a price: today the price is human verifier-hours per predicate, which is why 26 predicates sit unpriced (evidence-only). Limite pays that price at machine scale. Five unlocks, each with a before→after:

### U-1 Coverage unlock: 20/46 → 46/46 calibrated
Before: 20 calibrated / 26 evidence-only / 0 flagged / 0 born_off (live `d17-report.json`). Each evidence-only block is a law with no enemy — S-4 pressure lifecycle (B-1/B-2/B-6/B-7), S-6 telescoping (all 5 blocks), S-7 honesty (B-1…B-4), S-2 totality (B-1/B-2), S-3 anchors (B-4/B-6/B-10/B-11), S-5 regime (B-2/B-4). After: G-LIM-03 sweep generates the missing killing fixtures under the 4-filter; G-LIM-04 worklist drives the count to 46/46 with every promotion mechanically admitted. The quality-key claim becomes countable: `calibrated==46 && flagged==0 && born_off==0 && calibrate exit 0`. Countable is shippable; prose about "math-first" is not.

### U-2 Adversarial-depth unlock: 9 mutants → a standing regression army
Before: 9 mutants cover the famous failures (40-setup overgen, 13-setup undergen, side-inversion ×2, tp-cap, eu4-deep, tolerance-drift, rrr-drift, eu2-nearedge). The D17 discipline (FIRE needs SILENT twin) holds only where a human already imagined the enemy. After: every calibrated predicate owns ≥1 FIRE + ≥1 SILENT leg by construction (G-LIM-06 twin rule enforced at admission), and G-LIM-03 re-sweeps on every oracle/spec edit — a mutant that stops firing (oracle drift) or starts friendly-firing is caught at the next sweep, not at the next incident. The battery stops being a snapshot and becomes a standing army.

### U-3 Spec-hygiene unlock: string gates → semantic gates
Before: `jspec-check.ts` enforces the format contract (header/spec/form/blocks/keys) + D13 quote+anchor + D-R2 zero-PROPOSED — all string-level. A block can pass every string check while stating mush ("zones should be properly respected"). After: G-LIM-01 (mathiness) + G-LIM-05 (tolerance-proof) + AT-09 semantic half reject mush at authoring time with the offending word named. The S-corpus stays loss-free as it grows (M5 laws→cards: R1–R34 + 37 laws + 18 derailments compile into the same shape).

### U-4 Translation-trust unlock: oracle prose-comments → proved entanglement
Before: `oracle-registry.ts` header comments CLAIM pip-quantized integer compares + fail-closed throws; the claim is verified by reading code. After: G-LIM-02 produces the per-oracle `{entangled, gap[], surplus[]}` map, and every `gap` either gains a killing mutant or a written why-not, while every `surplus` becomes a spec-patch obligation (math wins — patch the spec first). The oracle file's own law ("zero float-ordering false positives by construction") becomes a checked property (AT-05 + AT-06) rather than a comment.

### U-5 Economic unlock: verifier bandwidth stops being the bottleneck
Limite 1B at vLLM throughput serves the whole sweep (≤78 calls, <2k tokens each) in minutes on one GPU — versus ~26 human verifier-sessions to hand-author 26+ mutants with twins. The models's weaknesses (no chat, no instruction-following, math-only reinterpretation) are irrelevant because every prompt IS a math task. Its sibling `limite-1b-value-model` (token-level correctness scores) offers a second, even cheaper pre-filter: score candidate mutants before running the full calibrate (PROPOSED optimization, not in the build list).

### The trust equation (why two signatures beat one)
`TRUST(predicate) = oracle-verdict(FIRE/SILENT/VALID/CONTRADICTED, exit-gated) ∧ Limite-adjudication(AT-01…AT-10, ledger-recorded) ∧ mech-check(script, re-runnable)`. Any one signature alone is theatrical: oracle-only = unexamined implementation; Limite-only = ungrounded prose; script-only = unexamined semantics. The fusion's quality key is the AND — and the AND is cheap because Limite is 1B-scale.

### V6 fit (one paragraph)
V6 law says intelligence lives in the STATIONS, not the agent's turns (canon §3 reduction). MPSE predicates ARE station intelligence (engine pre-casts M3, review-bind M5, rails-guard M4 in `03_TRADING_ENGINE_DPL1.md` §2 all consume math, never prose). Limite is what keeps station intelligence honest at scale: G-LIM gates sit in CI (per-PR) and nightly sweeps, the ledger (`limite-gate-ledger.jsonl`) is journal-adjacent evidence, and station law T2 (RECEIPTS NOT PROSE) is satisfied because every Limite verdict row carries its prompt-SHA + subject + evidence pointer.

## 6. Kev / Limite / code-gate routing (so sibling audit slices can map every function)

Sibling E1/E2/E3 audit slices map each function to exactly one of {Kev question, Limite call, code gate, needs-building}. This section fixes the routing definitions so those mappings are consistent:

| Route | When to choose it | Shape | Example in Plutus |
|---|---|---|---|
| CODE GATE (deterministic, exit-gated) | decidable over artifacts with zero judgment: counts, integers, sets, thresholds, chain checks | TS function + fixture + `calibrate.ts` verdict + exit code | `f(T)=24` mirror floor; `RRR>=2.5`; `SL∈[4p,36p]`; `designations(day,pair)==2`; `sha256(run1)==sha256(run2)`; `no wall-clock imports` |
| LIMITE CALL (math judge, ledger-recorded) | structured math reasoning: well-formedness, translation fidelity, mutant generation, twin/report adjudication, threshold-drift review | single-turn prompt → verdict row in ledger; mech-check appeal court | G-LIM-01…07; AT-01…AT-10 semantic halves; S-file mathiness; oracle gap/surplus maps |
| KEV QUESTION (uncertainty router, typed probs) | genuinely uncertain state where math cannot settle and the answer routes work: which mutant family to try first, which evidence-only block is ripest, whether a `gap` is spec-missing vs oracle-missing, triage order of the G-LIM-04 worklist | `noul` (is-X-true + P) / `choice` (pick-1-of-N + distribution) / `score` (rubric position + per-level probs); thresholded in code, never prose-parsed | `choice` over mutant families for block S-4/B-1 (lifecycle) given its recurrence kind; `score` for worklist priority (calibration-ripeness rubric); `noul` for "does this surplus indicate a missing spec clause (yes/no)" as triage pre-sort before human disposition |
| NEEDS-BUILDING | none of the above can express it yet: missing oracle, missing fixture class, missing JESL kind, missing engine verb | new file + spec + fixtures + gate, per §7 | new oracle for S-4 lifecycle recurrence (step-function over 6 states); new oracle for S-6 nesting-subset over zone bands; `limite-gate-ledger.jsonl` + sweep scripts; prompt pack versioning |

Routing laws: (R-1) decidable → code gate, never Limite/Kev (don't spend inference on arithmetic). (R-2) math-judgment → Limite, never Kev (beliefs don't prove). (R-3) uncertainty-routing → Kev, never Limite (math models don't calibrate belief; Limite's "confidence" is sampling temperature, not a Brier-scored probability). (R-4) Kev NEVER gates a wave; its outputs set ORDER and PRIORITY (which candidate first, which block next), while `calibrate.ts` exit codes set ADMISSION. (R-5) Every Limite/Kev call site records `{prompt-or-state-SHA, model-id, verdict-or-distribution, ts}` — unrecorded inference is theater (station law T2).
## 7. Per-spec Limite mapping (S-1 … S-7 — what Limite does for each live spec)

Status prefixes: CAL = calibrated (20) · EV = evidence-only (26). Limite action per block: GENERATE (mutants) / PROVE (translation/entablement) / AUDIT (twin/report). Priority for the G-LIM-03 sweep: P0 = load-bearing trade math (S-1/S-5/S-3/S-7) first, P1 = structural (S-2/S-6), P2 = lifecycle/pressure (S-4).

### S-1 The Cascade Law (piecewise; 2 CAL + 4 EV)
- B-1-side-match [CAL] — Limite: PROVE the `side_match`/`shape_gate` entanglement (LONG↔DEMAND, SHORT↔SUPPLY) covers both oracles; GENERATE 1 extra inversion mutant on GU (current twins are EU-only: mutant-3 v452 + mutant-4 v453-silent). Priority P0.
- B-2-mirror-floor [CAL] — Limite: AUDIT founding-VALID synthesis (AT-04); GENERATE boundary mutants (23/25 setups → CONTRADICTED) beyond the 40/13 pair. Priority P0.
- B-3-divergence [EV] — Limite: GENERATE divergence>0.35 chain pair (GU-diverges-EU) with `expect:FIRE` + SILENT twin at 0.34; PROVE `divergence_le` quantum choice (ratios at 1e-9). Priority P0 (macro-mirror is load-bearing).
- B-4-sequencing-requires [EV] — Limite: GENERATE EU-DESIGNATED-without-DXY-inverse record (`expect:DESIGNATION_INCOMPLETE`-class FIRE); needs-building: no oracle encodes REQUIRES/INVERT verbatim — new `sequence_requires` oracle or DESIGNATION_INCOMPLETE discharge path. Priority P0.
- B-5-consumption-forbids [EV] — Limite: GENERATE GU-consuming-raw-DXY record; PROVE subset semantics vs `containment_subset` (different subset: input-set vs band-containment — flag the overload). Priority P0.
- B-6-loop-detection [CAL] — Limite: PROVE re-fire KILL maps to mirror-floor CONTRADICTED without conflating duplicate-count with setup-count (AT-02 isolation). Priority P1.

### S-2 Designation Totality (forall; 3 CAL + 2 EV)
- B-1-bounded-forall [EV] — Limite: GENERATE 89-row (one missing) designation set → CONTRADICTED + 90-row VALID twin; PROVE `totality_forall` dual input shape (actual/expected vs designationCount/days/pairs/directions). Priority P1. Needs-building: 90-row fixture harness (golden-week carries oracle rows, not the 90-row designation grid).
- B-2-dual-sided [EV] — Limite: GENERATE single-sided (day,pair) designation (1 zone-ID) → CONTRADICTED + 2-ID twin. Priority P1.
- B-3-exists-unique [CAL] — Limite: AUDIT the v4.5.3 SILENT row stays SILENT after each sweep (regression anchor). Priority P1.
- B-4-exhaustiveness-d8 [CAL] — Limite: PROVE the 4-state cover {DESIGNATED, CONSUMED, INCOMPLETE-LOUD, SIDE_INVERSION_VIOLATION} has no fifth state reachable in fixtures (closed-world check over fixture `class` values). Priority P1.
- B-5-golden-instantiation [CAL] — Limite: PROVE chain equality entry(N+1)==TP(N) on EU Mon rows; GENERATE off-by-1p chain-break mutant. Priority P1.

### S-3 E3 Anchor Rules (predicate-family; 7 CAL + 5 EV)
- B-1-E1-entry-lqz-near-edge [CAL], B-2-E2-ss-nested-liquidity-long [CAL], B-12-shape-gating [CAL] — Limite: PROVE `near_edge` ROW/CONTRADICTED logic (containment + expectedRow + delta cross-check) against EU#2 Δ1.0p; AUDIT no-friendly-fire on anchor edits. Priority P0.
- B-3-E3-rwl-bs-deep-rung [EV], B-4-E4-supply-side-symmetry-short [EV], B-6-S2-operative-defense-switch [EV], B-10-T2-opposing-zone-internal-lqz [EV], B-11-T3-tp-timeframe-floor [EV] — Limite: GENERATE one mutant each (wrong-rung DEEP-vs-NEAR swap; SHORT-at-ceiling instead of floor; SL-on-LQZ-after-absorption; TP-at-wrong-zone; TP-timeframe < entry-timeframe). All five need `expect` classes that exist (`shape-gate`, `containment`, `tf-restriction`) — no new oracle required, only fixtures. Priority P0 (anchors ARE the trade).
- B-5-S1-ladder-steps-sl [CAL], B-7-S3-atr-floor [CAL], B-8-S4-golden-sl-min [CAL], B-9-T1-strength-driven-edge [CAL] — Limite: PROVE `sl_min`/`sl_ceiling`/`containment_subset` triple covers ladder+switch+floor with no gap at the [4p,36p]×ATR boundary; GENERATE 3.9p (FIRE) / 4.0p (SILENT) and 36.0p (SILENT) / 36.4p (FIRE) boundary twins. Priority P0.

### S-4 Pressure Laws (piecewise; 1 CAL + 6 EV — the largest gap)
- B-5-third-mitigation-inequality [CAL, the only one] — Limite: anchor; GENERATE reactionCount=2 (posture holds) vs 3 (TP-only) vs 4-held (FORTRESS-flip to B-4) triple. Priority P2.
- B-1-lifecycle-recurrence [EV], B-2-battle-count-guard [EV], B-3-death-scope-piecewise [EV], B-4-fortress-invariant [EV], B-6-broken-with-battle [EV], B-7-shield-relation [EV] — Limite: GENERATE minimal state-machine traces (VIRGIN→…→BROKEN event strings; touch-vs-SWEEP count pairs; 4H-death-claim REJECT; 4-holds-no-pierce FORTRESS vs 3-holds fail-expected; gap-through-without-battle NOT-BROKEN; shield-eaten-before-touch ORDER). Needs-building: **new `pressure_step` oracle** (6-state step function + battleCount) — none of the 10 existing oracles encodes recurrence; this is the single largest needs-building item in the fusion. Priority P2 (pressure refines, anchors decide).

### S-5 RRR Regime (predicate-family; 4 CAL + 2 EV)
- B-1-floor-inequality [CAL], B-3-ceiling-predicate [CAL], B-5-consequence-law [CAL], B-6-filter-law [CAL] — Limite: PROVE `rrr_floor` zero-risk-distance malformed path + pip-quantized boundary (2.49 FAILS / 2.50 PASSES); AUDIT consequence-law direction (no E/SL/TP assignment reads rrr — static check over trade-computer source when it lands). Priority P0.
- B-2-target-statement [EV] — Limite: GENERATE optimizer-gaming mutant (all-2.5-portfolio passes floor but violates maximize-rrr-subject-to-floor) — `expect` class is policy-level; needs-building: optimizer-objective predicate (maximize, not satisfice). Priority P1.
- B-4-min-sl [EV] — Limite: covered by S-3 B-8 twin sweep (shared 4p floor); no separate mutant needed, only the conjunction proof (tighter-of-4p-vs-0.5×ATR governs). Priority P0.

### S-6 Telescoping Law (forall; 0 CAL + 5 EV — fully unproven)
- B-1-nesting-subset [EV] … B-5-hierarchy-authority [EV] — Limite: GENERATE one REJECT each (un-nested LTF zone; BoM-on-30m; 30m-non-MoM; 4H-LQZ; 15m-edge entry). PROVE `containment_subset` band semantics covers B-1/B-4 (it does — same 4-edge quantized containment) but NOT B-2/B-3/B-5 (classification/hierarchy, not geometry). Needs-building: **new `tf_classification` oracle** (tf×classification admissibility matrix) for B-2/B-3/B-5; B-1/B-4 ride the existing `containment_subset` + `tf_restriction`. Priority P1.

### S-7 Determinism/Honesty (process; 1 CAL + 4 EV)
- B-5-x2-determinism [CAL] — Limite: AUDIT sha256(run1)==sha256(run2) claim shape; GENERATE tolerance-drift prose mutant ("30-pip tolerance acceptable") → TOLERANCE_DRIFT FIRES. Priority P0 (standing criterion SC-20).
- B-1-no-wall-clock [EV] — Limite: GENERATE clock-import core file (`Date.now` in src/e1) → REFUSAL; PROVE `no_wall_clock` WALL_CLOCK_KEYS set covers `performance.now`/`Math.random`/entropy imports (read the const set — it names timestamps/dates/Date.now-style; Limite checks the set against the S-7 forbidden list). Priority P0.
- B-2-content-hash [EV] — Limite: AUDIT frozen-pair SHAs cited in S-7 match the live files (`sha256sum` recheck); AT-08 pinned. Priority P0.
- B-3-honest-data [EV], B-4-no-fabricated-defaults [EV] — Limite: GENERATE zero-filled-row (missing provenance → DESIGNATION_INCOMPLETE, never data) and `?? 0.5`-confidence mutants; needs-building: provenance-shape oracle (4-fact audit trail {fixture-SHA, fetch-ts, broker, run-anchor}). Priority P0 (honesty is the spine).

## 8. Needs-building inventory (everything the fusion requires that does not exist today)

| ID | Artifact | Why (which gap it closes) | Shape (file + contract) | Wave |
|---|---|---|---|---|
| N-1 | `pressure_step` oracle | S-4 B-1/B-2/B-3/B-4/B-6/B-7 have no oracle: 6-state step + battleCount + death-scope + fortress/broken/shield are recurrence/piecewise over event traces, none of the 10 oracles encode a state machine | `oracle-registry.ts` += `pressure_step(trace:{states,events}) → FIRE/SILENT` + `shield_order` subset check; pure, quantized where numeric (reactionCount integers), `OracleError` on unknown state/event (fail-closed); fixtures = event-string traces | W-MPSE sweep 2 |
| N-2 | `tf_classification` oracle | S-6 B-2/B-3/B-5 are tf×classification admissibility, not geometry; `containment_subset`/`tf_restriction` cover B-1/B-4 only | `oracle-registry.ts` += `tf_classification({tf, classification}) → FIRE/SILENT` over the matrix {BoM:{4H,1H}, MoM:{4H?,1H,30m}, LQZ:{1H,30m,15m}} + hierarchy authority order; matrix rides in fixture data (sanctioned-in-data law), code holds no literals beyond the matrix load | W-MPSE sweep 2 |
| N-3 | `sequence_requires` discharge path | S-1 B-4 (REQUIRES DXY-inverse + INVERT direction) and S-2 B-1/B-2 (90-row/60-ID totality grids) need DAG + grid oracles, not single-record predicates | `oracle-registry.ts` += `sequence_requires({euDesig, dxyInverse})` + `totality_forall` already exists — extend its fixture harness to the 90-row grid (N-3b: `specs/fixtures/designation-grid.json` PROPOSED shape) | W-MPSE sweep 2 |
| N-4 | provenance-shape oracle | S-7 B-3/B-4 (4-fact audit trail; `?? 0.5` ban; honest absence) need a record-shape check | new `honest_record(record) → FIRE/SILENT`: requires `{fixtureSHA, fetchTS, broker, runAnchor}` or ABSENT-with-code; `confidence==0.5`-without-provenance → FIRE; wall-clock-shaped fetchTS still passes here (B-1 owns clocks) | W-MPSE sweep 2 |
| N-5 | optimizer-objective predicate | S-5 B-2 (maximize-rrr, never satisfice-2.5) is a policy over portfolios, not a per-trade inequality | PROPOSED: `portfolio_objective(portfolio) → SATISFICE-FLAG` when all rows ∈ [2.5,4.0) despite ∃ admissible 4R+ alternative in the same setup set; policy-level, reports to G-LIM-04 worklist, never gates a trade | W-MPSE sweep 3 |
| N-6 | `limite-gate-ledger.jsonl` + writer | G-LIM-01…07 verdict rows need an append-only, merge-safe home satisfying station law T2 | `specs/mpse/limite-gate-ledger.jsonl` (one JSON row per verdict: `{gate, subject, verdict, promptSHA, modelId, evidence, ts}`) + 30-line append helper; concurrently-appended, never rewritten | W-MPSE sweep 1 |
| N-7 | sweep scripts (4-filter + twin + report-diff) | G-LIM-03 admission, G-LIM-06 quarantine, AT-02 isolation must be scripts, not Limite prose | `specs/mpse/limite-sweep.ts` (generate→4-filter→admit/quarantine), `twin-check.ts` (AT-01), `report-diff.ts` (AT-02 pre/post diff); all exit-gated | W-MPSE sweep 1 |
| N-8 | prompt pack (versioned) | Limite prompts must be replayable across model upgrades; prompt SHA per ledger row | `specs/mpse/limite-prompts/` one file per gate (G-LIM-01…07) + AT adjudication prompts; SHA recorded per verdict row | W-MPSE sweep 1 |
| N-9 | Kev triage wiring | §9 question catalog needs a thin caller (state→questions→thresholds→order) | `specs/mpse/kev-triage.ts` PROPOSED: builds Kev `/v1/systemone` requests (noul/choice/score per §9), applies thresholds in code, emits ordered worklist; Kev NEVER gates (R-4) | W-MPSE sweep 3 |
| N-10 | Limite serving deployment | prompts need a pinned endpoint | vLLM + `paradigma-inc/limite-violetto` plugin deployment (per vendor README: `VLLM_PLUGINS=limite uv run --locked vllm serve ...`), model-id + prompt-SHA pinned per sweep; `limite-1b-value-model` as optional pre-filter (PROPOSED) | Ops, before sweep 1 |

Explicit non-builds (do NOT build): no Limite-in-live-path (F-1); no Kev-gated waves (R-4); no Limite prose in S-files (F-3); no new S-file `kind` values (the 6 kinds + equality/inequality/subset/recurrence/exists-unique/forall/piecewise/process/predicate-family cover the corpus); no Threshold change without D-R1/D-R2 ratification cite (G-LIM-05).

## 9. Kev question catalog (typed triage — order and priority, never admission)

Conventions: `state` = the artifact text under triage (block + fixtures + report slice). Thresholds below are PROPOSED defaults, tuned on the first sweep's Brier-equivalent (fraction of Kev-top-ranked candidates admitted by the 4-filter). Kev model pin: Kev-4B default (accuracy/byte balance), Kev-9B for calibration-sensitive reruns; all questions carry `state-SHA` in the ledger row (R-5).

| QID | Primitive | State → Question | Consumed as | Threshold (PROPOSED) |
|---|---|---|---|---|
| K-01 | `choice` | evidence-only blocks (26) → "which 5 blocks are ripest for G-LIM-03 next?" (options = block ids, context = kind + existing fixture classes) | sweep order for §7 priorities | take top-5 by P, run in that order; no cutoff |
| K-02 | `choice` | per-block mutant families (boundary/off-by-one/swap/drop/twin-break) → "which family first?" | candidate generation order inside G-LIM-03 | top-2 families first, remainder on second pass |
| K-03 | `noul` | G-LIM-02 `surplus` item → "does this surplus indicate a missing spec clause (yes) vs implementation detail (no)?" + P(yes) | triage pre-sort: yes → spec-patch queue, no → code-comment queue, human disposes both | P>=0.7 spec-queue; P<=0.3 code-queue; else human-first |
| K-04 | `noul` | AT-02 extra flip → "is this flip a legitimate cascade of the fix (yes) vs friendly fire (no)?" | pre-sort before human adjudication; NEVER auto-accepts a flip | P>=0.8 legitimate-candidate (still human-signed); else friendly-fire |
| K-05 | `score` | G-LIM-04 worklist items → rubric {1:blocked-on-missing-oracle … 5:fixtures-ready-admit-today} | priority order for wave planning | score>=4 this-sweep; 2–3 next-sweep; 1 needs N-1…N-5 first |
| K-06 | `score` | candidate mutant → rubric {1:breaks-twin … 5:minimal-clean-kill} (Limite-value-model score as an input feature, PROPOSED) | generation-order hint; admission still = 4-filter only | score>=3 run-4-filter-first; else second pass |
| K-07 | `noul` | threshold-edit diff → "does this edit preserve D-R1/D-R2 ratified constants (yes)?" | pre-sort for G-LIM-05 human review | P<0.6 → mandatory human review before re-calibrate |

Kev anti-theater rules: (a) every Kev call logs `{qid, stateSHA, modelId, distribution, ts}` to the ledger; (b) thresholds live in `kev-triage.ts`, never in prompts; (c) quarterly re-tune: fraction-admitted-at-top-rank tracked, thresholds moved by data; (d) Kev-0.8B is out-of-scope (out-of-domain acc ~0.65–0.68 per vendor evals — below triage trust).

## 10. Concrete Limite prompt shapes (one per gate — copy-pasteable skeletons)

All prompts are single-turn, block-scoped (<2k tokens), temperature=0.6/top_p=0.95. `{...}` = substituted verbatim from the named artifact. Prompts live versioned under `specs/mpse/limite-prompts/` (N-8); SHA of the prompt file is recorded per ledger row.

### P-G-LIM-01 (mathiness)
```
You are checking a MathExpr spec block for well-formedness, denotation, and count-pinning.
CLOSED GRAMMAR KINDS: [piecewise, forall, predicate-family, process, equality, inequality, subset, recurrence, exists-unique]
BLOCK:
quote: "{quote}"
expr: "{expr}"
kind: "{kind}"
TASKS:
1. WELL-FORMED: does expr parse under kind? Name the offending token if not.
2. DENOTED: list each NL content word in quote with its symbol/binding in expr, or mark UNDENOTED(word).
3. COUNT-PINNED: if the block constrains cardinality/threshold, quote the exact integer/float. Flag UNPINNED-COUNT if hedged (about/roughly/around/should).
OUTPUT (JSON only): {"verdict": "PASS"|"WELL-FORMED-FAIL"|"UNDENOTED"|"UNPINNED-COUNT", "detail": {...}}
```

### P-G-LIM-02 (translation-fidelity)
```
You are proving entanglement between a spec expr and its oracle implementation.
EXPR: "{expr}" (block {blockId})
ORACLE SOURCE:
```typescript
{oracleFunctionSource}
```
FILE LAW: every numeric comparison must be post-quantize integer; malformed input must throw OracleError.
TASKS: (a) map each expr clause to code lines (entangled[]); (b) list expr clauses with no code counterpart (gap[]); (c) list code behaviors with no expr counterpart (surplus[]).
OUTPUT (JSON only): {"entangled": [...], "gap": [...], "surplus": [...]}
```

### P-G-LIM-03 (mutant-generation, few-shot)
```
You are generating minimal adversarial fixtures for a MathExpr block. Mimic the exemplar shape exactly.
BLOCK: quote "{quote}" / expr "{expr}" / kind "{kind}" / target class "{fixtureClass}"
EXEMPLARS (same kind):
{exemplarMutant1_JSON}
{exemplarMutant2_JSON}
CONSTRAINTS: single-field perturbation of golden-week or a synthetic record; output EXACT fixture JSON {id, class, data, expect, predicateTargets, description}; expect ∈ {FIRE, SILENT}; the mutant must route to the intended oracle via class; include the SILENT/VALID twin when generating a FIRE mutant.
OUTPUT (JSON only): {"candidates": [{...}, ...]} (1-3 items)
```
Exemplar pairing by kind: inequality → mutant-7-tolerance-drift.json + mutant-8-rrr-drift.json; piecewise → mutant-6-eu4-deep-rung.json; side-inversion → mutant-3-sideinversion-v452.json + mutant-4-sideinversion-v453-silent.json; equality-count → mutant-1-40setup.json + mutant-2-13setup.json; near-edge → mutant-9-eu2-nearedge.json.

### P-G-LIM-04 (calibration-audit)
```
You are auditing a D17 calibration report. Do not evaluate code; evaluate the report.
REPORT: {d17-report.json}
BATTERY IDS: {battery.json predicate ids}
TASKS: (a) each evidence_only id → name its missing-killing-fixture class, or challenge for deletion; (b) each calibrated id → confirm ≥1 FIRE + ≥1 SILENT/VALID leg, else mark UNTWINNED; (c) batteryFingerprint equality; (d) flagged ids older than one sweep → mark STALE with owner demand.
OUTPUT (JSON only): {"promotions": [...], "deletions": [...], "untwinned": [...], "stale": [...], "fingerprintOk": true|false}
```

### P-G-LIM-05 (tolerance-proof)
```
You are reviewing a threshold change against ratified constants.
RATIFIED: {expectedSetups:24, divergenceMax:0.35, rrrFloor:2.5, slCeilingPips:36, slMinPips:4, tolerancePips:3, rows:90, zoneIDs:60} (D-R1/D-R2; spec D.4)
DIFF: {unified diff of S-file + oracle + fixture}
AFFECTED BLOCKS: {blockIds}
TASKS: verdict CONSISTENT (change preserves ratified values or cites a new ratification) or DRIFT(name, old, new, missingCite).
OUTPUT (JSON only): {"verdict": "CONSISTENT"|"DRIFT", "detail": {...}}
```

### P-AT (generic anti-theatrical adjudication, AT-01…AT-10 semantic halves)
```
You are adjudicating a decidable predicate over artifacts. Answer from the artifacts only.
PREDICATE: {predicateId + formal statement}
ARTIFACTS: {artifact excerpts with file:line}
TASKS: verdict PASS/FAIL/UNDECIDABLE with the artifact span that decides it. If UNDECIDABLE, name the missing artifact.
OUTPUT (JSON only): {"predicate": "...", "verdict": "PASS"|"FAIL"|"UNDECIDABLE", "evidence": "file:line span", "missing": null|"..."}
```

## 11. Proving the fusion is not theater (the fusion's own verification ladder)

The fusion adds inference to a deterministic harness — it must prove ITSELF under the same anti-theatrical law it enforces. Five rungs, each mechanical:

| Rung | Claim | Proof (command/artifact) | Fail = |
|---|---|---|---|
| V-1 prompts-versioned | every Limite verdict replays | `sha256sum specs/mpse/limite-prompts/*` recorded per ledger row; re-run one prompt → byte-identical prompt text | prompt drift without version bump → sweep INVALID |
| V-2 admission-is-mechanical | no mutant admitted on Limite's word | every admitted mutant has a `calibrate.ts` exit-0 run in the sweep log showing route-ok + verdict==expect + twin-silent + no-friendly-fire | admitted-without-log → mutant reverted |
| V-3 ledger-complete | every inference recorded | `wc -l limite-gate-ledger.jsonl` == prompt-call count in sweep log; each row has `{gate, subject, verdict, promptSHA, modelId, evidence, ts}` | missing row → sweep INVALID |
| V-4 twin-enforced | no UNTWINNED in the calibrate path | `twin-check.ts` exit 0; `ls mutants/quarantine/` holds all UNTWINNED | UNTWINNED in `mutants/` → re-calibrate BLOCKED |
| V-5 numbers-grounded | no prose drift | AT-10 script: numerals in any MPSE-citing doc == live `battery.json`+`d17-report.json` values (catches 19C/27E-vs-20/26 class) | UNGROUNDED → doc does not land |

First-sweep acceptance (the fusion's own DOD): V-1…V-5 all green + ≥5 evidence-only blocks promoted via the 4-filter + zero friendly-fire + `d17-report.json` re-written with `flagged==[]`. Until then the fusion is PROPOSED infrastructure, and wave gates read only `compile`/`calibrate`/`jspec-check` exits (unchanged).

## 12. Failure modes (fusion-specific — what breaks, what it looks like, what stops it)

| # | Failure | Symptom | Detection | Containment |
|---|---|---|---|---|
| FM-1 | Limite-mush admission (candidate edited by hand to pass) | mutant passes 4-filter but is not minimal / encodes the answer | twin-check + minimality review: mutant must be single-field perturbation; second reviewer (or G-LIM-02 re-run) confirms | hand-edited mutants rejected; generator re-run with tighter CONSTRAINTS |
| FM-2 | Prompt drift across Limite upgrades | same block, different verdicts, no code change | V-1 prompt-SHA + model-id per row; upgrade replays prompt pack, diffs verdicts | verdict diffs triaged as model-change, never silently adopted; prompt pack version-bumped |
| FM-3 | Limite non-math reinterpretation | verdict on a trade/market question instead of the predicate (vendor-documented limitation) | P-AT predicate shape: any verdict not citing an artifact span with file:line is UNDECIDABLE by construction | F-1: such prompts never issued; live-path questions never routed to Limite |
| FM-4 | Kev-as-gate creep (triage prob used as admission) | "Kev P=0.91 so admitted" prose in a sweep log | V-2: admission rows must cite calibrate exit-0, never a Kev distribution | R-4 enforced in `kev-triage.ts` code review: the file emits ORDER only, has no exit-code path |
| FM-5 | Friendly-fire cascade (one mutant flips a distant predicate legitimately) | AT-02 diff shows >1 flip | report-diff + K-04 pre-sort + human signature on the cascade explanation | legitimate cascades documented as coupled predicates (spec-patch), else mutant re-scoped |
| FM-6 | Threshold prose-drift (doc says 19C/27E, live is 20/26) | AT-10 FAIL | G-LIM-07 + AT-10 script per doc-landing | doc does not land until numerals == live JSON |
| FM-7 | Evidence-only parking (worklist ignored) | G-LIM-04 worklist grows across sweeps, promotions stall | K-05 score + flagged-aging rule (AT audit d) | M-wave gate: promotions-per-sweep floor (PROPOSED: >=3) or the wave does not close |
| FM-8 | Oracle-literal rot (sanctioned value hard-coded in code, fixture diverges) | AT-03 fallback-NOTE spike; G-LIM-05 DRIFT | CALIBRATE_NOTE count per sweep + G-LIM-02 surplus check | value moved back into fixture data; code holds fallback-only (current `FALLBACK` const pattern kept, never extended) |
| FM-9 | Ledger fork (two sweeps append conflicting verdicts) | same subject, different verdicts, overlapping ts | ledger query by subject orders by ts; latest does not overwrite (append-only) — conflict is visible | human adjudicates with calibrate re-run as tiebreak; both rows preserved |
| FM-10 | 1B-capability overreach (multi-hop proofs) | Limite verdicts degrade on cross-file multi-hop entanglement | scope rule: one block + one function per prompt; multi-hop split into per-hop prompts + script-joined map | prompts that exceed 2k tokens are split, never widened |

## 13. Build waves (order + gates — fits inside W-MPSE, does not rename it)

| Wave | Content | Enters with | Exits with (mechanical) |
|---|---|---|---|
| MW-0 deploy | N-10 Limite serving pinned (vLLM plugin, model-id recorded); prompt pack N-8 v1 (P-G-LIM-01…05, P-AT) | vendor README steps verified on the sweep host | `vllm serve` health + model-id in ledger header |
| MW-1 scaffolding | N-6 ledger + writer; N-7 sweep/twin/diff scripts; N-8 prompt pack landed; V-1…V-5 harness green on current 20/26 baseline | MW-0 | V-1…V-5 green with zero promotions (baseline lock) |
| MW-2 P0 sweep | §7 P0 blocks (S-1 B-1…B-5, S-3 anchors+widths, S-5 floor/ceiling/consequence/filter, S-7 clocks/hashes/honesty) through G-LIM-03 4-filter; N-3 grid harness; N-4 provenance oracle | MW-1 | >=5 P0 promotions + `calibrate` exit 0 + twin-check exit 0 |
| MW-3 P1+P2 sweep | S-2 totality grids, S-6 (N-2 oracle + fixtures), S-4 (N-1 oracle + traces), S-5 B-2 (N-5 policy) | MW-2 | 46/46 calibrated OR worklist with every remainder N-tagged (N-1…N-5) + owner + date |
| MW-4 Kev triage | N-9 `kev-triage.ts` + §9 K-01…K-07 wired to G-LIM-04 worklist ordering; thresholds tuned on MW-2/MW-3 admission data | MW-3 | ledger shows Kev-ordered sweeps; admission still 100% 4-filter (V-2) |
| MW-5 lock | G-LIM-05/07 + AT-01…AT-10 as per-PR gates; MW-1…MW-4 evidence packed into the W-MPSE wave report | MW-4 | fusion acceptance (§11: V-1…V-5 + >=5 promotions + zero friendly-fire) |

Wave-gate law (unchanged from canon): waves read `compile`/`calibrate`/`jspec-check` exits. G-LIM/Kev outputs are *inputs* to wave work, never *passes* for wave gates — until MW-5 acceptance, after which AT-01/02/06/08/10 scripts (the mech-check column) join the exit-gated set as PROPOSED promotion.

## 14. Source anchors (every Plutus-internal claim → file:line read this session)

### 14.1 S-corpus (all 7 read full)
- `PLUTUS/agent/specs/mpse/S-1-cascade-law.md` — B-1 side-match (piecewise, SIDE_INVERSION_VIOLATION, fixtures mutant-3/4), B-2 mirror-floor (f(T)=24, 40/13 CONTRADICTED), B-3 divergence (≤0.35 flag-only), B-4 sequencing (REQUIRES DXY-inverse + INVERT), B-5 consumption (SUBSET ACTIVE-EU, FORBID raw-DXY), B-6 loop (detectLoop KILL).
- `PLUTUS/agent/specs/mpse/S-2-designation-totality.md` — B-1 90-row forall, B-2 60-ID equality, B-3 exists-unique, B-4 D8 4-state cover, B-5 chain entry(N+1)==TP(N).
- `PLUTUS/agent/specs/mpse/S-3-e3-anchor-rules.md` — B-1…B-12 full (near-edge, nested-liquidity Δ1.0p EU#2, deep-rung, supply-symmetry floor(R), ladder-steps ±3p/1–2p, absorption switch, ATR floor 0.5×, 4p min, strength-driven TP edge, opposing-zone TP, TF floor, shape-gating map).
- `PLUTUS/agent/specs/mpse/S-4-pressure-laws.md` — B-1 6-state recurrence, B-2 SWEEP-only count, B-3 death-scope {30m,1H}, B-4 fortress ≥4-holds, B-5 third-mitigation TP-only, B-6 battle-break, B-7 shield order.
- `PLUTUS/agent/specs/mpse/S-5-rrr-regime.md` — D-R1 header (floor 2.5 / target 4R+), B-1 q-quantized floor (2.49 FAILS/2.50 PASSES), B-2 maximize-not-satisfice, B-3 36p ceiling (36.0 SILENT/36.4 FIRES), B-4 4p min + 0.5×ATR conjunction, B-5 rrr-blind anchors, B-6 gate-then-floor order.
- `PLUTUS/agent/specs/mpse/S-6-telescoping-law.md` — B-1 nesting-subset (4-edge containment), B-2 BoM∈{4H,1H}, B-3 30m-MoM-only, B-4 LQZ∈{1H,30m,15m} never 4H, B-5 King>General>Captain>15m authority.
- `PLUTUS/agent/specs/mpse/S-7-determinism-honesty.md` — B-1 no-wall-clock (injected-clock rule), B-2 content-hash (frozen SHAs `91294083…`/`33914c89…`), B-3 honest-data (4-fact trail), B-4 `?? 0.5`→0.05+LOUD, B-5 ×2 byte-identical + TOLERANCE_DRIFT.

### 14.2 Harness (all 4 read; calibrate head-to-mid + dispatch traced)
- `PLUTUS/agent/specs/mpse/compile.ts:1-~60` (W0 step-1 header: S-file format contract, D13 mechanical, fingerprint = sha256(block-ids+quotes), 1:1 invariant) + `run()`/exit law (0 = battery written, 1 = LOUD named failure).
- `PLUTUS/agent/specs/mpse/calibrate.ts:1-123` (header: fixture-expect comparison, data-driven dispatch, sanctioned-in-fixture, born_off EXCLUDED_BORN_OFF, founding VALID synthesized from fixtures, FALLBACK consts `expectedSetups:24/divergenceMax:0.35/rrrFloor:2.5/slCeilingPips:36/slMinPips:4/tolerancePips:3/fxPip:0.0001`) + `:124-333` (`buildIndex`/`resolveRef` 5-tier resolution: stem→norm→embedded-golden→substr→token-score; `evaluateRecord` class dispatch; `withFallback` CALIBRATE_NOTE audit log).
- `PLUTUS/agent/specs/mpse/oracle-registry.ts` (10 oracles §§1–10: mirror_floor/side_match/divergence_le/totality_forall/rrr_floor/sl_ceiling/sl_min/containment_subset/tf_restriction/no_wall_clock + composed shape_gate/near_edge; `quantize()` integer law; `OracleError` fail-closed; `ORACLES` map + `OracleName`).
- `PLUTUS/agent/specs/mpse/jspec-check.ts` (S-file contract regexes: `# S-<n>`, `spec:`, `form:`, `### B-`, per-block quote/anchor/kind/expr/oracle/fixtures; PROPOSED-count D-R2 rule; exit 0/1).
- `PLUTUS/agent/specs/mpse/battery.json` (fp `8acfe74f…`, 46/46, per-predicate `{id, spec, block, kind, oracle, fixtures}`) + `PLUTUS/agent/specs/mpse/d17-report.json` (20 calibrated ids listed verbatim in §0.3, 26 evidence-only, flagged [], born_off [], foundingControls + verdicts).
- Fixtures read: `specs/fixtures/golden-week.json` (meta week 2026-07-06, anchorMs 1783317600000, ORACLE_ISOLATION doctrine line, mondayConvergence ≤3p) + `mutants/mutant-3-sideinversion-v452.json` (LONG-on-SUPPLY 1.14469 → FIRE) + `mutants/mutant-7-tolerance-drift.json` (30-vs-3p → FIRE).

### 14.3 V6 canon + skills + library
- `PLUTUS/V6/00_CANON_CONTEXT.md` (v1.0 2026-09-15: §1 artifact contract, §2 registry V6-00…V6-12, §3 operator quotes + V6 reduction law, §4.1/4.2 measured baseline incl. 46→46 fp + 20,322-row failure DB + JESL kinds/bounds + golden levels/tolerances, §4.5 Orca fork verbs, §4.6 Jarvis/Paragon substrate, §4.7 SuperGoal/GM cards, §4.8 LuxAlgo parts, §4.9 station laws L1–L8/T1–T7, §5 verification law, §6 blockers, §7 output rules).
- `PLUTUS/V6/03_TRADING_ENGINE_DPL1.md:1-120` (§A/M1–M11 envelope: precast-gates M3, rails-guard M4, review-bind M5, journal-sink M7, paragon-ring M9; trade verb family; L1/L3/T1 boundaries).
- Skills loaded: `skill://mpse-systems` (idea→math→spec→code→test, D1–D9, MathContract PRE/POST/INV/TEMPORAL, SEL chokepoint, T2/T1/T0, gateIdea), `skill://lasme-systems` (detector/decision split, INCONCLUSIVE-never-PASS, triplet, slop screen, TEB anatomy, throw-only), `skill://paragon-substrate` (6 layers L1-math→L6-graph, brand/oracle/throw/audit laws, V2 stage chain, claim-gate Phase-B).
- `KNOWLEDGE_LIBRARY/MPSE/MPSE_KNOWLEDGE_INJECTION_PROMPT.md` (read full: lossy-NL vs lossless-math, 40/13 vs 24 parable, 20-structure table, symbol cheat sheet, math-wins law).
- Web sources (2026-09-23): Kev — https://github.com/jaredpalmer/kev, https://jevtypesafe.org/, https://openrouter.ai/docs/guides/community/jev; Limite — https://paradigma.inc/blog/limite-1b-violetto/, https://huggingface.co/paradigma-inc/limite-1b-violetto, https://github.com/paradigma-inc/limite-violetto/blob/main/README.md, https://huggingface.co/paradigma-inc/limite-1b-value-model.
- Absence proofs (this session): `glob **/*MATHEXPR*` ∅; `glob **/*CASCADE*` ∅; `glob **/*Token*Reasoning*` + `**/*11_Token*` ∅; `glob **/*V6*Blueprint*` + `**/*Master_Blueprint*` = 1 unrelated hit only; `grep \bKev\b /wt/plutus-main-66dfa4c` ∅ (Kev); `grep Limite|limite` = only `.abide/events.jsonl` enforcement hits (no design doc).

### 14.4 Numbers ledger (measured → used)
`46 blocks/46 predicates` (battery) · `fp 8acfe74f…` · `20 CAL / 26 EV / 0 flagged / 0 born_off` (live d17; canon prose 19/27 is STALE — AT-10 catches exactly this) · `9 mutants` · `24 = 8×(1+2)` · `90 = 5×3×2 rows` · `60 zone-IDs` · `0.35 / 2.5 / 4R+ / 36p / 4p / 3p / 2p / 5min` · `6 pressure states` · `8 JESL kinds / 15 nodes / 60000ms` · `20,322 failure rows (10919/8913/399/91)` · `DXY 100.945/101.14, EU 1.14395/1.14110, GU 1.33330` · `anchorMs 1783317600000` · `Limite: 1B, 131072 ctx, <300B tokens, T=0.6/top_p=0.95, AIME94.01/HMMT83.62/APEX50.80/Beyond74.25` · `Kev: 0.8B/4B/9B, noul/choice/score, /v1/systemone` · `sweep budget ≤78 calls, <2k tokens/call`.

---
*End of design. Acceptance: this file at `/tmp/kg-overhaul/v6-mpse-limite.md`. No code changed (design-only slice). Next action for Main: land MW-0…MW-5 into the W-MPSE wave plan; sibling E1/E2/E3 audit slices use §6 routing + §7 per-spec mapping for per-function Kev/Limite/gate/build assignment.*
