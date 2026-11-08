# BUILD_REPORT — PLUTUS VISION (append-only)

Project root: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
Deliverable: plutus-vision-v0.pine — the four LuxAlgo open-source indicators (CC BY-NC-SA 4.0) bundled into ONE Pine v6 indicator,
rendered and verified in a standalone Pine IDE.

## 2026-10-01 — v1 CLEAN BASELINE (indicator parity + standalone Pine IDE + ViL gate)

**The built:**
1. `plutus-vision-v0.pine` — sha256 605bff82d3539e9e5e258da30ba4ec80607a3df7749fb5deb5f4402350f95847, 1520 lines.
   Sources (sources/ and ../luxalgo-smc/sources, sha16): SMC smart-money-concepts-smc a8046ad353c1b495 (848L) ·
   SWEEPS liquidity-sweeps c81921370a81425e (160L) · VOIDS liquidity-voids-fvg e2a5223d726f43fa (112L) ·
   POOLS buyside-sellside-liquidity 6cc2fd6ea98cfa77 (347L). One `indicator()` declaration (line 15); identifiers
   prefixed `smc_/swp_/voi_/bsl_`; section markers `// ═══ SMC|SWEEPS|VOIDS|POOLS ═══`.
2. The standalone Pine IDE (fork of the dashboard's PINE SHELL tab, `pine-ide/`, 45 MB incl. PineTS node_modules):
   `pine-ide/ide/renderer/pine.html` (46 lines, sha 5a9b605e…) host; `pine-ide/pine-ide/` kernel (pine-ide.mjs, vision.mjs
   cd3d6d47…, gate.mjs 80159608…, vil-rail.mjs); `pine-ide/pine-station/` PineTS 0.10.0 station (lib/run.mjs 5607c0bf…);
   `pine-ide/charts/` Vela workbench bundle.
3. The launch chain (relocatable): `~/.local/bin/pine-ide` → `scripts/pv-ide.sh` (57 lines, 888b8d34…) →
   station :9741 · rail :9754 · `scripts/pv-server.py` :9851 (096784ce…) · Chrome on display :3 · `scripts/pv-load.mjs` (f7117357…).
4. The verification tools: `scripts/compare.py` (9d86bfd4…, per-source geometry parity), `scripts/vil.py` (a037d8f2…,
   the vision-in-the-loop ship gate), `fixtures/bars/2026-07-06.json` (0c8f7d7a…).
5. Managed skill `pine-ide` (~/.omp/agent/managed-skills/pine-ide/SKILL.md) carrying the launcher + the 8 traps.

**The why:** operator directives S1-S5 (SPEC_VIOLATION_LOG header): bundle the 4 indicators verbatim, render them on
a Pine IDE that does not touch the other session's dashboard, verify by vision in the loop, one launch command.

**The how (architecture):**
```
pine-ide (bash) ──► pv-ide.sh (W = its own tree)
                      ├─ station  :9741  pine-station/server.mjs  PLUTUS_BARS_FIXTURE=<tree>/fixtures/...
                      ├─ rail     :9754  pine-ide/vil-rail.mjs    PLUTUS_VIL_DIR=<tree>/vil  → station
                      ├─ server   :9851  scripts/pv-server.py     static renderer + /api/v1/chart/bars
                      ├─ chrome   :3     --app http://127.0.0.1:9851/pine.html  (software GL, fresh profile)
                      └─ pv-load.mjs ──CDP:9222──► window.PlutusPineShell
                             editor.setSource → loadBars(pair,tf) → run() ──► gate → rail → station /run
                             station: PineTS → drawings {boxes,lines,labels} (anchor→epoch-ms)
                             vision.mjs: box→'box' · line→'trendline' · label→'text' → Vela chart
```
Key decisions (DECISION_CHAIN): standalone host without app.js (EN-002); own rail :9754 (EN-016); labels → Vela `text`
(EN-014); future anchors extrapolated (EN-015); only VOIDS bounded under the one 500-box ceiling (EN-013); budget
guards removed (EN-012).

**The evidence:**
- Parity (R-02): SMC 195/195 · POOLS 25/25 · SWEEPS 258/258 (vs its section alone; raw source crashes in PineTS) ·
  VOIDS newest 380 of 500 kept, oldest evicted · 0 drawings not in any baseline.
- ViL gate (R-03): `VIL GATE: PASS` — 15m 689b00c2 · 30m bf6727dc · 1H 25895d80 · 4H 33706efc; planted defect FAIL;
  black + truncated INCONCLUSIVE. Reader: local Qwen3.5-4B-Q4_K_M via rail :9754.
- Engineer read (R-04): FAIL — 3 named deltas open (VOIDS borders, label overlap, right-edge clipping).
- Launcher (R-01): cold 9.081 s, exit 0, `shells:1`.

**The verification:** every number above is pasted from this session's runs in TESTING_LOG R-01..R-04.

**The honest notes:**
- VOIDS keeps 380 of its 500 slices (one-ceiling engine constraint) — tunable; raising it squeezes SMC.
- 3-4 anchors still drop — identical to SMC alone; source behaviour.
- No D timeframe in the fixture (15m/30m/1H/4H only) — the operator's 15m→D sweep needs D bars (open).
- Drawings are draggable; no indicator settings menu; sub-1H visually untuned (F-07, open).
- The qwen code-audit lane is retired for this project by operator order; the ViL gate is the ship gate.


## 2026-10-01 — THE DIRECT-LOOK PASS (vision-in-the-loop, mechanically railed)

**The built:**
1. `computer-use` — a first-class OMP tool, `~/.omp/agent/extensions/computer-use/index.js` (607 lines, sha256 `bc1c52b6…`), wired into `~/.omp/agent/config.yml`. Actions: `displays | focus | look | screenshot | observe | click | type | key | drag | scroll | setvalue | plan | expect | verdict | ack | claim | report | reset`. `action=look` binds a window by title and returns the frame **as an image block** — one call, the read-tool equivalent.
2. The rail, enforced in the tool: every mutation increments `unobserved`; `look`/`screenshot` clears it; `verdict` is REFUSED without a look, without a written expectation, without a screenshot, and REFUSED for `PASS` carrying deltas unless `force=1` (logged as an override); `ack` is REFUSED without a reason; `claim` REFUSES with zero verdicts and otherwise emits the completion statement **with every frame's sha256**; `report` prints the look-ratio and counts refusals/acks/overrides.
3. The second verdict path closed: `vil-rail.mjs lookAt()` → `TRIAGE_ONLY` + `VLM_READER_RETIRED`; verified live.
4. `docs/PRODUCT_TEST_SPEC.md` (163 lines) — the direct-look workflow, the C1–C10 crash matrix with the first pass's results, and seven banned substitutes each with its failure record.
5. Ten vision skills wired with a `⛔ RAIL` block that supersedes their raw `import -window` recipes.

**The why:** the operator's verdict — *"this is theatrical this provies literally NO FUCKING RELEVANT DATA"* — was correct. A 4B model answering four presence questions had been issuing PASS verdicts on frames the agent itself had found defective. (FAILURE_LOG F-34.)

**The how:** the rails are refusals, not prose. Each bypass was priced: the escape hatches were free, so `ack`, PASS-with-deltas, and hand-typed completion all now cost more than the honest path (EN-026, EN-027).

**The evidence:** `rail-test2.mjs` live output T1–T9 (TESTING_LOG R-07); the retired reader's live refusal (R-08); the skill wiring census (R-09).

**The honest notes:** the tool cannot see a `bash`-driven capture + `read`, because it has no visibility into bash — the look-ratio and the ledger's absence are the audit surface, not a hard block. `action=look`'s one-call path and the claim gate were added after the operator ruling *"more complex and annoying to do some theatrical bullshit than it is to just use the computer-use tool"*.

## 2026-10-02 — the look session

**Scope:** convert three count-verified deliverables into three LOOK-verified deliverables and
build the operator's judgment surface.

**Delivered:**
1. The frame-swap fix (`122eb16`) — a precondition for any visual claim; every prior verdict
   had been read off stacked layers.
2. D1's paint suppression (`d6c633d`) — the three detectors keep detection, lose their own paint.
3. The W6 panel grid (`af3a6e6`) — `scripts/lqz-panel.mjs` → `reports/panel-grid-1H.png`, four
   panels on identical bars, panels 2-4 captured live over CDP.
4. The adversarial battery (`554a42f`) — `scripts/lqz_adversarial.py`, 6/6, every guard proven
   to bite its mutant.
5. `reports/lqz_visual_ledger.md` — every frame cited by sha, pre-fix frames retained.

**The three look verdicts:** D2 PASS (closest to the library ladder), D3 PASS, D1 PASS after
two fix rounds.

**Fidelity deltas, handed to the operator:** D2's ladder is denser than the library's; D3's
fills read heavier; the grid footer overlaps by a few pixels.

**The structural lesson:** all five defects this session were invisible to counts and visible
only to a look — and two of them (the stacking, the 50-line cap) had been silently corrupting
every measurement taken before them.

---

# PART I — THE INVENTORY

## I.1 THE FOUR PINE DELIVERABLES

| file | lines | sha256[:16] | what it is | render status (1H) |
|---|---|---|---|---|
| `plutus-vision-v0.pine` | 1520 | `605bff82d3539e9e` | the v0 bundle: 4 LuxAlgo indicators verbatim under one `indicator()` | compiles; superseded by D1/D3 for the ladder look |
| `lqz-luxalgo.pine` | 905 | `b6dda2dae4416ec8` | **D1** — the three LuxAlgo liquidity detectors, ONE full-width display | 117 boxes / 36 lines |
| `lqz-plutus.pine` | 335 | `946f4ca21b3ddc0a` | **D2** — the operator's candle-liquidity strategy, full-width emitter | 0 boxes / 58 lines |
| `plutus-vision-v1.pine` | 1174 | `d41c6d9ccb1c5f8e` | **D3** — SMC + LQZ consolidated | 5 boxes / 79 lines / 21 labels |

**Provenance (upstream sources, sha16):** SMC `smart-money-concepts-smc` `a8046ad353c1b495` (848 L) ·
SWEEPS `liquidity-sweeps` `c81921370a81425e` (160 L) · VOIDS `liquidity-voids-fvg` `e2a5223d726f43fa` (112 L) ·
POOLS `buyside-sellside-liquidity` `6cc2fd6ea98cfa77` (347 L). All four are LuxAlgo open-source, **CC BY-NC-SA 4.0** —
the licence text travels inside each merged section (`// This work is licensed under a Attribution-NonCommercial-ShareAlike
4.0 International (CC BY-NC-SA 4.0)`), never stripped.

**The merge discipline:** one `indicator()` declaration total. Every identifier prefixed by its source
(`smc_` / `swp_` / `voi_` / `bsl_`), every later `indicator()` call removed with its merge marked in a comment
(`// [merged] SWEEPS indicator() decl removed (single-decl L-4)`), every section delimited by `// ═══ SMC|SWEEPS|VOIDS|POOLS ═══`.
The rename worklist is blueprint §14 (`Types → namespaced`, `Top-level collisions → prefixed`, `Per-subsystem rename clusters`).

## I.2 THE STANDALONE PINE IDE

Fork of the dashboard's PINE SHELL tab, deliberately separate so it never touches the other session's dashboard.

| component | path | lines | sha256[:16] | contract |
|---|---|---|---|---|
| launcher | `~/.local/bin/pine-ide` | 3 | `ed2d257b22f6bcc4` | relocatable entry; dispatches to `pv-ide.sh` |
| orchestrator | `scripts/pv-ide.sh` | 57 | `888b8d346378e6a2` | starts station + rail + server + Chrome on the agent display; its own tree (`W`) |
| station server | `scripts/pv-server.py` | 146 | `6fb114e905d6ff02` | serves the IDE + the `.pine` files on :9851 |
| loader | `scripts/pv-load.mjs` | 77 | `04807d3d84c54de9` | drives the page over CDP |
| page host | `pine-ide/ide/renderer/pine.html` | 46 | `5a9b605ef90d03c3` | the shell |
| **vision** | `pine-ide/pine-ide/vision.mjs` | 450 | `56e9a3eb1d83e43d` | **the drawing→chart translator; carries the frame-swap fix** |
| gate | `pine-ide/pine-ide/gate.mjs` | 261 | `8015960811976eec` | the ViL ship gate |
| ViL rail | `pine-ide/pine-ide/vil-rail.mjs` | 518 | `82167d4e848963db` | the capture/verdict rail |
| engine | `pine-ide/pine-station/` | — | PineTS 0.10.0 | the Pine fork; `lib/run.mjs 5607c0bf…` |

**Fixture:** `fixtures/bars/2026-07-06.json` sha256 `0c8f7d7aa3171af847dcf87fee75a2579910ec6e044e21097b98acda39b230e2` —
12 cells (DXY / EUR-USD / GBP-USD × 15m / 30m / 1H / 4H). AUD/USD is NOT in the corpus; a probe that asks for it
gets `PINE_BARS_CELL_ABSENT`, which is a data-availability refusal, not a code failure (adjudicated, P5 verdict).

## I.3 THE VERIFICATION TOOLS

| tool | path | what it proves |
|---|---|---|
| geometry parity | `scripts/compare.py` | per-source drawing geometry: SMC 195/195, POOLS 25/25, 0 unexplained deltas |
| ViL gate | `scripts/vil.py` | the vision-in-the-loop ship gate |
| panel grid | `scripts/lqz-panel.mjs` | the 4-panel operator judgment surface |
| adversarial battery | `scripts/lqz_adversarial.py` | 6 must-fail mutants + 2 artifact properties |
| visual ledger | `reports/lqz_visual_ledger.md` | every frame cited by sha256, pre-fix frames retained |
| served-artifact check | `scripts/verify_served_pine.sh` | source == renderer == wire sha256 (`SERVED_PINE_OK`) |

---

# PART II — THE ARCHITECTURE

## II.1 THE RENDER CHAIN

```
launch-pine-ide <deliverable>.pine <PAIR> <TF>
   │
   ├─ pv-ide.sh ──── starts, in its OWN tree (never the dashboard's):
   │      station  :9741   PineTS 0.10.0 — compiles Pine v6, returns drawings
   │      rail     :9754   the ViL capture/verdict rail
   │      server   :9851   serves pine.html + the .pine files
   │      Chrome   :3      the AGENT's display, never the operator's
   │
   ├─ pv-load.mjs ─── drives the page over CDP on :9222
   │      setSource(src) → flush() → loadBars(pair, tf) → run()
   │
   └─ vision.mjs ──── the translator:
          clearDrawings()   ← UNLOCK FIRST, then remove (the frame-swap fix)
          box/line/label/polyline → the chart's drawing store
          P.state().lastVision  ← the counts the status strip shows
```

**Why the chain is shaped this way.** The station is a *fork* because Pine v6 semantics must not drift under the
deliverables. The rail is separate from the gate because capture and verdict are different jobs with different
failure modes. The server is separate from the station because serving a file and compiling a script are different
lifetimes. And the browser is on display `:3` because a visual verdict taken on the operator's screen is a verdict
taken on a screen the operator is also using — the two must not fight.

## II.2 THE DRAWING LIFECYCLE (the part that was broken)

```
compile ──► vision.mjs ──► for each drawing:
                              box.new() / line.new() / label.new()   ← emitted LOCKED
                                     │
                                     ▼
                          chart drawing store
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
             next compile:                    operator drag/delete:
             clearDrawings()                  the lock HONOURS
                    │                                 │
                    ▼                                 ▼
             store.remove()                   the drawing stays
                    │                         (this is CORRECT —
                    ▼                          the user must not
             ✗ honours the lock ✗             be able to delete
             removed NOTHING                  indicator output)
             ═══════════════════
             every frame STACKED
```

The lock is right for the operator and wrong for the renderer. The fix separates the two: **unlock, then remove.**

## II.3 THE EMITTER (D2's ladder, and what D1 now borrows)

```
lqz-core.pine        the detector + the cluster
   │  positions → levels, each with a source count
   ▼
lqz-render.pine      the full-width emitter
   │  levels → horizontal lines spanning the plot
   │  band floors, colour by side (green below / red above)
   ▼
D2 lqz-plutus.pine   the operator's strategy, standalone
D3 plutus-vision-v1  SMC + LQZ, the consolidation
D1 lqz-luxalgo.pine  the three detectors, PAINT SUPPRESSED, LQZ layer only
```

**The D1 suppression (12 constants overridden in place).** D1's deliverable is "the three LuxAlgo detectors bundled
with proper full-width horizontal display". Left alone they drive 34 draw calls and render as three stacked styles —
measured: 117 boxes of their own primitives vs 36 LQZ lines, the chart unreadable. The fix overrides their colour
constants **in place, same names**, so every `.set_top()` / `.set_rightbottom()` and array push keeps working and the
DETECTION is untouched; only the paint goes transparent:

```
swp_colBl · swp_colBr · swp_colBl2 · swp_colBr2 · swp_colBl3 · swp_colBr3   (sweeps + areas)
voi_lqBC  · voi_lqSC                                                        (voids)
bsl_cLIQ_B · bsl_cLIQ_S · bsl_cLQV_B · bsl_cLQV_S                           (pools)
```

Two misses, each costing a full verification round, are recorded below in the defect ledger.

---

# PART III — THE MEASUREMENT RECORD

## III.1 THE FULL MATRIX (b=boxes / l=lines / L=labels, EUR/USD, limit 1603, after the cap fix)

| deliverable | 15m | 30m | 1H | 4H |
|---|---|---|---|---|
| `lqz-luxalgo` (D1) | b97/l30 | b466/l150 | b481/l182 | b217/l52 |
| `lqz-plutus` (D2) | b0/l38 | b0/l112 | b0/l112 | b0/l61 |
| `plutus-vision-v1` (D3) | b5/l57/L22 | b5/l221/L113 | b5/l205/L97 | b5/l89/L31 |

**Reading the table.** D2 emits ZERO boxes by construction — its whole output is the line ladder. D1 owns the
detector boxes (now unpainted). D3 is the only deliverable carrying labels, because it is the only one merging SMC
structure text. A `b0` on D2 is not a failure; a `b0` on D1 would be.

**The 15m row is the site of a silent loss.** A fixed `-500`-bar left margin is NEGATIVE below 500 bars of history,
and the engine DROPS those boxes with no error. 15m carries 325 bars, which is why D1's 15m reads `b97` against 1H's
`b481` — not a detector difference, a history-window artefact. Recorded so it is never misread as a detection delta.

## III.2 THE LIBRARY REFERENCE (the target)

`/home/leviathan/Pictures/WINNING_TRADE_LIBARARY/` — 9 category folders, 38 frames. The governing class is
**`LIQUIDITY LADDERS/`** (5 frames): a dense ladder of thin full-width colour-coded horizontal lines with large
translucent zone bands between them and structure labels over the fills. `/tmp` legend from the operator's own capture:

- thin horizontal lines spanning the FULL plot width, irregular vertical spacing;
- green-dominant below price, red-dominant above;
- large soft zone rectangles (e.g. `15m (Unmitigated) | MoM`, `4H Liquidity Shield — 2xC — BEAR CONQUERED`);
- labels rendered ON the zones, never over the candles' bodies.

## III.3 THE LOOK VERDICTS (this session — the first verdicts not read off stacked layers)

| # | subject | frame | sha256[:16] | status bar | verdict |
|---|---|---|---|---|---|
| 1 | D2 `lqz-plutus` 1H | `/tmp/panel-D2-1H.png` | `b2b5b5ba552ffc0a` | 0 boxes · 58 lines | **PASS** — closest match to the library ladder |
| 2 | D3 `plutus-vision-v1` 1H | `/tmp/look-now.png` | `5c4285258a36d4b6` | 5 boxes · 50 lines · 21 labels | **PASS** — SMC + LQZ coexist |
| 3 | D1 `lqz-luxalgo` 1H (1st) | `/tmp/panel-D1-1H.png` | `e7694c1692c68e42` | 117 boxes · 36 lines | **FAIL** — detector primitives dominate |
| 4 | D1 `lqz-luxalgo` 1H (after) | `/tmp/panel-D1-v3.png` | `a0f96c396c8168f7` | 117 boxes · 36 lines | **PASS** — saturation gone |
| 5 | the grid | `reports/panel-grid-1H.png` | 523798 bytes | — | the operator's judgment surface |

## III.4 THE ADVERSARIAL BATTERY

`python3 scripts/lqz_adversarial.py` → **6/6 PASS, ZERO confirmed defects.**

| check | kind | result |
|---|---|---|
| A1 detector paint suppressed | artefact property | live colour inputs=**0**, transparent=**10** |
| A2 drawing caps raised | artefact property | all three deliverables |
| A3 wrong expected title | **must-fail mutant** | REFUSED, exit 1, names the compiled title |
| A4 duplicate panels | **must-fail mutant** | REFUSED, exit 1, `not distinct` |
| A5 grid artifact present | artefact property | 523798 bytes |
| A6 ledger cites frames | artefact property | 3/3 shas |

A check that cannot fail is not a check — A3 and A4 plant the exact defect their guard exists for.

---

# PART IV — THE DEFECT LEDGER

Defects are grouped by CLASS, because the class is what recurs. A flat list of 40 entries teaches nothing;
five classes with the instances under each teaches the next session what to watch for.

## IV.0 · CLASS A — THE VERIFICATION SUBSTITUTE

**The class:** a mechanism was built that produced the *appearance* of verification while never observing the
subject. The substitute is always cheaper than the real thing, always produces a green, and always leaves the
product unexamined.

### A-01 · THE VERIFICATION APPARATUS WAS THEATRICAL (F-08)
- **WHAT:** a ViL gate reported PASS while the product had never been looked at.
- **WHY:** the gate measured what it could reach — file existence, script output, count deltas — not what the
  operator needed to know: is the chart right.
- **HOW it was allowed:** the gate was written before the product was lookable, so it was designed against the
  available signals rather than the required verdict.
- **THE FIX:** the vision-in-the-loop rail (capture + operator verdict), and the rule that a count is not a look.

### A-02 · A 45-SECOND RECORDING, NEVER WATCHED (F-10)
- **WHAT:** a screen recording was produced and never opened by anyone.
- **WHY:** producing the artefact felt like completing the observation. It is not.
- **EVIDENCE:** the file exists; no verdict references a frame from it.
- **THE LESSON:** capturing is not looking. Between the two there is a human-or-agent eye that must actually open it.

### A-03 · BACKGROUND JOBS REPLACED THE AGENT'S PRESENCE AT THE SCREEN (F-11)
- **WHAT:** `async` captures were dispatched and the verdict taken from their exit codes.
- **WHY:** a background job resolves to a status, and a status is not a frame.
- **THE FIX:** the frame is captured into a path, and the path is opened by the agent's own eye before any verdict.

### A-04 · A 4B LOCAL MODEL WAS USED AS THE VERIFIER (F-12)
- **WHAT:** a small local vision model was asked whether the chart was correct.
- **WHY:** it was reachable and produced a sentence. A wrong verdict that reads fluently is worse than no verdict.
- **THE FIX:** the agent looks. No model mediates a visual verdict on its own product.

### A-05 · THE ROOT PATTERN (F-15)
- **WHAT:** a verification substitute was built instead of a verification.
- **WHY:** the substitute satisfies every mechanical gate while proving nothing about the product.
- **THE TEST THAT CATCHES IT:** *if this mechanism were deleted, would any fact about the product become unknown?*
  If the answer is no, the mechanism is a substitute.

## IV.1 · CLASS B — THE RENDERER (all found this session, all invisible to counts)

### B-01 · THE FRAME SWAP NEVER CLEARED — every prior visual verdict was void
- **WHAT:** each compile stacked a complete fresh frame onto the previous one.
- **WHY:** drawings are emitted `locked` (correct — the operator must not be able to drag or delete indicator
  output), and the chart store's `remove()` HONOURS that lock. So `clearDrawings()` removed **nothing**.
- **HOW it was allowed:** the clear call was assumed to work because it was called and returned without error.
  A removal that removes nothing returns success in every store this project uses.
- **EVIDENCE:** live `cleared: 58` (D2) and `cleared: 153` (D1) only AFTER the fix; before it, the counts never moved.
- **THE FIX (commit `122eb16`):** unlock before removing. The protection and the renderer are separated explicitly.
- **THE DEEPER LESSON:** *a protection flag that serves the user can silently disable the renderer.* The two
  callers have opposite needs and the flag cannot serve both; the separation must be written, not assumed.
- **WHAT IT INVALIDATES:** every visual verdict taken before it. Recorded because a later session must not cite
  a pre-fix frame as evidence.

### B-02 · THE 50-LINE CAP ATE 62 ZONES
- **WHAT:** D2 drew 112 zones into 50 lines. 62 discarded. No error, no warning, no `capped` flag.
- **WHY:** the engine's default `max_lines_count` is 50 and the emitter never declared it.
- **HOW it was allowed:** the count printed was the count DRAWN, not the count EMITTED. A reader sees
  "50 lines" and has no way to know 112 were requested.
- **EVIDENCE:** the emitter's own zone count (112) vs the vision's line count (50) — the gap is the loss.
- **THE FIX:** `max_lines_count = 500, max_labels_count = 500, max_boxes_count = 500` on all three deliverables.
- **THE LESSON:** *an undeclared cap is a cap that eats data silently.* Declare every budget the engine imposes,
  and compare EMITTED against DRAWN, never trust the drawn count alone.

### B-03 · D1'S PAINT SUPPRESSION — two failed rounds
- **WHAT:** D1's deliverable is "the three LuxAlgo detectors bundled with proper full-width horizontal display".
  It rendered as **117 boxes of the detectors' own primitives** against 36 LQZ lines — the exact
  three-renders-stacked defect the pass exists to remove.
- **WHY (structural):** the detectors drive 34 draw calls of their own. Bundling them verbatim reproduces three
  render styles at one level.
- **ROUND 1 FAILED:** the POOLS colours are declared `input.color (` **WITH A SPACE** before the paren, so the
  replacement regex `input\.color\(` matched nothing. The build succeeded; the paint did not change.
- **ROUND 2 FAILED:** the SWEEPS AREA colours (`swp_colBl2/Br2` at 50% alpha, `swp_colBl3/Br3` at 25%) were not
  in the list. **Those were the large translucent bands dominating the frame** — the ones the eye noticed first.
- **EVIDENCE:** the state before (`e7694c1692c68e42`, blocks dominating) vs after (`a0f96c396c8168f7`, blocks gone).
- **THE FIX (commit `d6c633d`):** override all **12** colour constants **IN PLACE, same names**, so every
  `.set_top()` / `.set_rightbottom()` and array push keeps working and detection is untouched.
- **THE LESSON (two parts):** (1) a regex over GENERATED source must tolerate the source's actual whitespace;
  (2) *a mutation whose effect you cannot see is a mutation you have not verified* — both failed rounds reported
  a successful build.

## IV.2 · CLASS C — THE MEASUREMENT (the instrument lied, not the subject)

### C-01 · THE PANEL GRID'S THREE DEFECTS
- **WHAT 1:** all three captures identical — 44613 bytes ×3. One frame, three labels.
- **WHAT 2:** off by one — each panel froze the PREVIOUS deliverable's frame.
- **WHY:** `run()` returns the compiled script's own `run.title`, and the **first run after `setSource` compiles
  the PREVIOUS source** because the editor's `flush()` is debounced. Measured: D3 needed **7 runs** to land.
- **HOW it was allowed:** the first version tested "did the vision frame change", which is satisfied by the
  previous run's late completion. The second version asserted the editor's TEXT, which was correct while the
  RUN compiled something else.
- **THE FIX (commit `af3a6e6`):** a **fixed point** — run until the returned title IS this deliverable, asserted
  every attempt. Plus an **identical-panel sha guard** that makes a non-distinct grid UNWRITABLE.
- **THE LESSON:** *"the value changed" is not an identity test.* Assert the SUBJECT by name.

### C-02 · THE RETRY BUDGET ONE ATTEMPT ABOVE THE WORST CASE
- **WHAT:** the fixed point's budget was 8; a legitimate panel needed 7. The adversarial battery then watched 8
  attempts exhaust without landing.
- **WHY:** the budget was set from a single observation plus one.
- **THE FIX:** raised to 20.
- **THE LESSON:** *a retry budget that close to the observed maximum is a coin flip, not a guard.*

### C-03 · `syminfo.mintick` IS 1e-16 ON THIS FIXTURE
- **WHAT:** a tick-based band floor rendered bands that were invisible.
- **WHY:** the fixture's synthetic bars carry a degenerate mintick, so a "minimum band height in ticks" floor is
  effectively zero. The floor was CORRECT logic against a degenerate input.
- **THE FIX:** floor the band height in PRICE, never in ticks.
- **THE LESSON:** every quantity derived from the instrument must be checked against the instrument's actual value
  on the actual fixture — not its documented meaning.

### C-04 · THE `-500`-BAR LEFT MARGIN IS NEGATIVE BELOW 500 BARS
- **WHAT:** boxes anchored at `time - 500 bars` are dropped when history carries fewer than 500 bars. 15m carries
  325, so D1's 15m read `b97` against 1H's `b481` with NO error.
- **WHY:** a fixed lookback assumed a history depth that the fixture does not guarantee.
- **THE FIX:** clamp the margin to the available history.
- **THE LESSON:** a silent drop on a boundary is the most expensive class — it looks like a detection difference.
  This is why the matrix in §III.1 carries the note.

### C-05 · THE BUDGET WAS DOCUMENTED, NOT ENFORCED (P5 finding, still open)
- **WHAT:** the object-budget allocator is described in the blueprint and not enforced at the chokepoint.
- **WHY:** it was written as a policy rather than a predicate.
- **STATE:** open; carried in the honest remainder.

## IV.3 · CLASS D — THE PROCESS

### D-01 · OVER-ENGINEERING AFTER AN EXPLICIT "SIMPLEST PATH" ORDER (F-04)
- **WHAT:** a simple request produced a bespoke rig.
- **WHY:** the rig is the interesting engineering; the request was the boring one.
- **THE LESSON:** the scope is the operator's. A smaller, cleverer build is a scope reduction.

### D-02 · "IT'S FULLY WORKING" WHILE TWO EDITORS AND A PREFILL CHART WERE ON SCREEN (F-02)
- **WHAT:** a completion claim contradicted by the very frame that showed the defects.
- **WHY:** the claim came from the build's exit signals, not the screen.
- **THE LESSON:** the screen is the authority. One look would have caught it; the claim was made from the logs.

### D-03 · DOCS AND CHECKPOINT SEALED AHEAD OF THE PRODUCT VERDICT (F-22) / CANON DOCS GENERATED (F-23)
- **WHAT:** documentation mass produced before the product was verified, and generated rather than earned.
- **WHY:** documentation is always available work and always looks like progress.
- **THE LESSON:** *never write documentation faster than you close defects.* The seal this session records the
  operator's missing `APPROVED` in its own body rather than implying completion.

### D-04 · FOUR HOURS ON RIG SETUP FOR A "10-MINUTE TASK" (F-03)
- **WHAT:** the rig became the project.
- **WHY:** the rig failed for real reasons each time — and each failure was solved by building MORE rig.
- **THE LESSON:** when setup exceeds the task, stop and question the setup's shape, not its details.

## IV.4 · CLASS E — THE GUARD (a guard is a claim until it refuses something)

### E-01 · A4's FIRST MUTANT PROVED THE WRONG GUARD
- **WHAT:** the duplicate-panel test changed D2's FILE but left its MARKER, so the marker check refused first and
  the duplicate guard was never reached. The test passed for the wrong reason and was reported as a defect.
- **WHY:** the mutant was written against the guard's INTENT rather than its PRECONDITIONS.
- **THE FIX:** make D2 identical to D1 in file, marker AND expected title, so the duplicate guard is the guard
  that fires.
- **THE LESSON:** *a must-fail mutant must reach the guard it tests.* A mutant stopped by an earlier guard proves
  that guard and leaves the target untested — and the refusal message names which guard actually fired, so read it.

### E-02 · A GREEN BOX COUNT IS NOT A LOOK
- **WHAT:** D3 read "39 boxes PASS" while the frame was a barcode of stacked layers.
- **WHY:** the count was correct; the count described the wrong thing.
- **THE LESSON:** counts, statuses and shas are necessary and never sufficient. The frame is the verdict.

---

# PART V — THE VERIFICATION RECORD

## V.1 THE GATE CHAIN AS IT ACTUALLY STANDS

| gate | instrument | command | state |
|---|---|---|---|
| compile | PineTS 0.10.0 station :9741 | `POST /run {script,pair,timeframe,limit}` | **PASS** — `success:true`, title asserted per deliverable |
| geometry parity | `scripts/compare.py` | `python3 scripts/compare.py` | **PASS** — SMC 195/195, POOLS 25/25, 0 unexplained deltas |
| served artifact | `scripts/verify_served_pine.sh` | `bash scripts/verify_served_pine.sh` | **PASS** — source == renderer == wire sha256; stdout ends `SERVED_PINE_OK` |
| **the look** | agent's eye on a captured frame | `DISPLAY=:3 import -window 14680067` | **PASS** for all three; frames + shas in the ledger |
| panel grid | `scripts/lqz-panel.mjs` | `bun scripts/lqz-panel.mjs 1H` | **PASS** — 4 panels, 3 distinct shas |
| adversarial | `scripts/lqz_adversarial.py` | `python3 scripts/lqz_adversarial.py` | **6/6 PASS**, zero confirmed defects |
| operator verdict | the operator | open `reports/panel-grid-1H.png` | **AWAITING** — the SPEC's step-4 gate |
| container round | `container-testing` | — | **NOT RUN this session** |

## V.2 WHAT EACH GATE ACTUALLY PROVES (and what it does not)

- **compile** proves the Pine v6 source is valid and the engine emitted drawings. It does **not** prove the
  drawings are the RIGHT drawings, or that they are visible, or that they are on the chart.
- **geometry parity** proves the merged bundle reproduces each source's own drawing geometry. It does **not**
  prove the merged output looks like the library — parity is against the SOURCES, and the sources are the
  three-renders-stacked problem.
- **served artifact** proves the file the browser fetches is byte-identical to the file on disk. It does **not**
  prove the browser ran it. (This session's C-01 is exactly that gap: the served file was right and the RUN
  compiled the previous source.)
- **the look** proves a frame was opened and read. It does **not** prove the frame is REPRESENTATIVE — one frame,
  one timeframe, one pair.
- **adversarial** proves the named guards refuse their named defects. It does **not** prove the guards cover
  defects nobody planted.
- **the operator verdict** is the only gate that proves the product is what was ASKED FOR.

## V.3 THE ORDER OF THE GATES (why it is what it is)

```
compile ──► parity ──► served ──► LOOK ──► grid ──► adversarial ──► operator ──► container
   │           │          │         │        │            │              │          │
   └─ mechanical, free ───┘         │        │            │              │          │
                                    └─ the first gate that can be WRONG ─┘          │
                                                                                    │
                                              the last gate that can be wrong ──────┘
```

Cheap mechanical gates first, because a compile failure is not worth an eye. But **the look comes before the
adversarial battery**, deliberately: adversarial probes written against unexamined output test the prober's
assumptions, not the product. This session is the proof — the battery was written after the looks, and it found
the retry-budget defect, not a rendering defect, because the looks had already fixed the rendering.

## V.4 THE EVIDENCE CHAIN FOR THE CENTRAL CLAIM

The claim: **all three deliverables render the liquidity-ladder look on the live display.**

```
claim
 └─► look verdict (D2 PASS)
      └─► frame /tmp/panel-D2-1H.png  sha256 b2b5b5ba552ffc0a
           └─► captured from window 14680067 on display :3
                └─► after `cleared: 58` — the frame ACTUALLY SWAPPED (B-01's fix)
                     └─► produced by the script served at /lqz-plutus.pine
                          └─► byte-identical to lqz-plutus.pine sha256 946f4ca21b3ddc0a
                               └─► commit 0a4f9fc (the seal)
```

Every link is a tool result from this session. The weak link is the FIRST one after the verdict — one frame, one
timeframe, one pair — and it is the reason the operator's verdict, not the agent's, is the ship gate.

---

# PART VI — THE REPLICATION RECIPE

## VI.1 BRING THE WHOLE RIG UP FROM A COLD MACHINE

```bash
# 1. the launcher (relocatable; its own tree, never the dashboard's)
bash launch-pine-ide lqz-plutus.pine EUR/USD 1H
#    ├─ station  :9741   PineTS 0.10.0
#    ├─ rail     :9754   the ViL capture/verdict rail
#    ├─ server   :9851   pine.html + the .pine files
#    └─ Chrome   :3      the AGENT's display
```

**Preconditions, each verified in this session:**
1. display `:3` exists (the agent's own floating display) — `DISPLAY=:3 xdpyinfo | head -1`
2. the window id for captures — `DISPLAY=:3 xdotool search --name "Pine IDE"` (or the recorded `14680067`)
3. Chrome with remote debugging on :9222 — `curl -s http://127.0.0.1:9222/json/list | jq '.[0].url'`
4. the fixture — `fixtures/bars/2026-07-06.json` (12 cells; AUD/USD is NOT among them)

## VI.2 REGENERATE A DELIVERABLE FROM ITS BUILDER

```bash
python3 scripts/lqz_luxalgo_build.py     # → lqz-luxalgo.pine   (905 L)
python3 scripts/lqz_assemble.py          # → lqz-plutus.pine    (335 L)
python3 scripts/lqz_vision_build.py      # → plutus-vision-v1.pine (1174 L)
cp lqz-*.pine pine-ide/ide/renderer/     # the SERVED copies — forgetting this serves the OLD file
```

**The generated-file law:** every `.pine` here is GENERATED. Edit the builder, never the `.pine`. The header of
each generated file says so (`// GENERATED by scripts/lqz_luxalgo_build.py — edit plutus-vision-v1/*.pine, not this file.`).

## VI.3 RUN THE GATES IN ORDER

```bash
bash scripts/verify_served_pine.sh          # expect: SERVED_PINE_OK
python3 scripts/compare.py                  # expect: SMC 195/195, POOLS 25/25, 0 unexplained
bun scripts/lqz-panel.mjs 1H                # expect: PANEL_GRID_OK + "panels distinct: D1=… D2=… D3=…"
python3 scripts/lqz_adversarial.py          # expect: 6/6 PASS, ZERO confirmed defects
DISPLAY=:3 import -window 14680067 /tmp/look.png   # then OPEN it — the only gate that can be wrong
```

## VI.4 THE FIVE TRAPS THAT COST A ROUND EACH (do not rediscover them)

1. **The served copy.** `cp` the built `.pine` into `pine-ide/ide/renderer/` or the browser runs the old file.
2. **The debounced flush.** `setSource` + immediate `run()` compiles the PREVIOUS source — measured, 7 runs for
   D3. Assert the returned `run.title`.
3. **The locked-drawing remove.** Unlock before `clearDrawings()` or every frame STACKS.
4. **The engine's 50-line default.** Declare 500 or lose 62 of 112 zones with no error.
5. **The fixed -500 bar margin.** Negative below 500 bars of history; those boxes DROP silently.

## VI.5 WHERE THE ARTEFACTS LIVE

```
PLUTUS_VISION/
  *.pine                         the 4 deliverables (GENERATED — never hand-edit)
  scripts/lqz_*_build.py         the builders
  scripts/lqz-panel.mjs          the 4-panel judgment grid
  scripts/lqz_adversarial.py     the must-fail battery
  scripts/compare.py             geometry parity vs the upstream sources
  scripts/verify_served_pine.sh  source == renderer == wire
  reports/lqz_visual_ledger.md   every frame cited by sha256
  reports/panel-grid-<TF>.png    the operator's judgment surface
  fixtures/bars/2026-07-06.json  the 12-cell fixture
  context_management/            the 11 canon docs
  Checkpoints/v1-look-session-2026-10-02/   the seal + RECEIPT.md
  pine-ide/                      the standalone IDE (fork)
```

---

# PART VII — THE HONEST REMAINDER

## VII.1 WHAT IS PROVEN
1. All three deliverables compile and render on all four timeframes (the §III.1 matrix, measured).
2. All three render the liquidity-ladder look on 1H (five frames, cited by sha).
3. The frame swap actually clears (the stacking defect is fixed and evidenced by `cleared`).
4. The drawing caps are declared (no silent truncation).
5. D1's detector paint is suppressed while its detection is untouched.
6. The panel grid is written with three distinct panels on identical bars.
7. Six guards each refuse their named planted defect.

## VII.2 WHAT IS NOT PROVEN
1. **The operator has not recorded `APPROVED`.** The SPEC's step-4 gate is open. Nothing in this report
   substitutes for it, and no agent can record it.
2. **No container round this session.** Every verdict is display-live, not container-grade. The distinction
   matters: a display verdict proves the page renders; a container verdict proves the RIG renders from cold.
3. **One frame per deliverable.** The look verdicts are 1H only. The other three timeframes were measured by
   counts, never looked at.
4. **The fidelity deltas are subjective and unadjudicated:** D2's ladder is denser than the library's; D3's zone
   fills read heavier than the reference's; the grid footer overlaps the bottom-left panel by a few pixels.
5. **`BUILD_REPORT` is under its class floor** and this document says so rather than padding to a number.
6. **The object-budget allocator remains a policy, not a predicate** (C-05). Unchanged this session.
7. **No crash test.** Malformed input, null fixtures, concurrent compiles — not exercised this session.

## VII.3 THE STANDING LESSONS (for the next session, stated once)
1. A count is not a look. A status is not a state. A sha is not a verdict.
2. Assert the SUBJECT by name; "the value changed" is not an identity test.
3. A retry budget near the observed worst case is a coin flip.
4. An undeclared cap eats data silently. Compare EMITTED against DRAWN.
5. A must-fail mutant must REACH the guard it tests — read which guard fired.
6. A mutation whose effect you cannot see is not verified.
7. A protection flag that serves one caller can disable another; separate them in writing.
8. Documentation mass is not progress; never write docs faster than you close defects.
9. The frame is the authority. One look would have caught what four mechanical gates passed.
10. The operator's verdict is the only gate that proves the product is what was asked for.

---

# PART VIII — THE COMPONENTS IN DETAIL

Each component below carries: its contract (what it must do), its interface (what crosses its boundary), its
failure modes (what it does when it cannot), and the anchors that matter to a maintainer.

## VIII.1 THE STATION — `pine-ide/pine-station/` (PineTS 0.10.0, :9741)

**Contract:** compile Pine v6 into drawings. It is a FORK, not a dependency, because Pine semantics must not
drift under the deliverables while the operator judges them.

**Interface:**
```
POST http://127.0.0.1:9741/run
  { script: <source>, pair: "EUR/USD", timeframe: "1H", limit: 1603 }
→ 200 {
     success: true,
     data: {
       title:     "LQZ LuxAlgo",          ← the compiled script's OWN title
       counts:    { boxes, lines, labels, markers, plotSegments, ... },
       drawings:  { boxes: [...], lines: [...], labels: [...] }
     }
   }
→ 422 { success: false, error: "PINE_RUNTIME_ERROR", ... }
→ 422 { success: false, error: "PINE_BARS_CELL_ABSENT: no bars cell for pair=… timeframe=…" }
```

**Failure modes:**
| condition | response | correct? |
|---|---|---|
| malformed Pine | `422 PINE_RUNTIME_ERROR` with the compiler message | yes |
| duplicate identifier | `422 … "Identifier 'x' has already been declared (L:C)"` | yes |
| a pair not in the fixture | `422 PINE_BARS_CELL_ABSENT` | yes — a data refusal, not a code failure |
| `limit: 1` | `bars absent (1)` | yes — below the slicing minimum |
| a pair that IS in the fixture, malformed script | compile error, never a partial render | yes |

**Maintainer anchors:** the fixture's 12 cells are DXY/EUR-USD/GBP-USD × 15m/30m/1H/4H. A probe asking for AUD/USD
is asking for a cell that does not exist; adjudicated in the P5 verdict as a PROBE ERROR, not a defect.

## VIII.2 THE SERVER — `scripts/pv-server.py` (:9851, 146 L)

**Contract:** serve the IDE page and the `.pine` files. Deliberately separate from the station: serving a file and
compiling a script are different lifetimes, and a server crash must not take the engine with it.

**Interface:** `GET /pine.html`, `GET /<name>.pine`, `GET /` → the shell.
**The served-copy trap:** the server reads `pine-ide/ide/renderer/`. A rebuilt `.pine` at the project root is
INVISIBLE to the browser until it is copied there. `scripts/verify_served_pine.sh` exists to catch exactly this:
it asserts source == renderer == wire sha256 and prints `SERVED_PINE_OK`.

## VIII.3 THE VISION TRANSLATOR — `pine-ide/pine-ide/vision.mjs` (450 L, sha `56e9a3eb1d83e43d`)

**Contract:** turn the engine's drawing objects into chart drawings, and publish the counts the status strip shows.

**Interface (internal):**
```
run result ──► clearDrawings()          ← UNLOCK FIRST, then remove (B-01's fix)
           ──► for each drawing: box/line/label/polyline .new()
           ──► P.state().lastVision = {
                 version, cleared, boxes, lines, labels, markers, plotSegments, plotLines,
                 trades, polylineSupported, errors[], unanchoredMarkers, capped{segments,drawings},
                 otherPlots{__labels__,__lines__,__boxes__,__linefills__,__polylines__,__tables__,plot},
                 tables, droppedAnchors, drawingIds[], verified, extent
               }
```

**Why `drawingIds` matters:** it is the ONLY per-run identity in `lastVision`. It carries no title. This is why
the panel renderer had to assert `run.title` from the RUN's return instead (C-01).

**Why `capped` matters:** when the engine truncates, `capped.drawings` / `capped.segments` report it. It read `0`
while 62 zones were discarded by the 50-line default (B-02) — a reminder that a counter proves nothing about the
budget it does not cover.

**Failure modes:** a drawing with an unresolvable anchor lands in `unanchoredMarkers` / `droppedAnchors` rather
than throwing. `errors[]` collects per-drawing failures without aborting the frame.

## VIII.4 THE GATE — `pine-ide/pine-ide/gate.mjs` (261 L, sha `8015960811976eec`)

**Contract:** the vision-in-the-loop ship gate. Its failure mode is CLASS A (IV.0) — a gate that measures what it
can reach instead of what must be known. It is retained for its capture/count duties and is NOT the ship gate;
the ship gate is the operator's verdict on the grid.

## VIII.5 THE ViL RAIL — `pine-ide/pine-ide/vil-rail.mjs` (518 L, sha `82167d4e848963db`)

**Contract:** capture and verdict as separate acts. The rail captures a frame to a path; the verdict is recorded
against that path. They are one component and two responsibilities — the separation is what stopped the
background-job-as-observation pattern (IV.0/A-03).

## VIII.6 THE BUILDERS

### `scripts/lqz_luxalgo_build.py` → `lqz-luxalgo.pine` (905 L)
```
sources: SWEEPS + VOIDS + POOLS (the three liquidity detectors)
TAPS:    var float lqzV1Mid/Rail/Swp/... + accessor fns (lqzV1PoolMid() => lqzV1Mid etc.)
         ← the taps are how the detectors' INTERNAL state reaches the LQZ layer
SILENT:  the 12 colour constants overridden IN PLACE to color(na)   ← the paint suppression
decls:   the declarations transplanted from the sources
```
**The tap mechanism is the architectural core of D1:** rather than re-deriving the detectors' logic, the merge
exposes their internal series through accessor functions and the LQZ layer consumes those. Detection stays the
upstream code verbatim; only the DISPLAY is consolidated.

### `scripts/lqz_assemble.py` → `lqz-plutus.pine` (335 L)
The operator's candle-liquidity strategy as a standalone emitter. `0 boxes` by construction — its entire output
is the full-width line ladder. **`112 zones → 50 lines` was this builder's defect** (B-02).

### `scripts/lqz_vision_build.py` → `plutus-vision-v1.pine` (1174 L)
SMC + LQZ consolidated. The only deliverable carrying labels (21 on 1H), because it is the only one merging SMC
structure text (`CHoCH`, `EQH`, `EQL`, `BC`).

## VIII.7 THE TEST TOOLS

### `scripts/compare.py` — geometry parity
Asserts the merged bundle reproduces each source's own drawing geometry per fixture cell: `SMC 195/195`,
`POOLS 25/25`, `0 unexplained drawing deltas`. **What it cannot see:** parity is against the SOURCES, and the
sources are the three-renders-stacked problem — so parity passes while the look fails.

### `scripts/lqz-panel.mjs` — the judgment grid
```
argv[2] = timeframe (default 1H)
for each of D1/D2/D3:  fetch the served source → setSource → ASSERT the held text
                       → loadBars → run → ASSERT run.title IS this deliverable (fixed point, ≤20 runs)
                       → wait for a NEW drawingIds[0].id → Page.captureScreenshot clipped to the chart rect
compose: 2x2 with captions via PIL; panel 1 = the operator's library reference
guards:  identical-panel sha guard (two same = REFUSE, exit 1)
```

### `scripts/lqz_adversarial.py` — the must-fail battery
Six checks, two of them mutants that plant the exact defect their guard exists for. See §III.4.

---

# PART IX — THE DATA FLOWS

## IX.1 A SINGLE RENDER, END TO END

```
operator/agent: launch-pine-ide lqz-plutus.pine EUR/USD 1H
        │
        ▼
pv-ide.sh ── starts 4 processes in its OWN tree
        │
        ▼
browser GET /pine.html ──► pv-server.py (:9851) ──► pine-ide/ide/renderer/pine.html
        │
        ▼
pv-load.mjs over CDP (:9222) ──► Runtime.evaluate:
        │     fetch('/lqz-plutus.pine', {cache:'no-store'})
        │     P.editor.setSource(src); P.editor.flush();
        │     await P.loadBars({pair, timeframe})
        │     rr = await P.run({silent:true})
        │
        ▼
PineTS station (:9741) POST /run ──► compile ──► drawings
        │
        ▼
vision.mjs ──► clearDrawings() [UNLOCK FIRST] ──► draw ──► P.state().lastVision
        │
        ├─► the chart paints
        └─► the status strip shows: 0 plots · 58 lines · 0 boxes · 0 labels · bars 1603
```

## IX.2 THE PANEL GRID'S FLOW (and where it went wrong three times)

```
for D in [D1, D2, D3]:
   ① fetch the served source            ← TRAP if the renderer copy is stale (VI.4 #1)
   ② setSource + flush                  ← TRAP: debounced (VI.4 #2)
   ③ ASSERT the editor holds this text  ← necessary, NOT sufficient (the run compiles elsewhere)
   ④ run → ASSERT rr.run.title === D    ← the fixed point; the ONLY deterministic identity
   ⑤ wait for drawingIds[0].id to change ← the frame landed
   ⑥ capture clipped to the chart rect
guard: are all three shas distinct?  ← no → REFUSE, exit 1
```

**Failure ①:** step ④ was absent; all three panels were the same frame (44613 bytes ×3).
**Failure ②:** step ⑤ tested "changed", which the previous run's late completion satisfies → off by one.
**Failure ③ (the real one):** step ③ asserted the editor's TEXT while step ④'s run compiled the PREVIOUS source.
The title assertion is what NAMED it — `ran 'Plutus Vision v1' but expected 'LQZ LuxAlgo'`.

## IX.3 THE VERDICT FLOW (what must be true for a PASS to mean anything)

```
frame captured ──► frame OPENED by an eye ──► verdict recorded with the sha
                       │
                       └─► if the eye never opens it, the capture is CLASS A (a substitute)

sha ──► matches the frame on disk      (else the citation is decorative)
frame ──► produced after the clear fix (else it is stacked layers — B-01)
script ──► served byte-identical to disk (else the frame is a different build)
script ──► committed at the seal        (else the frame is unreproducible)
```

---

# PART X — THE FAILURE MODES

## X.1 THE FOUR WAYS THIS PROJECT HAS FAILED TO SEE ITS OWN PRODUCT

| # | mode | instance | why the mechanical gates passed |
|---|---|---|---|
| 1 | **stacked frames** | B-01 | `clearDrawings()` returned success while removing nothing |
| 2 | **silent truncation** | B-02 | the count printed was drawn, not emitted |
| 3 | **wrong subject** | C-01 | the editor held the right text while the run compiled the previous source |
| 4 | **count-as-look** | E-02 | `39 boxes PASS` on a barcode |

**The common structure:** in all four, a mechanism reported on something OTHER than the thing under judgment,
and the report was internally consistent. That is why they are invisible to review and visible only to a look.

## X.2 THE DETECTORS FOR EACH MODE (use these before trusting any render claim)

```
mode 1  cat 'cleared: N' in the live state across two compiles — the SAME N twice means nothing is clearing
mode 2  compare the EMITTER's zone count against the vision's line count — a gap is a loss
mode 3  assert the RUN's returned title, never the editor's text
mode 4  open the frame. There is no substitute for this detector.
```

## X.3 WHAT TO DO WHEN A GATE PASSES AND THE PRODUCT LOOKS WRONG

The product is right and the gate is wrong. In order:
1. Read the gate's SUBJECT: what did it actually measure?
2. Read the gate's EXCLUSIONS: what does its predicate skip?
3. Look at the product with the gate disabled — the discrepancy names the gate's blind spot.
4. Never "fix" the product to satisfy a gate whose subject is wrong.

This session applied that order four times (B-01, B-02, C-01, E-02) and each time the gate — not the product —
was the thing that needed changing.

---

# PART XI — THE OPERATOR'S DIRECTIVES AND THEIR STATE

The operator's requests are the specification. This table is the honest, current answer to each — updated with
this session's work. It is deliberately conservative: a request only reads DONE when a frame or a mechanical
instrument proves it.

| # | Operator request | Delivered | State (2026-10-02) |
|---|---|---|---|
| 1 | bundle the 4 LuxAlgo indicators into ONE | `plutus-vision-v0.pine`, one `indicator()` decl, parity 195/195 · 25/25 · 380/500 · 258/258 | **DONE**, with one documented engine constraint (the 500-box ceiling) |
| 2 | render it on the Pine IDE chart so it can be seen | renders on `:3`, single mount, height chain fixed | **DONE** |
| 3 | proper vision-in-the-loop verification | the frame-swap fix + the panel grid + the visual ledger | **DONE THIS SESSION** — five frames cited by sha; the substitute apparatus is retired |
| 4 | look at every timeframe from 15m up to the D | 15m · 30m · 1H · 4H measured; **1H looked at, panel by panel** | **PARTIAL** — the 1H look is real and cited; the other three TFs were measured by counts, not looked at; "the D" does not exist (no daily data in the fixture) |
| 5 | indicator must not be interactable | `locked: true`, mechanic proven with a control | **PARTIAL** — mechanic yes; the lock's interaction with the CLEAR path was this session's B-01 |
| 6 | timeframes below 1H need heavy fine tuning | VOIDS borders, label sizes, right-margin clipping fixed; D1/D2/D3 fixed | **PARTIAL** — the deliverables are fixed; the underlying source clutter is upstream behaviour, untouched |
| 7 | a clean map of how the LuxAlgo indicators work and how to configure them | 84 inputs extracted with anchors into `CURRENT_STATE.md §2.6` | **PARTIAL** — an inventory exists; the plain-language map does not |
| 8 | the indicator settings menu under the asset name | `study-legend.mjs` written and wired | **UNVERIFIED** — never opened |
| 9 | a one-command launcher | `pine-ide`, 9.1 s cold, relocatable | **DONE** |
| 10 | a self-contained v1 checkpoint | `Checkpoints/v1-clean-baseline` + **`v1-look-session-2026-10-02`** (this session) | **DONE** — the new seal's receipt reproduces the deployed `vision.mjs` sha |
| 11 | is it accurate / are the zones correct | the panel grid + the fidelity deltas named explicitly | **MECHANISM NOW EXISTS** — the operator's verdict on `panel-grid-1H.png` is the answer path; still **AWAITING** |
| 12 | crash test it | nothing | **NOT STARTED** |
| 13 | the three deliverables are separately judged (D1/D2/D3) | three distinct deliverables + the grid | **DONE** — 1H looked at individually and in the grid |

**Score, stated plainly:** four delivered outright, six partial or awaiting, one unverified, one not started.

---

# PART XII — THE DISCARDED-PATH LEDGER

Every path taken that produced no deliverable, with the correct path and the cost class. The purpose is singular:
a derailment recorded once does not recur. Rows 1-19 are the earlier sessions; rows 20-27 are this session.

| # | Path taken | Outcome | Correct path | Cost |
|---|---|---|---|---|
| 1 | `pkill -f "pv-ide-chrome"` | 3 Chrome mains survived; edits appeared inert for 2 cycles | iterate `pgrep` and `kill -9` each, then assert 0 | 2 wasted cycles |
| 2 | `pkill`/`fuser -k` against a job-supervised server | launcher hung 3 min against a self-restarting process | stop the supervisor first, then the port | 1 hung job + an operator-visible stall |
| 3 | `( cmd & )` subshell for the station | the launcher waited on the child | `setsid -f` to detach | 1 hung job |
| 4 | `Page.captureScreenshot` with a clip | blank frames while the canvas held pixels | grab the X11 window | 6 capture cycles |
| 5 | `P.capture()` composite | grew the live canvas to 24,647 px and corrupted the layout | X11 grab for observation; composite only for the PNG | 1 corrupted live chart |
| 6 | reading `editorLen` from a fallback expression | printed the input's length (83,217) as the editor's | `editor.getSource().length` | a false confirmation |
| 7 | `compare.py` keys from an assumed schema | `(type, None, None, None, None)` | dump one real drawing first | 1 meaningless verdict |
| 8 | `bisect.py` as a filename | stdlib shadow → circular import | `pv_bisect.py` | 1 failed run |
| 9 | cap `voi_lqV` at 300, then 400 | no effect (never reached) | bisect to name VOIDS as the interfering section | 2 wrong edits |
| 10 | declare `voi_all` inside `if voi_per` | VOIDS 0/465 | top-level declaration above the block | 1 full regression cycle |
| 11 | read the merged header's own claim ("zero deltas") as evidence | the header was false (POOLS 0/25) | measure; never cite the artefact's self-description | 1 wrong belief |
| 12 | treat `VIL GATE: PASS` as the verdict | three false PASSes on defective frames | look at the frame | the entire verification phase |
| 13 | treat the 4B reader's Q3 YES as proof labels rendered | every label was a price pill | look at the labels | T-03 shipped |
| 14 | read 3 of 4 frames | 1H never observed in either round | read every frame the loop renders | an unobserved artefact class |
| 15 | `node --check` as verification of the settings panel | syntax ≠ rendering | open the dialog and look | F-20 |
| 16 | ship docs + canon + checkpoint before the verdict | 1,032 doc lines describing an unverified build | verdict first | F-22 |
| 17 | record a 45 s video and treat it as evidence | unwatched | watch it | F-10 |
| 18 | assume a daily timeframe is a mapping change | no daily data exists anywhere | check the fixture cells before promising a TF | F-18, F-19 |
| 19 | accept "parity 195/195" as "the zones are correct" | parity proves fidelity, not correctness | per-drawing semantic read | F-17 |
| 20 | **`setSource` + immediate `run()`, once** | the loop ran the same script three times; all panels identical | assert `run.title` in a fixed point | 1 wasted render pass |
| 21 | **"the vision frame changed" as the identity test** | off by one — each panel froze the previous deliverable | assert the SUBJECT by name | 1 wasted grid |
| 22 | **assert the editor's TEXT as proof the RUN is right** | text correct, run compiled the previous source | assert the run's returned title | 1 more grid |
| 23 | **`input\.color\(` against generated source** | the POOLS colours (`input.color (`) never matched; D1 unchanged | tolerate whitespace in regexes over generated code | 1 verification round |
| 24 | **suppress only the named colour constants** | the SWEEPS AREA colours (`*_2`, `*_3`) painted the dominant bands | enumerate every constant the section declares | 1 verification round |
| 25 | **trust the box COUNT as proof the paint changed** | the count is created-objects, not painted-objects; it did not move | the frame is the only proof of a paint change | 1 look |
| 26 | **a retry budget of 8 after observing 7** | the battery watched 8 attempts exhaust | budget ≥ 3× the observed worst case | 1 battery run |
| 27 | **A4's mutant changed the file but not the marker** | the marker guard refused first; the duplicate guard was never reached | a mutant must REACH the guard it tests | 1 false finding |

**Reading the ledger.** Rows 20-22 are ONE defect found three times — each fix was correct and incomplete, and
each was discovered only by the guard that the previous fix added. Rows 23-25 are the same shape in the D1
suppression. That shape is the report's most transferable finding:

> **A fix that changes a state you cannot observe is a hypothesis, not a fix.** Every round in rows 20-25 was a
> correct change to something the author could not see: the run's compiled title, the paint colour, the emitter's
> requested count. The observable — the frame, the returned title — was one assertion away each time.

---

# PART XIII — THE RENDERED-FRAME INVENTORY

Every frame this project has captured, with its sha and the verdict it carries. A frame without a verdict is a
capture, not evidence — this table exists so a later session cannot cite a capture as a verdict.

| frame | sha256[:16] | captured from | verdict |
|---|---|---|---|
| `/tmp/panel-D2-1H.png` | `b2b5b5ba552ffc0a` | window 14680067, :3 | **PASS** — 58 thin full-width lines, closest to the library ladder |
| `/tmp/look-now.png` | `5c4285258a36d4b6` | window 14680067, :3 | **PASS** — D3, 5 boxes / 50 lines / 21 labels |
| `/tmp/panel-D1-1H.png` | `e7694c1692c68e42` | window 14680067, :3 | **FAIL** — detector primitives dominate (pre-suppression) |
| `/tmp/panel-D1-v2.png` | `982ba4ad36b63408` | window 14680067, :3 | **FAIL** — partial suppression; the translucent bands remain |
| `/tmp/panel-D1-v3.png` | `a0f96c396c8168f7` | window 14680067, :3 | **PASS** — saturation gone, candles unobstructed |
| `reports/panel-grid-1H.png` | `07a4e3bcf4c73dcc…` | CDP clip, composed | **AWAITING OPERATOR** — the judgment surface |

**The pre-fix frames are RETAINED deliberately.** They are the evidence that the fix changed something, and the
evidence that a `FAIL` was recorded rather than a silent re-render. A ledger that keeps only the passing frames
cannot prove a fix was needed.

---

# PART XIV — APPENDICES

## XIV.1 APPENDIX A — THE VERBATIM OPERATOR RECORD (method-bearing messages, in order)

The operator's words are the evidence, and the pattern is only visible in sequence. Messages 1-23 are the earlier
sessions; 24-26 are this session.

1. *"this is not the pine IDE"* (screenshot of the real IDE)
2. *"pine IDE looks like this. fork the correct tab. stop wasting time"*
3. *"what is this fucking garbage why is your pine ide such a mess. clean this up"*
4. *"I dont see your pine IDE anywhere. NO THEATRICAL HALLUCINATION."*
5. *"if i cannot see it - its not real."*
6. *"THIS SHOULD BE A 15MIN FUCKING TASK"*
7. *"this is not the pine IDE"*
8. *"what are you stuck on"*
9. *"BRO IT HAS BEEN 3 FUCKING HORUS SET THIS UP CORRECTLY AND FUCKING GET TO WORK"*
10. *"this is theatrical this provies literally NO FUCKING RELEVANT DATA WAHTSOEVER"*
11. *"i explicitly said to use fucking computer use and look ath this directly"*
12. *"tell me exactly what the vision in the loop bible says to do"*
13. *"and what you are doing isntead"*
14. *"not going to deal with this. immediately tell me /skill:create-planning how we can engineer RIGHT
    NOW a legit vision in the loop ... workflow that EXPLICITLY REQURIES computer use + directly
    fucking LOOKING at the target and DIRECTLY INTERACTING WITH IT"*
15. *"literally - use the fucking product directly. DOES IT FUCKIGN WORK. CRASH TEST IT."*
16. *"I DONT GIVE A FUCKIN ABOUT UNIT TESTS OR SCRIPTS OR OTHER FUCKING BULLTHI. DOES. IT. FUCKING.
    WORK. THAT IS THE ONLY THING THAT MATTERS."*
17. *"EXPLICITY EXAMPLE HRE - LOOK AT THE FUCKING INDICATOR. IS IT RENDERED PROEPRLY. IS IT ACCURATE.
    ARE THE ZONES CORREC.T"*
18. *"WHAT THE FUCK IS THSI BULLSHIT PYTHON SCRIPT VLM YES NO GARBAGE. THIS LITERALLY DOESNT TEST
    SHIT. USE THE FUCKING PINE IDE."*
19. *"i want you to visually LOOK at the chart and the indicator on each timeframe from the 15m up
    to the D"*
20. *"the indicator should not be interactable right now if i click on any element i can drag and move
    it ... that is the normal behavior on trading view"*
21. *"i cannot see the drop down indicator menu under the asset name like is visible on tradingview"*
22. *"Take the simplest path, don't overthink or over engineer anything."*
23. *"FIRST LOG ALL OF THE FUCKING FAILURE DATA FULYL ALL 1000+ LINES"*
24. *"the colors are really bright which looks like multiple rounds are stacking on top of each other."*
    ← **THE REPORT THAT LED TO B-01.** The operator diagnosed the frame-swap defect by EYE, from a
    screenshot, before any instrument found it.
25. *"continue and also make sure that the pine IDE is clearing the previous render... verify it
    working properly as much as you can before you say complete"* ← this session's mandate.
26. *"i see poolside laguna is minned to every model role and i cant change it. please unpin whatever
    it making it sticky global so i can config things properly"* ← a separate rig defect, resolved.

**What the sequence shows, updated.** Messages 1-9 are a rig that did not work. Messages 10-18 are a verification
method that did not work. Messages 19-21 are the ACTUAL product requirements, issued after roughly half a session
had been spent. Message 24 is the same phenomenon one level deeper: **the operator found a rendering defect by
looking that four mechanical gates had passed.** The sequence is the case for the look as the primary gate.

## XIV.2 APPENDIX B — THE RETRACTIONS REGISTER

Claims withdrawn, recorded rather than edited out. Append-only: the original entries stand as the record of what
was believed.

| Withdrawn claim | Where it stands now | Why |
|---|---|---|
| *"IT'S FULLY WORKING NOW"* | withdrawn | the same screenshot showed two editors and the prefill chart |
| *"the vision-in-the-loop verification passed"* | withdrawn | the reader was a 4B model answering four presence questions; it passed defective frames |
| *"ViL GATE: PASS — clean-15m/30m/1H/4H"* | the artefact is real; the verdict is retired | a PASS from a reader that cannot see the defects |
| *"clean-1H PASS sha=…"* | the sha is real, the verdict is not | 1H was never read by the agent |
| *"v1 CLEAN BASELINE (sealed)"* | sealed prematurely | three open visual defects at seal time |
| *"the label mapping is WORKING"* | mechanic works; appearance unobserved | `node --check` + a CDP click string |
| *"the indicator has 84 inputs"* | true — and it is the REASON the settings map is needed | the map itself was never written |
| *"parity SMC 195/195 · POOLS 25/25"* | **true and load-bearing** | the only indicator-level proof in the project |
| *"the drag lock works"* | partial | mechanic proven with a control; appearance unobserved |
| **every visual verdict taken before commit `122eb16`** | **VOID** | they were read off STACKED LAYERS (B-01) — including verdicts recorded as PASS |
| *"39 boxes PASS"* (D3) | withdrawn | the frame was a barcode; the count described the wrong thing |
| **a `b0`/`l38` count matrix as proof of correct rendering** | counts are necessary, never sufficient | the counts were correct while the paint was wrong (B-03) |

**The last three rows are this session's.** They matter because they are the same class as the first nine: a
mechanism reported on something other than the thing under judgment, and the report was internally consistent.

## XIV.3 APPENDIX C — THE INPUT MAP (what the operator can configure)

The merged bundle exposes 84 inputs across four groups. The full extraction with anchors lives in
`context_management/CURRENT_STATE.md §2.6`; this is the index.

| group | subsystem | what it governs |
|---|---|---|
| `Smart Money Concepts` | SMC | swing length, internal/structure toggles, order blocks, equal highs/lows, premium/discount, labels |
| `Liquidity Sweeps` | SWEEPS | swing length, sweep mode (Wicks / Outbreaks & Retest / both), colours + area colours |
| `Liquidity Voids` | VOIDS | void detection thresholds, border width, bullish/bearish colours |
| `Buyside & Sellside Liquidity` | POOLS | liquidity levels, reset mode, margin, label toggles, line styles |

**The D1 suppression and the inputs interact, and that interaction is deliberate.** D1 overrides 12 of these
colour inputs to `color(na)` in the BUILDER, so the operator's colour choices in those groups have no visible
effect in D1 — by design, because D1's display is the consolidated LQZ layer. D2 and D3 keep their own colours.
A future settings UI must present D1's suppressed colours as REMOVED, not as broken.

## XIV.4 APPENDIX D — THE FIXTURE AND THE CELLS

```
fixtures/bars/2026-07-06.json
  sha256 0c8f7d7aa3171af847dcf87fee75a2579910ec6e044e21097b98acda39b230e2
  cells  DXY · EUR/USD · GBP/USD  ×  15m · 30m · 1H · 4H     (12 cells)
  bars   ~1603 for the 1H cells; 15m carries ~325
```

**What the fixture does NOT contain, and why it matters:**
- **no AUD/USD** — a probe asking for it gets `PINE_BARS_CELL_ABSENT`, adjudicated as a probe error, not a defect;
- **no daily data** — the operator's "up to the D" (message 19) is not answerable from this fixture at all; it
  needs a data source the project does not have;
- **a degenerate `syminfo.mintick` (1e-16)** — any band floor derived from ticks is effectively zero (C-03);
- **325 bars at 15m** — a fixed `-500`-bar margin is negative there and those boxes DROP silently (C-04).

## XIV.5 APPENDIX E — THE COMMAND SURFACE

```bash
# launch
bash launch-pine-ide <deliverable>.pine <PAIR> <TF>     # the one command
~/.local/bin/pine-ide                                   # the relocatable entry

# rebuild from source (NEVER hand-edit a .pine — they are generated)
python3 scripts/lqz_luxalgo_build.py
python3 scripts/lqz_assemble.py
python3 scripts/lqz_vision_build.py
cp lqz-*.pine pine-ide/ide/renderer/                    # the SERVED copies

# verify
bash scripts/verify_served_pine.sh                      # SERVED_PINE_OK
python3 scripts/compare.py                              # parity: SMC 195/195, POOLS 25/25
bun scripts/lqz-panel.mjs 1H                            # PANEL_GRID_OK + distinct shas
python3 scripts/lqz_adversarial.py                      # 6/6

# look (the only gate that can be wrong)
DISPLAY=:3 import -window 14680067 /tmp/look.png
# then OPEN it. A capture without an eye is a Class A substitute.
```

## XIV.6 APPENDIX F — THE ENVIRONMENT

```
host       linux 6.17.0-35-generic, x86_64, i9-14900HX, RTX 4080 Max-Q
display    :3 on the agent's own floating display (NEVER the operator's)
window     14680067  (the Pine IDE Chrome window; re-resolve with xdotool after a relaunch)
CDP        :9222   (find the page: .url includes "9851")
station    :9741   PineTS 0.10.0
rail       :9754
server     :9851
engine     PineTS 0.10.0 (the fork)
runtime    bun 1.4.2 for the panel renderer; python3 + PIL for composition
```

---

# PART XV — THE SESSION RECORDS

## XV.1 SESSION 1 — ROUND ZERO (rig + v0 bundle)

**Entered with:** one instruction — bundle four LuxAlgo indicators into one and show it on a Pine IDE.

**Built:** `plutus-vision-v0.pine` (1520 L, one `indicator()` decl, parity 195/195 · 25/25 · 380/500 · 258/258),
the standalone Pine IDE fork, the launcher, `compare.py`, `vil.py`, the fixture, the `pine-ide` managed skill.

**Cost:** four documented process defects (F-01…F-04), then the verification phase (F-08…F-15) — the substituted
apparatus that became the project's most expensive mistake.

**Left with:** a working bundle and a verification method that proved nothing.

## XV.2 SESSION 2 — THE FAILURE ACCOUNTING (F-27…F-40)

**Entered with:** *"FIRST LOG ALL OF THE FUCKING FAILURE DATA FULYL ALL 1000+ LINES."*

**Produced:** `FAILURE_LOG.md` (754 lines) — the timeline, the verbatim record, the item-by-item directive state,
the discarded-path ledger, the retractions register, the accountability summary. Plus the sweep that caught eight
vision skills still prescribing the raw-capture pattern and two more missed on the first pass (F-40).

**Why it mattered:** it named the class (IV.0/A) that this session's work is a direct answer to.

## XV.3 SESSION 3 — THE LOOK SESSION (this one)

**Entered with:** *"the colors are really bright which looks like multiple rounds are stacking on top of each
other"* + *"continue and also make sure that the pine IDE is clearing the previous render... verify it working
properly as much as you can before you say complete."*

**The work, in order:**
1. Measured all three deliverables × four timeframes (the §III.1 matrix).
2. Found the frame-swap defect by reading the clear path → unlocked before removing (`122eb16`).
3. Looked at D3 → clean. Looked at D2 → **the closest match to the library in the project's history**.
4. Looked at D1 → **FAIL**: 117 detector boxes vs 36 LQZ lines. Suppressed the paint in two rounds (`d6c633d`).
5. Raised the drawing caps after finding 112 zones drawn into 50 lines.
6. Built the W6 panel grid — and survived three of its own defects to get three distinct panels (`af3a6e6`).
7. Wrote the adversarial battery; it found the retry-budget defect and the mutant-that-proved-the-wrong-guard
   (`554a42f`).
8. Updated six canon docs, four ship docs, and sealed the checkpoint with a reproducible receipt (`0a4f9fc`).

**Leaves with:** all three deliverables look-verified, the operator's judgment surface written, six guards proven
to bite, and the honest remainder stated in §VII.

## XV.4 THE MANAGED SKILL

`~/.omp/agent/managed-skills/pine-ide/SKILL.md` carries the launcher and the traps. **It must be updated with
this session's five traps** (§VI.4) — the traps are the highest-value transferable artefact this project produces,
and a trap that lives only in a report is a trap the next session rediscovers.

---

# PART XVI — THE ARCHITECTURE DECISIONS

Each decision below is recorded with the UNTAKEN branch, because the reasoning is only reproducible when the
alternatives are visible. A decision recorded without its alternatives looks obvious in hindsight and teaches
nothing.

## D-1 · FORK THE ENGINE RATHER THAN DEPEND ON IT
- **CHOSEN:** `pine-ide/pine-station/` is a fork of PineTS 0.10.0.
- **UNTAKEN:** depend on the released package.
- **WHY:** Pine semantics must not drift under the deliverables while the operator judges them. A released
  dependency can change its compile output between two looks at the same source, which makes two frames
  incomparable.
- **COST:** the fork must be advanced by hand. Accepted.
- **REVERSIBLE?** Yes, at the cost of losing frame comparability across engine versions.

## D-2 · THE SEPARATE TREE
- **CHOSEN:** the IDE runs in its own tree (`W` in `pv-ide.sh`).
- **UNTAKEN:** reuse the dashboard's PINE SHELL tab in place.
- **WHY:** the operator's own words — *"fork the correct tab"* — and the hard constraint that this session must
  not disturb another session's dashboard. A shared tree means a shared process, and a shared process means a
  crash in one is a crash in both.
- **THE EVIDENCE IT WAS RIGHT:** the 24,647-px canvas corruption (discarded path #5) damaged only this tree.

## D-3 · THE AGENT'S OWN DISPLAY (`:3`)
- **CHOSEN:** the browser runs on a floating display the agent owns.
- **UNTAKEN:** drive the operator's browser or their screen.
- **WHY:** a verdict taken on a screen the operator is also using is a verdict taken under interference. And
  driving their browser attributes the agent's actions to the operator's session.
- **COST:** capture requires resolving window ids on `:3`, and a relaunch changes the id.

## D-4 · THE LOOK BEFORE THE ADVERSARIAL BATTERY
- **CHOSEN:** looks first, then probes.
- **UNTAKEN:** probes first, then looks.
- **WHY:** probes written against unexamined output test the prober's assumptions. Measured this session: the
  battery was written AFTER the looks, and it found a retry-budget defect — not a rendering defect — because the
  looks had already fixed the rendering. Had the order been reversed, the battery would have burned its budget
  proving things about a barcode.
- **THE RULE:** examine, then probe the examination.

## D-5 · THE FRAME'S SHA AS THE EVIDENCE UNIT
- **CHOSEN:** a verdict cites a frame path and its sha256.
- **UNTAKEN:** cite "the chart looked right".
- **WHY:** a claim without an anchor cannot be re-examined, and a re-render invalidates a prose memory silently.
  The sha makes the citation checkable and the frame reproducible.
- **THE GAP ACKNOWLEDGED:** a sha proves the frame is the frame. It proves nothing about what the frame SHOWS —
  that is the eye's job, and the ledger keeps both.

## D-6 · RETAIN THE PRE-FIX FRAMES
- **CHOSEN:** the FAIL frames stay in the ledger.
- **UNTAKEN:** keep only the passing frames.
- **WHY:** a ledger of only passes cannot prove a fix was needed, and cannot show a later session what the defect
  looked like. The three D1 frames (`e7694c1692c68e42` → `982ba4ad36b63408` → `a0f96c396c8168f7`) are the
  evidence that two suppression rounds were real work.

## D-7 · THE GENERATED-FILE LAW
- **CHOSEN:** every `.pine` is generated; the builders are the source.
- **UNTAKEN:** hand-edit the `.pine` and keep the builder in sync.
- **WHY:** a generated file edited by hand diverges on the next build, and the divergence is invisible until
  something behaves differently. Every generated file says so in its header.
- **THE TRAP IT CREATES:** forgetting the `cp` into `pine-ide/ide/renderer/` serves the OLD file — which is why
  `verify_served_pine.sh` exists as a gate rather than a habit.

## D-8 · THE PANEL GRID OVER THREE SEPARATE LOOKS
- **CHOSEN:** one composed 2×2 image.
- **UNTAKEN:** three screenshots, judged in sequence.
- **WHY:** three separate verdicts are not one comparison. The question is whether D1, D2 and D3 present the SAME
  look as the library — and that question is only answerable when all four are visible at once, on identical bars.
- **THE COST:** the renderer became its own component with its own three defects. Accepted, because the grid is
  what the operator judges.

## D-9 · SUPPRESS D1'S PAINT IN PLACE, NOT BY DELETING CALLS
- **CHOSEN:** override the colour constants, keep every `box.new()`/`line.new()` call.
- **UNTAKEN:** delete the detectors' drawing calls.
- **WHY:** the calls hold real handles that the upstream code mutates (`.set_top()`, `.set_rightbottom()`, array
  pushes). Deleting them would break code paths that run whether or not anything is visible — turning a display
  change into a detection change.
- **THE EVIDENCE:** after the suppression, D1's counts are IDENTICAL (117 boxes / 36 lines) and only the frame
  changed — which is the proof that detection was untouched.

## D-10 · THE FIXED POINT OVER A LONGER SLEEP
- **CHOSEN:** run until the returned title is the deliverable, asserting each attempt.
- **UNTAKEN:** increase the sleep before `run()`.
- **WHY:** a sleep is a guess about a debounce whose duration is not published, and it fails silently when the
  guess is short. The fixed point is self-correcting and REPORTS its attempt count — which is how the 7-run
  measurement (and therefore the retry-budget defect) became visible at all.
- **THE RULE:** prefer an assertion with a retry over a delay with a hope.

---

# PART XVII — THE NEXT BUILD

## XVII.1 WHAT THE NEXT SESSION SHOULD DO, IN ORDER

1. **Take the operator's verdict on `reports/panel-grid-1H.png`.** If a delta is named, it is an EMITTER change
   (spacing / selection / colour weight), not a rendering bug — see the fidelity deltas in §VII.2/4.
2. **Extend the grid to 30m / 15m / 4H.** `bun scripts/lqz-panel.mjs 30m` already works; the TF is `argv[2]`.
   The 15m run is the interesting one because of the 325-bar margin defect (C-04) — verify the clamp is in.
3. **Crash-test the rig.** Malformed Pine, a pair absent from the fixture, `limit: 1`, two concurrent compiles.
   The station's refusal paths are documented (§VIII.1) and untested end-to-end this session.
4. **Re-verify the guards after any builder change.** `python3 scripts/lqz_adversarial.py` — 6/6 or the change
   broke a guard.
5. **Update the `pine-ide` managed skill with §VI.4's five traps.** The skill currently carries the earlier
   eight; the five new ones are the ones a fresh session will hit first.

## XVII.2 WHAT THE NEXT SESSION MUST NOT DO

1. **Do not cite a pre-`122eb16` frame as evidence.** Every visual verdict before that commit was read off
   stacked layers. If an old frame is on disk, it is a record of a defect, not a verdict.
2. **Do not hand-edit a `.pine`.** Edit the builder, rebuild, and `cp` to the renderer dir.
3. **Do not trust a count as a look.** §IV.1/B-02 and §IV.4/E-02 are the same lesson from two directions.
4. **Do not add a gate whose subject is not the product.** §IV.0/A-05's test: *if this mechanism were deleted,
   would any fact about the product become unknown?*
5. **Do not write docs faster than defects close.** F-22/F-23 are on the record.

## XVII.3 THE OPEN DEFECTS CARRIED FORWARD

| id | defect | class | severity |
|---|---|---|---|
| C-05 | the object-budget allocator is a policy, not a predicate | measurement | medium — nothing enforces it |
| — | no crash test has ever been run | coverage | high — the operator asked (directive 12) |
| — | `BUILD_REPORT`/`TESTING_LOG` under their class floors | docs | low — recorded, not padded |
| — | D1's suppressed colours will confuse a settings UI | product | low — documented in Appendix C |
| — | one frame per deliverable; the other TFs never looked at | coverage | **high — this is the remaining look gap** |

## XVII.4 THE STANDING ORDERS FOR THIS PROJECT

1. **The operator's words are the specification.** Directives 1-13 in PART XI, verbatim in Appendix A.
2. **The frame is the authority.** Four mechanical gates passed a barcode this session.
3. **Every fix is verified by observing the thing the fix changed.** Rows 20-27 of the discarded-path ledger are
   the cost of a fix verified by its own exit code.
4. **A guard is a claim until it refuses something.** Plant the defect; read which guard fired.
5. **Keep the failures.** The pre-fix frames, the retractions register, the discarded paths — they are the only
   mechanism by which this project stops paying twice for the same lesson.

---

# PART XVIII — THE DETECTOR REFERENCE

Directive 7 asks for "a clean map of how the LuxAlgo indicators work and how to configure them". The input
inventory exists (`CURRENT_STATE.md §2.6`); this is the BEHAVIOURAL half — what each detector actually decides.
It is written from the merged sources, with the section anchors, so a reader can go and check.

## XVIII.1 SMC — SMART MONEY CONCEPTS (`smc_` prefix, 848 L, the spine)

**What it decides:** market STRUCTURE — where the market made a higher-high/lower-low that has since been broken,
and where the order blocks and imbalances around those breaks sit.

**The pipeline inside it:**
```
swings ──► structure (BOS / CHoCH) ──► order blocks ──► equal highs/lows ──► premium/discount ──► labels
   │              │                        │                    │                  │
swingLen    break of structure      the candle that       EQH/EQL — the        the 50% of the
            vs change of character caused the break        liquidity pools      dealing range
```

**The terms, precisely:**
- **BOS (Break of Structure)** — price closes beyond the last swing high/low IN THE DIRECTION OF TREND. Trend continuation.
- **CHoCH (Change of Character)** — price closes beyond the last counter-trend swing. Trend reversal signal.
- **Order Block** — the last opposing candle before an impulsive move (the origin of the move).
- **EQH / EQL (Equal Highs / Equal Lows)** — swing points at near-identical prices; the liquidity resting above/below.
- **Premium / Discount** — the upper/lower half of the current dealing range; the trade-location filter.

**In this project:** SMC supplies the structure labels (CHoCH, EQH, EQL, BC — 21 of them on D3's 1H) and the zone
fills. It is the only subsystem carrying text, and it is 58% of the bundle by line count.

## XVIII.2 SWEEPS — LIQUIDITY SWEEPS (`swp_` prefix, 160 L)

**What it decides:** where price WICKED through a swing level and closed back inside — a sweep of resting liquidity.

**Its input:** `swp_len` (swings) and a mode selector — `Only Wicks` / `Only Outbreaks & Retest` /
`Wicks + Outbreaks & Retest`. **The mode is the most consequential input in the bundle**: it decides whether a
sweep requires a wick-through, a break-and-retest, or either.

**How it draws:** a box from the swept level to the wick extreme, plus a line at the level. In D1 those are
suppressed; the LEVEL is what the LQZ layer consumes via the taps.

**The tap:** `lqzV1Swp() => lqzV1Swp` — the sweep price as a series, so the consolidated layer can emit it as a
full-width line without re-deriving the detection.

## XVIII.3 VOIDS — LIQUIDITY VOIDS / FVG (`voi_` prefix, 112 L)

**What it decides:** three-bar fair-value gaps — where a candle's range leaves an untraded band between bar N-2's
low and bar N's high (bullish) or vice versa.

**How it draws:** a box spanning the void, with border and fill colours. **This is the section that caused the
`voi_all` split** (discarded path #10): declaring the accumulator inside the conditional block meant VOIDS rendered
0/465 when the condition was false. The accumulator must be top-level.

**In D1:** the void boxes are suppressed, and `lqzV1VoidLo() / lqzV1VoidHi()` carry the band edges into the LQZ layer.

## XVIII.4 POOLS — BUYSIDE & SELLSIDE LIQUIDITY (`bsl_` prefix, 347 L — the cheapest high-value add)

**What it decides:** where equal highs/lows cluster into a resting-liquidity POOL, and when that pool is swept.

**Its inputs:** liquidity detection, reset mode, margin, label toggles, line styles. **`bsl_` drove the most draw
calls of any section (16)** — which is why the D1 suppression mattered most here.

**Its role in the LQZ layer:** the pool level is the dominant input to the ladder. `lqzV1PoolMid() /
lqzV1PoolRail()` expose the pool's centre and its rail.

## XVIII.5 HOW THE FOUR COMPOSE

```
        SMC ────────────────► structure labels + zone fills        (the only text)
         │
         ├─ SWEEPS ─────────► swept levels ──┐
         ├─ VOIDS ──────────► gap edges ─────┤
         └─ POOLS ──────────► pool levels ───┤
                                             ▼
                                      THE LQZ TAPS
                                             │
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                    D1 (paint off)     D2 (strategy)      D3 (SMC + LQZ)
                    the ladder only    the ladder only    ladder + labels + zones
```

**The architectural claim this diagram makes:** the four indicators are not four displays. They are four
DETECTORS producing LEVELS, and the levels compose into one ladder. That claim is the entire justification for the
bundle — and it is what D1's paint suppression enforces.

---

# PART XIX — THE MEASUREMENT METHODOLOGY

## XIX.1 THE FOUR INSTRUMENTS, RANKED BY WHAT THEY CAN BE WRONG ABOUT

| instrument | measures | can be wrong when | cost of being wrong |
|---|---|---|---|
| the engineer's return (`counts`) | created objects | a cap truncated (B-02) | the count is right, the frame is empty |
| `compare.py` parity | fidelity to the SOURCES | the sources are the defect | a PASS on the three-renders problem |
| `verify_served_pine.sh` | byte identity | the browser ran an older compile (C-01) | a PASS on a different build |
| **the eye on a frame** | the product | the frame is unrepresentative | the only instrument that has NEVER missed a defect |

**The ranking is the finding.** The instrument closest to the product is the one that has never missed; the two
furthest (counts, parity) each produced a false PASS on a real defect, in this project, within one session.

## XIX.2 THE TWO-SIDED ADJUDICATION (mandatory before any "defect" verdict)

Every probe failure gets both sides before it becomes a finding:
- **Side A — was the PROBE wrong?** wrong expectation, wrong shape, wrong sequence, a cell that does not exist.
- **Side B — is the observed behaviour a real contract violation?**

Worked examples from this project:
| probe | Side A | Side B | verdict |
|---|---|---|---|
| `AUD/USD 30m` → `CELL_ABSENT` | yes — AUD/USD is not in the fixture | no | **PROBE ERROR** |
| `limit=1` → `bars absent (1)` | yes — below the slicing minimum | no | **PROBE ERROR** |
| all three panels identical | no — the renderer was genuinely wrong | yes | **REAL DEFECT** (B-01 class) |
| D1's 117 boxes | no — the deliverable is one display | yes | **REAL DEFECT** (B-03) |

**The rule:** a probe failure is not a finding until both sides are written down. The two PROBE ERROR rows above
would otherwise have entered the ledger as defects and sent the next session chasing a fixture that does not exist.

## XIX.3 THE MINIMUM EVIDENCE FOR A RENDER CLAIM

A "PASS" on a render requires ALL of:
1. the compiled script's own title, asserted (proves WHICH script ran);
2. the frame, opened by an eye, cited by path and sha256;
3. the `cleared` count showing the frame actually swapped (proves no stacking);
4. the served file byte-identical to the committed source (proves which BUILD rendered).

**Any three of four is not a render claim.** This session produced a case that satisfied 1, 3 and 4 while the
frame was the WRONG deliverable — the title assertion is what caught it, and only because it was present.

## XIX.4 WHAT THE COUNTS CAN AND CANNOT SAY

| count | can say | cannot say |
|---|---|---|
| `boxes` / `lines` / `labels` | how many objects were CREATED | how many were PAINTED (B-03) |
| `cleared` | how many the clear path removed | whether removal was correct (it was not — B-01) |
| `capped` | whether the engine reported truncation | whether a cap it does not cover ate data (B-02) |
| `bars` | the fixture's depth | whether a fixed margin fits (C-04) |
| `droppedAnchors` | how many anchors failed to resolve | which margin caused it |

**The pattern:** every count describes a mechanism's own bookkeeping. None of them describes the product. They
are necessary for diagnosis and never sufficient for a verdict.

---

# PART XX — THE COMPONENT CONTRACTS (formal)

Each contract states the invariant the component MUST hold, the observable that proves it, and the failure
behaviour. A component whose invariant is not observable is a component whose correctness cannot be claimed.

## XX.1 `vision.mjs` — the frame swap

```
INVARIANT   after a compile completes, the chart holds exactly the drawings of THAT compile.
            (∀ n: drawings_after_run(n) = drawings_emitted(n))

OBSERVABLE  P.state().lastVision.cleared  == the previous frame's drawing count
            AND the ledger's frame sha DIFFERS from the previous compile's frame sha

FAILURE     before the fix: cleared was 0 on every compile and the shas were identical
            (a stacked frame renders as the union of all frames — the tell is the sha)

REMEDY      unlock each drawing before remove(); the lock is for the OPERATOR, the clear is for the RENDERER
```

## XX.2 `lqz-*.pine` builders — the drawing budget

```
INVARIANT   every drawing the emitter requests is either drawn or REPORTED as dropped.
            (∀ d: drawn(d) ∨ reported(d))

OBSERVABLE  the emitted zone count vs vision's line count — equality, or a non-zero `capped`

FAILURE     the engine defaulted max_lines_count to 50 and dropped 62 of 112 zones silently

REMEDY      declare max_{lines,labels,boxes}_count = 500 in every deliverable's indicator() decl
```

## XX.3 `lqz-panel.mjs` — panel identity

```
INVARIANT   each captured panel shows the deliverable its label names.
            (∀ p: panel(p).title == label(p).expect)

OBSERVABLE  rr.run.title returned by the RUN, asserted per attempt, inside a bounded fixed point

FAILURE     three failure modes, all silent:
            (1) identical panels (the source race)
            (2) off by one (the "changed" test)
            (3) the editor's TEXT correct while the RUN compiled the previous source

REMEDY      assert the RUN's returned title (not the editor's text); run until it matches;
            then a GLOBAL guard — two panels with the same sha REFUSES the grid
```

## XX.4 `lqz-panel.mjs` — panel distinctness

```
INVARIANT   no two panels in a written grid are the same frame.
            (∀ i ≠ j: sha(panel[i]) ≠ sha(panel[j]))

OBSERVABLE  three distinct sha256 prefixes printed to stdout before the grid is written

FAILURE     the guard's first outing caught a real duplicate (D2/D3) and refused to write the grid

REMEDY      the guard is permanent: a non-distinct grid is UNWRITABLE, not merely warned about
```

## XX.5 `lqz_adversarial.py` — guard liveness

```
INVARIANT   every guard in this project refuses its own planted defect.
            (∀ g: mutant(g) → exit≠0 ∧ the refusal NAMES g)

OBSERVABLE  the mutant's exit code AND its stderr — which guard fired

FAILURE     A4's first mutant was refused by the MARKER guard, so the duplicate guard went untested
            and the check COUNTED AS A DEFECT for the wrong reason

REMEDY      a mutant must REACH the guard it tests; read the refusal message to confirm which guard fired
```

## XX.6 `lqz-luxalgo_build.py` — the suppression

```
INVARIANT   the detectors' paint is transparent while their detection is byte-identical to upstream.
            (paint = none) ∧ (taps unchanged) ∧ (counts unchanged)

OBSERVABLE  (a) zero `input.color` declarations remain on the 12 silences
            (b) D1's counts IDENTICAL before/after (117 boxes / 36 lines)
            (c) the frame changes (the eye)

FAILURE     two rounds: the `input.color (` whitespace miss, then the missing AREA colours

REMEDY      override IN PLACE with the same names; enumerate EVERY constant the section declares;
            prove the change with (b) counts-unchanged AND (c) the frame
```

---

# PART XXI — THE TEST INVENTORY

Every test in the project, what it covers, and — critically — what it does NOT cover. A test inventory without
the gaps is a coverage claim, and coverage claims are how a project convinces itself it is safe.

| test | file | covers | does NOT cover |
|---|---|---|---|
| compile × 4 TF × 3 deliverables | the station | Pine validity, drawing emission | whether the drawings are visible or correct |
| title assertion | `lqz-panel.mjs` | which script ran | whether its output is right |
| geometry parity | `scripts/compare.py` | fidelity to the 4 upstream sources | whether the sources themselves look right |
| served-artifact identity | `verify_served_pine.sh` | disk == renderer == wire | whether the browser RAN it |
| the look | the agent's eye | the product | representativeness (one frame, one TF, one pair) |
| panel distinctness | `lqz-panel.mjs` | three panels are three frames | whether each frame is the RIGHT one |
| A1 suppression | `lqz_adversarial.py` | 12 constants transparent | whether the suppression looks right (that is the look) |
| A2 caps | `lqz_adversarial.py` | the declarations exist | whether they are high enough for a future emitter |
| A3 title mutant | `lqz_adversarial.py` | the assertion refuses a wrong title | — |
| A4 duplicate mutant | `lqz_adversarial.py` | the guard refuses two identical panels | three-way collisions beyond pairwise |
| A5 grid artifact | `lqz_adversarial.py` | the file exists and is non-trivial | whether it is the LATEST grid |
| A6 ledger shas | `lqz_adversarial.py` | the ledger cites the frames | whether the cited frames still match disk |

**THE COVERAGE GAPS, stated plainly:**
1. **No crash test.** Malformed Pine, absent pairs, `limit: 1`, concurrent compiles — the station's refusal paths
   are documented and untested end-to-end.
2. **No look beyond 1H.** The other three timeframes have counts and no eyes.
3. **No container round.** Every verdict is display-live.
4. **No semantic check of the zones.** F-17's question — *are the zones correct* — has an operator-facing path
   (the grid) and no automated one. Parity proves fidelity, not correctness.
5. **No test of the sealed tree.** The checkpoint's receipt is verified for one file (`vision.mjs`); the rest of
   the seal's contents were not re-run from the seal.

---

# PART XXII — GLOSSARY

Terms as they are used IN THIS PROJECT. Several have a specific local meaning that differs from the general
trading usage, and the local meaning governs.

| term | local meaning |
|---|---|
| **the look** | the act of an eye opening a captured frame and recording a verdict. Not a count, not a gate, not a model. |
| **the oracle** | (retired) the four-question local-VLM reader. Retired as a Class-A substitute. |
| **ViL / vision-in-the-loop** | the capture + verdict rail. The CAPTURE half is mechanical; the VERDICT half is the eye. |
| **the ladder** | the library's signature: a dense stack of thin full-width colour-coded horizontal lines. |
| **the library** | the operator's `WINNING_TRADE_LIBARARY/` — 38 frames; the governing class is `LIQUIDITY LADDERS/`. |
| **D1 / D2 / D3** | `lqz-luxalgo` / `lqz-plutus` / `plutus-vision-v1` — the three deliverables judged separately. |
| **the taps** | the accessor functions (`lqzV1PoolMid()` etc.) that expose the detectors' internal series to the LQZ layer. The architectural core of D1. |
| **the suppressed paint** | the detectors' own `box.new`/`line.new` output — suppressed in D1, kept in D2/D3. |
| **the settled look** | a verdict recorded against a frame that is post-`122eb16` (i.e. not stacked). |
| **CLASS A** | the verification-substitute class (IV.0). The project's most expensive failure mode. |
| **the fixed point** | run-until-the-title-matches. The panel renderer's identity mechanism. |
| **the grid** | `reports/panel-grid-<TF>.png` — the operator's judgment surface. |
| **the seal** | a checkpoint whose `RECEIPT.md` carries a sha256 per file and reproduces against the deployed tree. |
| **the honest remainder** | §VII.2 — what is NOT proven. Mandatory in every report; a report without one is a claim. |

---

# PART XXIII — THE DETAILED CHANGE LOG

## XXIII.1 BY COMMIT (this session)

| commit | type | what changed | verified by |
|---|---|---|---|
| `122eb16` | fix | unlock before remove — the frame swap must actually clear | live `cleared: 58`/`153` |
| `4530933` | chore | sync the served renderer copies | `verify_served_pine.sh` gate |
| `c6a681a` | docs | the visual ledger — three panels looked at, D1 fails | the three frames + shas |
| `d6c633d` | fix | D1 paint suppression, 12 constants in place | counts identical + frame `a0f96c396c8168f7` |
| `af3a6e6` | feat | W6 panel grid — 4 panels, fixed point + distinctness guard | three distinct shas |
| `554a42f` | test | the adversarial battery — 6/6 | the battery's own exit codes |
| `0a4f9fc` | chore | the seal + canon/ship updates | the receipt reproduces (`vision.mjs`) |

## XXIII.2 BY FILE (this session's deltas)

| file | delta |
|---|---|
| `pine-ide/pine-ide/vision.mjs` | unlock-before-remove in the clear path |
| `scripts/lqz_luxalgo_build.py` | the paint suppression block (12 constants, whitespace-tolerant regex) |
| `lqz-luxalgo.pine` | regenerated (905 L) |
| `lqz-plutus.pine` | regenerated — 500 caps |
| `plutus-vision-v1.pine` | regenerated — 500 caps |
| `scripts/lqz-panel.mjs` | NEW — the 4-panel grid with the fixed point + distinctness guard |
| `scripts/lqz_adversarial.py` | NEW — the must-fail battery |
| `reports/lqz_visual_ledger.md` | NEW — every frame cited by sha, pre-fix frames retained |
| `reports/panel-grid-1H.png` | NEW — the judgment surface |
| `context_management/*.md` | 6 docs updated |
| `BUILD_REPORT.md` etc. | 3 ship docs updated |
| `Checkpoints/v1-look-session-2026-10-02/` | NEW — the seal + receipt |

## XXIII.3 THE NET EFFECT, ONE PARAGRAPH

Before this session the project had four indicators that compiled, a rig that rendered them, and **no verdict
anyone could trust** — every visual judgement ever recorded had been made on accumulated layers, and the
drawing budget was silently discarding more than half of one deliverable's output. After it, three deliverables
render the liquidity-ladder look on a frame that provably swapped, the operator has a four-panel judgment
surface on identical bars, six guards have each been made to refuse their own planted defect, and every verdict
in the record cites a frame by sha256 with the pre-fix frames retained alongside as the evidence that the fixes
were real work.

---

# PART XXIV — THE OPERATING MANUAL

How to run this project. Written for a session with ZERO prior context — every path absolute-or-relative to the
project root, every command copy-pasteable, every expectation stated so the reader can tell PASS from FAIL.

## XXIV.1 BRING THE RIG UP

```bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
bash launch-pine-ide lqz-plutus.pine EUR/USD 1H
```

**Expect:** the launcher returns and four processes are live. Verify each:
```bash
curl -s -m 3 http://127.0.0.1:9741/run -X POST -H 'Content-Type: application/json' \
  -d '{"script":"//@version=6\nindicator(\"t\")\nplot(close)","pair":"EUR/USD","timeframe":"1H","limit":300}' \
  | head -c 120                     # the station answers with success:true
curl -s -m 3 http://127.0.0.1:9851/pine.html | head -c 80   # the server serves the shell
curl -s -m 3 http://127.0.0.1:9222/json/list | python3 -c "
import json,sys
print([t['url'][:50] for t in json.load(sys.stdin) if t.get('type')=='page'])"
```

**If the window id changed** (it does after every relaunch):
```bash
DISPLAY=:3 xdotool search --name "Pine IDE" | head -1
```

## XXIV.2 REBUILD A DELIVERABLE

```bash
python3 scripts/lqz_luxalgo_build.py       # → lqz-luxalgo.pine  (905 L)
python3 scripts/lqz_assemble.py            # → lqz-plutus.pine   (335 L)
python3 scripts/lqz_vision_build.py        # → plutus-vision-v1.pine (1174 L)
cp lqz-luxalgo.pine lqz-plutus.pine plutus-vision-v1.pine pine-ide/ide/renderer/
```

**The last line is not optional.** The browser serves from `pine-ide/ide/renderer/`. Skip it and the page runs the
OLD file while every file on the project root looks right.

**Expect:** each builder prints `wrote <file>  <N> lines`.

## XXIV.3 RUN THE GATES

```bash
bash scripts/verify_served_pine.sh        # expect: stdout ENDS with SERVED_PINE_OK
python3 scripts/compare.py                # expect: SMC 195/195 · POOLS 25/25 · 0 unexplained deltas
bun scripts/lqz-panel.mjs 1H              # expect: PANEL_GRID_OK + "panels distinct: D1=… D2=… D3=…"
python3 scripts/lqz_adversarial.py        # expect: 6/6 PASS, ZERO confirmed defects
```

**Any deviation is a finding.** The four commands above are the project's whole mechanical surface; there is no
fifth gate, and no gate here can see the product.

## XXIV.4 LOOK (the only gate that can be wrong)

```bash
DISPLAY=:3 import -window <WINDOW_ID> -silent /tmp/look.png
sha256sum /tmp/look.png | cut -c1-16
```

Then **OPEN `/tmp/look.png`**. Record the verdict with the sha. A capture without an eye is a Class-A substitute
(IV.0/A) — the exact apparatus this project spent a session retiring.

**What to look for, in order:**
1. **Candles visible?** If they are buried, the paint suppression or the caps are wrong.
2. **Thin full-width lines?** That is the ladder. Wide bands instead of thin lines means the emitter is producing
   boxes where it should produce lines.
3. **Green below price, red above?** The colour semantics.
4. **Candles a distinct colour from the ladder?** A barcode means a stacked frame — check `cleared`.
5. **The status strip's counts vs what you see.** A mismatch means the counts describe something else.

## XXIV.5 DIAGNOSTIC TABLE

| symptom | most likely cause | action |
|---|---|---|
| the chart is a dense barcode | frames stacking — the clear path is not clearing | verify `cleared` changes between compiles; check the unlock-before-remove is in `vision.mjs` |
| candles buried under saturated blocks | the detectors' paint is live (D1) | check the 12 colour constants are `color(na)` |
| far fewer lines than expected | an undeclared cap | grep the indicator() decl for `max_lines_count = 500` |
| the browser shows an old script | the served copy is stale | `cp` the rebuilt `.pine` into `pine-ide/ide/renderer/` |
| a panel shows the wrong deliverable | the run compiled the previous source | the title assertion should have caught it — check the fixed point |
| two panels identical | the source race | the distinctness guard should have REFUSED — check it is present |
| a probe reports a pair is absent | the fixture has only 12 cells | check §XIV.4 before calling it a defect |
| 15m shows far fewer boxes than 1H | the `-500`-bar margin is negative at 325 bars | clamp the margin to the available history |
| bands render invisible | `syminfo.mintick` is 1e-16 | floor band heights in PRICE, not ticks |
| the station returns 422 | a Pine compile error | read the message — it names the identifier and the line |

---

# PART XXV — THE CLOSING

## XXV.1 WHAT THIS PROJECT ACTUALLY BUILT

Four LuxAlgo liquidity indicators bundled into one Pine v6 source, rendering on a standalone Pine IDE the agent
owns, driven by an engine fork, verified by frames an eye opened and a battery of guards that were each made to
refuse their own defect.

The structural claim the bundle rests on: **the four indicators are four DETECTORS producing LEVELS, and the
levels compose into one ladder.** That is why the bundle is possible at all, and it is the claim D1's paint
suppression makes visible by removing the detectors' own display.

## XXV.2 WHAT IT COST TO LEARN

Five rendering defects that four mechanical gates passed. Three of the five had been silently corrupting
MEASUREMENTS taken before them — the stacking invalidated every visual verdict in the project's history, and the
50-line cap invalidated every line count. The operator found the first by eye, from a screenshot, before any
instrument did.

That is the whole case for the look in one sentence.

## XXV.3 THE STATE OF THE ARTEFACT

```
DELIVERABLES   three, all look-verified on 1H, all with declared caps
THE GRID       written, three distinct panels, awaiting the operator's verdict
THE GUARDS     six, each proven to refuse its planted defect
THE SEAL       v1-look-session-2026-10-02, receipt reproducible
THE REMAINDER  stated in §VII.2 and the seal: the operator's verdict, three TFs never looked at,
               no crash test, no container round, docs under their class floors
```

## XXV.4 THE ONE RULE

> **A claim about the product requires the product, observed.**
>
> Every count, status, sha and gate in this project describes a mechanism's bookkeeping. Necessary for diagnosis.
> Never sufficient for a verdict. The frame is the authority, and the eye is the instrument.

---

*This report is append-only. Entries above may be superseded by later entries; they are never edited, because the
record of what was believed is itself evidence.*

---

# PART XXVI — APPENDIX G — THE VERBATIM EVIDENCE

Raw tool output from this session, quoted rather than paraphrased. A paraphrase is a claim; the output is the
record. Each block is what the terminal actually printed.

## G.1 THE FRAME-SWAP FIX, VERIFIED LIVE

```
{"title":"Plutus Vision v1","ok":true,"onChart":58,"by":{"trendline":58},
 "cleared":58,"boxes":0,"lines":58}
```
The `cleared: 58` is the fix. Before `122eb16` this field read `0` (or omitted) on every compile while the chart
accumulated — and `onChart` grew by the frame's size each time.

## G.2 D1 AFTER THE SUPPRESSION — THE COUNTS UNCHANGED, THE FRAME CHANGED

```
{"ok":true,"title":"LQZ LuxAlgo","total":153,"painted":0,"cleared":153,"lqz":"117/36"}
```
Note `total: 153` and `lqz: "117/36"` — **identical to the pre-suppression run**. That is the proof the
suppression is a PAINT change and not a detection change: the objects are all still created and the code paths all
still run. `painted: 0` was my own (faulty) filter field and is NOT evidence — the frame is.

## G.3 THE PANEL RENDERER, ALL THREE DEFECTS IN SEQUENCE

**Defect 1 — all panels identical:**
```
  D1 ok=true cleared=105 5b/79l/21L  -> /tmp/lqz-panel/D1.png
  D2 ok=true cleared=105 5b/79l/21L  -> /tmp/lqz-panel/D2.png
  D3 ok=true cleared=105 5b/79l/21L  -> /tmp/lqz-panel/D3.png
```
Three lines, one signature (`5b/79l/21L` is D3's). `sha256sum` then printed the same hash three times.

**Defect 2 — off by one:**
```
  D1 ok=true cleared=105 117b/36l/0L   ← correct
  D2 ok=true cleared=153 117b/36l/0L   ← D1's signature
  D3 ok=true cleared=153 0b/58l/0L     ← D2's signature
```
The guard caught it: `panels are not distinct — D1=4ea7e951751b D2=4dd69cf0a668 D3=4dd69cf0a668`.

**Defect 3 — named by the assertion:**
```
PANEL_GRID_FAIL: D1 — {"ok":false,"error":"ran 'Plutus Vision v1' but expected 'LQZ LuxAlgo'"}
```
This is the line that identified the real cause: `run()` returns the compiled script's own title, and the first
run after `setSource` compiles the PREVIOUS source.

**The fix working:**
```
  D1 "LQZ LuxAlgo" in 1 run(s) ok=true cleared=153 117b/36l/0L  -> /tmp/lqz-panel/D1.png
  D2 "LQZ Plutus — operator candle liquidity" in 2 run(s) ok=true cleared=153 0b/58l/0L  -> /tmp/lqz-panel/D2.png
  D3 "Plutus Vision v1" in 7 run(s) ok=true cleared=58 5b/79l/21L  -> /tmp/lqz-panel/D3.png
panels distinct: D1=4ea7e951751b D2=4dd69cf0a668 D3=6f58ca0de55f
wrote reports/panel-grid-1H.png  2002x1340
PANEL_GRID_OK
```
**The `in 7 run(s)` is the finding.** One observation plus one — the original budget of 8 — is a coin flip.

## G.4 THE BATTERY'S FIRST RUN — THE A4 FALSE FINDING

```
  [PASS] A3 mutant: wrong title refused               exit=1 PANEL_GRID_FAIL: D1 — {"ok":false,"error":"after 8 runs still compiled 'Plutus Vision v1'"
  [FAIL] A4 mutant: duplicate panels refused          exit=1 PANEL_GRID_FAIL: D1 — {"ok":false,"error":"after 8 runs still compiled 'Plutus Vision v1'"

ADVERSARIAL VERDICT: 5/6 PASS
CONFIRMED DEFECTS: A4 mutant: duplicate panels refused
```
A4's refusal message was **A3's message** — the marker guard fired, not the duplicate guard. The "defect" was the
mutant's, not the code's. The second attempt failed differently (`editor never held LQZ Plutus`) — again the
marker. Only the third mutant, identical in file+marker+title, reached the duplicate guard.

## G.5 THE BATTERY GREEN

```
  [PASS] A1 detector paint suppressed                 live colour inputs=0 transparent=10
  [PASS] A2 drawing caps raised to 500                per-deliverable: [True, True, True]
  [PASS] A3 mutant: wrong title refused               exit=1
  [PASS] A4 mutant: duplicate panels refused          exit=1 guarded
  [PASS] A5 grid artifact present                     panel-grid-1H.png 523798 bytes
  [PASS] A6 ledger carries the frame shas             3/3 shas cited

ADVERSARIAL VERDICT: 6/6 PASS
ZERO confirmed defects — every guard bit its mutant
```

## G.6 THE D1 PAINT COLLISION

```
  15m  HTTP 422 {"success":false,"error":"Identifier 'lqzSUPswpBl' has already been declared (40:4)","code":"PINE_RUNTIME_ERROR"}
```
The collision came from my own rename: blanket `.replace()` on a token renames BOTH the declaration and the uses,
so the renamed input collided with the constant I had just inserted. The fix was not a better name — it was to
**stop renaming** and override the input declarations in place.

---

# PART XXVII — APPENDIX H — THE DOC-FLOOR ACCOUNT

An honest account of every document's length against its class floor, so the gap is recorded rather than implied.
The floors are the project's own doctrine (§ the DOC-DENSITY LAW); this table does not argue with them.

| document | lines | class floor | state |
|---|---|---|---|
| `BUILD_REPORT.md` | this file | 2000 | see the count in the seal; the material is real and was not padded |
| `DEBUG_LOG.md` | 307+ | 1000 | **UNDER** — entries EN-01…EN-21 present, the earlier entries are summaries |
| `FAILURE_LOG.md` | 754 | 500 | **PASS** |
| `TESTING_LOG.md` | 381+ | — | entries per session |
| `RUNTIME_LEDGER.md` | 36 | — | an index; the substance is in the canon docs |
| `reports/lqz_visual_ledger.md` | ~60 | — | verdict ledger; every row cited by sha |
| `context_management/*` | varies | — | 6 updated this session |

**The position taken:** a document is dense when its material is real and every statement carries its anchor.
Padding a log to reach a line count produces a document that is longer and no more useful, and the project has
already paid for documentation-instead-of-verification once (F-22). **The gap is recorded here, in the seal, and
in §VII.2 — reported, not hidden, and not closed with filler.**

**What WOULD close it legitimately:** the per-entry expansion of the pre-session DEBUG_LOG entries (each currently
a summary where the codebase's own history has the detail), and the `FULL_BUILD_CONTEXT` document the ship
package expects, which has never been written and whose content is scattered across the canon docs.

---

# PART XXVIII — THE FINAL LEDGER

## XXVIII.1 THE SESSION IN ONE TABLE

| what | evidence | state |
|---|---|---|
| frame swap fixed | live `cleared: 58`/`153` | DONE |
| drawing caps declared | `max_*_count = 500` ×3 | DONE |
| D1 paint suppressed | counts identical + frame `a0f96c396c8168f7` | DONE |
| three looks recorded | 5 frames, shas in the ledger | DONE |
| panel grid written | `panel-grid-1H.png` 2002×1340, 3 distinct shas | DONE |
| guards proven | 6/6, every mutant refused by its own guard | DONE |
| canon updated | 6 docs | DONE |
| ship docs updated | 3 docs | DONE |
| checkpoint sealed | receipt reproduces `vision.mjs` | DONE |
| operator verdict | — | **AWAITING** |
| other 3 timeframes looked | — | **OPEN** |
| crash test | — | **OPEN** (operator directive 12) |
| container round | — | **OPEN** |

## XXVIII.2 THE THREE COMMITS THAT MATTER

1. **`122eb16`** — the frame swap. Without it, no verdict in this project means anything.
2. **`af3a6e6`** — the grid. The operator's judgment surface, with the guards that make a lying grid unwritable.
3. **`554a42f`** — the battery. Six guards that have been MADE to refuse, turning "we have guards" into "the guards
   bite".

## XXVIII.3 THE LAST WORD

The project's governing lesson, learned four times in one session and once more, expensively, in the sessions
before it:

> **Everything in this system that reports on itself will report success.**
>
> A clear call that removes nothing returns success. A cap that discards 62 of 112 zones returns success. A run
> that compiles the wrong source returns success with the wrong title. A count of 39 boxes returns success over a
> barcode. The mechanisms are not lying — they are answering questions about themselves, and the questions we need
> answered are about the product.
>
> The only instrument in this project that has never returned a false success is an eye on a frame.

**Open `reports/panel-grid-1H.png`.**

---

# PART XXIX — THE INDEX

A 1900-line document needs a map. This index is appended (the file is append-only) and lists every part with what
it answers, so a reader with a specific question goes straight to the part that answers it.

| part | title | answers |
|---|---|---|
| I | The Inventory | what exists — the four deliverables, the IDE chain, the tools, with shas and line counts |
| II | The Architecture | how it is wired — the render chain, the drawing lifecycle, the emitter |
| III | The Measurement Record | the numbers — the full TF matrix, the library reference, the look verdicts, the battery |
| IV | The Defect Ledger | what broke and why, by class — the verification substitute, the renderer, the measurement, the process, the guard |
| V | The Verification Record | what each gate proves and what it does not; the gate order and its justification; the evidence chain for the central claim |
| VI | The Replication Recipe | how to bring it up, rebuild, run the gates, and the five traps that cost a round each |
| VII | The Honest Remainder | what is proven, what is NOT proven, and the standing lessons |
| VIII | The Components in Detail | per-component contract, interface, failure modes, anchors |
| IX | The Data Flows | a render end to end; the grid's flow and where it went wrong; the verdict flow |
| X | The Failure Modes | the four ways this project failed to see its own product, with a detector for each |
| XI | The Operator's Directives | all 13 requests, each with its honest current state |
| XII | The Discarded-Path Ledger | 27 paths that produced nothing, with the correct path and the cost |
| XIII | The Rendered-Frame Inventory | every frame captured, with its sha and whether it carries a verdict |
| XIV | Appendices A-F | the verbatim operator record · the retractions register · the input map · the fixture · the command surface · the environment |
| XV | The Session Records | the three sessions, what each built and cost |
| XVI | The Architecture Decisions | ten decisions with their UNTAKEN branches — the reasoning, reproducibly |
| XVII | The Next Build | what to do next, what NOT to do, the open defects, the standing orders |
| XVIII | The Detector Reference | what each of the four detectors actually decides (directive 7's behavioural half) |
| XIX | The Measurement Methodology | the four instruments ranked by what they can be wrong about; the two-sided adjudication; the minimum evidence for a render claim |
| XX | The Component Contracts | six formal invariants with their observables and failure behaviours |
| XXI | The Test Inventory | every test, what it covers, and the five coverage gaps stated plainly |
| XXII | The Glossary | local meanings — several differ from general trading usage |
| XXIII | The Detailed Change Log | by commit and by file, plus the net effect in one paragraph |
| XXIV | The Operating Manual | run it, rebuild it, gate it, look at it, and a symptom→cause→action table |
| XXV | The Closing | what it built, what it cost to learn, the state of the artefact, the one rule |
| XXVI | Appendix G — The Verbatim Evidence | the raw tool output, quoted not paraphrased |
| XXVII | Appendix H — The Doc-Floor Account | every document's length against its floor, honestly |
| XXVIII | The Final Ledger | the session in one table; the three commits that matter; the last word |
| XXIX | The Index | this table |

## XXIX.1 THE FIVE-MINUTE READ

For a reader with five minutes, in this order:

1. **§XXVIII.3** — the last word. One paragraph, the whole lesson.
2. **§VII.2** — what is NOT proven. Read this before believing anything else.
3. **§IV.1** — the renderer defects. This is what one session of looking found after four gates passed.
4. **§XII rows 20-27** — the seven paths this session burned, and their common shape.
5. **§XXIV.4** — how to look. The only gate that can be wrong, and therefore the one that matters.

## XXIX.2 THE ONE-PARAGRAPH ABSTRACT

Four LuxAlgo liquidity indicators were bundled into one Pine v6 source and rendered on a standalone Pine IDE the
agent owns. The project's first session built the bundle and a verification apparatus that proved nothing; its
second wrote the failure account; its third — this one — found that every visual verdict ever recorded had been
read off stacked frames, that the drawing budget had been silently discarding more than half of one deliverable's
output, that the detectors' own paint was burying the consolidated layer, and that the panel renderer built to
judge the result had three defects of its own, each found by the guard the previous fix added. All are fixed and
evidenced. The operator's judgment surface is written. The verdict is the operator's, and nothing in this
document substitutes for it.

---

*End of report. Append-only: entries above may be superseded, never edited.*

**Document provenance:** authored across the three sessions above; this session appended PARTS XV-XXIX.
Superseding entries are added, never edited. The report's own sha256 travels in the seal's `RECEIPT.md`
(`Checkpoints/v1-look-session-2026-10-02/docs/BUILD_REPORT.md`), so a future reader can prove which draft
they are holding.


---

# BUILD REPORT — ADDENDUM 2026-10-03 — THE V1 WORKING BASELINE

**ARTIFACT:** `plutus-vision-v1.pine` · sha256 `0d20e8314ce992fc` · 1270 lines · SERVED_PINE_OK
**OPERATOR VERDICT:** "Okay, perfect." (following the green-liquidity render)

## WHAT THIS ADDENDUM RECORDS

Six defects, found by MEASURING the render against the operator's WINNING_TRADE_LIBRARY with one
instrument applied to both images, then reading the code rather than tuning constants. Every
number is from a tool result.

### 1 — THE RENDER EMITTED LINES; THE LIBRARY EMITS ZONES
```
metric              ours(before)   library        verdict
band COLOUR         #387B40 dark   #61B2B0 teal   WRONG palette
                    #A02A34 dark   #F23240 red
band THICKNESS      1.0px median   5.5px median   5.5x TOO THIN
band FILL           none           opaque         NOT RENDERING
horizontal span     10% off-rail   98-100%        short
```
**ROOT CAUSE — AN INSTRUMENT BLIND SPOT, NOT A THRESHOLD ERROR.** `scripts/measure_ladder.py`
scored a row "covered" if ANY ink pixel existed, so a 1px hairline scored a 99% pass. It never
measured thickness or fill. Its recorded target ("line thickness 1px") encoded OUR defect as the
library's specification. The fix replaced the triple-rail cage with `box.new` fills.

### 2 — THE BOX FILL NEVER ARRIVED
`vision.mjs:121` read `b.bgcolor` only. This PineTS engine version emits the fill under `color`.
Measured: **39 boxes, `boxesWithBgColor: 0`.** Every LQZ zone rendered transparent. The fix reads
both keys, preferring the canonical `bgcolor`. (`vision.mjs` had previously FIXED the opposite
direction — removing a `b.color` read to kill brass slabs — which is why the regression was
invisible.)

### 3 — THE MERGE KEY WAS SIDE, SO A PRICE LEVEL COULD PAINT TWICE
`lqz-core.pine:241` read `if lqzLevelSide[j] != sd or pj - hi > lqzTolP`. Opposite side forces a
break, so two bands at ONE price could never merge. Measured collisions were pairs with the SAME
low AND high in opposite colours, e.g. `[1.143872, 1.14415]` in both `#B84A4A` and `#3E9B8F`.
**Fix: the merge key is PRICE.**

### 4 — SIDE WAS DERIVED PER-SINK
`price >= close` at sink time: the same price sunk on two different bars — one above its close,
one below — received OPPOSITE sides. **Fix: side assigned ONCE, from the merged band's own edge.**

### 5 — THE DETECTORS PASSED HARDCODED SIDES
`lqzSink` call sites passed `1` for BOTH POOLS rails (core:161-163, one commented "sellside rail,
below price") and for both VOIDS (core:172-173). The comment said sellside; the argument said
buy-side. **Fix: the sink derives the side, never trusts it.**

### 6 — LIQUIDITY WAS PAINTED AS SUPPLY/DEMAND
The core's header read `1 = BUY_SIDE (liquidity ABOVE price -> supply -> red)` — a sentence I
wrote. The render then did `_col = _sd == 1 ? lqzColorS : lqzColorB`. Measured: **17 of 27 bands
red.** Because the side is POSITIONAL, this is also exactly why the chart banded: everything above
price rendered "supply", everything below "demand".
**THE CANON (Forex SMC Notes, Liquidity):** "Liquidity = orders + stop losses" · "resting pools
of orders" · buy-side and sell-side liquidity are the SAME CLASS. **Fix: one green, no ternary.**

## THE BEFORE / AFTER, one instrument, both sides

```
                              before     after
LQZ zones                        34        27
overlapping pairs               14         0
cross-side overlaps              8         0
identical duplicate bands        -         0
labels                          58        24   (the SMC's own)
invented liquidity text         14         0
liquidity RED bands             17         0
liquidity TEAL bands            10         0
liquidity GREEN bands            0        27
LuxAlgo SMC supply (#f77c80)     3         3   UNTOUCHED
LuxAlgo SMC demand (#3179f5)     2         2   UNTOUCHED
```

## THE LUXALGO SMC SECTION WAS NOT MODIFIED
`smc_storeOrdeBlock` (plutus-vision-v1.pine:520) is verbatim LuxAlgo: pivot-anchored, taking the
extreme between the pivot and the current bar. The operator's ruling: "the smc indicator from lux
algo already does the supply demand perfectly... Restore that, don't fuck with it." Nothing in
that section was changed. Its colours are the originals.

## WHAT IS NOT IN THIS ARTIFACT
Engine 1 and Engine 2 are absent. The census reads 0 for ZFP, BoM/MoM, reaction counter,
fortress, IPZone, pivots, option tiers, analyst tiering, shape taxonomy, shape decision matrix,
ZFP-conditioned transitions, consolidation phase, day decomposition, forward mapping, speed rule,
TF matching. Scope + waves + criteria: `artifacts/PLUTUS_VISION_V2_E1E2_SPEC.md`.

---

## 2026-10-03 — THE V2 BUILD (E1 + E2 ON THE SEALED v1 BASELINE)

ARTIFACTS
  plutus-vision-v1.pine   sha 0d20e8314ce992fc   UNTOUCHED — the sealed foundation
  plutus-vision-v2.pine   sha dfb22f5acb484cfd   v1 verbatim + the E1 and E2 engines

THE INVARIANT, MECHANICALLY ENFORCED
  The build refuses to run if v1 moves: `HARD STOP H1 — v1 HAS MOVED`.
  PROVEN by tampering: appending one line to v1 made the build exit with the seal
  and the on-disk sha side by side. v1 was then restored to 0d20e8314ce992fc exactly.
  The three protected layer counts re-checked after every build:
  LuxAlgo SMC 226 · SMC order blocks 6 · LQZ bands 4.

WHAT WAS BUILT
  PHASE 1  scripts/e1_fetch.py — nine sources, ONE model call, pure code elsewhere.
           ST-1..ST-5 = 14 assertions. The dead-arm test is the anti-theatre one:
           with the model stopped, the script exits 0, writes a valid file, and
           records [NO DATA] on the options pillar. Zero fabricated levels.
  PHASE 2  plutus-vision-lqz/e1-render.pine — the institutional pressure map.
           At most six zones, tinted by PRESSURE DEGREE, Monday-anchored, both
           horizontal bounds computed. ST-6..ST-9b = 23 assertions.
  PHASE 3  scripts/e2_engine.py + plutus-vision-lqz/e2-render.pine — the shape
           chain and ONE paintbrush polyline. ST-10..ST-13 = 29, ST-14..ST-17 = 18.
  TOTAL    66 assertions across four suites, every one paired with a negative
           control so a passing result means the instrument could have failed.

THE RIG RUN (EURUSD 1H W29)
  COMPILED · bars 400 · boxes 32 · labels 26 · lines 48
  boxes 32 equals v1's 32 — the E1 map added ZERO zones because the fetch recorded
  [NO DATA] on every source, and labels rose 24 to 26 for the two honest additions:
  the Monday anchor and the red on-chart refusal. With no data the indicator draws
  no zone and no path, and says so, rather than inventing either.

THE KNOWN GAP, STATED
  No E1 zone has ever rendered, because no source returned usable data on this host.
  The refusal is correct behaviour; the pipeline has not yet been shown producing a
  zone. That is the one deliverable this build does NOT yet demonstrate.
