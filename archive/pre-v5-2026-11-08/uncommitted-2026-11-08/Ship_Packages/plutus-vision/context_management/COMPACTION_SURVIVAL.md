# COMPACTION SURVIVAL — PLUTUS VISION

---

## ⚡ CURRENT STATE — 2026-10-26 (this block supersedes any state below it)

**THE DEPLOYED ARTEFACT (measured this session, `sha256sum`)**
```
pine-ide/ide/renderer/plutus-vision-v2.pine   653eea1a5fc4c01a744a7097c79a27e173d860402da494a05f205e2b77e80406
                                              1,863 L · the renderer bytes the IDE serves
plutus-vision-v1.pine (THE V1 SEAL, HARD STOP) 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
```
⚠ The v2 file CHANGED since the 2026-10-22 manifest refresh (`668e89d7…` → `653eea1a…`). The manifest row is
stale and the file on disk wins; the change is recorded in RUNNING_BUILD_LOG (2026-10-26).

**WHAT IS LIVE ON THIS HOST, and how it is proven**
- `computer` (~/.omp/agent/extensions/computer-use-v2/, 48 files, commit `5263655`) — a headed
  computer per instance id. Surface `weston-x11` by default, `weston-vnc` only where no display exists.
  C3 (no focus theft) is a PER-RUN BEHAVIOURAL REFUSAL, not a table cell: `core/govern.sh:125`
  `c3_check` compares the WM's `_NET_ACTIVE_WINDOW` and the top of `_NET_CLIENT_LIST_STACKING` by
  identity across EVERY 30 ms sample of the verb, and `up` tears the instance down on a breach.
- `pinebox` (scripts/pinebox/, 17 files, commit `4de2be2`) — the Pine IDE as an app layer. Ports derive
  from `--id` (`scripts/pinebox/ports.sh:21` `pb_ports_json`); the served page is rewritten at request
  time for BOTH config globals it reads (`scripts/pinebox/inject.py:38`), so `git diff HEAD -- pine-ide/`
  stays EMPTY; inputs are validated before any process starts
  (`scripts/pinebox/stages/services.sh:34` `pb_preflight`).
- The two compiled helpers: `nofocus.so` sha16 `ccc1f778d2bd`, `hostwin` sha16 `88579d713640`
  (built into `~/.cache/computer-use/lib`, keyed by source sha; a stale helper is REFUSED
  `HELPER_STALE`, never used).
- Deploy proof: `deploy.sh verify` → `DEPLOY: OK  sealed=61 files  mcp=2/2 answer
  probe=native/weston-x11`.

**THE EVIDENCE, this cycle**
- release-order rate: 0 failures in 60 `up`s with a 30 ms sampler (was 3/24, 5/45, 1/40 ≈ 11%).
- real desktop: 26/26 checks, `active=0x0 top=0xa0000a` identical before/after every step.
- pinebox seven concurrent instances: 35 distinct ports / 35 assignments, 7 slots, 7 compositors,
  0 operator-focus changes, `up --id 0` correctly REFUSED `PORT_TAKEN` against the operator's own server.
- gate chains: tool 9 gates / 0 failed; app layer 7 gates / 0 failed (both with behavioural mutants that
  make their gates FAIL).
- **AUDIT GATE: BLOCKED** (`OCR_MISSING` — no executable `ocr` on this host). No ship-ready claim is
  made for this build; the independent reviewer subagent (12 defects, all fixed) is a substitute, not
  the gate.

**WHAT IS NOT DONE** (unchanged, and named rather than implied): the E2 polyline/linefill geometry is
counted and discarded at `pine-ide/pine-station/run.mjs:163`; the guest runtime (V11) is unproven
without an image; agentOS (V12) is not built; 88 authored docs are untracked because the repo's own W-9
floor refuses them (none padded, no gate weakened).

**As of 2026-10-22** · overwrite semantics · what survives this session, and how to reload it

---

## 1 · THE THIRTY-SECOND VERSION

This session produced **the two documents that govern the build** and **the graph that grounds them**.
The build itself has not started. The first move is **W0.T1**: create the W0 worktree, boot the agent's
own display, and prove it is not the operator's. **Nothing else runs until W0.T2 is green** — 30 gates,
each watched refusing a corrupted subject.

---

## 2 · THE FIVE THINGS THAT MATTER MOST

```
1  THE CONSTRAINT      Pine cannot fetch. The indicator computes Class A; the sidecar supplies
                       Class B. Everything else follows from this one physical law.
2  THE TWO DOCUMENTS   design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md (WHAT, 857 L) and
                       design/BUILD_WORKFLOW_v2.md (HOW, 2,916 L). They are authority.
3  THE BASELINE        the v1 seal `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1`, 1,270 L, REPRODUCIBLE from its five modules.
4  THE GRAPH           163 cards, diagnostics 0, every quote anchored. It is the context layer.
5  THE FIRST MOVE      W0.T1. The harness gates every wave. Build the harness first.
```

---

## 3 · THE DECISIONS THIS SESSION MADE (and their reasons)

| # | Decision | Why |
|---|---|---|
| 1 | **Class A / Class B split** | Pine cannot fetch. A design that requires fetching from the indicator is not a design; it is a wish. |
| 2 | **The card is a JSON document, one per week** | The operator's ruling R-02. One artefact per week, vision-capable agent builds it, nothing ported. |
| 3 | **The card is a fixed point; A and B are deliveries** | The paste and the dashboard must render identically — that is the parity gate W7.T3, and it is only meaningful if the card is unchanged between them. |
| 4 | **Four cast verdicts, not a boolean** | A zone with no receipt is INCONCLUSIVE, not false. A boolean collapses "cannot tell" into "failed". |
| 5 | **The degradation contract: absent card → 80 of 100 points** | The indicator must be usable without the sidecar, and it must SAY it is degraded. Never invent an IP zone. |
| 6 | **The workflow is 7 workers / 42 turns** | The unit of work is a turn with one gate and one proof. A worker is a scope owner, not a checklist. |
| 7 | **W0 gates everything** | A gate never watched failing is a sentence. W0.T2 exercises all 30 before any feature work. |
| 8 | **The vision contract: every render turn ends in an OPENED capture** | RULES §B / the operator's law: a count is an effort receipt, a capture you did not open is not evidence. |
| 9 | **W6 is read-only and runs on unseen weeks** | The only test that can falsify hardcoding is a test on data the builder never saw. |
| 10 | **The blind agent is the graph's real test** | A graph that reads well but cannot be used is a doc pile. W6.T4 is the only measure of usability. |

---

## 4 · THE OPERATOR'S WORDS — the ones that changed the design

```
"Design this like a CAD model of something we are going to physically manufacture."
   → constraint-first, contracts, tolerances, no aspiration in place of specification

"How are you going to calculate the failure probability of a zone from the width of pixels
drawn on the screen? It's fucking irrelevant. It has no place whatsoever."
   → ZFP is STRENGTH only. A width-derived failure probability is a defect, not a formula.

"This literally could not be more of a fucking lie."
   → said of the claim that 12 of 19 library pages held no trades. The counter had searched
     for TEXT LABELS and read their absence as the absence of a trade.

"Everything needs to be set up and working immediately right now."
   → the recurring standard: a tool that is installed but not wired is not set up.
```

**These are in `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md` as R-01 … R-11, verbatim.** Reload them from
there, never from memory.

---

## 5 · WHAT THIS SESSION LEARNED THE HARD WAY (the instrument lessons)

```
· A BAD REFERENCE PROPAGATES. Five calibration examples I asserted from a 150 dpi glance were
  wrong, and three counters built on them before one flagged the conflict.

· A ZERO FROM A BLIND INSTRUMENT IS NOT AN ABSENCE. Four detectors returned confident wrong
  answers; tesseract found 0 labels on pages where the labels are visible.

· A LABEL IS NOT THE OBJECT. The trade grammar is the BOX, not the text. The operator's reference
  carries six position pairs and zero labels.

· A VERDICT INSIDE THE IMAGE IS NOT A TRADE. The freehand SL/E/T chips are ROCKETS.

· A SPEC THAT NAMES A COMMAND AND NEVER RUNS IT IS FICTION. Six of the prior spec's commands
  either failed or produced nothing. `scripts/spec_wire_verify.py` is the answer: extract every
  command, assert it against the disk, mutation-prove the checker.

· READ THE MECHANISM'S OWN EXECUTION MODEL BEFORE JUDGING ITS NUMBERS. I called the ZFP bands
  a broken partition; the doc says "apply in SEQUENCE — first match stops". A cascade has no hole.

· AN INSTALL IS NOT A WIRE. Four independent facts must agree before a graph is reachable.
```

**All four instrument failures are in `forensic/INSTRUMENT_FAILURES.md` — recorded, not deleted, because
a deleted failure is a lesson nobody learns.**

---

## 6 · THE FILES THAT MATTER

```
design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md     the WHAT
design/BUILD_WORKFLOW_v2.md                       the HOW
design/EVIDENCE_BASE.md                           the anchors behind both
design/DESIGN_BLUEPRINT_v1.0_AS_DESIGNED.md       the design of record (provenance)
context_management/OPERATOR_RULINGS_PV.md         R-01 … R-11 verbatim
context_management/CURRENT_STATE.md               what exists NOW
context_management/NEXT_STEPS.md                  the wave order
context_management/TASK_QUEUE.md                  every turn, its gate, its status
context_management/BUILD_STATE.md                 the artefact's sha and composition
cards/                                            163 cards — the graph
sources/                                          8 hubs, derived from the cards
CHARTER.md                                        the 13 authoritative sources
forensic/BLIND_COMPREHENSION_AUDIT.md             the graph's honest grade
forensic/INSTRUMENT_FAILURES.md                   the four detectors that lied
```

---

## 7 · THE RELOAD SEQUENCE (after a compaction, in this order)

```
STEP 1   read context_management/CURRENT_STATE.md            ~2 min   what exists now
STEP 2   read context_management/NEXT_STEPS.md               ~2 min   the wave order
STEP 3   read the two authority documents' HEADERS + §0      ~5 min   the constraint + the laws
STEP 4   read cards/FRAC-THREE-ENGINES.md + E2-CLASSIFICATION-MATRIX.md + MECH-ROCKETS-VS-TRADES.md
STEP 5   read context_management/OPERATOR_RULINGS_PV.md      ~2 min   the rulings in force
STEP 6   read context_management/TASK_QUEUE.md's per-turn contracts for the wave you are on
STEP 7   verify the seal: python3 scripts/lqz_vision_build.py → 0d20e831…
STEP 8   begin at the first NEXT task in TASK_QUEUE.md
```

**DO NOT SKIP STEP 7.** If the seal does not reproduce, the tree has drifted and the baseline is fiction.

---

## 8 · WHAT A RESUMED SESSION MUST NOT ASSUME

```
1  that the build has started              — it has not
2  that the 30 gates exist                 — only the 13 anti-pattern checks do
3  that the ten weeks are named            — they are not
4  that the Protocol A source is available — it is not
5  that the sidecar exists                 — it does not
6  that the E2 line works                  — its prior attempt scored 0.18
7  that the graph has been blind-tested    — it has not
8  that any ruling is negotiable           — R-01..R-11 are the operator's words
```

---

## 9 · THE ONE-LINE RESUMER

> **The design and the graph are done; the build is at zero; start at W0.T1 and do not begin feature
> work until 30 gates have been watched refusing their corrupted subjects.**

---

## 10 · THE SESSION TIMELINE — what actually ran, in order

```
PHASE 1  TAKEOVER          a prior "PV MIMO" session was absorbed (342 parts / 86 messages /
                           3h42m). Its checkpoint named two open items: the E1/E2 engines and the
                           build's execution. That is where this session started.

PHASE 2  THE GRAPH         eight parallel desks over the 13 authoritative sources → 163 cards.
                           Then independent verification: pv-verify-anchors (163/163),
                           pv-canon-terms (0 non-canon), pv-gen-hubs (hubs derived),
                           pv-l1-ingest (178 entities / 170 edges), pv-kg-gate (rc=0, 8 conditions).

PHASE 3  THE BLIND AUDIT   three agents with the graph and NOTHING else, 36 questions.
                           31 COMPLETE · 5 failed · verdict FALSIFIED AS STATED.
                           The three blocking defects: the SL contradiction, the regime-threshold
                           mismatch, and no E2-CANNOT-DO card.

PHASE 4  THE BLUEPRINT     v1.0 (449 L) — the design of record — then, after operator feedback,
                           v1.2 (857 L), the authority. The operator's correction that drove the
                           revision: "design this like a CAD model of something we are going to
                           physically manufacture."

PHASE 5  THE WORKFLOW      v2 (2,916 L). The v1 workflow was procedural: it said WHAT to do and left
                           every decision to mid-flight judgement. v2 carries, per turn: the
                           preflight check, the action, the gate, the expected oracle row, the
                           rollback, the capture protocol, and the anti-pattern refusal.

PHASE 6  THE TRADE LIBRARY five independent counters over 38 panels at 150 and 300 dpi. The result
                           is in CURRENT_STATE §7: 15 WT + 26 OBS + 2 TP, 14 found by eye,
                           2-3 trades per week, two panels per page.

PHASE 7  THE WIRING        arsumbris + semantica made reachable per-project (the four-fact
                           dependency), plus au-health.sh / au-layout.sh as the predicates.

PHASE 8  THIS DOC SET      the two logs first (fresh capture), then docs 1-9, then the gate.
```

---

## 11 · THE GRAPH BUILD — the mechanics, so it can be repeated

```
STEP 1  CHARTER.md            the operator-authored scope: the 13 authoritative sources, nothing else
STEP 2  the 8 desks            DISJOINT source assignments, each desk self-verifying its own quotes
STEP 3  pv-verify-anchors      every card's quote checked at its cited line — 163/163
STEP 4  pv-canon-terms         every card title checked against the canon lexicon — 0 violations
STEP 5  pv-gen-hubs            the 8 hub files DERIVED from the cards' back-links (never hand-listed)
STEP 6  pv-l1-ingest           the semantica layer: 178 entities, 170 relationships
STEP 7  pv-kg-gate            8 conditions, rc=0
STEP 8  the blind audit       3 agents, 36 questions, the honest grade
```

**THE LESSON THAT MADE THE GRAPH WORK:** hubs are DERIVED, never authored. A hand-written hub drifts
from its cards the moment a card is added; a derived hub is correct by construction. This is the same
principle as the generated Pine file — the artefact is built from its parts, never hand-edited.

**THE PDF ANCHOR CONVENTION:** a `.pdf` card's `:N` is a PAGE, verified against the text layer and
recorded as a page. It is NOT a line — a normaliser that assumed lines fabricated a citation into a
card (`:30` in an 18-line file). `cards/REF-*` are now exempt from the anchor fixer.

---

## 12 · THE ARSUMBRIS / SEMANTICA WIRING — the four facts that must agree

```
FACT 1  THE PATH EXISTS      workspaces.yaml pointed at MASTER_CONTEXT/Plutus — which does not exist
FACT 2  THE PID IS RIGHT     a stale pid file claimed a daemon; that pid was `manager-machine`, 4d11h —
                             PID REUSE. The liveness check must read /proc/<pid>/cmdline, never the pid alone
FACT 3  A KERNEL RUNS        two MCP entries hardcoded AU_MCP_WORKSPACE, pinning the graph to two
                             folders and disabling the adapter's own cwd fallback
FACT 4  THE VENV IS OURS     the semantica entry ran a DIFFERENT project's venv
```

**ALL FOUR FAILED AT ONCE, and the symptom was a single line on a dashboard: "engine OFF · MCP OFF".**
The remedy is one launcher per system, resolving the workspace from the session's cwd, plus two
predicates (`au-health.sh`, `au-layout.sh`) that name the failing fact rather than a boolean.

---

## 13 · THE WORKFLOW'S STRUCTURE — the parts a builder works from

```
§0   the laws                   the 8 non-negotiables (never edit generated · never edit LQZ ·
                                one gate per turn · a capture or it did not happen · …)
§1   the worker plan            7 workers, disjoint file sets, one worktree each
§2   the oracle table           30 rows — each row is an assertion about a rendered artefact
§3   the gate inventory         30 gates, each with its corrupted subject
§4   the corruption matrix      30 corrupted inputs and the refusal each must trigger
§5   the turns                  42 turns: preflight / action / gate / oracle / rollback / capture
§6   the discipline             the build discipline (`design/BUILD_WORKFLOW_v2.md:2050`)
§7   the render discipline       the six-layer order + the measurement of the line
§8   the failure catalogue      35 named failure modes and the check that catches each
§9   the vision contract        what "verified" means: an OPENED capture + a live probe
```

**WHAT MAKES IT DIFFERENT FROM THE PRIOR SPEC:** every turn carries its own gate and its own expected
oracle row. A turn that does not move its oracle row did not happen, whatever files it produced.

---

## 14 · THE TRADE LIBRARY — the measurement, and its three traps

```
TRAP 1  TWO PANELS PER PAGE. A TradeZella panel (the trades) and a TradingView panel (the analysis).
        Counting the TradingView panel reads zero and is wrong for the WEEK.

TRAP 2  THE PILL IS THE IDENTITY, not the crop label. Two crop sets are offset by one page in places;
        reconciling by label produced a false 19-vs-20 discrepancy. Reconcile by the pill's values.

TRAP 3  THE VLM CORPUS CARRIES FABRICATED LEVELS. Four entries have impossible prices
        (OBS_21 EURUSD at 1.73). Its risk:reward is a generic guess. RRR comes from the tool label
        or nowhere.
```

**THE RESULT:** 15 winning trades, 26 observations, 2 trade plans. 14 unique trades found by eye across
38 panels. 2-3 per week. And the structural conclusion: **a curated set of wins cannot yield a trade
RATE** — the Closed Positions history is the only place a rate exists.

---

## 15 · THE THIRTEEN ANTI-PATTERN GATES — the one executable standard

```
$ python3 gates/anti/anti_patterns.py . pine=plutus-vision-v1.pine tree=.
  FAIL A3    no CARD:ABSENT / [JESL …] token
  FAIL A9    15m in 27 build files
  FAIL A10   choch 488 · fvg 102 · fair value gap 141 · premium 182 · discount 183 · liquidity void 23
  FAIL A12   progress-prose/code 5.9 (graph excluded)
→ FAIL (4 classes, 6/13 evaluated), rc = 1
```

**THE CLI IS `<root> pine=… tree=…`.** Invoking it with the pine as argv[1] supplies no subjects,
SKIPs all 13, and reports PASS — which was a real fail-open defect, now fixed: `live==0 → INCONCLUSIVE,
rc=2`. Four behaviours mutation-proven (no-subject / clean-pass / A3-bites / A9-bites).

**EVERY GATE IN W0 COPIES THIS ONE'S STANDARD:** it was itself proven by REVERTING each of its 13 checks
and watching it go red. A gate that has never been watched failing is a sentence with a return code.

---

## 16 · THE EXACT STATE OF THE BUILD

```
COMPLETE   the graph · the two authority documents · the 13 anti-pattern gates · the v1 seal's
           reproducibility proof · the trade library measurement · the rulings R-01..R-11
ZERO       the 30 workflow gates · the sidecar · card.pine · cast.pine · the E2 line ·
           the E3 render · the dashboard tab
BLOCKED    the ten held-out weeks · the Protocol A source · the golden week (all operator inputs)
```

---

## 17 · THE ANCHOR INDEX — every claim in this doc, and where it is checked

**CANON claims anchor to a CARD. DESIGN claims anchor to the BLUEPRINT.** The graph holds canon only —
the card protocol, the cast verdicts and the degradation contract are DESIGN, and their authority is
`design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md`, not a card. (Getting this wrong once produced eight
anchors to cards that do not exist; the index below was verified file-by-file.)

```
CLAIM                                        ANCHOR
Pine cannot fetch                            design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:21   (§0)
Class A / Class B                            design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:145  (§4 L0)
the card IS a JESL document                  design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:246  (§6 L2)
the four cast verdicts                       design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:475  (§9 L4)
the six-layer drawing order                  design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:380
Option A now, Option B as phase 2            design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:396  (§8)
the 13 anti-patterns, wired                  design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:507  (§11)
━━━ the workflow ━━━
the verdict law (pixels only)                design/BUILD_WORKFLOW_v2.md:46    (L2)
the forbidden list                           design/BUILD_WORKFLOW_v2.md:74    (L4)
the isolation law                            design/BUILD_WORKFLOW_v2.md:84    (L5)
the anti-cheat law (four proofs)             design/BUILD_WORKFLOW_v2.md:104   (L6)
the oracle table                             design/BUILD_WORKFLOW_v2.md:365   (§2)
the turn shape + the authorized action set   design/BUILD_WORKFLOW_v2.md:517   (§4)
the 42 turns                                 design/BUILD_WORKFLOW_v2.md:590   (§5)
W0 · the rig and the gate harness            design/BUILD_WORKFLOW_v2.md:597
━━━ the canon ━━━
E1 → E2 → E3, one direction                  cards/FRAC-THREE-ENGINES.md:1
the E2 cascade stops at first match          cards/E2-CLASSIFICATION-MATRIX.md:1
E2 is two phases (boxes, then the line)      cards/E2-TWO-PHASES.md:1
the nine pillars                             cards/E1-NINE-PILLARS.md:1
the confluence /12 + the capped bonus        cards/E1-CONFLUENCE-SCORE.md:1
ZFP is strength, never width                 cards/E1-ZFP-DUAL-DEFINITION-RULING.md:1
the receipt is mandatory                     cards/E1-ZFP-RECEIPT.md:1
the E3 contract field set                    cards/E3-CONTRACT.md:1
RRR — the 2.5 floor                          cards/E3-RRR-RULING.md:1
one TP, no partials                          cards/E3-TP-RULING.md:1
the SL rule (both branches)                  cards/E3-SL-RULE.md:1
the confidence ruling (gate 65)              cards/E3-CONFIDENCE-RULING.md:1
eviction, never rejection                    cards/LAW-TRADE-COUNT-CAP.md:1
rockets are not trades                       cards/MECH-ROCKETS-VS-TRADES.md:1
the annotation grammar                       cards/REF-CHART-ANNOTATION-GRAMMAR.md:1
the week anatomy (two panels per page)       cards/REF-WTL-WEEK-ANATOMY.md:1
the VLM corpus and its fabricated levels     cards/REF-VLM-TRADE-CORPUS.md:1
━━━ the evidence ━━━
the operator's rulings, verbatim             MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:1
the four instrument failures                 forensic/INSTRUMENT_FAILURES.md:1
the graph's blind grade                      forensic/BLIND_COMPREHENSION_AUDIT.md:1
the operator's scope (13 sources)            CHARTER.md:1
━━━ the executables ━━━
the 13 anti-pattern checks                   gates/anti/anti_patterns.py:1
the v1 seal's reproducibility                scripts/lqz_vision_build.py:1
the seal's own warning against editing it    plutus-vision-v1.pine:3
```

**HOW TO USE THIS INDEX:** when a resumed session doubts a claim in this document, it reads the anchor
and checks the source. **A claim whose anchor does not support it is a defect in THIS document** — fix
the doc, do not act on the claim.
