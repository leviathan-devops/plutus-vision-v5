# BUILD STATE — PLUTUS VISION

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

**As of 2026-10-22** · overwrite + SHA · the artefact's state, measured

---

## 1 · THE ARTEFACTS AND THEIR FINGERPRINTS

```
ARTEFACT                          SHA / ID                                        LINES
plutus-vision-v1.pine             0d20e8314ce992fc23e27f1b97fed76b981c84e78c647…  1,270   THE V1 SEAL
plutus-vision-v2.pine             282517ac06d8420e0ea6f6b0b5d0a5d1d30ec72f97e1…  (v2, the E1/E2 deliverable)
plutus-vision-v0.pine             (the SMC parent; the purge target)              852
DESIGN_BLUEPRINT_v1.2             (the WHAT — 857 L)                              —
BUILD_WORKFLOW_v2.md              (the HOW — 2,916 L)                             —
the 163-card graph                diagnostics 0 · 163/163 anchors                 —
```

**THE SEAL IS THE P1 BASE.** `0d20e831…` is the state at the start of this build. It is not modified;
it is the reference the first five waves measure themselves against.

---

## 2 · THE REPRODUCIBILITY PROOF (the fact the whole build leans on)

```
$ python3 scripts/lqz_vision_build.py
   → 1,270 lines emitted
   → sha256 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
   → EXACTLY the seal
```

**Inputs (5 modules + 1 extracted section):**

```
plutus-vision-lqz/lqz-core.pine        305 L   the liquidity detection         A-minus grade
plutus-vision-lqz/lqz-render.pine      125 L   the liquidity render            A-minus grade
plutus-vision-lqz/e1-render.pine       314 L   the E1 render                   A-minus grade
plutus-vision-lqz/e2-render.pine       102 L   the E2 path render              A-minus grade
plutus-vision-lqz/f17probe.pine         51 L   a probe                         A-minus grade
plutus-vision-v0.pine             lines 13-864  the SMC section, VERBATIM      852 L
```

**WHY THIS MATTERS:** a module edit is provable — regenerate, compare the sha, and either it changed
deliberately or the edit did not land. There is no ambiguity about whether a change took effect.

**AND THE COROLLARY:** `plutus-vision-v1.pine:3` states *"edit plutus-vision-lqz/*.pine, not this file"*.
An edit to the generated file is erased by the next build. The generator is the source of truth.

---

## 3 · THE SEAL'S INTERNAL COMPOSITION — measured, not estimated

```
REGION                      LINES        CONTENTS                                    DISPOSITION
header + stubs              1 - 12       version · the LQZ stubs                     keep
THE SMC BLOCK              13 - 864      852 L extracted verbatim from v0            PURGE (W1)
  box.new                  × 4          the supply/demand ZONE DRAWS                KEEP — the product
  line.new                 × 7          BOS / CHoCH structure lines                 PURGE
  label.new                × 9          the label trash                             PURGE
  inputs                   × 8          showInternals / showSwing / showPivots …    PURGE
THE LQZ CORE + RENDER     865 - 1270     406 L, full-width, A-minus grade            KEEP UNTOUCHED
```

**THE COUNT THAT MATTERS: `box.new == 4`.** Those four calls are the supply/demand detection. Any turn
that changes that count is a regression, whatever else it improves.

---

## 4 · WHAT THE BASELINE FAILS — the 13 anti-pattern gates, rc=1

```
$ python3 gates/anti/anti_patterns.py . pine=plutus-vision-v1.pine tree=.
  PASS A1   baked levels               no decimal literals in draw calls
  FAIL A3   silent fallback            no CARD:ABSENT / [JESL …] token
  FAIL A9   15m creep                  15m in 27 build files
  FAIL A10  market-standard vocab      choch 488 · fvg 102 · fair value gap 141 ·
                                       premium 182 · discount 183 · liquidity void 23
  PASS A11  stub wearing done          no stubs
  FAIL A12  docs as progress           progress-prose/code 5.9
  → FAIL (4 classes, 6/13 evaluated), rc=1
```

**THE SCOPE IS THE BUILD TREE.** `iter_tree()` excludes DEEPSEEK_AGENT · MIMO_AGENT · STEP_AGENT ·
Checkpoints · Ship_Packages · pine-ide* · Original_Canon_Data. Before the fix, `tree=.` reported
"15m in 428 files" — sibling checkouts, not this build.

**THE MECHANISM:** the SMC block is a fork of a generic Smart-Money-Concepts indicator — its own line 16
carries the © LuxAlgo notice. Its internal-structure module speaks the market-standard dialect that the
operator's canon does not use. **The purge is not cosmetic; it is a vocabulary correction.**

---

## 5 · THE ENVIRONMENT — the rig's facts

```
HOST            linux 6.17 · RTX 4080 Max-Q · the agent gets its OWN display, never the operator's
DISPLAY         the agent's nested weston; captured with `import -window`
CHROME          --ozone-platform=x11 (wayland surfaces fail under the nested compositor)
CDP             9222
THE APP         the Pine IDE at http://127.0.0.1:4173/app.html (the /  route is a trap)
THE API         plutus-ide/server.mjs — the LANES map, NEVER app.js
STATE           the workspace-state is the AUTHORITATIVE source — localStorage is a mirror
PINE EDITOR     HARNESS.editor.getValue() / setValue() — never a DOM textarea
RUN             HARNESS.run() returns the FULL response wrapped in res.data
FIXTURE         ?fixture=2026-07-06.md — verify the quoted header matches the request
```

**Every one of these is a measured fact from a failed attempt, not documentation.** They live here
because the rig wastes a session when it is rediscovered.

---

## 6 · THE ARTEFACT INVENTORY — what will exist when the build is done

```
NEW                                PURPOSE                                       OWNER
plutus-vision-lqz/card.pine         the card UDTs + ONE input field + parser     W2
plutus-vision-lqz/cast.pine         the four verdicts + ancestry                  W4
plutus-vision-lqz/e2-render.pine    EXTENDED: the boxes phase                     W5
plutus-vision-lqz/e3-render.pine    ENTRY · the two-branch stop · one TP          W5
sidecar/card.py                     the week-card emitter                         W3
sidecar/walls.py                    Protocol A → walls                            W3
sidecar/zfp.py                      strength + the receipt                        W3
sidecar/e1.py                       the nine pillars + confluence                 W3
sidecar/e2.py                       the cascade + the two phases                  W3
gates/*.sh                          the 30 gates                                  W0
.trident/container-test-results.json the run's evidence, machine-readable          ALL
```

---

## 7 · THE HONEST RESIDUALS — named, never hidden

```
1  THE BUILD IS AT ZERO. Nothing in §6 exists yet except the specification of it.
2  THE 30 GATES ARE SPECIFIED, NOT WRITTEN. `gates/anti/anti_patterns.py` (13 checks) is the only
   executable gate today, and it is the model every new gate copies.
3  THE E2 LINE HAS NEVER BEEN DRAWN AT THE BAR. The prior attempt measured 0.18 column-coincidence.
   The requirement is 0.900. Nothing in the design proves it is achievable in Pine — W5.T3 measures it.
4  THE TEN HELD-OUT WEEKS ARE UNNAMED. The only test that can falsify hardcoding is blocked on them.
5  THE BLIND-AGENT TEST HAS NEVER RUN. It is the only measure of whether the graph is USABLE.
6  THE SIDECAR HAS NO CODE. W3 is 8 turns of from-scratch work.
7  THE V1 SEAL'S LQZ BLOCK IS A-MINUS, NOT A. The four box draws work; they are not the final form.
```

---

## 8 · THE SIX MODULES — what each one does, and why it is graded where it is

The A-minus grade is not a comment on the code's tidiness. It means: **the module does its job on the
weeks it was shown, and it has not been proven on weeks it was not shown.** Every one of the six
inherits the same residual — the held-out test (W6) is what promotes a module from A-minus to A.

### 8.1 · `lqz-core.pine` — 305 L — the liquidity detection

```
WHAT IT FINDS     equal highs / equal lows, then the sweep that takes them
WHAT IT EMITS     a zone with a left edge, a right edge, a price band, a grade
WHAT IT DOES NOT  predict whether the zone will be respected — that is E2's job, downstream
ITS RESIDUAL      the sweep tolerance is a constant; it was tuned on the weeks it was shown
```

**WHY IT IS THE MOST LOAD-BEARING MODULE:** every downstream stage consumes its output. If it emits a
zone that is not liquidity, E2 classifies a fiction and E3 trades it. The 0.18 line ratio in the prior
attempt was downstream of this, and it is not evidence that this module is wrong — but it is not
evidence that it is right either.

### 8.2 · `lqz-render.pine` — 125 L — the liquidity render

```
WHAT IT DOES      draws the zones full-width, one box per zone, 4 total per panel
WHAT IT MUST NOT  let a label define a boundary — the box carries its own coordinates
ITS PROOF         4 box.new calls, and the only 4 in the SMC block that survive the purge
```

### 8.3 · `e1-render.pine` — 314 L — the E1 IP render

```
WHAT IT DOES      draws the nine-pillar confluence as a zone set with its score badge
WHAT IT READS     the card (once W2 lands) — TODAY it reads its own computation
ITS DEPENDENCY    face A's nine pillars; absent a card it renders face A only
```

### 8.4 · `e2-render.pine` — 102 L — the E2 path render

```
WHAT IT DOES      TODAY: nothing useful. It is the stub the two-phase render replaces.
WHAT W5 ADDS      PHASE 1 the boxes (one per structural break, anchored xloc.bar_time)
                  PHASE 2 the line (drawn to the box's FAR edge, not near)
THE MEASUREMENT   the column-coincidence ratio, ≥0.900, read from the capture
```

**THIS IS THE MODULE THE BUILD IS REALLY ABOUT.** Everything else is scaffolding around the question:
*can Pine draw the predicted path so it coincides with the price action?* The prior attempt's 0.18 is
the number that must move, and no design claim substitutes for measuring it.

### 8.5 · `f17probe.pine` — 51 L — the probe

```
WHAT IT DOES      emits diagnostic values as labels during development
ITS RISK          it is the only module whose OUTPUT is visible text — a purge target if it
                  ever prints in a shipped build
```

### 8.6 · the SMC block, lines 13-864 — the parent, verbatim

```
WHY IT IS THERE   v1 was a fork; the fork needed the SMC detection to exist at all
WHY IT IS PURGED  it speaks the market-standard dialect (CHoCH · FVG · premium/discount)
                  and the operator's canon does not
WHAT SURVIVES     the four box.new calls and every variable they read
```

---

## 9 · THE GENERATOR'S CONTRACT

```
INVOCATION     python3 scripts/lqz_vision_build.py
READS          the 5 modules in a fixed order, then the SMC slice from v0
WRITES         plutus-vision-v1.pine
INVARIANT      the output is byte-reproducible: same inputs → same sha, every time
THE LAW        the GENERATED file is never edited. An edit is erased by the next run.
               `plutus-vision-v1.pine:3` says exactly this, in the file itself.
```

**THE WIRING ORDER IS PART OF THE CONTRACT.** The card module must be ordered BEFORE the renderers
(W2.T2), because the renderers read the card's nodes. A module ordered after the renderers compiles
and does nothing — the classic silent-orphan in a concatenating build.

---

## 10 · THE SIX-LAYER DRAWING ORDER — why z-order is a gate

```
LAYER 1  the inherited face-B zones            (bottom — the context)
LAYER 2  the card's IP zones                    (the institutional overlay)
LAYER 3  the E2 phase-1 boxes                   (the structural breaks)
LAYER 4  the E2 phase-2 line                    (the predicted path)
LAYER 5  the E3 entry / stop / target           (the trade)
LAYER 6  the tokens and the score badge         (top — the verdicts)
```

**WHY THIS IS A GATE AND NOT A STYLE CHOICE:** the prior build's E2 line was drawn UNDER the zone boxes
and was invisible on the capture. It scored 0.18 partly because a line nobody can see cannot be measured.
A layer swapped is a measurement destroyed. `design/BUILD_WORKFLOW_v2.md:900` makes the order an
assertion the generator enforces, so it cannot regress by a careless edit.

---

## 11 · THE ARTEFACT CHAIN — from a bar to a pixel

```
  bars (4H/1H/30m, the loader)
    └─► E1 face A: the nine pillars → confluence /12 (+2 bonus) → zones + the 5 roles BY POSITION
          └─► E2: the cascade (first match stops) → shape + confidence + ZFP (strength, receipt)
                └─► E3: entry · the two-branch stop · one TP · the RRR floor 2.5
                      └─► the CARD (JSON, one per week) ── the fixed point
                            └─► the PASTE (A) or the HTTP read (B) ── the same card either way
                                  └─► the CAST (four verdicts, ancestry, the refusal tokens)
                                        └─► the RENDER (six layers, bar-time anchors)
                                              └─► the CAPTURE (opened, read, graded)
```

**THE CARD IS THE FIXED POINT.** Every stage before it computes; every stage after it consumes. That is
why Option A and Option B are the same product with a different delivery, and why the dashboard (W7)
cannot change the card's contract — it would break the paste.

---

## 12 · THE KNOWN DEFECTS CARRIED INTO THE BUILD

These are not surprises; they are the queue W0-W6 exists to close.

```
D1  the labels define visual boundaries in the SMC block         → W1.T2
D2  the market-standard vocabulary in 16 files                   → W1.T3 + A9/A10
D3  no ABSENT token: an empty card would render silently          → W2.T3
D4  the card has no schema — the renderers compute their own data → W2.T1
D5  the sidecar does not exist                                    → W3 (8 turns)
D6  the cast layer does not exist — nothing validates a card      → W4 (5 turns)
D7  the E2 line scores 0.18 and is occluded                       → W5.T2/T3/T6
D8  no eviction: the setup set is capped by rejection, not quality → W5.T5
D9  nothing tests for hardcoding                                   → W6.T3
D10 nothing tests whether the graph is usable                      → W6.T4
```

**EACH DEFECT'S SPECIFICATION — where the fix is defined, not merely named:**

| defect | specified in |
|---|---|
| D1 the labels define boundaries | `design/BUILD_WORKFLOW_v2.md:713` (W1) |
| D2 the market-standard vocabulary | `design/BUILD_WORKFLOW_v2.md:713` (W1) + `gates/anti/anti_patterns.py:121` (A10) |
| D3 no ABSENT token | `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:246` (§6 the card) |
| D4 the card has no schema | `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:246` (§6) |
| D5 the sidecar is absent | `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:168` (§5 L1) |
| D6 no cast layer | `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:475` (§9 L4) |
| D7 the E2 line scores 0.18 | `design/BUILD_WORKFLOW_v2.md:46` (L2 the verdict law) |
| D8 no eviction | `cards/LAW-TRADE-COUNT-CAP.md:1` |
| D9 nothing tests hardcoding | `design/BUILD_WORKFLOW_v2.md:104` (L6 the anti-cheat law) |
| D10 nothing tests usability | `forensic/BLIND_COMPREHENSION_AUDIT.md:1` |

**A defect on this list that is closed without its gate row is not closed.** It is a claim. And a
defect named without its specification is a symptom with a label — the table above is what turns each
one into work someone can pick up.
