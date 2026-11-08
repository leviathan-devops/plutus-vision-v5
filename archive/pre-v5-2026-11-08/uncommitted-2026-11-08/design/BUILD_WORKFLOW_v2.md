# PLUTUS VISION — THE BUILD WORKFLOW v2

**HONEST_CLASS**: architectural
**Status:** AUTHORITATIVE for procedure. It governs HOW the build is driven and judged.
**It is not authority for WHAT the machine is** (that is `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md`)
**nor for what the operator has ruled** (that is `MASTER_CONTEXT/` + `cards/`).

```
THIS DOCUMENT ABSORBS spec/RENDER_LOOP_WORKFLOW.md WHOLE. Sections 0.1 through 0.6 are that
document, carried VERBATIM, because it said: "This is the only workflow. Every other document in
spec/ is input to it or a record of it."
```

---

# §0 · MISSION AND SCOPE

```
THE MISSION: make a build of PLUTUS VISION that an operator can leave running overnight and
come back to a CORRECT chart — where every verdict came from a gate that looked at the artifact,
a verification card that recorded what it saw, a control that proved the gate could see, and a
money-test score that asked whether price respected the zone.

THE SCOPE, in the nouns this document governs: a VERIFICATION CARD is the unit a JUDGMENT is
made on; the GATE is the check that fails when the error recurs; the PHASE is a closed unit of the
build; the TURN is one executor step ending at a gate; the MANDATE is the law a card is judged
against; the CONTROL proves the judge can see; the REPLAY is the acceptance; the FIXTURE is the
known-good and known-bad pair; the CHART is the rendered artefact; the FRAME is its captured pixels.

THE SCOPE: this document governs the PROCEDURE and the VERIFICATION. The product is governed by
design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md; the operator's rulings by MASTER_CONTEXT/ and
cards/; the build sequence by section 6.
```

## THE SCOPE

```
| the noun                | what it is here                                   | where it is verified            |
|-------------------------|---------------------------------------------------|---------------------------------|
| verification            | the act of deciding a turn is correct             | section 3, the verdict algebra   |
| card                    | the budgeted unit the judge is shown              | section 2, vcards/              |
| gate                    | a check that exits nonzero when the error recurs  | section 3, gates/               |
| judgment                | a typed, calibrated answer from the judge         | section 3, G3 and G4             |
| phase                   | a closed unit of the build, P0..P7                | section 6                       |
| turn                    | one executor step ending at a gate                | section 7                       |
| mandate                 | the distilled law a card is judged against        | section 2, mand/                |
| control                 | the known-bad subject that proves the judge sees  | section 3.3                     |
| replay                  | anchor Monday, hide the future, score the reaction| section 0.3 T5, VC-P6-001        |
| fixture                 | the generated good and bad artifacts              | section 3.3, gates/fixtures/     |
| chart                   | the rendered artefact under judgement             | section 0.1, the rig             |
| frame                   | the captured pixels of that chart                 | section 0.1 step 1.6             |
```

# §0.1 · THE RENDER LOOP — carried verbatim from `spec/RENDER_LOOP_WORKFLOW.md`

```
RENDER IT.  SCREENSHOT IT.  LOOK AT IT.
Does the price action react to the E1 zones, the E2 path, the E3 trades?
    TRUE  -> next week, next asset
    FALSE -> debug why. That is the work.
DONE = any random week, any random asset, renders correctly and price respects it.
```

**FORBIDDEN as evidence:** grep - sha256sum - wc -l - diff - file existence - JSON schema -
counts from the renderer's own report - a compile line - a green suite - any statement about
the chart that is not read off pixels I opened this turn.

**A count is not a look.** The renderer reporting `boxes:11 labels:12` while the chart shows
nothing is the exact failure this workflow exists to catch - measured, twice, this session.

## 0.1.1 · THE RIG — exact commands (every line load-bearing)

### 1.1 Bring up the agent display

```bash
S=~/.omp/agent/managed-skills/computer-use-virtual-display/scripts/agent-display.sh
bash $S up          # -> AGENT_DISPLAY=:4  (weston pid printed)
bash $S status      # -> instance / slot / pid / endpoint / geometry
```

**LAW: never `:0` `:1` `:2` — those are the operator's.** The agent display comes from `up`.
Never improvise a weston. Never `pkill -f weston` (kills sibling agents' displays).

### 1.2 Bring up the renderer (station + rail + server)

```bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
# station :9741 (PineTS) - rail :9754 - server :9851
# pv-ide.sh owns them; if it is already up, skip to 1.3
```

### 1.3 Launch the chart INTO the agent display

```bash
CHROME=/home/leviathan/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome
bash $S app "$CHROME" \
  --user-data-dir=/tmp/pv-ide-chrome-<slot> --no-first-run --no-default-browser-check \
  --remote-debugging-port=9222 --remote-allow-origins='*' \
  --window-size=1600,900 --window-position=0,0 \
  --ozone-platform=x11 \
  --disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader \
  --app="http://127.0.0.1:9851/pine.html"
```

**★ `--ozone-platform=x11` IS MANDATORY.** Measured failure: without it chrome's ozone layer
tries Wayland first, `Failed to connect to Wayland display`, `The platform failed to initialize.
Exiting.` — chrome dies and **the chart renders into nothing.** With it, the window appears.

**★ Do not unset `XDG_RUNTIME_DIR`.** Measured: `env -u XDG_RUNTIME_DIR ... chrome` ->
`XDG_RUNTIME_DIR is invalid or not set` -> same Wayland death. Leave it; set only
`--ozone-platform=x11`.

### 1.4 Load the script with a MATCHING pair

```bash
bun scripts/pv-load.mjs plutus-vision-v2.pine DXY 1H
```

**★ THE PAIR MUST MATCH THE FIXTURE.** Measured failure on screen, verbatim:

```
FIXTURE_CELL_ABSENT: EUR/USD 1H — the fixture carries DXY 1H (HTTP 200)
```

The zones are **DXY-priced**. Loading EUR/USD bars puts them off-scale and the chart comes up
empty. The fixture is `fixtures/bars/2026-07-06.json` and it is DXY -> **pair must be `DXY`**.

### 1.5 Capture — window-scoped, never device-scoped

```bash
WIN=$(DISPLAY=:4 xdotool search --name "Plutus Vision" | head -1)
bash $S shot $WIN /tmp/pv-chart.png
```

**LAW: window-scoped only.** `shot` refuses `WIN=root` by design — *"you are explicitly
forbidden from doing device level screenshots."*

### 1.6 LOOK

```
read /tmp/pv-chart.png        <- in the SAME turn as the capture. Always.
```

## 0.1.2 · THE KNOWN FAILURE MODES (all measured — check these FIRST)

```
+----+----------------------------------+-----------------------------------------+
| #  | WHAT YOU SEE ON THE CHART        | WHAT IT IS                              |
+----+----------------------------------+-----------------------------------------+
| F1 | entirely empty desktop,          | chrome died on the Wayland ozone probe  |
|    | no window at all                 | -> missing --ozone-platform=x11         |
| F2 | chart shows FIXTURE_CELL_ABSENT  | pair != fixture. The fixture is DXY;    |
|    | with `0 bars` in the status row  | the chart asked for EUR/USD             |
| F3 | candles absent, axes present,    | the fixture is DEGENERATE —             |
|    | OHLC readout O=H=L=C             | every bar the same price                |
| F4 | candles fine, NO study drawings  | the payload reached the script but the  |
|    | (no zones, no labels, no lines)  | draw sites produced nothing             |
| F5 | drawings present but in the      | wrong price scale / off-screen          |
|    | wrong place on the y-axis        | geometry                                |
| F6 | drawings present but on the      | wrong time anchor / window              |
|    | wrong days                       |                                         |
| F7 | a zone label reads a NUMBER      | the ZFP fabrication is alive            |
|    | where the report scored nothing  |                                         |
+----+----------------------------------+-----------------------------------------+
| F8 | ONE zone extends RIGHT of the    | FORWARD EXTENSION — the law is ONE      |
|    | anchor week's Friday             | week left only. e1-render.pine:204      |
| F9 | a label reads "60% ZFP" where    | the WIDTH-RATIO fabrication:            |
|    | the report scored nothing        | f_e1CalcZFP (e1-render.pine:153)       |
| F10| the price axis spans 0.30-2.00   | an unvalidated level dragged the scale |
|    | on a 1.16 pair; candles crushed  | (e1-render.pine:186-189)                |
| F11| a green slab fills the pane      | a box whose bottom was 0:              |
|    |                                    | _body = max(_hi-_lo,..) (lqz-render:103)|
| F12| all five labels stacked at ONE   | the levels fell back to `close` instead |
|    | price (the current close)        | of the card's levels                    |
+----+----------------------------------+-----------------------------------------+
```

**F1/F2/F3 are ENVIRONMENT. F4..F12 are the INDICATOR.** Conflating them is how a session
burns a day fixing the wrong layer. **Read the status row and the OHLC readout FIRST** — they
discriminate F2 and F3 in one glance, before any code is touched.

## 0.1.3 · THE TEST SUITE — every test pixel-based

**Every test carries four things:** a stimulus · the pixel criterion · a **negative control**
(which must fail) · a **mutation** (break it, the verdict must flip). A test never seen flip is
unproven.

### T1 · DOES IT RENDER AT ALL
```
stimulus   plutus-vision-v2.pine + DXY + the 2026-07-06 fixture
criterion  read off pixels: candles present AND >=1 coloured zone band present
negative   an empty fixture -> candles present, ZERO bands
mutation   disable the render call -> zero bands
FAIL = F1/F2/F3/F4 (discriminate via the status row + the OHLC readout)
```

### T2 · ZONES AT THE RIGHT PRICES
```
stimulus   the same render
criterion  read the y-axis. Each visible band's price must equal the payload's zone price
           within 2 pips.
negative   a payload with a zone at 1.0000 -> the band must sit at 1.0000
mutation   move one zone 50 pips in the payload -> THAT band must move
FAIL = F5 (payload not reaching the render, or the render ignoring it)
```

### T3 · ZONES ON THE RIGHT DAYS
```
stimulus   the same render
criterion  the bands span the focus week — anchor Monday to the following Friday
negative   a fixture from a different week -> bands must not sit on the visible bars
mutation   shift the anchor one week -> the bands must shift one week
FAIL = F6 (window / anchor wrong)
```

### T4 · ZFP IS HONEST
```
stimulus   a payload where one zone has NO report value
criterion  that zone's label reads `ZFP n/a` — read off the pixels
negative   a zone the report DID score reads its real number
mutation   restore f_e1CalcZFP -> the `n/a` zone starts reading a NUMBER
FAIL = F7/F9 (the fabrication is alive)
```

### T5 · ★ THE MONEY TEST — DID PRICE REACT
```
stimulus   a week with NO report  (cv-2026-04-13 / -05-04 / -06-15 / -06-29 / -08-24)
criterion  for EVERY rendered E1 zone, read the chart: did price reverse, reject, or hold
           at that level?  score N zones / M reacted
negative   a zone at a price price ignored -> must NOT be counted
mutation   (not mutable — this measures reality, not the code)
FAIL = the zones are wrong (UPSTREAM DATA) or the render is wrong (T2/T3 would catch that)
```

**T5 on a week WITH a report proves nothing** — a zone table transcribed from a report is
guaranteed to match that report's week. **Only an un-fitted week tests the indicator.**

**T5 RUNS ON EVERY RENDER TURN, NOT AT THE END OF THE BUILD.** It is a per-turn criterion
(§8, the G block), and its N/M lands in the record row (§0.5) on every turn. A build that judges
the reaction only at P6 is the "build it all, test at the end" pattern this workflow exists to kill.

### T6 · THE E2 PATH
```
criterion  the drawn chain passes through where price actually went
mutation   break the derivation -> the path must change
FAIL = the derivation is wrong
```

### T7 · THE E3 TRADES
```
criterion  entry / SL / TP boxes: would the entry have hit TP before SL? R multiple
FAIL = the setup logic is wrong
```

## 0.1.4 · THE DEBUG TREE — when FALSE

```
  a  did ANYTHING render?              no  -> F1/F2/F3 (env) or F4 (draw sites)
  b  zones at the right PRICES?        no  -> F5 -> the payload is not reaching the render
  c  zones on the right DAYS?          no  -> F6 -> window / anchor
  d  ZFP honest?                       no  -> F7/F9 -> the fabrication
  e  zones correct at right price+time, but price did NOT react?
         -> THE ZONES ARE WRONG. UPSTREAM DATA. Not the indicator.
```

**(e) is the line that matters most.** If the indicator faithfully draws a zone at the right
price and time and price sails through it, the indicator did its job and the *zone* was bad.

## 0.1.5 · THE RECORD — one row per loop, forever

```
week | asset | F# (if any) | E1 zones N/M | E2 path | E3 R | verdict | note
```

Over days that table is the progress. **A failure class that repeats becomes the fix list.**

**THE ROW IS WRITTEN BY THE GATE, NEVER BY THE EXECUTOR** (§3.5). The executor's words go in a
second column; the numbers come from the machine.

## 0.1.6 · WHAT THIS WORKFLOW FORBIDS

```
X reporting a count as a render              X a verdict from an unopened PNG
X fixing the indicator when the fixture is degenerate
X testing on the week the zones were transcribed from
X any grep/hash/existence/diff as a PASS reason
X device-level screenshots
X touching :0 :1 :2
X improvising a weston instead of agent-display.sh
```

---

# 1 · THE PSTACK SUBSTRATE — the drive engine, mandatory

pstack (Lauren Tan / `poteto`, SpaceXAI) is the default operational engine. Installed at
`~/.omp/agent/skills/pstack-*` (47 skills). A workflow that does not run on it is rejected on sight.

```
1  pstack-create-verification-skill   generates verify-<app>/SKILL.md:
      LAUNCH / DOCTOR / DRIVE / EVIDENCE / CLEANUP  + features/
      + "prove the generated skill before handing it over" — run it once, end to end.
      IT WRAPS THE RIG OF 0.1. IT DOES NOT REPLACE IT: the commands of 0.1 remain the
      canonical way to bring the chart up, load it and capture it. If the skill is absent,
      0.1 is the fallback and the build still runs. NOTHING IN THIS WORKFLOW MAY DEPEND ON
      AN ARTIFACT THAT IS NOT ON DISK.

2  THE FEATURE MAP      the coverage DENOMINATOR. A proof that drives one convenient entry
                        point is INCOMPLETE when the map lists others.

3  pstack-show-me-your-work   a TSV decision trail: one row per decision.

4  THE PRINCIPLES (loaded on trigger)
      principle-encode-lessons-in-structure   the 2nd occurrence of a failure class becomes a
                                              CHECK in the gate, never a paragraph
      principle-attack-the-premise            two fixes failing the SAME gate -> the PREMISE is
                                              wrong; take a census
      principle-prove-it-works                verify against the real artifact
      principle-test-behavior-not-implementation
      principle-never-block-on-the-human
      principle-guard-the-context-window
```

**THE TRUST CURVE:** P0 one executor, every turn watched, the gate being CALIBRATED. P1 one
executor, every turn gated, the operator opens every frame. P2 one-to-two, a gate PASS must exist
before the next turn opens. P3-P4 two-to-three on disjoint files. P5 three, only gate FAILs
surface. P6 unattended replays. P7 parity gates. **SCALE ONLY WHEN THE GATES HAVE PROVEN THEY
CAN SAY NO.**

---

# 2 · THE LOOK — THE ACCEPTANCE

**THE PASS IS A LOOK. NO GATE SAYS PASS.**

The build is correct when the golden week's chart, rendered on the golden week's real bars,
SHOWS the golden week's zones at their known prices, sitting on the actual candlesticks — and
the vision judge has LOOKED at that frame and said so.

```
THE TARGET   2026-07-06 - DXY 1H - fixtures/bars/2026-07-06.json
             382 bars, 2026-06-22 -> 2026-07-14, range 100.558 - 101.800
THE ZONES    the canon's zone table for that week
             MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:3412
             ("DXY Zone: RESISTANCE CEILING at 99.50-99.65 | EXTREME (12/14) | ZFP: 8%")
             and the July 6-10 backtest evidence in
             MASTER_CONTEXT/HANDOVER_37_FUNDAMENTAL_LAWS.md
THE LOOK     render -> capture -> OPEN -> ask the vision judge ONE question:
             "Count how many of these N zones are visibly present at the correct price on the
              candlesticks. Answer with the number."
THE NUMBER   zone_accuracy = (zones visibly present at their price) / (zones in the card)
THE BAR      zone_accuracy >= 0.95
```

**WHY THE GOLDEN WEEK IS THE ACCEPTANCE, AND IT IS NOT CHEATING.**
```
The golden week's card is the SPEC for the render, not the answer. The test is whether the
RENDER places each zone at its price on the REAL bars — a valid test of the render.
And if the render is right for one week, it is right for every week: THE EQUATIONS DO NOT
CHANGE WITH THE WEEK. A held-out set is a LATER generalisation check (P8), NEVER a
precondition for correctness.

THE OPERATOR RULED IT: proving the maths on the fully specified week IS proving the maths.
Do not make the operator supply a test set to validate a calculation he already specified.
```

**THE CARD — how the judge is told what to look for.** The card is the SUBJECT of the look, not
a certification:

```
+------------------------------------------------------------------------------------+
| LOOK CARD                                            budget ~1,500 tok            |
+------------------------------------------------------------------------------------+
| IDENTITY   phase - target week - pair - the feature being looked at                  |
| SUBJECT    the zone prices the card holds, and the frame's measured numbers          |
| QUESTION   ONE snap claim: "are these N zones visible at these prices on the          |
|            candlesticks?" — a compound question scores mid-range and judges nothing  |
| BUDGET     the judge's window is 16,384 tokens. It does not need the corpus; it needs |
|            the zone list and the frame.                                             |
+------------------------------------------------------------------------------------+
```

---

# 3 · THE FILTERS — REJECT, NEVER PASS

**EVERY MECHANICAL CHECK IS A FILTER. ITS EXIT CODE SAYS: "this frame is eligible to be LOOKED
at" (0) or "REJECT - not acceptable, and here is why" (1).**

```
**NO FILTER EVER CERTIFIES A BUILD. THE CERTIFICATION IS THE LOOK.**

A green suite that says "pass" is the exact failure this workflow exists to kill: the previous
build had eight layers of green gates and shipped a chart with NO CANDLES IN IT.
```

```
FILTER          REJECTS WHEN                                                   EXIT
-------          ----------                                                       ----
F-RIG           the rig did not answer: F1 / F2 / F3                           1 + the F#
F-DEGENERATE     the fixture is degenerate: O=H=L=C                             1
F-CANDLES        fewer than 20 candle bodies                                    1
F-SHARE          candles under 40% of the pane height, or under 60% of the     1
                pane width                                                      1
F-FILL           one colour over 40% of the pane (the slab)                    1
F-BANDS          a band over 15% of the pane, or the zones over 60% of it      1
F-LABELS         fewer than N distinct label prices (the stack at close)       1
F-AXIS           the axis does not bracket the bars, or a zone sits more than  1
                 0.6 of the candle range away from it                           1
F-FORWARD        a zone extends right of the anchor Friday (F8)                1
F-ZFP            a width ratio printed under the ZFP name (F7/F9)              1
F-STUB           an accessor returns a constant where a computation belongs    1
F-FRESH          the rendered artefact's sha is not the source's               1
F-JUDGE-BLIND    the judge affirms the known-bad slab                           VOID -> repair
```

**THE KNOWN-BAD FIXTURE IS GENERATED, NOT BORROWED** — a fixture taken from the build rots with
the build. A generated chart and a generated slab cannot.

**A REJECTED FRAME IS FIXED AND RE-RENDERED. IT NEVER ENDS THE RUN.**

## 3.1 · THE CALIBRATION LAW — thresholds are derived, never chosen

```
  1  LABEL frames with known verdicts. The generated good/bad pair is the floor; the golden
     week and its variants grow the set.
  2  SWEEP the threshold over 0.5 / 0.6 / 0.7 / 0.8 / 0.9. Record precision and recall.
  3  READ the maximum and the spread.
        maximum < 0.5    -> THE QUESTION IS BROKEN, not the threshold. Rewrite the question.
        spread  < 0.25   -> the question does not discriminate. Rewrite the question.
  4  POSITIVE control >= 0.85 and NEGATIVE control <= 0.15 on EVERY arm.
  5  Only then does the threshold exist, as a DERIVED constant with its sweep beside it.
```

**Never lower a threshold to catch a broken question. That admits the whole corpus and destroys
the signal.**

## 3.2 · THE MEASURED JUDGE — already proven on this host

```
  G3 semantic    the judge reads the look card and answers whether the CLAIM matches the
                 MEASUREMENTS.  Measured: 0.945 on a matching state, 0.023 on a non-matching
                 one - a gap of 0.922.
  G4 perception  the judge reads the FRAME and answers what is on it.  Measured on the two
                 frames that broke the last build:
                     GOOD frame   choice 'candlestick chart' 1.000   score 2.00 / 4
                     BAD  frame   choice 'solid block'       1.000   score 1.23 / 4
                 every primitive FLIPS between a real chart and the slab.
```

---

# 4 · THE RUN NEVER STOPS

```
THE RUN DOES NOT STOP FOR ANY REASON.

  a filter rejects          -> fix the OWNER LAYER (section 5), re-render, continue
  the judge is blind        -> repair the JUDGE (resolution, prompt, model), continue
  a worker dies             -> respawn it with a fresh brief
  the provider rate-limits  -> switch model, continue
  a phase cannot close      -> record it, move on, come back
  the fixture is stale      -> regenerate it, continue
  a filter is wrong         -> fix the FILTER, re-run, continue

THE ONLY END: the golden week's zone_accuracy >= 0.95, the frame is on disk, and the record
is complete.

THE OPERATOR IS NEVER CONSULTED TO ADVANCE THE BUILD. Not for a test set, not for a
judgement, not for permission. The judgement is the LOOK, and the LOOK is the agent's.
```

## 4.1 · THE FOUR THINGS THAT MAKE WAKING UP TO A CORRECT BUILD POSSIBLE

```
  1  THE HOOK      .githooks/pre-commit refuses any commit touching a judged artefact, a .pine,
                   or a proofs/ frame WITHOUT a look record row naming its card.
  2  THE LEDGER    the record rows (0.1.5) + the show-me-your-work TSV + one card verdict per
                   looked unit.
  3  THE CONTROL   every run proves the judge can see before it is believed.
  4  THE RECORD    state/RESUME.md: last PASS card id - the open phase - the next turn - the
                   frozen artefact sha. A cold agent reads the record, not the chat.
```

## 4.2 · WHAT "DONE" MEANS — the completion bar

```
DONE = ALL FOUR OF THESE, and the operator is not consulted about any of them:

  1  THE GOLDEN WEEK LOOK      2026-07-06 DXY 1H rendered on the real bars, LOOKED at by the
                                judge: zone_accuracy >= 0.95, the zones visible at their prices
                                ON the candlesticks, the price action visible.
  2  THE TEN BATTLE RUNS        10+ of the fixtures on disk rendered and scored, every one
                                passing the filters and the look, zero regressions across them.
  3  THE THREE BLIND AGENTS     three agents spawned with ZERO project context - given only
                                the record and the documents - each reproduces the week, and
                                each reproduction is itself filtered and looked at. 3 of 3.
  4  THE RECORD COMPLETE        every row written, every frame on disk, every verdict readable.

NEVER: the executor says it is finished.
NEVER: every todo is ticked.
NEVER: a filter is green. A green filter only means the frame was ELIGIBLE to be looked at.
```

## 4.3 · THE PHASE-EXIT CLAUSE — a phase that does not update the context docs is NOT closed

```
THE LAW      Every phase's exit writes SIX documents in context_management/ and ONE record file:

             context_management/CURRENT_STATE.md      what the system IS now (the stack, the seals,
                                                      what renders, what does not)
             context_management/BUILD_STATE.md        the CURRENT fingerprints + the gate verdicts of
                                                      record + the defects with file:line anchors
             context_management/CHANGELOG.md          APPEND the phase's history - never rewrite it
             context_management/EVIDENCE_STATE.md     which artefact proves which claim, with the path
                                                      and the sha and the command that regenerates it
             context_management/DECISION_CHAIN.md     APPEND the rulings, each with its reason AND its
                                                      cost
             context_management/NEXT_STEPS.md         what remains, in order, each with the gate that
                                                      closes it
             state/RESUME.md                          last PASS card - open phase - next turn - the
                                                      frozen shas - the lane - the threshold - the
                                                      host's safety state

WHY IT IS A LAW, NOT A CHORE
             context_management/ IS the compaction-survival mechanism. A fresh session reads those docs
             and NOT the chat. A stale doc is therefore not cosmetic debt - it is a WRONG INSTRUCTION
             handed to the next agent, and it is indistinguishable from a true one until it is measured.
             Measured cost of the last lapse: from 2026-10-22 every one of those docs described a build
             that "had not started" while HEAD was eight commits past it, and
             `python3 gates/canon_docs.py .` returned EXIT 1 with five U2 findings (2026-10-25 07:39).

THE PREDICATE - the exit is MECHANICAL, not declared
             python3 gates/canon_docs.py .
                 U1 DENSITY      every standard doc >= 200 lines, >= 3 file:line refs,
                                 evidence docs carry >= 1 sha
                 U2 CONSISTENCY  the five read-first docs carry THE SEAL and it EQUALS the disk
                 U3 FRESH LOGS   RUNNING_BUILD_LOG + RUNNING_DEBUG_LOG carry timestamped entries
                 U4 MANIFEST     every "(N lines)" claim in CANON_MANIFEST matches the disk
             EXIT 0 = the phase may be closed. EXIT 1 = the phase is OPEN, whatever the work looks like.

AND THE TWO RULES THAT KEEP THE DOCS TRUE
             1  A doc NEVER says "the build is going well". It says what was measured, with the anchor.
                Where a check could not be run, the doc says BLOCKED / UNRECORDED - never a blank, and
                never a word that reads as success.
             2  CHANGELOG.md and DECISION_CHAIN.md are APPEND-ONLY. A correction is a NEW entry that
                names the old one. A rewritten history cannot be audited, and the audit is the point.

WHAT THIS CLAUSE IS NOT
             It is NOT a request for more prose. Six dense documents with anchors beat sixty pages of
             narrative; the U1 floor exists to stop the opposite failure - a one-paragraph "state" that
             carries no path, no sha and no number, which is worse than no document at all.
```

**THE FIXTURES ARE ON DISK. THE OPERATOR SUPPLIES NOTHING.**
```
  fixtures/bars/2026-07-06.json            DXY  1H   382 bars   THE GOLDEN WEEK
  fixtures/bars/cv-2026-04-13.json          DXY  1H   382 bars   cross-validation
  fixtures/bars/cv-2026-05-04.json          DXY  1H   382 bars   cross-validation
  fixtures/bars/cv-2026-06-15.json          DXY  1H   382 bars   cross-validation
  fixtures/bars/cv-2026-06-29.json          DXY  1H   382 bars   cross-validation
  fixtures/bars/cv-2026-08-24.json          DXY  1H   382 bars   cross-validation
  fixtures/bars/2026-04-20.json             EURUSD 1H 382 bars   a second PAIR
  fixtures/bars/dxy-full-to-jul21.json      DXY  1H  1,881 bars  a long window
  fixtures/bars/pv-long.json                DXY  1H  3,115 bars  a long window
  fixtures/bars/EURUSD-live.json            EURUSD 1H 10,000 bars a second PAIR, a year
  fixtures/bars/2026-07-06.validated-harvest.json  DXY 15m 299 bars  a second TIMEFRAME
  fixtures/bars/_current.json               DXY  1H   382 bars   the live pointer
  TWELVE fixtures. The ten battle runs need none from the operator.
```

---

# 5 · THE FAILURE-CLASS ROUTING — the card decides where the fix goes

`defect_class` is not decoration; it is the routing table. The class names the OWNER LAYER. The fix
goes THERE, never at the symptom.

```
   measured classes and their owners:
      missing candles     -> the feed, or a primitive painted over the bars      (A14 guard)
      full-pane fill      -> the box arithmetic: a bottom that reached zero      (F11, lqz-render:103)
      stacked labels      -> the level path falling back to close                (F12)
      axis blown open     -> an unvalidated level dragging the scale            (F10, e1-render:186-189)
      forward extension   -> the anchor expression: 3 weeks forward, comment lied (F8,  e1-render:204)
      fabricated ZFP      -> a width ratio printed as a probability             (F7/F9, e1-render:153)
      wrong price         -> the payload not reaching the render                (F5)
      wrong days          -> the window / anchor                              (F6)
```

```
   THE SECOND OCCURRENCE of a class  -> principle-encode-lessons-in-structure:
      it becomes a new CHECK in chart_validator.py plus a fixture pair. Now structurally impossible.
   TWO FIXES FAILING THE SAME GATE -> principle-attack-the-premise:
      the premise is wrong. Take a census. Re-derive. Do not patch a third time.
```

---

# 6 · THE PHASE LADDER — card-driven

Every phase names its cards. A phase is not closed by work; it is closed by a card verdict.

```
+-----+-----------------------------------+---------------------+---------------------------+
| P0  | THE MACHINE                        | VC-P0-001/002       | the filters can reject;    |
|     | the look card, the judge arms, the  |                     | the judge was RUN once     |
|     | filters, the calibration, the      |                     |                           |
|     | record, the hook                   |                     |                           |
+-----+-----------------------------------+---------------------+---------------------------+
| P1  | E1 FACE B - from bars             | VC-P1-001/002/003   | 3 pairs; one-week law;    |
|     |                                   |                     | T5 money test EVERY turn  |
+-----+-----------------------------------+---------------------+---------------------------+
| P2  | E1 FACE A - the card's layer      | VC-P2-001/002/003   | 5 distinct labels; ZFP    |
|     |                                   |                     | traced; degrades to B     |
+-----+-----------------------------------+---------------------+---------------------------+
| P3  | E2 PHASE 1 - the boxes            | VC-P3-001           | derived, not written      |
+-----+-----------------------------------+---------------------+---------------------------+
| P4  | E2 PHASE 2 - the line             | VC-P4-001           | ratio from the CAPTURE    |
+-----+-----------------------------------+---------------------+---------------------------+
| P5  | E3 + THE GATE                     | VC-P5-001           | ancestry; RRR >= 2.5      |
+-----+-----------------------------------+---------------------+---------------------------+
| P6  | THE GOLDEN WEEK LOOK              | VC-P6-001           | zone_accuracy >= 0.95,   |
|     | 2026-07-06 DXY 1H, LOOKED at      |                     | confirmed on the candles  |
+-----+-----------------------------------+---------------------+---------------------------+
| P7  | THE TEN BATTLE RUNS               | VC-P7-001           | 10+ fixtures; every one   |
|     | every fixture on disk, 10+ times   |                     | scored; zero regressions  |
+-----+-----------------------------------+---------------------+---------------------------+
| P8  | THE THREE BLIND AGENTS            | VC-P8-001           | 3 of 3 reproduce the week |
|     │ zero context, from the record     │                     | and are themselves looked |
|     │ and the docs only                 |                     | at                       |
+-----+-----------------------------------+---------------------+---------------------------+
| P9  | OPTION B - the dashboard tab      | VC-P9-001           | byte identity + parity    |
+-----+-----------------------------------+---------------------+---------------------------+

## 6.1 · P0 IN FULL — the phase that makes the rest possible

```
P0.T1  generate and PROVE the verification skill
   /pstack-create-verification-skill -> verify-plutus/SKILL.md + features/
   THEN RUN IT ONCE using the rig of 0.1: display up, chrome with --ozone-platform=x11,
   pv-load with the MATCHING pair, window-scoped shot, read the frame, clean up, and
   confirm the evidence SURVIVED the cleanup.
   A generated skill that was never executed is a draft, not a deliverable.

P0.T2  author mand/P0..P7.md
   each <= 2,000 tokens, distilled from the blueprint + the graph, committed.
   THE GATE REFUSES a card whose mandate exceeds the budget.

P0.T3  the gate, and its own control
   gates/GATE.sh implementing G0..G5 with fixtures/frame.good.png and frame.bad.png GENERATED,
   not borrowed. The gate runs its own self-test FIRST on every run.

P0.T4  calibrate
   the sweep of 3.4, recorded; act derived and committed beside it.

P0.T5  the record
   state/RESUME.md, the hook wired, the TSV opened.

EXIT: VC-P0-001 PASS (the gate separates good from bad) and VC-P0-002 PASS (the driver ran end
      to end and the evidence survived).
```

## 6.2 · THE TEST SUITE MAPS ONTO THE CARDS

```
   T1 renders at all        -> G0 + G1 (candles present, bands present)      VC-P1-001
   T2 zones at right prices -> G1 (band heights + axis) + T2 mutation       VC-P1-001
   T3 zones on right days   -> G2 (forward extension) + T3 mutation         VC-P1-002
   T4 ZFP honest            -> G2 (no ratio site; receipt re-adds)          VC-P2-002
   T5 ★ money test          -> the RECORD ROW N/M, every render turn        every card
   T6 the E2 path           -> G1 + derivation mutation                     VC-P3-001, VC-P4-001
   T7 the E3 trades         -> G2 (ancestry, RRR)                          VC-P5-001
   the pair matrix          -> G1 on three pairs                            VC-P1-003
```

---

# 7 · THE TURNS — every turn, no exceptions

```
P0 ENTRY     the previous gate exited 0 - the rig of 0.1 answers (status row + OHLC)
A  ACTION    literal commands; every edit re-derives its anchor immediately before it
E  EVIDENCE  outputs captured to proofs/<turn>/; every artifact OPENED in this turn
R  REASON    three lines: what changed - what the evidence shows - why it is safe to advance
G  FILTER+LOOK  bash gates/LOOK.sh <frame> --card vcards/<id>.md --claim "<verbatim>"
               the FILTER exits 0 (eligible to be looked at) or 1 (REJECT + the reason)
               then the LOOK runs: the judge reads the frame and the card, and the LOOK
               card's verdict block is written with zone_accuracy.
               exit 0 = the look confirmed. A filter NEVER says pass.
C  COMMIT    one semantic commit whose body carries the filter rc, the card id, the look
             verdict and the zone_accuracy
```

**THE G BLOCK ALSO REQUIRES, ON EVERY RENDER TURN:**
```
   the T5 score (N zones / M reacted) - written into the record row (0.5)
   the failure mode F# from 0.2, or NONE
```

## 7.1 · THE FORBIDDEN LIST — printed verbatim in every turn's G block

```
   advance on a red gate                              weaken or lower a gate to pass it
   reuse evidence produced before a fix                describe an artifact you did not open
   report a count / sha / suite / token as a verdict   let a filename assert a verdict
   edit the gate from inside the build                 write the verdict you are being judged by
   pass the corpus to the judge instead of a card      set a threshold without a sweep
   declare done without a frozen-artifact pass         skip the control because it "always" passes
   + the seven of 0.6, verbatim
```

---

# 8 · THE OPERATOR INTERFACE

```
SURFACE - only three:
  1  a gate has failed three times after real fixes (the premise is wrong; report the census)
  2  a genuine architectural fork the documents do not answer (state it WITH a recommendation
     and continue on that recommendation)
  3  the acceptance, when P6 completes

NEVER SURFACE: "should I continue?" - approval-seeking progress summaries - "this is a lot" -
  scope-shrink proposals - a question the repo already answers.
```

**THE EXECUTOR IS BOUND BY 3 AND 7.1 EXACTLY AS THE BUILD IS.**

---

# 9 · THE RESUME PROTOCOL

```
0  python3 gates/canon_docs.py . - EXIT 0, or the docs you are about to read are NOT current
      (U2 names the doc and the seal it is missing; U4 names the count that drifted)
1  read state/RESUME.md - the last PASS card, the open phase, the next turn, the frozen shas
2  read context_management/{POST-COMPACTION_PROMPT,CURRENT_STATE,BUILD_STATE,NEXT_STEPS}.md
3  read vcards/REGISTRY.md - the card set, and which cards are PENDING
4  run the gate's own self-test - it must still separate good from bad
      * a BLOCKED gate (exit 3, a stale pin) is reported as BLOCKED and fixed by the OPERATOR - never
        re-pinned by the agent who moved the ruler (gates/LOOK.sh:94-101)
5  open the LAST PASS card's frame and confirm the verdict matches the pixels
      * if the record says PASS and the frame is a slab, THE RECORD IS WRONG - fix it first
6  only then dispatch the next turn
```

---

# 10 · THE MEASURED DEFECTS — the evidence base for the checks

Verified at the line in the pre-session baseline (`plutus-vision-v1.pine`, seal `0d20e831`, 1,270 L).

```
+-------------------------+------------------------------------------------+
| e1-render.pine:203      | _lx = anchor - 2 weeks   - the law says ONE   |
| e1-render.pine:204      | _rx = anchor + 3 weeks   - and NO forward;    |
|                         | the comment says "1 week after". IT LIES.      |
+-------------------------+------------------------------------------------+
| e1-render.pine:186-187  | the scale reads (top, size-1) and (bot, 0) on  |
| e1-render.pine:188-189  | an UNGUARDED ordering assumption; two invisible |
|                         | plots drag the axis: 0.30-2.00 on a 1.16 pair |
+-------------------------+------------------------------------------------+
| e1-render.pine:153      | f_e1CalcZFP = (tp-bt)/refR*100 - a WIDTH RATIO  |
|                         | printed as ZFP                              |
+-------------------------+------------------------------------------------+
| lqz-render.pine:94      | _span = _hi-_lo ; _body = max(_span, ..) ; the  |
| lqz-render.pine:103     | box runs from the price DOWN TO ZERO when _lo is|
| lqz-render.pine:109     | 0/na -> the full-pane green slab              |
+-------------------------+------------------------------------------------+
| lqz-core.pine:51        | lqzSink accepts na as a level - one na poisons|
| lqz-core.pine:58        | the sort                                      |
| lqz-core.pine:198       | `if not na(_vlo)` guards BOTH sinks but sinks  |
|                         | _vhi                                         |
+-------------------------+------------------------------------------------+
| plutus-vision-v1.pine:5 | lqzV1PoolMid() returns na - the LuxAlgo tap is |
|                         | a STUB while the detector claims two sources  |
+-------------------------+------------------------------------------------+
```

**THE SHARED ROOT: an unvalidated price level reached a drawing primitive. That is check A14.**

**AND THE INSTRUMENT THAT WOULD HAVE CAUGHT ALL EIGHT:** one frame_metrics run on one EUR/USD frame
returns NO_CANDLES - FAT_BLOCK - axis 0.30-2.00 - labels stacked - in three seconds.

---

# 11 · THE SELF-AUDIT — this document against the failures it exists to prevent

```
+----+--------------------------------------------+---------------------------------------+
| 1  | declare pixels, build counts              | 0.2/0.3 pixel criteria; 3.1 blocks    |
| 2  | a turn closing on a file property         | 7 - every turn ends at G0..G5          |
| 3  | no gate pointed at the product            | 3 G1/G3/G4 + 0.1/0.2                 |
| 4  | a gate that can only refuse               | 4 inner loop 1-2 - the self-test       |
| 5  | an oracle reading the maker's own count   | 2 SUBJECT is measured, never reported   |
| 6  | the money test dropped                    | 0.3 T5 EVERY render turn               |
| 7  | a single-artifact subject hiding a variant| VC-P1-003 three pairs                  |
| 8  | a workflow ignoring its predecessor        | 0.1-0.6 carried VERBATIM               |
| 9  | a check with no subject                   | 3.2 names what each gate CANNOT see    |
| 10 | a filename asserting a verdict            | 7.1 forbidden list                      |
| 11 | the executor exempt                       | 8 the executor is bound                 |
| 12 | forward extension + fabricated ZFP        | 10 anchors - VC-P1-002 - VC-P2-002     |
| 13 | an unvalidated level feeding a primitive  | A14 + VC-P1-002                        |
| 14 | a judge that cannot see                   | 3.3 the control, every run              |
| 15 | fitting to the week under test            | VC-P6-001 - the operator draws the weeks|
| 16 | a card that overflows silently            | 2 the gate refuses an over-budget card  |
| 17 | the executor writing its own verdict      | 3.5 + 4 inner loop 4                    |
| 18 | the rig commands dropped                  | 0.1 carried VERBATIM, byte for byte     |
| 19 | A GREEN GATE SAYS PASS                    | 3 - filters REJECT; the certification is  |
|    |                                            | the LOOK (2). The previous build had 8   |
|    |                                            | green layers and shipped a chart with    |
|    |                                            | no candles.                             |
| 20 | THE OPERATOR IS IN THE VERIFICATION LOOP  | 4 - the run never stops and never asks;  |
|    |                                            | the fixtures are on disk (4.2)           |
+----+--------------------------------------------+---------------------------------------+
```

**Adversarial read, alive: can an executor satisfy every gate here and still ship a green slab?**
Only if the control passes a slab - and the control IS the slab. **The one thing this document cannot
survive is a judge that lies about what it sees, so the control is the first gate in P0 and it runs on
every run thereafter.**

---

# 12 · THE STATE OF THIS DOCUMENT

```
   0.1-0.6  the render loop, VERBATIM - the rig, the failure modes, the test suite, the
             debug tree, the record, the forbidden list
   1  the pstack substrate, with 0.1 as the fallback path
   2  the verification card, budget 3,500 tok
   3  the six gates, the verdict algebra, the control, the calibration law
   4  the self-validating loop, the four unattended-run requirements
   5  the failure-class routing
   6  the phase ladder, P0 in full, the test-suite-to-card map
   7  the turns, the forbidden list
   8  the operator interface
   9  the resume protocol
   10 the measured defects, anchored at the line
   11 the self-audit, 18 failures
```

**THE ONE LINE: every turn ends at a gate that looked at the artifact, a card that recorded what it
saw, a control that proved the gate could see, and a money-test score that asked whether price
respected the zone - and the only thing that may call a build done is a replay, on a frozen artifact,
on weeks the operator drew.**

---

# §13 · SUCCESS CRITERIA

```
| # | the criterion                                                                   | the noun it names        | the evidence it must carry            |
|---|---------------------------------------------------------------------------------|--------------------------|---------------------------------------|
| C1 | the gate runs its OWN known-good and known-bad fixture FIRST and refuses to      | gate, fixture, control   | the two verdict lines + the exit code  |
|   | judge anything when they do not separate                                        |                          | observed in the tool result            |
| C2 | a verification card renders under the judge's budget and is REFUSED, never       | card, mandate            | the rendered token count + the refusal  |
|   | truncated, when it overflows                                                    |                          |                                       |
| C3 | every judgment the judge returns is typed, carries a probability, and is        | judgment                 | the raw answer + its probability       |
|   | compared against a threshold derived from a recorded sweep                      |                          |                                       |
| C4 | a phase closes only on a card verdict of PASS, and the card id is named in      | phase, card              | the verdict block + the record row     |
|   | the phase's exit criterion                                                      |                          |                                       |
| C5 | every turn ends at the gate; the executor may not write its own verdict         | turn, gate, verification | the gate's exit code in the commit body |
| C6 | the money test runs on EVERY render turn and its N/M lands in the record row    | replay, chart            | the score sheet + the record row        |
| C7 | the captured frame is opened in the SAME turn as the capture                    | frame, chart             | the opened capture + its metrics        |
| C8 | the control is pushed through the judge on every run and a judge that affirms   | control                  | the control's verdict + the VOID        |
|   | the known-bad slab yields VOID                                                 |                          |                                       |
| C9 | the resume record names the last PASS card, the open phase, the next turn and  | phase, turn, card        | the record file, read at resume        |
|   | the frozen artefact sha, so a cold agent resumes at the exact next turn         |                          |                                       |
| C10| the pre-commit hook refuses a commit that touches a judged artefact without a   | gate, verification        | the hook's refusal + the PASS row      |
|   | PASS row, and the hook's own exit code is observed refusing                    |                          |                                       |
```

**A CRITERION WITHOUT A COMMAND-CHECKABLE EVIDENCE COLUMN IS A WISH. A criterion whose noun never
appears in the criteria table is a translation hole. Every row above names its nouns and its
evidence.**

---

# §14 · THE ANCHORED SOURCES

Every rule in this document traces to a line. These are the load-bearing ones, verified.

```
THE RENDER LAW THIS DOCUMENT ABSORBS
   spec/RENDER_LOOP_WORKFLOW.md:1        the rig, the failure modes, the test suite, the
                                         debug tree, the record, the forbidden list
   spec/RENDER_LOOP_WORKFLOW.md:3        "This is the only workflow. Every other document in
                                         spec/ is input to it or a record of it."

THE ZFP IS A REPORT VALUE, NOT A RATIO — the root of VC-P2-002 and check A7
   cards/E1-ZFP-BASE.md:6                "A base failure probability in one of six published
                                         classes, which the six modifiers then shift upward;
                                         the total is the zone's ZFP"
   cards/E1-ZFP-BASE.md:23               "Failure mode: Treating the LSZ row as a failure
                                         probability. An LSZ is expected to be breached and
                                         reverse; scoring it at 5-15% 'hold' probability
                                         inverts its function and corrupts any SL placed on it."

THE ZONE RULES — the root of VC-P1-001 and check A5
   MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md:193
                                         "S&D zones are caused by momentum. The stronger the
                                          price imbalance the stronger the zone."

THE MACHINERY THIS DOCUMENT DRIVES
   scripts/chart_validator.py:1          G1 + G2 — 20 checks, 4/4 frames separated
   gates/VALIDATE.sh:1                   the wrapper: sha pin, symmetric self-test
   design/BUILD_WORKFLOW_v2.md:1          this document
   vcards/REGISTRY.md:1                  the 13 judged units
   mand/P1.md:1                          a mandate, sized for the judge's window
```

**A rule with no anchor is an opinion. Every check in section 3 and every card in vcards/ cites one
of the sources above, or the measured-defect table in section 10.**
