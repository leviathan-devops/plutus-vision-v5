# PLUTUS MPSE × LIMITE MASTER BLUEPRINT v1
**Series:** MPSE_Limite (the quality-control layer of Plutus V6)
**Date:** 2026-09-17 · **Sources:** V6MPSE authoritative (378L, first-hand reads of all 5 bibles + live W0 harness) + V6MPSE-2 (398L) + V6 blueprint (524L)
**Thesis:** Limite closes the MPSE triangle — for the first time, Math-as-Spec, Code-as-Implementation, and Tests-as-Proof are held by three INDEPENDENT systems that cross-verify each other.

## CONTENTS
1. The fusion thesis (who fills each MPSE slot)
2. The 6 Limite SPEC queries (L1-L6)
3. The dual-compute verifier (anti-hallucination wall)
4. The 7 Limite gates (replacing TS assertions)
5. The 10 anti-theatrical predicates (AT-01..AT-10)
6. The 5 quality-key unlocks (U-1..U-5)
7. The Limite prompt grammar (D13 inside the prompt)
8. Determinism hardening (bridging stochastic Limite to deterministic MPSE)
9. Limite calibration (earning SPEC status)
10. The complete wiring diagram

(Sections 1-9 above in chat; section 10:)
## 10. THE AUTHORITATIVE SCOUT REFERENCE (378 lines, first-hand anchored)

# V6 MPSE x LIMITE FUSION DESIGN (AUTHORITATIVE)

**Target path:** `/tmp/kg-overhaul/v6-mpse-limite-authoritative.md` (Main ruling (b) 2026-09-23: this is the authoritative version; V6MPSE-2's `/tmp/kg-overhaul/v6-mpse-limite.md` stays for cross-reference, backed up to `/tmp/kg-overhaul/v6-mpse-limite.V6MPSE-2.1790149937.bak`)
**Status:** DESIGN (codebase untouched — READ-ONLY honored; only /tmp written) · **Date:** 2026-09-23 · **Author slice:** V6MPSE
**Baseline:** v4.5.3_CLEAN_BASELINE + MPSE battery fp `8acfe74f272bf736de101e297b731cfa97c9fdd4a1684e63363489f116af7b7e` 46/46, live d17 20C/26E/0F/0B

## 0. GROUNDING — all five named sources exist and were read first-hand

A prior occupant of the sibling path recorded all five inputs ABSENT (searched only under `/home/leviathan/.omp/wt/plutus-main-66dfa4c` — wrong root). All five live at the canon root and were read first-hand this session:

| # | Source | Real path (read) | Shape |
|---|---|---|---|
| 1 | PLUTUS_MATHEXPR_CARDS_BIBLE.md | `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT/PLUTUS_MATHEXPR_CARDS_BIBLE.md` | 1088L: S1 pure substrate + S2 E1-E10 + S12B circuit + S12C kernel flow, Iron Laws 1-14 |
| 2 | MATHEXPR_RULECARD_ARCHITECTURE_BIBLE.md | `.../MASTER_CONTEXT/MATHEXPR_RULECARD_ARCHITECTURE_BIBLE.md` | 500L: laws 1A-1P, pairs P2-1..P2-7, P3-1..P3-7, 28-tag grammar 5A, RuleCard 5B, trading table 5C, class-to-card 5H |
| 3 | 11_Token_Reasoning_Chain_Design.md | `.../MASTER_CONTEXT/11_Token_Reasoning_Chain_Design.md` | ~300L: Tokens 1-7 deterministic 70% + 8-11 shadow-LLM 30%, lanes, grounding contract, refine<=3, failure store, 30-min fix |
| 4 | PLUTUS_GOLDEN_CASCADE_23.md | `.../MASTER_CONTEXT/PLUTUS_GOLDEN_CASCADE_23.md` | ~120L: Tier A DXY-8 verbatim RRR 3.58-5.84, Tier B axis labels, Tier C 7 doctrines, Tier D EU-8/GU-7 OHLC 15/15 WIN, oracle :99 |
| 5 | Plutus_V6_Master_Blueprint_v1.md | `.../MASTER_CONTEXT/reports/Plutus_V6_Master_Blueprint_v1.md` | 524L: Bp-1 Kev pointer-readout, Bp-2 Limite math, Bp-3 TensorTrade OMS, V6 merge ~300-line Python, 13-step cycle, V6-vs-V5 |
| 6 | PLANNING_SUITE_Kev_Limite_Fusion.md | `.../MASTER_CONTEXT/reports/PLANNING_SUITE_Kev_Limite_Fusion.md` | 386L: ARCHITECTURAL intent, differential, 5 enforcement laws, 3 falsification instruments, 5 phases, Appendix-A Kev mapping + Limite table |
| 7 | S-corpus + harness (live W0) | `/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent/specs/mpse/` | S-1..S-7, oracle-registry.ts 394L, compile.ts 270L, calibrate.ts 711L, battery.json fp 8acfe74f 46/46, d17-report.json |
| 8 | Embed specs | `/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/reports/MPSE_Circuit_ShowMe.md` + `MathExpr_EWave_ShowMe.md` | Shape A/B circuit + E1-E10 adoption plan |

Live W0 facts (measured, not quoted from memory): battery.json:2-4 fp 8acfe74f + blockCount 46 + predicateCount 46 (1:1 D008); oracle-registry.ts:5-9 fail-closed header + :33-42 quantize; oracles :75-93 mirror_floor, :95-106 side_match, :108-122 divergence_le, :124-153 totality_forall, :155-182 rrr_floor (3 shapes, zero-risk THROW :175), :184-209 sl_ceiling, :211-231 sl_min, :233-273 containment_subset (inverted-band THROW :251-253), :275-289 tf_restriction, :291-325 no_wall_clock, :327-340 shape_gate, :342-379 near_edge (delta cross-check :363-372), :381-392 ORACLES export; compile.ts:3-14 contract + :28-32 BLOCK_KINDS + :73-146 D13 gate (empty quote / anchor not doc:line => D13_VIOLATION); calibrate.ts:1-29 exit truth (exit 0 = ALL-CALIBRATED-OR-BORN-OFF) + :34-59 FALLBACK sanctioned constants + founding VALID control :19-22 (synthesized from fixture truth, never a literal).

## FUSION THESIS

MPSE today already IS the triad the assignment names: **Math as the Spec** (S-corpus cards quote+anchor+kind+expr+oracle+fixtures, bible S6.1), **Code as the Implementation** (trade-computer L1-L5 + math-eval->oracle-gate, bible S12C + arch-bible P3-6/5C), **Tests as the Proof** (compile D13 exit + calibrate D17 exit + d17-report.json + golden-week + 9 mutants, bible S6.6-S6.7). V6 does NOT replace this triad — it **replaces who fills each slot**: Kev 0.6B pointer-readout replaces the shadow-LLM and all E1/E2/E3 judgments (Choice/Noul/Score over closed option sets, block-causal, single forward pass, blueprint S1.1-S1.4/S1.7); **Limite 1B replaces the arithmetic half of the oracle layer** (zone width, SL distance, RRR, fib, commission — blueprint S2.3 + suite A.5); deterministic Python keeps the **assert** (quantize-then-compare, `if rrr < 2.5: reject` — blueprint S2.4 + suite S5-law-3); TensorTrade + golden-23 + battery become the **proof** (suite S6 instruments). The invariant making fusion safe is arch-bible separation law **P3-4: compute first (math-eval), compare second (oracle-gate) — never let the gate node also compute** — Limite takes the compute seat, code takes the gate seat, and a **dual-compute verifier** (`|Limite - code| <= eps` else UNVERIFIABLE) stops fluent-but-wrong numbers passing as spec.
## 1. HOW LIMITE BECOMES THE MATH SPEC LAYER (it computes the exact numbers the pipeline must match)

### 1.1 What changes vs what does not

| MPSE slot today | V6 occupant | Anchor |
|---|---|---|
| `expr:` line in S-file (readable math over named vars, BLOCK_KINDS vocabulary) — compile.ts:28-32, bible D011 | UNCHANGED as the law shape. The S-corpus stays the source of truth; Iron Law 1 cards-before-code still governs | RULECARD 1A (arch-bible S1A) |
| `oracle:` named verdict code + `expected` static value — RuleCard {id,math,expected,tolerance,severity,provenance}, RULECARD 1B/5B | `expected` becomes PER-RUN Limite-produced: the card declares the FORM (RRR=|TP-E|/|E-SL|), Limite fills the VALUE for this trade's anchors | RULECARD 1B, 5B; S-5 B-5 consequence law |
| `oracle-registry.ts` pure TS fns computing from {entry,sl,tp} | SPLIT: Limite computes the number from bars+zones in natural math; a pure-Python shadow recompute cross-checks it; the code gate compares | RULECARD P3-4 (compute-then-compare split); V6 blueprint S2.3-S2.4 |
| `fixtures:` golden-week (SILENT) + mutants (FIRE) — calibrate.ts:15-17, bible D006 | EXTENDED: Limite calls themselves get fixtures — Tier-A RRR reproductions must come back within tolerance or the Limite call is CONTRADICTED | GOLDEN_CASCADE :19-24; RULECARD 1F |
| Doctrine quotes as legal authority (D13, compile.ts:130-146) | EXTENDED into the Limite prompt: every Limite query carries its quote+anchor; the manager refuses quoteless prompts with exit 2 | RULECARD 1B; suite S5-law-5 (doctrine feeds model offline, never runtime) |

### 1.2 The six Limite SPEC queries (exact mapping to blueprint S2.3 + suite A.5)

| # | Limite query | Inputs (from Kev state + E1/E2 outputs) | Output (steps + number) | Replaces which TS compute | S-card it instantiates |
|---|---|---|---|---|---|
| L1 | Zone width | zone top/bottom, pair pip (EU/GU 0.0001, DXY 0.01) | width=|top-bottom| = N.N pips | `containment_subset` entry/rung/top sugar (oracle-registry.ts:254-266) width leg | S-3 B-1/B-2/B-4 (near-edge entries); S-6 B-1 nesting widths |
| L2 | SL distance | zone width + Law-7 buffer 3-5p (dominant 3-5) + S1-ladder / S2-switch / S3-ATR-floor / S4-min-max context | SL distance = width + buffer = N.N pips; placement = edge +- buffer | `sl_ceiling` + `sl_min` width computation (:184-231) | S-3 B-5 (S1 ladder), B-6 (S2 switch), B-7 (S3 |E-SL|>=0.5xATR), B-8 (S4 >=4p, <=36p) |
| L3 | RRR | E/SL/TP (Limite-computed anchors) | risk=|E-SL|, reward=|TP-E|, RRR=reward/risk = N.NN | `rrr_floor` computed shape (:163-176) | S-5 B-1 (floor), B-2 (4R+ target), B-5 (consequence: rrr=computeRRR(anchors)), B-6 (filter order) |
| L4 | Fibonacci levels | swing-high wick / swing-low reaction wick | 0.382/0.5/0.618/0.786/1.272/1.618 = prices | L3-fib spiderweb rung math (bible S12C: 1.272/1.618/2.618) | S-3 T-family context; L3-fib reinforcement |
| L5 | Commission impact | gross pips, entry, 0.1% round-trip, size 100000 | cost=$X = N.N pips; net=gross-cost | NEW (no TS precedent — TensorTrade commission model, blueprint S3.2) | TensorTrade sensitivity gate (0%/0.1%/0.2%) |
| L6 | TP distance | entry to opposing-zone internal LQZ (E2-projected zone id) | TP_dist=|TP-E| = N.N pips | computeMirrorTP/computeLmvTP path (GOLDEN Tier-C :50) | S-3 B-9 (T1 edge), B-10 (T2 internal-LQZ), B-11 (T3 TF floor + |TP-E|>=1.2x|E-SL|) |

Blueprint anchors: Limite calls L1-L5 verbatim at V6-Blueprint S2.3 (zone-width 10.0p; SL 10.0+3.0=13.0p; RRR 28.5/18.5=1.54 with GATE 1.54<2.5 REJECT; fib 0.382-1.618; commission $200=20.0p net 8.5p); latency ~200ms/call, 5 calls ~=1s (vLLM on 4080); context 131k (full weeks of bars); inference vLLM temperature=0.6/top_p=0.95 RECOMMENDED — OVERRIDDEN to 0 on the SPEC path (see S1.4).

### 1.3 The Limite prompt grammar (D13 inside the prompt)

Every Limite call is a closed JSON envelope — no free prose, no threshold invention:

```json
{"query_id": "L3-rrr-eu2-mon-long", "rule_id": "S-5/B-1-floor-inequality", "quote": "RRR >= 2.5 (floor) / 4R+ (target)", "anchor": "PLUTUS_V5_FULL_BUILD_SPEC.md:1341", "inputs": {"E": 1.1411, "SL": 1.1399, "TP": 1.1446, "pip": 0.0001}, "task": "Show steps, then emit ANSWER line: RRR = |TP-E|/|E-SL| = <reward>p/<risk>p = <ratio> to 2dp.", "forbidden": ["do not judge tradability", "do not move E/SL/TP", "do not quote RRR floor as your decision"]}
```

- `quote`+`anchor` REQUIRED — manager exit-2 LIMITE_QUOTE_MISSING without them (mirrors D13_VIOLATION, compile.ts:130-146; Iron Law 2, bible :545).
- `task` names ONLY arithmetic (blueprint S2.4 NEVER-reversed table: Limite never classifies, never scores confidence, never gates).
- `forbidden` enforces S-5 B-5 consequence law (S-5-rrr-regime.md:40-47): rrr=computeRRR(anchors) with anchors rrr-blind; bending an anchor to lift RRR fires E3_DISOBEYED_E2. Limite moving E to raise RRR is the same violation class.
- Output grammar: free steps + terminal ANSWER line the parser extracts. Unparseable => CONTRADICTED (fail-closed, RULECARD 1E), never silent retry more than once (S1.4.5).

### 1.4 Determinism hardening (Limite is stochastic; MPSE is not — the bridge)

V6 blueprint serves Limite at temperature=0.6 (S2.1) — REJECTED for the SPEC path. S-7 B-1 (S-7-determinism-honesty.md:20-30) forbids wall-clock/entropy in the core; S-7 B-5 demands sha256(run1)==sha256(run2) (SC-20 x2); Iron Law 7 (bible :556) lets exit codes speak over files. Therefore:

1. Serve at temperature 0, top_p 1, fixed seed. ONNX-style determinism (suite S5-law-4) extended to Limite. Any sampling parameter !=0 => manager refusal LIMITE_NONDETERMINISTIC_CONFIG exit 2.
2. Canonicalize inputs: pip-quantized integers on the wire (quantize(v,pip) — oracle-registry.ts:33-42; Iron Law 3, bible :548). Limite sees 114110/113990/114460 + pip=1 as well as floats — the integer form is the parse anchor.
3. Parse-then-quantize: extract ANSWER, needFinite it (mirrors needFinite, :44-49), quantize at 1e-9 for ratios / 0.1 for pips (mirrors rrr_floor/sl_ceiling quanta :155-209), compare integers only. Float-ordering false positives impossible BY CONSTRUCTION (bible Myth-3 table :35).
4. Dual-compute verifier (anti-hallucination wall, extends the shadow grounding contract 11_Token S4): pure-Python code_rrr=|TP-E|/|E-SL| recomputed alongside Limite; require |limite_rrr - code_rrr| <= 0.01 (ratio) / <=0.1p (widths) else verdict UNVERIFIABLE => rollup INCONCLUSIVE (RULECARD 1E ladder; E6 rollup FAIL>INCONCLUSIVE>PASS, EWave S4). Limite disagreeing with arithmetic is a Limite failure, never a trade rejection — exact-failure-path names LIMITE_CODE_DIVERGENCE with both numbers.
5. One retry max, then CONTRADICTED: unparseable/divergent first call => exactly one identical retry (transport-flake allowance); second failure => CONTRADICTED=>FAIL with delta in the evidence anchor (RULECARD 1I: FAIL carries the delta, never a new refusal token). No bracket-repair loop (that belongs to generation kinds, not tier-1 math — MPSE_Circuit S5 failure table).
6. No wall-clock in the Limite record: no_wall_clock oracle (:291-325, WALL_CLOCK_KEYS) runs over every Limite receipt; timestamped receipt => FIRE.

### 1.5 Calibrating Limite itself (Limite must earn SPEC status per query)

Iron Law 6 (bible :553): never treat an unexercised predicate as live; Law 14 (:562): author the mutant when promoting. Applied to Limite:

- Golden reproduction: Limite L3 must reproduce all six Tier-A computable RRRs (GOLDEN_CASCADE :19-24: 4.25/4.92/4.60/3.58/3.79/5.84) from {E,SL,TP} within +-0.02, and L2 must reproduce the worked SL placements (Tier-C :51: SL 100.900 1.8p inside [100.885-100.918]; S-3 B-5 EU#2 SL 1.13990; B-6 EU#4 SL 1.13970) within +-0.1p. Miss => Limite query stays evidence_only, never calibrated (D006 three tiers, calibrate.ts:15-17).
- Mutant firing: rrr-drift (floor 1.5->1.0, S-5 B-1), tp-cap-mutant (36.4p vs 36, S-5 B-3), tolerance-drift (30-pip, S-7 B-5), mutant-5-tpcap, mutant-8-rrr-drift — Limite+gate must FIRE on each (mirrors P3-3 calibrate procedure).
- 7-leg promotion gate (E4 pattern, EWave S5 scope-row-11; arch-bible 5H): structure/validate/run/CLI-cast/negative/mutation/adversarial per Limite query before its tier flips recorded=>gating (E5 tier enforcement: gating consumer referencing non-calibrated Limite query => exit 2 NOT_CALIBRATED).
## 2. HOW LIMITE-BASED GATES REPLACE TYPESCRIPT ASSERTION CODE

### 2.1 The replacement rule (what moves, what stays)

Moves to Limite+gate: every oracle whose verdict depends on COMPUTING a number (widths, distances, ratios, levels, costs). Stays code: every oracle whose verdict depends on MEMBERSHIP/COUNT/ORDER/ABSENCE (sides, counts, divergence ceilings, TF sets, wall-clock absence, totality). This is blueprint S2.4 (Kev WHAT / Limite HOW MUCH / GATE accept-reject) made MPSE-exact:

| Oracle (oracle-registry.ts) | Verdict shape | V6 disposition | Limite computes | Code asserts | S-block |
|---|---|---|---|---|---|
| rrr_floor :155-182 (3 shapes: {rrr,floor} / {entry,sl,tp,floor} / {claimedFloor,sanctionedFloor}) | FIRE iff q(rrr)<q(2.5) at 1e-9 | LIMITE L3 + gate | RRR=|TP-E|/|E-SL| | q(RRR)>=q(2.5) + drift shape (claimedFloor<sanctionedFloor=>FIRE) | S-5 B-1/B-5/B-6 |
| sl_ceiling :184-209 / sl_min :211-231 | FIRE iff width outside [4,36] at 0.1 | LIMITE L2 + gate | width=|quantize(E)-quantize(SL)| pips | q(width)<=q(36), q(width)>=q(4) + ATR-floor >=0.5xATR (S-3 B-7, code ATR read) | S-5 B-3/B-4; S-3 B-7/B-8 |
| containment_subset :233-273 (bands + entry/rung/top sugar) | FIRE iff inner NOT-subset outer | LIMITE L1 + gate | band edges/widths in pips | integer floor>=outer.floor AND ceiling<=outer.ceiling (inverted-band THROW :251) | S-6 B-1 nesting; S-3 B-1 near-edge |
| near_edge :342-379 (ROW iff entry in [rung,top] + delta cross-check 0.05 + expectedEntry match) | ROW/CONTRADICTED | LIMITE L1/L6 + gate | entry, delta=|entry-rung| | containment + |computed-declared|>0.05=>OracleError + entry!=expected=>CONTRADICTED (mutant-9: rung 1.14100/top 1.14120/delta1.0p) | S-3 B-1/B-2/B-4 |
| divergence_le :108-122 (generic ceiling) | FIRE iff q(v)>q(bound) | CODE (Limite supplies v only when v is a computed distance; bound stays card-pinned) | optionally the measured value | ceiling holds: DIVERGENCE_MAX 0.35 (S-1 B-3), tolerancePips 3 (mutant-7) | S-1 B-3 |
| mirror_floor :75-93 / totality_forall :124-153 | VALID iff actual===expected | CODE (counts are data — RULECARD P2-4; card()/forall() toolkit, arch-bible 5A) | NOTHING (Limite never counts setups — Iron Law 9) | f(T)=24 (S-1 B-2), 90-row totality 5x3x2 (S-2 B-1), 60 zone-IDs (S-2 B-2) | S-1 B-2/B-6; S-2 |
| side_match :95-106 / shape_gate :327-340 | FIRE iff LONG-holds-SUPPLY or SHORT-holds-DEMAND | CODE + Kev (Kev proposes direction/zone-type; code checks sideConsistent) | NOTHING | D50 side-match (S-1 B-1); EU#4-deep legality (mutant-6) | S-1 B-1; S-3 B-12 |
| tf_restriction :275-289 | FIRE iff TF not in allowed | CODE + Kev | NOTHING | LQZ {1H,30m,15m} never 4H (S-6 B-4); BoM {4H,1H} only (S-6 B-2); 30m MoM-only (S-6 B-3) | S-6 B-2/B-3/B-4 |
| no_wall_clock :291-325 | FIRE iff wall-clock key present (depth<=10, cycle-safe) | CODE | NOTHING (Limite receipts are its subject, never its author) | S-7 B-1/B-5 determinism | S-7 |

### 2.2 The gate pseudocode (one Limite-backed gate, RRR floor exemplar — arch-bible P3-7 trace steps 6-7)

```python
# Gate: S-5/B-1 RRR_FLOOR_VIOLATION — Limite computes, code asserts (P3-4).
# Provenance: quote RRR >= 2.5 (floor) / 4R+ (target) at PLUTUS_V5_FULL_BUILD_SPEC.md:1341 (S-5 B-1).
def gate_rrr_floor(E, SL, TP, rule=S5_B1, pip=0.0001):
    lim = limite.query("L3", rule_id=rule.id, quote=rule.quote, anchor=rule.anchor,
                       inputs={"E": E, "SL": SL, "TP": TP, "pip": pip})  # steps + ANSWER
    if lim.status in ("UNPARSEABLE", "DIVERGENT"):                     # fail-closed (1E)
        return FAIL(rule.id + " CONTRADICTED — " + lim.reason + " (E=" + str(E) + " SL=" + str(SL) + " TP=" + str(TP) + ")")
    if E == SL:
        raise OracleError("rrr_floor", "sl", "zero risk distance — entry equals SL")  # :175
    code_rrr = abs(TP - E) / abs(E - SL)
    if abs(lim.rrr - code_rrr) > 0.01:                                    # dual-compute verifier (S1.4.4)
        return INCONCLUSIVE("LIMITE_CODE_DIVERGENCE limite=" + str(round(lim.rrr, 4)) + " code=" + str(round(code_rrr, 4)))
    if quantize(lim.rrr, 1e-9) < quantize(2.5, 1e-9):                     # the ONE floor (Iron Law 4)
        return FAIL("RRR " + str(round(lim.rrr, 2)) + " < 2.5 — SL " + str(pips(E, SL)) + "p TP " + str(pips(TP, E)) + "p", delta=2.5 - lim.rrr)
    journal.append({"rule": rule.id, "limite": lim.to_row(), "code": code_rrr, "verdict": "SILENT"})  # E1 chain
    return SILENT  # SILENT is the pass state (MPSE_Circuit S2)
```

- Zero-risk (E==SL) THROWS OracleError-equivalent (fail-closed, :175; RULECARD 1E) — never RRR=0 dressed as data.
- Drift shape preserved: {claimedFloor, sanctionedFloor} still fires when a consumer claims below 2.5 (mutant-8; S-5 B-1 boundary q(2.49)<q(2.5) FAILS).
- Filter order preserved (S-5 B-6): aggregatePos>aggregateNeg (Kev-gated, machine-1 clause) runs FIRST, this floor runs LAST — a high-RRR candidate with neg>=pos still REJECTs.
- FAIL carries the delta + SL/TP remedy format (RRR 1.59 < 3.0, SL 28p TP 39p — arch-bible P3-7 step 7; failures.db RRR_BELOW_GATE x3,410 class).

### 2.3 What the TS assertion code becomes (file-level)

- oracle-registry.ts arithmetic bodies (rrr_floor computed shape, sl_ceiling/sl_min entry/sl/pip shapes, containment_subset quantize legs, near_edge delta math) become Limite prompts L1/L2/L3/L6 + Python shadow recomputes; the comparison lines (quantize comparisons) survive verbatim as the Python gate (one pinned constant per card — RULECARD P2-5; Iron Law 4).
- trade-computer.ts:13 RRR_FLOOR 2.5 + L1-L5 verdict fusion (bible S12C) becomes gate-layer `if rrr < 2.5: Reject(...)` (V6-merge; suite S5-law-3) reading Limite L3 + Kev E3.Q1/Q2.
- computeMirrorSL/computeMirrorTP/computeSL_LMV/computeLmvTP (Tier-C :50-51; S-3 families) become Limite L2/L6 for the numbers + S-3 B-1..B-12 cards for family selection (shape-gating E2 DESIGNATES, E3 OBEYS, S-3 B-12; Kev E2.Q1 shape picks the family, Limite fills the price).
- report-v452.ts cascade/mirror/count asserts become code gates (mirror_floor, totality_forall, side_match) — Limite never touches counts/sides (Iron Law 9; RULECARD P2-4 denominator emitted+rejected=card(oracle)).
- diag-lmv-golden-fx.ts golden harness becomes golden-23 oracle + TensorTrade walk-forward (suite S6.1-6.3): >=14/15 entries at <=3p, direction+grade per forensic-38, profitable at 0.1% on >=2 unseen weeks.
## 3. HOW MPSE ANTI-THEATRICAL CRITERIA BECOME LIMITE-VERIFIABLE PREDICATES

### 3.1 D13 quote law becomes LIMITE_QUOTE_GATE (refusal, exit 2)

- Today: compile.ts:130-146 — empty quote / anchor not doc:line => D13_VIOLATION exit 1 (now exit 2 per E3 two-tier refusal, EWave S3 row 3); jspec-check.ts:60-63 companion screen; Iron Law 2 (bible :545).
- Limite form: predicate LIMITE_QUOTE_GATE(prompt) — FIRE iff quote==empty OR anchor not matching doc:line OR threshold literal in task without provenance. Manager refuses BEFORE spend (E3 refuse-before-spend; E7 caps pre-check): zero vLLM tokens burned, zero artifacts, machine-parsable LIMITE_QUOTE_MISSING <query_id> <remedy: cite doc.md:line> (mirrors [JESL ORACLE-MISSING], RULECARD 1B/P2-6).
- Why it works: the magic-ladder slop class (unnamed magic numbers — RULECARD 1B.3) is exactly what a fluent math model invents when unquoted. The prompt grammar (S1.3) makes invention unrepresentable: Limite fills {E,SL,TP} slots, never authors {floor,ceiling,tolerance}.
- Negative control (must demonstrate before calibrated): quoteless L3 prompt => exit 2 + no journal row; quote-restored rerun => row appears. (E4 7-leg negative leg.)

### 3.2 Verification-before-declaration becomes LIMITE_RECEIPT_GATE (E9 + E6 + Iron Law 7)

- Today: calibrate exit 0 = ALL-CALIBRATED-OR-BORN-OFF (calibrate.ts:1-22); D012 verdict contract; Iron Law 7 (exits over files, bible :556); arch-bible S6 delivery gate (re-read as fresh agent; every anchor verified).
- Limite form: no PASS/SILENT/TradeDecision ships without a TRIPLE receipt: (i) Limite row {query_id, steps_hash, ANSWER, quantized, code_cross, runId}, (ii) code-gate row {rule_id, comparison, delta}, (iii) chain verification chainVerified==true (E1 journal self=sha256(payload+\\0+prev); E2 runId=hash(fp+\\0+seed)[0:16]; E9 receipt {runId,verdict,chainVerified,counts} — EWave S5 pseudocode). Missing leg => UNVERIFIABLE=>INCONCLUSIVE (RULECARD 1E), reported as BLOCKED, never PASS (the PASS-on-UNVERIFIABLE false-green row, RULECARD S4-table).
- Kev-PVE interaction: Kev PVE.Q3 confidence (suite A.4: F/C/B/A/A+) never overrides the receipt gate — conf<B=>flag (V6-merge) is advisory; a B without receipts is still INCONCLUSIVE (S-7 B-4: UNVERIFIABLE terminal with reason, never a confident-looking number).

### 3.3 Exact-failure-path becomes LIMITE_FAILURE_TAXONOMY (typed errors, deltas, no silent pass)

| Limite failure | MPSE type | Verdict/rollup | Evidence anchor carries | Source law |
|---|---|---|---|---|
| Unparseable ANSWER (no ANSWER line / non-finite) | LIMITE_UNPARSEABLE (OracleError-equivalent) | CONTRADICTED=>FAIL (1 retry, then FAIL) | query_id + raw_tail_hash + remedy: re-prompt identical | RULECARD 1E (NaN=>CONTRADICTED :129-134); MPSE_Circuit S5 |
| |Limite-code|>eps | LIMITE_CODE_DIVERGENCE | UNVERIFIABLE=>INCONCLUSIVE | both numbers + inputs + pip | S1.4.4; E6 rollup |
| Zero risk (E==SL) / inverted band (floor>ceiling) | OracleError THROW | CONTRADICTED=>FAIL, wave STOPS for this trade | zero risk distance — entry equals SL (:175) / inverted band (:251-253) | oracle-registry.ts:175,251 |
| Unbound symbol (Limite cites zone id not in zoneMap) | UNBOUND_SYMBOL=>INCONCLUSIVE (math-eval.ts:138-141) + PAPER_ANCHOR_BAN | INCONCLUSIVE (member gate member(zoneId,zoneMap.zones) — RULECARD 1K/P2-3) | W-5_E1ZONE_ID_REAL x73 class | RULECARD 1K; 5H table |
| Div-by-zero in Limite steps | undefined at eval (math-eval.ts:27) => CONTRADICTED | FAIL | guard if(not(eq(den,0))) or pre-validate (1H) | RULECARD 1H |
| Threshold drift (claimedFloor<sanctioned) | RRR_FLOOR_VIOLATION drift shape | FIRE | claimed vs sanctioned (mutant-8) | oracle-registry.ts:163-168; S-5 B-1 |
| Tolerance split (display != verdict) | TOLERANCE_DRIFT (S-7 B-5; v4.5.4 M1: 3p-display/2p-verdict => 5/5 vs 4/5) | FIRE, promotion BLOCKED (E10 breaker) | the ONE GOLDEN_ENTRY_TOL 0.0003 card id (P2-5) | RULECARD P2-5; Iron Law 4 |
| Dead Limite query (never discriminates golden vs mutant) | FLAGGED{dead} | stays evidence_only, E5 refuses gating use | calibrate per-predicate FIRE-on-mutant + SILENT-on-golden (1F) | RULECARD 1F/5G; bible D006 |

Additional Iron-Law bindings (each a Limite-verifiable predicate): Law 3 (quantize-before-compare — every Limite number quantized before the gate; float eq(entry,1.14110) refused per P2-2 with tolerance 0.0003); Law 4 (one declaration — Limite never carries {floor:2.5} in inputs; OracleConflictError on re-register with different math, 1D); Law 9 (count invariant — card(setups), gte(card(mirror),card(dxy)), eq(add(emitted,rejected),oracle) — P2-4; Limite excluded from counting); Law 11 (golden levels are anchors never inputs — founding VALID control calibrate.ts:19-22 synthesized from fixture truth, never a literal; Limite prompts carry zone geometry from bars, never golden E/SL/TP as inputs); Law 10 (D-R1 tension recorded — S6 below); 35-AP screen (1N: should/approximately/reasonable in a Limite task => pre-math refusal).
## 4. THE CONCRETE WIRING — LIMITE MANAGER TOOL + LIMITE GATES + CODEBASE LOGIC

### 4.1 Process topology (extends V6-merge diagram + S12C kernel flow)

```
bars -> StateConstructor (bars->Kev text, 5ms) -> Kev ONNX
  E1 5q (zone/OBCV/mitigation/pressure/fortress)  [10ms]
  gate: neutral/conf<0.6 => no_zone; 3x_depleted => TP-only
  E2 4q (shape/day-element/cascade/freshness)      [10ms]
  gate: cascade invalid => HALT; consolidation => wait
  E3 5q (direction/quality/session/SL-envelope/shield) [10ms]
  gate: no_trade/F_reject => emit nothing
     | probabilities (argmax + confidence, temp=0 ONNX)
     v
LIMITE MANAGER (vLLM, temp=0, S1.4)
  L1 width -> L2 SL -> L6 TP_dist -> L3 RRR -> L4 fib -> L5 commission
  sequential; each <=200ms, total ~1s
  each: D13-checked prompt -> steps+ANSWER -> parse -> quantize -> code-cross -> journal row
     | Limite rows + Kev distributions
     v
GATE LAYER (pure Python if/else, <1ms each):
  G1 rrr<2.5=>REJECT (S-5 B-1) | G2 session valid (E3.Q3)
  G3 SL in [4,36]+ATR floor (S-3 B-7/B-8, S-5 B-3/B-4)
  G4 side-match (S-1 B-1) | G5 cascade-requires (S-1 B-4/B-5)
  G6 containment/nesting (S-6 B-1) | G7 totality/counts (S-2)
  G8 wall-clock absence (S-7 B-1) | G9 anchor-membership (1K)
     | accept/reject + reason
     v
TradeDecision{dir,E,SL,TP,rrr,quality,conf,session,pair,
  provenance{cardSetupId,cardZoneId,designationId,l1/l4 ids,kevRunId,limiteRunIds,gateFp}}
  -> TensorTrade OMS (execute+commission 0/0.1/0.2%+Sharpe/Sortino/drawdown+walk-forward; async)
DOCTRINE: arsumbris 649 cards -> offline Kev fine-tune
  (LoRA r=16, ~12M params, minimal-pairs none-handling 0.25->0.80) + offline Limite prompt-quote bank; NEVER at inference
```

Full-cycle latency: feed 0 + state 5ms + Kev 4x10ms + Limite 5x200ms + gates <5ms ~= 1.05s GPU (~=1.45s CPU-ONNX) — slower than the 250ms Kev-only sketch (V6-merge step list) because math SPEC costs five vLLM calls; acceptable: the 30-min shadow chain (11_Token S7) collapses to ~1s, and pairs parallelize (Promise.all fix, 11_Token S7).

### 4.2 Limite manager tool (the new executable unit — E4 shape)

```python
# limite_manager.py — node-builtin-equivalent discipline in Python: stdlib + vllm client only.
# Contract: {id, load, invoke, assert, sink} per query (E4 guard-card pattern, EWave S9 row 11).
class LimiteManager:
    def __init__(self, endpoint, model="Limite-1B-Violetto", temperature=0, seed=0,
                 battery_fp="8acfe74f272bf736de101e297b731cfa97c9fdd4a1684e63363489f116af7b7e"):
        assert temperature == 0, "LIMITE_NONDETERMINISTIC_CONFIG"  # S1.4.1
        self.run_id = sha256(battery_fp + "\\0" + str(seed))[:16]  # E2 run-identity
        self.prev = "GENESIS"
    def query(self, qid, rule_id, quote, anchor, inputs, task, quanta):
        if not quote or not re.match(r".+:\d+$", anchor):          # D13/E3 refuse-before-spend
            raise Refusal("LIMITE_QUOTE_MISSING", "cite doc.md:line", exit=2)
        prompt = render(qid, rule_id, quote, anchor, quantize_inputs(inputs), task)
        raw = vllm.complete(prompt, temperature=0, seed=self.seed)   # ~200ms
        ans = parse_answer(raw)                                      # ANSWER: <num> else UNPARSEABLE
        q = quantize(ans, quanta)                                    # Iron Law 3 — ints only
        code = shadow_recompute(qid, inputs)                         # dual-compute (S1.4.4)
        status = "OK" if abs(ans - code) <= EPS[qid] else "DIVERGENT"
        row = {"query_id": qid, "rule": rule_id, "quote": quote, "anchor": anchor,
               "inputs": inputs, "steps_hash": sha256(raw), "answer": ans, "quantized": q,
               "code": code, "status": status, "runId": self.run_id}
        row["self"] = sha256(canonical(row) + "\\0" + self.prev)
        self.prev = row["self"]                                     # E1 chain
        journal.append(row)                                          # E1/E9
        return row
```

- Registry: LIMITE_QUERIES = {L1..L6} with {rule_id, quote, anchor, quanta, eps, fixtures} — append-only, first-wins, sha256(anchor|bindings)[:12] ids (RULECARD 1D/1G).
- Caps pre-check (E7): fixture-count + per-query time budget refused up-front (CAP-UNBOUND class), never half-run.
- Breaker (E10): 3 consecutive exit-1 on same battery_fp => OPEN => promotion blocked until manual reset.
- Zero-dep analogue: stdlib + vLLM client only (Iron Law 12 spirit — law never hostage to tooling; V6 Python runtime).

### 4.3 Gate layer (deterministic Python — suite S5 laws 1-5 honored)

```python
# gates.py — Kev scores, never edits (law 1); every question carries full state (law 2);
# the RRR floor is code, not judgment (law 3); ONNX deterministic (law 4); doctrine offline (law 5).
def decide(kev, lim, ctx):
    if kev.E1.pressure == "neutral" and kev.E1.conf < 0.6:
        return Reject("no_zone")
    if kev.E1.mitigation == "3x_depleted":
        mark_tp_only(ctx.zone)                                            # E1.Q3 (A.1)
    if kev.E2.cascade == "invalid":
        return Halt("cascade invalid")                                  # E2.Q3 (A.2)
    if kev.E2.shape == "consolidation":
        return Wait()                                                     # E2.Q1
    if kev.E3.direction == "no_trade" or kev.E3.quality == "F_reject":
        return Reject("E3")                                             # A.3
    g = [gate_rrr_floor(...), gate_session(...), gate_sl_envelope(...),   # S2.2 + A.3 Q3/Q4/Q5
         gate_side_match(...), gate_cascade_requires(...), gate_containment(...),
         gate_totality(...), gate_no_wall_clock(...), gate_anchor_member(...)]
    if any(v == FAIL for v in g):
        return Reject(first_fail().reason_with_delta())
    if any(v == INCONCLUSIVE for v in g):
        return Blocked("UNVERIFIABLE — " + reasons())                   # never PASS
    pve = kev.PVE  # A.4: TP-prob score, reachability noul, confidence score
    if pve.confidence in ("F", "C"):
        return Flagged(decision, "manual review")
    return Accept(TradeDecision(..., provenance={"kevRunId": kev.run_id, "limiteRunIds": lim.ids, "gateFp": FP}))
```

- Kev never edits E1/E2 data (gate reads distributions only); Kev never asked is-RRR-good-enough (Limite computes, code gates); arsumbris never queried at inference (training offline — V6-merge doctrine box).
- Kev fallback ladder (suite S12.2): local Kev-ONNX first, Jev API for validation/debug only; never inference randomness.

### 4.4 File tree (what gets built — mirrors MPSE_Circuit S3 + EWave S6)

```
plutus-v6/                          # vanilla Python runtime (V6-merge: ~300 lines + manager)
  state_constructor.py             # bars -> Kev state text (A.1 state blocks; 30m/1H/4H + ATR + session + DXY ctx)
  kev_client.py                    # 4 calls E1.5q/E2.4q/E3.5q/PVE.3q (A.1-A.4); ONNX temp=0; argmax+conf
  limite_manager.py                # S4.2: L1-L6, D13-checked prompts, parse->quantize->cross->journal
  limite_queries/                  # one JSON per query: {rule_id, quote, anchor, task, quanta, eps, fixtures}
    L1-zone-width.json  L2-sl-distance.json  L3-rrr.json
    L4-fib.json  L5-commission.json  L6-tp-distance.json
  gates.py                         # S4.3: G1-G9 pure if/else; quantize-then-compare; typed FAILs with deltas
  shadow_recompute.py              # dual-compute verifier (S1.4.4): integer-path RRR/width/containment
  journal.py                       # E1: sha256(payload+\\0+prev); E2 runId; E9 receipt {runId,verdict,chainVerified,counts}
  receipts.py  run_identity.py  breaker.py  caps.py   # E9/E2/E10/E7 (EWave S5)
  tensortrade_wire.py              # Exchange+Portfolio+walk-forward+commission 0/0.1/0.2% (blueprint S3.3)
  tests/                           # 7-leg proof per Limite query (E4) + golden-23 + forensic-38 + x2-determinism
```

Consumers pin battery_fp + limite_registry_fp in every receipt (Iron Law 8, bible :557).
## 5. 11-TOKEN + GOLDEN-23 MAPPING (no reasoning left homeless)

### 5.1 Tokens become Kev/Limite/gate (kills the 30-minute chain, keeps its intelligence)

| Token (11_Token S2) | V4.5.4 occupant | V6 occupant | Why the mapping is exact |
|---|---|---|---|
| T1 zone-identification (incl. PHANTOM_BOM fortress exemption) | runTokens1to7 deterministic + findFortressDemand | Kev E1.Q1 (zone type {BoM,MoM,PHANTOM_BOM,LQZ,S_D}) + E1.Q5 fortress noul (A.1) | Phantom-BoM ALL-4 predicate => Kev option; shape-brain blanket-kill replaced by pointed option |
| T2 pressure-status (side/score/votes/wick-mass) | deterministic ledger | Kev E1.Q4 pressure {strong_dem...strong_sup} + S-4 lifecycle recurrence (B-1/B-2) as code guard | Pressure fundamental R04 — judgment to Kev, lifecycle math to code |
| T3 liquidity (LMV rungs, nearest LQZ) | deterministic | Kev E1 context + Limite L1 widths; shield relation S-4 B-7 (eat(shield) BEFORE touch(sdz)) stays code subset | Fuel map is geometry (Limite) + approach order (code) |
| T4 break-validation (close-beyond=invalid, wick-reclaim=valid) | deterministic | Kev E1.Q2 OBCV gate (body>=1.5xavg AND range>=1.5xATR) (A.1) | Displacement gate verbatim => noul options |
| T5 strength-comparison (impulse delta) | deterministic | Kev E2.Q1 shape {BS,WL,RWL,R,SS,consol} + S-3 B-9 T1 strength edge (Limite TP edge) | Shape chain IS the strength verdict (E2 native) |
| T6 reaction-count (THIRD-mitigation fail) | deterministic | Kev E1.Q3 mitigation {unmit,1x,2x,3x_depl} + S-4 B-5 (>=3=>TP-only) + B-4 fortress flip (>=4-held=>FORTRESS) as code | Freshness ladder E2.Q4 mirrors it (A.2) |
| T7 chain-progress (SS=>BS=>R=>WL stage) | deterministic | Kev E2.Q1+Q2 (shape + day-element {BS_day,WL_day,R_day}) + S-1 sequencing/consumption (B-4/B-5) as code | E2-designates/E3-obeys (S-3 B-12) |
| T8 forward-position (shadow.projectForward, fallback deterministicForwardPosition, conf-cap 0.70) | shadow-LLM | Kev E3.Q1 direction {long,short,no_trade} + PVE.Q2 reachability; fallback = deterministic forward (S-7 B-4 honest 0.05+AETHER_DEGRADE, never ??0.5) | 70/30 split (:50: 7 deterministic + 4 LLM) collapses: judgment=>Kev, fallback=>code; W-1_FORWARD_POSITION_NUMERIC x620 => STEP_B card (5H) |
| T9 chaining (Law-27 TP(N)=E(N+1)) | priorTp code | CODE (S-2 B-5 equality: entry(N+1)=TP(N); EU Mon-L entry 1.14110 = EU Mon-S TP 1.14110; EU chain E4=TP3 verified, GOLDEN Tier-D) | Never a model (would hallucinate the link); chain rows EU-4=EU-3TP etc. |
| T10 anchor construction (shadow.anchor + computeMirrorSL/TP) | shadow-LLM + TS | Limite L2/L6 + S-3 B-1..B-12 family select by Kev shape (E2 designates zone IDs, Limite computes prices — S-3 B-10/B-12) | EU#2 delta1.0p HIT path: nested-rung top (Limite) + SL far-edge-3p (Limite) + TP BoM-supply edge (Limite) |
| T11 validation (computeMechanicalFloor + shadow.validateProjection + refine<=3=>hard-throw=>SQLite) | floor + LLM vote | Code floor (direction-order W-3 x213=>DIRECTION_ORDER_GEOMETRY; RRR>=1.0 mechanical; macro check) + Kev PVE.Q3 confidence + gate-layer G1-G9; refine<=3=>REFINEMENT_BUDGET_3=>failure-store (5H: REFINEMENT_EXHAUSTED x399=>INFO escalate, D36) | Floor ALWAYS authority (11_Token S5); LLM vote downgraded to Kev scored signal; warnings carry context (RRR 1.4<2.0 — SL 28p TP 39p) |

Lanes preserved: E2_NATIVE / MACRO / REACTION per day per direction (11_Token S3); macro WINS divergences (D50/D59 fix) => S-1 B-3 divergence <=0.35 FLAG-only + B-4/B-5 sequencing/consumption; per-pair parallelism (Promise.all 3 pairs — 11_Token S7 fix 1) retained; SSE-idle-timeout + validate-only-on-floor-fail (fixes 2-3) inherited by the manager (one retry, S1.4.5).

### 5.2 Golden-23 tiers become pipeline stages (nothing inferred mistaken for fact)

- Tier A (DXY-8 verbatim, :19-25): Limite L2/L3/L6 calibration fixtures (reproduce E/SL/TP to RRR within tolerance) + Kev E1/E2 classification labels (SS/BS/RWL/Ladder/Whiplash). Structural notes (dip 100.838, rally 101.145, SL-survives-by-3.3p #3, #4-review-flag 101.275-vs-SL-101.25) become Limite edge-case fixtures (SL-precision gap: system 100.811 vs operator 100.77).
- Tier B (axis labels EU-29/GU-23): the closed target set for Limite L6 (Limite picks TP only from drawn labels — extends T8 grounding chosenTarget in CLOSED set, 11_Token S4).
- Tier C (doctrine: TP-internal-LQZ :50, SL-inside-next-LQZ :51, RRR>=3.5 :9/S9, dedup :53, anchor-union :54, fill-model, mirror-cascade :11): S-cards + Limite task text (each Limite query quotes its Tier-C line; S-3 B-5/B-6 ladder quotes :1822/:72 preserved verbatim).
- Tier D (EU-8/GU-7 OHLC-verified, ENTRY+TP final, warning SLs pending operator): Kev+Limite must emit ENTRY+TP within +-3p (acceptance oracle :99); warning SL rows (EU LONGs 0.91/0.55/1.83, GU 0.53/1.33 sub-3.5 as-drawn) are evidence_only until operator red-box readings supersede — Limite emits OHLC-consistent SL + flags TIER_D_PENDING, never silently fits the drawn RRR (Iron Law 11).
- Acceptance oracle (:99): all 23 at levels (+-3p entry, Tier-C SL/TP semantics, every planned RRR>=3.5) + visual overlay => V6 proof triple: (i) battery exit 0, (ii) golden-23 reproduction >=14/15 entries <=3p (suite S7.1; full 15/15 stretch), (iii) TensorTrade profitable at 0.1% on >=2 unseen weeks (S7.3).
## 6. THE RRR TENSION, RESOLVED WITHOUT SILENCE (Iron Law 10)

Recorded, not resolved (S-5:7-11 D-R1 pattern; bible Law 10, :560):

| Level | Value | Authority | Consumer |
|---|---|---|---|
| BUILD FLOOR | 2.5 | PLUTUS_V5_FULL_BUILD_SPEC.md:1341 (S-5 B-1 q(rrr)>=q(2.5), boundary 2.49 FAILS/2.50 PASSES) | Gate G1 if rrr<2.5: Reject (V6-merge; blueprint S2.3 RRR 1.54=>REJECT exemplar) |
| TARGET | 4R+ | .trident/wave-plan.md:10 (S-5 B-2: floor admits, target ranks; optimizer maximizes subject to B-1) | Ranking/sizing; never a filter |
| EXECUTED STANDARD | >=3.5 (Tier-A computes 3.58-5.84; EU/GU rows >=2.92 in spec D.2 discharge list) | Operator 2026-07-29 NOT A SINGLE ONE OF MY TRADES IS BELOW RRR=3.5 (GOLDEN :9; arch-bible 5F) | Acceptance oracle :99 (every planned RRR>=3.5); Limite L3 calibration bar |
| LEGACY DRIFT | 1.5/2.0/3.0 (four conflicting constants — arch-bible P2-1) | SUPERSEDED (single card RRR_FLOOR_VIOLATION by id; OracleConflictError kills seconds) | Mutant-8 drift probe must FIRE |

Limite computes the ratio; code compares to 2.5; acceptance checks 3.5; optimizer prefers 4R+. Any proposal to move the gate to 3.5 is a spec event with operator ratification (D-R1 ratification header pattern), never a code edit.

Related pins: SL ceiling 36 HARD (beyond it = wrong entry, repair anchor — S-3 B-8; S-5 B-3 boundary 36.0 SILENT/36.4 FIRES via mutant-5); SL min 4p (S-3 B-8/S-5 B-4; tighter of 4p vs 0.5xATR governs with Law-8/S-3 B-7); entry tolerance 3p the ONLY metric (bible Myth-3; P2-5 one-card; M1 forensic 2p/3p split killed); count f(T)=24 (S-1 B-2; founding 40+13-vs-24 derailment, RULECARD 1A.2).

## 7. RISKS + OPEN DECISIONS (with defaults — suite S12 inherited)

| # | Risk / fork | Evidence | Default / mitigation |
|---|---|---|---|
| R1 | Limite hallucinates arithmetic (fluent steps, wrong ANSWER) | BeyondAIME 74.25% is not pip-exact; failures.db W-1_NUMERIC x620 | Dual-compute verifier (S1.4.4) + quantize + one-retry-then-CONTRADICTED; Limite never the sole computer |
| R2 | vLLM+CUDA contention on the 4080 (Kev ONNX + Limite 1B + host workloads) | Blueprint S2.1 vLLM-required; suite S12.3 | 1B fits alongside; batch pairs; CPU-ONNX fallback for Kev; measure tok/s before cutover |
| R3 | Kev OOD 0.620 / confident-error 11% at >=0.9 (blueprint S1.6) | Locked-test 0.808 in-domain; 4B reaches 0.75 | Start prompt-engineered (suite S12.1 default), fine-tune on 649 cards (LoRA r=16 + pointer head + minimal pairs) when Q-mapping proven; Jev API for validation only (S12.2) |
| R4 | Parallel vs cutover (TS pipeline still reference?) | Suite S12.4 | Parallel first (Kev/Limite alongside TS, compare on golden week), cutover at S8 proof triple; TS becomes reference impl |
| R5 | Limite prompt drift (thresholds creep into tasks) | 35-AP screen (1N); BANNED_WORDS (should/approximately/reasonable) | Prompt registry append-only + OracleConflictError on re-register; CI greps tasks for numerals without provenance: |
| R6 | Journal bloat (per-verdict rows x 46 predicates x 23 trades x weeks) | E1/E9 + wave-db pattern (EWave S9: bun:sqlite, WAL, PLUTUS_MPSE_DB, chain rows + verifyChain + compact-with-aggregate) | SQLite + compact-with-aggregate-marker; receipts carry counts, not full rows |
| R7 | Commission kills edge (TensorTrade finding: 0%=>profitable, 0.1%=>loss) | Blueprint S3.2 (the single most important validation Q) | L5 commission gate pre-TensorTrade (net<0 => REJECT) + full sensitivity 0/0.1/0.2% + walk-forward train-golden=>test-unseen |
| R8 | Tier-D SL pending rows fitted as truth | GOLDEN Tier-D warning + Iron Law 11 | TIER_D_PENDING flag; ENTRY+TP gating, SL recorded-not-gating until operator red-box |

## 8. PHASED ROLLOUT (suite S6, MPSE-hardened)

- Phase 1 — Kev prototype (1 session): ONNX serve; state_constructor.py + A.1-A.4 templates; gate skeleton (code-only, Limite stubbed by shadow_recompute.py); golden-week compare (target: Kev classifications match TS E1/E2 on 15/15 entries' zones/shapes). Exit: Kev confusion matrix posted, no math claimed.
- Phase 2 — Limite math (1 session, THIS design): deploy vLLM; limite_manager.py + L1-L6 registry; dual-compute verifier; golden Tier-A RRR reproduction (6/6 +-0.02) + SL placements (+-0.1p); mutant battery (rrr-drift, tp-cap, tolerance-drift all FIRE). Exit: Limite queries calibrated per S1.5.
- Phase 3 — Doctrine fine-tune (1 training pass): 649 arsumbris cards => ~1,000 (state,questions,answers) records (mechanism cards S1.8 mapping: body>=1.5xavg AND range>=1.5xATR => OBCV pass etc.); LoRA r=16 + pointer head; A/B prompt-engineered vs fine-tuned on golden+forensic-38. Exit: direction+grade per forensic row.
- Phase 4 — TensorTrade validation (1 session): tensortrade_wire.py; commission 0/0.1/0.2%; walk-forward golden=>unseen-x2; Sharpe/Sortino/drawdown vs TS pipeline. Exit: profitable at 0.1% or documented kill-reason.
- Phase 5 — Cutover: proof triple (S5.2) green + breaker CLOSED + chainVerified:true + fingerprints pinned => Kev/Limite primary, TS reference. Zero coding-agent involvement throughout (operator ruling; V6-merge harness options A/B/C — default A vanilla Python).

## 9. ACCEPTANCE CHECKLIST (mechanical — every box a command or exit code)

```
[ ] compile exit 0 + battery_fp == 8acfe74f... (S-corpus untouched by V6: D008 1:1, 46/46)
[ ] Limite L3 reproduces Tier-A RRRs 4.25/4.92/4.60/3.58/3.79/5.84 +-0.02 (quantized compare)
[ ] Limite L2 reproduces worked SLs (100.900 in [100.885-100.918]; 1.13990; 1.13970) +-0.1p
[ ] Mutants FIRE: rrr-drift (claimedFloor<sanctioned) + tp-cap 36.4 + tolerance-drift 30p + side-inversion pair
[ ] Quoteless Limite prompt => exit 2 LIMITE_QUOTE_MISSING, zero journal rows (D13 negative control)
[ ] Dual-compute divergence injected (|lim-code|>eps) => INCONCLUSIVE LIMITE_CODE_DIVERGENCE (not PASS)
[ ] Golden-week: >=14/15 entries <=3p + every emitted RRR>=2.5 gate + acceptance RRR>=3.5 audit posted
[ ] Forensic-38: direction+grade per row (Kev); commission 0/0.1/0.2% table (TensorTrade)
[ ] x2-determinism: same card+seed twice => byte-identical receipt, chainVerified:true, invoked:0 on replay (E2)
[ ] Breaker: 3x exit-1 same fp => OPEN, promotion blocked; manual reset path demonstrated
[ ] Zero-dep audit: harness imports stdlib+vllm-client only (Iron Law 12 analogue); no golden-read path in pipeline (Law 11)
```

## 10. ANCHOR INDEX (every load-bearing claim => its line)

- Kev pointer-readout/grammar/backbone/primitives/training/envelope/role: V6-Blueprint S1.1-S1.8; questions E1.5q/E2.4q/E3.5q/PVE.3q: S1.7 + Suite A.1-A.4.
- Limite arch/perf/role/calls/latency/division: V6-Blueprint S2.1-S2.4 (L1-L5 boxes, RRR 1.54=>REJECT, temp 0.6/top_p 0.95, 74.25%, 131k, ~200msx5~=1s).
- TensorTrade env/OMS/finding/role/non-role: V6-Blueprint S3.1-S3.4 (commission 0%=>0.1% kill-finding; BSH/PBR/Stoppers/Informers; Exchange/Broker/Portfolio/Wallet).
- Merge/cycle/contribution/comparison/pi-harness: V6-Blueprint V6-MERGE + 13-step cycle (~250ms Kev-only) + V6-vs-V5 table (10k+=>~300 lines, seconds=>ms, discipline=>architectural determinism).
- Fusion intent/differential/reduced-core/laws/instruments/phases/checklist/anti-patterns/residual: Suite S1-S11 (ARCHITECTURAL; judgment-loop ONE mechanism; 5 enforcement laws; 3 falsification instruments; 5 phases).
- Cards-are-spec/standalone/quantize/unexercised/golden-as-validation/quotes-are-authority/46=19+27: CARDS_BIBLE S3 Myths 1-7 + map + D001-D012 + S6.1-S6.10 + S9.6-S9.7 + S10 Laws 1-14 + S11 recovery + S12/E1-E10 + S12B/S12C.
- Rule shape/tolerance/registry/discharge/calibration/content-address/grammar/gate-not-token/ladder/paper-anchor/surface/persistence/35-AP/temporal/empirical-seed + pairs + procedures + matrix + grammar + contract + circuit + paths + quotes + ladders: RULECARD SS1A-1P/S2/S3(P3-1-P3-7)/S4/S5A-5H/S6/S7.
- 70/30 split + token table + lanes + shadow grounding + floor/refine<=3/store + 30-min math + EU#2 walkthrough: 11_Token S1-S7 + proof (:50: 7 deterministic + 4 LLM).
- Tier-A rows/key-levels/notes + Tier-B labels + Tier-C 7 doctrines + Tier-D EU8/GU7 chains + oracle :99 + RRR>=3.5 :9 + cascade :11: GOLDEN full doc.
- S-law blocks: S-1 B-1..B-6 (side/mirror-24/diff-0.35/sequencing/consumption/loop); S-2 B-1..B-5 (90-row forall/dual-60/exists-unique/D8/chain-entry=priorTP); S-3 B-1..B-12 (near-edge/nested/deep/supply/ladder/switch/ATR/min/T1/T2/T3/gating); S-4 B-1..B-7 (lifecycle/battle/death-scope/fortress-4+/third-mitig/TP-only/broken-with-battle/shield); S-5 D-R1 + B-1..B-6 (2.5 floor/4R+ target/36 ceil/4 min/consequence/filter-order); S-6 B-1..B-5 (nesting/BoM-4H+1H/30m-MoM/LQZ-no-4H/King>General>Captain); S-7 B-1..B-5 (no-clock/content-hash/honest-data/no-0.5-default/x2).
- Harness lines: quantize + fail-closed oracle-registry.ts:5-9,33-42; oracles :75-93,:95-106,:108-122,:124-153,:155-182,:184-231,:233-289,:291-325 + composed :327-379 + ORACLES :381-392; D13 compile.ts:3-14,28-32,73-146; founding-VALID + sanctioned-in-fixture + born_off/evidence-only + exit truth calibrate.ts:1-29,34-59; fingerprint battery.json:2-4; circuit nodes/registry/profile/failures MPSE_Circuit S1-S6; E-wave rows/pseudo/criteria EWave S1-S9.

**Verdict:** MPSE survives V6 intact as the law; Limite earns SPEC status per-query through calibration, never by installation; Kev earns JUDGMENT status through golden+forensic accuracy, never by fluency; code keeps every comparison; TensorTrade keeps every P&L claim. Anything in this design without an anchor above is prose — discard it.
