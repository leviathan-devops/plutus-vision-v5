# PLUTUS VISION PINE IDE — CONTEXT HANDOVER (PRIMARY AGENT DUMP)

### Paste this file first. Then unzip the rest of the pack. Then do not renegotiate the rulings.

```
Package:   PLUTUS_PINE_IDE_CONTEXT_HANDOVER.zip
Written:   2026-10-02 (the handover turn; tree HEAD 53a29ac, working tree clean)
Author:    the PLUTUS_VISION session being handed off (the agent that built D1/D2/D3 and the rig)
Consumer:  a WEB AGENT with its OWN computer + sandbox and ZERO access to this local machine,
           AND any local fresh session that must resume this work from disk.
Freeze:    PLUTUS_VISION @ 53a29ac · D3 = 82da437af969a315 (OPERATOR-APPROVED) ·
           v0 parity reference = 605bff82d3539e9e (NEVER EDIT) · engine pinets 0.10.0 /
           @luxalgo/vela-pinets 0.2.14 / vela 0.8.0 (lock == disk)
```

**Conflict rule (verbatim, also in README.txt at the zip root):**

```
If handover conflicts with BINDING spec on implementation detail, BINDING wins.
If BINDING conflicts with a superseded spec, BINDING wins.
Dead paths in the handover override any superseded "v1 daemon / keep-alive" language.
```

**You are a foreign agent.** Nothing in this pack requires `/home/leviathan/...` to exist on
your machine. Where an absolute local path appears below it is marked `[LOCAL-ONLY]` — it is
either (a) a provenance note for an artifact that is ALREADY INSIDE THIS ZIP, or (b) an
environment override you set yourself. §3.6 lists every one of them. The tree resolves its own
root (`scripts/pv-ide.sh` line 8: `W="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"`), so
extract-anywhere works.

---

# 0. WHO YOU ARE NOW

You are the builder and the operator of a self-hosted **Pine IDE** (a standalone TradingView
look-alike that compiles and renders Pine v6 indicators through PineTS) and of **three liquidity
deliverables** written for it. You are not a designer of new architecture. The architecture
exists, is measured, and is frozen at the SHAs above. Your job in the first hours is to
**run the thing, look at pixels, and continue the refinement stream** — not to redesign.

What you police, in one line each:

- **Evidence over prose.** A verdict without the tool result / the opened frame behind it is VOID.
- **The operator's words are the spec.** Rulings 1-12 below are LAW; you do not reopen them.
- **`plutus-vision-v0.pine` is the parity reference. NEVER EDIT IT.** `605bff82d3539e9e`.
- **A capture nobody OPENED is not evidence.** "if i cannot see it - its not real" (ruling 7).
- **A blocked op is never a pass.** It names its resume condition. (This project's whole culture.)
- **The operator owns the calibration and the verdict.** You put measured numbers in front of
  them; you do not decide the look.

What you will NOT do, even if a transcript from before this handover suggests it:

- You will not invent a fallback band, a synthetic zone, or a "sensible default" render when a
  detector is starved. Zero zones is the CORRECT output of a starved detector (DRILL 3, §9).
- You will not wire a label/annotation feature into D3 that the operator did not ask for. One
  such attempt happened and was REVERTED — read §6.1 before touching labels.
- You will not "fix" the sweeps standalone leg by pinning an older engine: the lock and the disk
  AGREE (F-XX, §5.5). The lever is not a version.
- You will not run a code-audit gate on this project. Ruling 12 replaced it with vision-in-the-loop.

If you are reading this as a web agent with no display: §7.3 (headless) is your path and it is
first-class, not a workaround. The station, the renderer and the rail all run headless; only the
headed X11/Chrome path needs a display.

---

# 1. THE ARC OF THIS SESSION

## 1.1 Requests, in order (the operator's own words, compressed only where marked)

1. "take the working 4 lux algo indicators, bundle them into ONE indicator, and render it on the
   pine IDE chart so i can see everything and **MAKE SURE IT IS PROPERLY FUCKING DONE**"
2. "no fucking reinventing or customizing anything"
3. "Assemble production grade components > build from scratch"
4. "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION - THIS IS YOUR NEW
   WORKSPACE. MIGRATE ALL *YOUR* PROJECT FILES TO HERE FULLY" `[LOCAL-ONLY path]`
5. "THIS IS REFERENCE ONLY FOR YOU TO FORK THE PINE IDE TAB INTO A STANDALONE PINE IDE FOR THIS
   PROJECT'S TESTING SO YOU DONT INTERFERE WITH THE DHA OTHER SESSIONS WORK"
6. "YOU WILL DO PROPER VISION IN THE LOOP VERIFICATION TO MAKE SURE IT WORKS"
7. "if i cannot see it - its not real"
8. "Take the simplest path, don't overthink or over engineer anything."
9. "Create a clean, simple, separate launcher where I can just type Pine E IDE in the terminal and
   launch this exact standalone fucking shell"
10. "save this checkpoint in the plutus vision folder as v1 clean baseline ... make sure there is a
    checkpoint for the indicator itself + the entire pine shell ide ... self contianed within the
    checkpoint"
11. "the indicator should not be interactable right now ... indicators are not interactable they
    just render. that is the normal behavior on trading view"
12. "REPLACE QWEN CODE AUDIT WITH VISION IN THE LOOP
    /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/Bibles/VISION_IN_THE_LOOP_ENGINEERING_BIBLE.md"
    `[LOCAL-ONLY path]`

Then, in the liquidity stream (the current work), the operator added:

13. "the liquidity zones right now are 3 different weird stlyes of render that make it hard to see
    - my hand drawn liqidity zones are all 3 of these data types/triggers/instances/etc drawn as
    one solid horizontal green zone across the level that all 3 liquidity tpyes itnersect"
14. "all liquidity zones extend horizontally across the entire chart. look at the photos."
15. "i want you to deeply study my winning trade library and how i've manually charted all of my
    S/D/L zones on my winning trades setups"
16. "Lux algo's SMC indicator already handles S/D zones basically perfect. liquidity is the issue"
17. "your task is to fix liquidity and split test lux algos vs mine to see which is more precise"
18. "IT IS NOT APPROVED" unless it LOOKS as solid as the winning trade library
19. (on the refinement) the operator asked for the rendered zones to match the library's visual +
    accuracy, and questioned the label wiring — see §1.2 R-13 and §6.1.

## 1.2 RULINGS THE OPERATOR ALREADY MADE (do not reopen)

Numbered. These are the live constraints; each is restated as the constraint it imposes.

| # | ruling | the live constraint | where it bites |
|---|---|---|---|
| R-1 | bundle the 4 LuxAlgo indicators into ONE, render it on the Pine IDE | the deliverable set is D1/D2/D3 + v0(reference); the IDE is the ONLY surface ("EVERYTHING RUNS THROUGH THE IDE") | `lqz-*.pine`, `pine-ide/` |
| R-2 | no reinventing or customizing anything | edits go to INPUT VALUES or to the renderer; NEVER to LuxAlgo detector logic | `sources/*.pine` frozen; `scripts/compare.py` parity is the tripwire |
| R-3 | assemble production-grade components > build from scratch | the four LuxAlgo sources are merged VERBATIM (single `indicator()` decl rule) | `plutus-vision-v0.pine`, `sources/` |
| R-4 | migrate the project to its own workspace | this project is its OWN git repo (`PLUTUS_VISION`), untracked inside `Shared_Workspace` | `.git`, remote `leviathan-devops/plutus-vision` (PRIVATE) |
| R-5 | fork the Pine IDE tab into a STANDALONE Pine IDE so the DHA session is not interfered with | own ports `9741/9754/9851/9222` + display `:3`; the dashboard's `9430/9441/9444/9448` are FORBIDDEN to touch | `scripts/pv-ide.sh` |
| R-6 | do proper vision-in-the-loop verification | every visual verdict comes from a frame the agent OPENED | `reports/lqz_panel_look_record.md` |
| R-7 | if i cannot see it - its not real | a capture nobody opened is not evidence; a file on disk is not a look | the look record's per-panel rows |
| R-8 | take the simplest path; don't over-engineer | no new subsystems for a missing knob; a NAMED residual beats a speculative build | the viewport control (residual, not built) |
| R-9 | a clean simple launcher you type to launch the exact shell | the launcher is relocatable and fails LOUD with a named code | `launch-pine-ide`, `scripts/pv-ide.sh` |
| R-10 | a checkpoint for the indicator AND the whole shell, self-contained | checkpoints carry `tree/` + `artifacts/` + `canon/` + `ship/`; launch-from-checkpoint MUST work | `Checkpoints/` |
| R-11 | indicators are NOT interactable; they just render | `locked: true` on every drawing the renderer adds; a drag test is the acceptance | `pine-ide/pine-ide/vision.mjs` |
| R-12 | REPLACE QWEN CODE AUDIT WITH VISION IN THE LOOP | the ship gate is `scripts/vil.py` + the battery; no code-audit gate runs here | `scripts/vil.py`, `scripts/lqz_adversarial.py` |
| R-13 | (refinement order) match the rendered zones to the winning-trade library's visual + accuracy; and "why are you adding buyside/sellside liquidity labels" | the refinement target is D3 (`plutus-vision-v1.pine`); the label wiring is DEAD (§6.1) | `plutus-vision-lqz/lqz-render.pine`, D3 |

R-13's second clause is the one that killed a whole round of work. Read §6.1 before you touch
anything that emits labels.

## 1.3 What this session already produced (file table, with roles)

| artifact | what it is | state |
|---|---|---|
| `plutus-vision-v1.pine` (D3) | the operator's candle liquidity + the LuxAlgo SMC; the refinement target | **OPERATOR-APPROVED**, sha `82da437af969a315` |
| `lqz-luxalgo.pine` (D1) | the three LuxAlgo detectors, ONE full-width display | renders; 15m reader-FAIL / 30m-4H PASS; `lqzSource='both'` is the displaying config |
| `lqz-plutus.pine` (D2) | the operator's candle strategy (line ladder, no labels by design) | renders; sha `68881deaca0c66a1` |
| `plutus-vision-v0.pine` | the merged 4-source parity reference | **UNCHANGED across 107+ commits** — `605bff82d3539e9e` |
| `pine-ide/` | the standalone IDE: station, kernel, renderer, rail, chart/workbench bundles | working; the pack ships it whole incl. `pine-station/node_modules` |
| `scripts/pv-ide.sh` | the one-command, relocatable rig launcher | 72 lines; probes the station by COMPILE, not by `/` |
| `scripts/pv-server.py` | the static renderer host + the fixture bars feed on `:9851` | 146 lines |
| `scripts/verify_served_pine.sh` | the served-artifact drift guard (`SERVED_PINE_OK`) | 41 lines; root-resolved |
| `reports/lqz_panel_judge.md` | the 39-frame library cross-reference + the band-height delta | the measured refinement evidence |
| `context_management/` (12 docs) | the canon: state, decision chain, evidence, queue, logs | CANON GATE PASS; hand blocks inside markers |
| `Checkpoints/v1-lqz-pin-execution-2026-10-02/` | the seal (tree + artifacts + canon + ship) | rev 9+; `tracked == sealed`; mode `no-lock` |
| `Checkpoints/v1-working-baseline/` | the seal at the operator's D3 approval | HEAD `484dae9`; 462 src entries |

---

# 2. THE PRODUCT IN ONE PAGE

**One sentence:** a self-hosted Pine v6 IDE that compiles and renders liquidity/SMC indicators on
a bundled FX fixture, plus three liquidity deliverables built by merging four verbatim LuxAlgo
open-source indicators into one shared full-width level renderer.

```
   ┌─────────────────────────────── the machine (birth → execute → observe) ──────────────────────┐
   │                                                                                              │
   │  BIRTH      pv-ide.sh resolves its OWN tree root (W) and starts FOUR processes on THIS tree:  │
   │               :9741 station   pine-ide/pine-station/server.mjs   (PineTS compile+run, AGPL)   │
   │               :9754 rail      pine-ide/pine-ide/vil-rail.mjs     (ledger writer / proxy)      │
   │               :9851 server    scripts/pv-server.py               (renderer + fixture feed)    │
   │               :9222 CDP       chrome --app=.../pine.html         (the shell, HEADED path only)│
   │                                                                                              │
   │  EXECUTE    POST :9741/run {script|canon:true, pair, timeframe, limit} → JSON                │
   │               {success, data:{title, bars, counts:{boxes,lines,labels,…}, drawings:{…}}}       │
   │             the renderer's shell (window.PlutusPineShell) drives it from the page:            │
   │               P.editor.setSource(src) → P.loadBars() → P.run() → P.capture() → P.runGate()    │
   │                                                                                              │
   │  COMPLETE   a run is COMPLETE when the station returns success:true AND the run's OWN title    │
   │             matches the deliverable's declared title (the only deterministic per-panel check) │
   │                                                                                              │
   │  NOTIFY     the VIL ledger row (vil/<week>.jsonl) + the PASS/FAIL/INCONCL buttons — VISIBLE    │
   │             but they never drive the loop; the OPERATOR's verdict is the terminal gate         │
   │                                                                                              │
   │  OBSERVE    a capture (P.capture / import -window) that the AGENT OPENS. Nothing else.         │
   └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**The three deliverables + the reference:**

```
   D1  lqz-luxalgo.pine      the three LuxAlgo liquidity detectors, ONE display (the bundle)
   D2  lqz-plutus.pine       the operator's own candle strategy (dense line ladder)
   D3  plutus-vision-v1.pine the winner + the LuxAlgo SMC  ← OPERATOR-APPROVED, the refinement target
   v0  plutus-vision-v0.pine THE PARITY REFERENCE — never edited, never shipped as a deliverable
```

**What it is NOT (bullets a fresh agent gets wrong):**

- It is **not** a TradingView integration. `pine-ide/tv-feed/` exists (a TradingView-API data
  feed as a separate process) but the IDE runs on the bundled fixture
  `fixtures/bars/2026-07-06.json` (1.9 MB, 12 cells = 3 pairs × 4 timeframes).
- It is **not** the DHA dashboard. The renderer root is a FORK of the dashboard's renderer
  (`pine-ide/ide/renderer/`, which still carries `app.js`, `novnc/`, trade tabs). The IDE page is
  `pine.html` and it does NOT load `app.js` (D-01). The dashboard's ports and processes are a
  different session's — never touch `9430/9441/9444/9448`.
- It is **not** a live-data product. No network, no broker, no TradingView account. The fixture is
  the world.
- It is **not** an interactable chart. Drawings are `locked: true` (R-11).
- It is **not** a code-audit-gated project. Vision-in-the-loop replaced the audit gate (R-12).
- It is **not** finished. P8 (the operator's panel verdict) is open for D1/D2; the refinement
  stream (R-13) is the live work; the honest gaps are §9.4 and the checkpoint manifest.

---

# 3. HOST / FREEZE INTERNALS

Everything here is measured on this host on 2026-10-02 and is what the pack reproduces.
`file:line` anchors are relative to the project root (`PLUTUS_VISION/`), which inside the zip is
`02_PINE_IDE/`.

## 3.1 The rig — four ports, four processes, one display

| port | process | file | healthy probe | failure token |
|---|---|---|---|---|
| `:9741` | the Pine station (PineTS transpile+run) | `pine-ide/pine-station/server.mjs` | **`POST /run` returns `{"success":true}`** | `PINE_STATION_DOWN`, `STATION_DOWN` |
| `:9754` | the VIL rail (ledger writer + station proxy) | `pine-ide/pine-ide/vil-rail.mjs` | `GET /` → **404 = HEALTHY** (no `/` route); use `/health` | `RAIL_DOWN` |
| `:9851` | the renderer host + fixture bars feed | `scripts/pv-server.py` | `GET /pine.html` → 200 | `SERVER_DOWN` |
| `:9222` | Chrome DevTools Protocol (headed only) | `google-chrome-stable --remote-debugging-port=9222` | `GET /json/version` → 200 | `NO_PAGE` |
| `:3` | the X11 display the IDE window lives on (headed only) | nested weston | `DISPLAY=:3 xdotool search --name "Pine IDE"` | `DISPLAY_DOWN` |

**THE HALF-ALIVE STATION — the single most important rig fact.** Measured twice
(`reports/lqz_second_operator.md`, `reports/lqz_runtime_forensic.md`): `GET /` and `GET /health`
on `:9741` **can HANG** (`http_code=000`, curl exit 28, the full client timeout) **while
`/catalog`, `/cells`, `/bars` answer 200 and `POST /run` compiles normally.** Every checker that
pings `/` declares a WORKING station dead. The launcher's station probe therefore POSTs a trivial
script and requires `"success":true` — see `scripts/pv-ide.sh` lines 40-50 (`station_up()`), and
the comment above it that names the measurement. **A launch is a compile: probe the compile.**

## 3.2 The station contract (the API the docs must state)

`pine-ide/pine-station/server.mjs` header, lines 1-30, is the authority. Summary:

```
GET  /health | /            → { status, engine, pid, uptimeMs, canon, node, catalog }
GET  /catalog               → { studies:[{id,name,kind,overlay,description,script}] }
GET  /canon                 → { path, sha256, bytes, lines, version, title }
GET  /cells[?dataFile=]     → the fixture's pair/timeframe inventory (12 cells)
GET  /bars?dataFile=&pair=&timeframe=[&limit=]
                            → { source, label, anchorMs, ticks, count, bars:[{time,open,high,low,close,volume}] }
POST /run {script | canon:true, bars|dataFile, pair, timeframe, symbol, limit, maxPoints,
           overlay:{script|canon:true, id}}
                            → the normalized run; with `overlay` a SECOND source runs over the
                              SAME bars and is returned separately under `data.overlay`
```

- **Body size cap:** 12 MB (`MAX_BODY`, line 30).
- **Bar trim:** `trimBars()` (line ~107) — `limit <= 0` or absent keeps the FULL history; `limit`
  beyond the array length is a no-op. So `limit=0` is DOCUMENTED as "keep the full history" — it
  is not a refusal.
- **CORS:** `Access-Control-Allow-Origin: *` is deliberate (station binds 127.0.0.1 only; the
  page is served from `:9851`, so every call is cross-origin). Removing it makes a healthy station
  read as `PINE_STATION_DOWN` (measured — the header comment says so).
- **Named refusals** (never an empty success): `PINE_SCRIPT_ABSENT` (400) · `PINE_REQUEST_MALFORMED`
  (400) · `PINE_BARS_ABSENT` (400) · `PINE_OVERLAY_MALFORMED` (400) · `PINE_COMPILE_ERROR` /
  `PINE_RUNTIME_ERROR` (422) · `PINE_DATA_DENIED` (403) · `CANON_PINE_ABSENT` (503) · `PINE_ROUTE_ABSENT`
  (500) · `PINE_STATION_ERROR` (500).
- **Serialization:** the station serializes compiles (~16-19 s each under concurrent load) with NO
  busy signal. Budget ~20 s per compile; the crash test measured 6 simultaneous compiles finishing
  ~19 s apart.

**The refusal table a reader must know (so a refusal never reads as a failure):**

| input | response |
|---|---|
| empty / null script | `400 :: primary: a script or canon:true is required` |
| not Pine | `422 :: Unexpected token (2:6)` |
| unknown identifier | `422 :: <name> is not defined` |
| absent pair/timeframe | `500 :: no bars cell for … (available: 12 cells listed)` |
| `limit=1` | `400 :: bars absent (1)` |
| `limit=0` | **`200` — keep the full history** |
| concurrent load | serialized ~16-19 s each; no busy signal |

## 3.3 The AGPL isolation law (why the station is a separate process)

`pine-ide/pine-station/server.mjs` header, lines 3-13: `pinets` (PineTS) and
`@luxalgo/vela-pinets` are **AGPL-3.0**. They live in THIS package's own `node_modules` and are
imported by THIS process only. Nothing AGPL reaches the Apache-2.0 dashboard bundle: the chart
calls `http://127.0.0.1:9741/run` and receives JSON. **Pull the station and the chart still
renders candles, drawings and native indicators** — a dead station yields the token
`PINE_STATION_DOWN`, never a blank panel.

**Consequence for you:** the pack ships `pine-station/node_modules` (39 MB) because that is the
engine. It is AGPL — keep it a separate process. Do not inline it into a bundle. If you repackage
the renderer, keep the station out of it.

## 3.4 The engine pins (checked, not assumed)

| package | `package-lock.json` | on disk | note |
|---|---|---|---|
| `pinets` | `0.10.0` | `0.10.0` | they AGREE |
| `@luxalgo/vela-pinets` | `0.2.14` | `0.2.14` | install mtime 2026-10-01 16:33 — the only moving part since the baseline |
| `vela` | `0.8.0` | `0.8.0` | the drawing/geometry engine |

**Why this table matters:** the F-XX sweeps failure was theorised to be a version drift. It is NOT
— the lock and the disk carry the same builds, so the regression reproduces on an unchanged
install and lives in Vela's UDT-geometry extraction. **The version pin is not the lever.**

## 3.5 Hooks / processes that DO NOT EXIST (do not go looking)

- **No Electron main process here.** `server.mjs`'s header says "OWNED BY THE ELECTRON MAIN
  PROCESS" — that is the DHA dashboard's architecture, inherited by the fork. In this project the
  station is launched by `scripts/pv-ide.sh` (`env -C … setsid -f node server.mjs`) and by nothing
  else. There is no `main.js` in this tree.
- **No `session.idle` / promptAsync notifier, no keep-alive daemon, no plugin supervisor.** The
  only long-lived things are the four processes above. `plutus-vision.service` (a systemd unit
  referenced in an old checkpoint manifest) is NOT part of this pack and is not required.
- **No `GET /` route on the rail** (404 is healthy). No websocket in the IDE page.
- **No `fitContent` / viewport API on the chart control** — this is why the composer's panels can
  have different windows (a NAMED residual, §8).
- **No settings-dialog access from the exposed shell surface** — `H2` is UNRUN, named (§9.4).
- **No `D` timeframe cell in the fixture** (15m/30m/1H/4H only) — T-14/N-7 is blocked on data.

## 3.6 Relocatability — every absolute path, classified

The pack is relocatable. These are the only absolute paths that appear anywhere in the machinery,
and each one is either optional or overridable:

| path | where | class |
|---|---|---|
| `W="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"` | `scripts/pv-ide.sh:8` | **SELF-RESOLVED** — the tree root is wherever the script sits |
| `$W/fixtures/bars/2026-07-06.json` | `pv-ide.sh:10`, `pv-server.py` default | **SELF-RESOLVED** relative to the tree |
| `/tmp/pv-ide-chrome`, `/tmp/pv-*.log`, `/tmp/pine-ide-shot.png` | `pv-ide.sh` | scratch; created fresh |
| `/home/leviathan/JARVIS_WORKSPACE/...` in docs, checkpoints, `reports/` | docs only | `[LOCAL-ONLY]` provenance; **not read at runtime** |
| `/home/leviathan/Pictures/WINNING_TRADE_LIBARARY` | docs + `reports/` | `[LOCAL-ONLY]` — the library is IN this zip at `04_REFERENCE_LIBRARY/` |
| `PLUTUS_BARS_FIXTURE`, `PLUTUS_LIVE_ROOT`, `PINE_STATION_PORT`, `PINE_STATION_HOST`, `PV_FIXTURE`, `PLUTUS_VIL_*` | env overrides | **you set them; the defaults are tree-relative** |

**THE ONE REQUIRED ENV VAR (measured on the extracted pack, 2026-10-02):**
`PLUTUS_BARS_FIXTURE` — with it, the station is fully working from any path; without it, the
station LISTS but resolves the fixture from a BUILD-MACHINE path (`…/PLUTUS/LIVE/agent/reference/
fixtures/bars/2026-07-06.json`) and `/bars` fails on a foreign machine. `PLUTUS_LIVE_ROOT` alone
does NOT point at this pack's fixture (it resolves `<root>/agent/reference/fixtures/…`).
`PLUTUS_CANON_PINE` (default: a build-machine path) only affects `POST /run {"canon":true}` —
which the deliverables never use; a foreign `/canon` returning `503 CANON_PINE_ABSENT` is
EXPECTED, not a defect. `POST /run` also accepts a `bars` array inline, so the fixture is not
strictly required for a single compile.

**Env vars the launcher sets (pv-ide.sh lines 34-56), which you can set yourself headless:**

```
PINE_STATION_PORT=9741  PINE_STATION_HOST=127.0.0.1
PLUTUS_BARS_FIXTURE=<tree>/fixtures/bars/2026-07-06.json
PLUTUS_LIVE_ROOT=<tree>
PLUTUS_VIL_PORT=9754  PLUTUS_STATION_URL=http://127.0.0.1:9741
PLUTUS_VIL_DIR=<tree>/vil  PLUTUS_VIL_EVIDENCE=<tree>/evidence
PV_FIXTURE=<tree>/fixtures/bars/2026-07-06.json
```

---

# 4. SOURCE ANALOGS — what to take, what to refuse

## 4.1 The four LuxAlgo sources (`sources/*.pine`, FROZEN)

| # | file | lines | sha256[:16] | take | refuse |
|---|---|---|---|---|---|
| 1 | `sources/smart-money-concepts-smc.pine` | 848 | `a8046ad353c1b495` | the SMC renderers: BOS/CHoCH, order blocks, EQH/EQL, FVG, premium/discount zones, structure labels | never edit; its detector logic is the "S/D is basically perfect" the operator named |
| 2 | `sources/liquidity-sweeps.pine` | 160 | `c81921370a81425e` | the wick/outbreak sweep detector + sweep areas | never edit; **its standalone leg FAILS in Vela's extraction (F-XX)** |
| 3 | `sources/liquidity-voids-fvg.pine` | 112 | `e2a5223d726f43fa` | the 13-slice void boxes + filled-void recolour | never edit; bounded at 380 boxes under the shared 500 ceiling (D-04) |
| 4 | `sources/buyside-sellside-liquidity.pine` | 347 | `6cc2fd6ea98cfa77` | the zigzag pivot liquidity zones + dotted level lines | never edit; its 14 draw sites are what V1 taps |

License: all four are **CC BY-NC-SA 4.0** (verified in their headers). Keep `// © LuxAlgo`
attribution. Non-commercial + share-alike. Ship as a DERIVATIVE with attribution; clean-room only
if it ever ships to anyone else.

## 4.2 The merged reference — `plutus-vision-v0.pine`

1521 lines, sha `605bff82d3539e9e`, **never edited across the entire session and 107+ commits**.
Its section map (from `context_management/CURRENT_STATE.md` §2.3): HEADER (1) · SMC (20) ·
SWEEPS (869) · VOIDS (1042) · POOLS (1174). One `indicator()` decl (line 15). It is the PARITY
INSTRUMENT's baseline: `scripts/compare.py` compares the four sources against it. Touch it and
every "unchanged" claim becomes unfalsifiable (invariant I-1).

## 4.3 The renderer fork — `pine-ide/ide/renderer/`

A fork of the DHA dashboard's renderer root. What to take: `pine.html` (the standalone IDE page,
46 lines), `tabs/_shell.js` (620 lines — the mount/registration kernel), `tabs/pineshell.js`
(187 lines — the Pine tab: `window.PlutusPineShell`), `tabs/pineshell.css`, `styles.css`,
`tokens.css`, the chart/workbench bundles via symlink. What to refuse: `app.js` (the dashboard's
app, 104 KB — pine.html does NOT load it), `novnc/`, `trade-*.js`, `browser-*.js`, `mt5-tab.js`.
They are harmless dead weight; do not build on them, do not delete them if you want the fork to
stay diffable against its origin.

**Symlinks inside the renderer (important for the pack):** `charts -> ../../charts` and
`plutus-vision-v0.pine -> ../../../plutus-vision-v0.pine`. The zip was written with symlinks
DEREFERENCED, so inside the pack these are real files/dirs; the relative layout is preserved
(`02_PINE_IDE/pine-ide/charts`, `02_PINE_IDE/plutus-vision-v0.pine`).

## 4.4 `pine-ide/tv-feed/` — the TradingView data feed

A separate process (package `plutus-tv-feed`, deps `@mathieuc/tradingview` 3.5.2 + `ws` 8.18.0)
that would stream bars/quotes/replay into the charts. **It is NOT wired into the running rig** —
the rig runs on the fixture. Take it as a documented path to live data; refuse it as a dependency
of the current product (the chart must never depend on TradingView).

## 4.5 `pine-ide/chart/` and `pine-ide/charts/`

Two Vela-based chart bundles: `chart/app.bundle.js` (1.6 MB, the older host) and
`charts/workbench.bundle.js` (1.9 MB, sha `7ff93dcf5b2c9e77`, the workbench the IDE's chart
actually is; built from `charts/workbench.js`, 531 lines, by `charts/build.mjs`). **The bundle is
a BUILD OUTPUT.** Edit `workbench.js`/`app.js` sources, then rebuild — never hand-edit the bundle
(§7.5).

## 4.6 The library — `04_REFERENCE_LIBRARY/` (39 PNGs)

The operator's own hand-charted winning trades: 39 PNGs in 10 pattern families + 1 root frame,
plus `ALL_OCR.txt` (the tesseract OCR of all 39) and `LIBRARY_REFERENCE.md` (the measured
vocabulary). **This is the refinement target, not a picture set.** Read §5.4 and §6.1 before you
use it: a prior session MISREAD it and built a feature on a tag that does not exist.

---

# 5. WHAT ALREADY EXISTS ON DISK

## 5.1 The four deliverables — identity is sha256[:16]

| file | sha256[:16] | role | state |
|---|---|---|---|
| `lqz-luxalgo.pine` (D1) | `db06b60574125039` | the three LuxAlgo detectors, one display | defaults `lqzSource='both'`; 117 boxes / 42 lines / 2 labels at 1H (PASS) |
| `lqz-plutus.pine` (D2) | `68881deaca0c66a1` | the operator's candle strategy | 0 boxes / 58 lines; no labels BY DESIGN |
| `plutus-vision-v1.pine` (D3) | `82da437af969a315` | the winner + LuxAlgo SMC | 5 boxes / 79 lines / 24 labels; the only 4/4 reader-PASS deliverable; **OPERATOR-APPROVED** |
| `plutus-vision-v0.pine` | `605bff82d3539e9e` | THE PARITY REFERENCE | UNCHANGED, never edited |

Titles each `indicator()` declares (the deterministic per-panel check):

| deliverable | title |
|---|---|
| `lqz-luxalgo.pine` | `LQZ LuxAlgo` |
| `lqz-plutus.pine` | `LQZ Plutus — operator candle liquidity` |
| `plutus-vision-v1.pine` | `Plutus Vision v1` |
| `plutus-vision-v0.pine` | (the parity reference — never edited) |

**IF A TITLE MISMATCHES, REGENERATE — do not update the consumer.** `scripts/lqz_assemble.py`
defaults `--title "LQZ"`; regenerating without the flag silently drops the descriptive title,
which breaks `scripts/lqz-panel.mjs`'s `expect` and `scripts/lqz_ship.test.ts:103` at once.
Measured — it happened, and a second operator found it.

## 5.2 The generator chain (the deliverables are GENERATED — edit the modules, not the output)

| deliverable | generator | module inputs |
|---|---|---|
| `lqz-luxalgo.pine` | `scripts/lqz_luxalgo_build.py` | `plutus-vision-lqz/*.pine` + the LuxAlgo tap |
| `lqz-plutus.pine` | `scripts/lqz_assemble.py` | `plutus-vision-lqz/lqz-core.pine` + `lqz-render.pine` |
| `plutus-vision-v1.pine` | `scripts/lqz_vision_build.py` | the winner + the SMC section from `sources/smart-money-concepts-smc.pine` |
| `plutus-vision-v0.pine` | (merged by hand once; `scripts/deguard.py` removed the W3 budget guards) | the four `sources/*.pine` |

The three module files that ARE the editable surface:

```
plutus-vision-lqz/lqz-core.pine     the detector: lqzLevels[] + lqzSource (V1 LuxAlgo tap / V2 candles)
plutus-vision-lqz/lqz-render.pine   the output layer: the full-width zone emitter, side→colour, fills
plutus-vision-lqz/                  (this directory is the ONLY correct place to edit liquidity logic)
```

**THE LAW: edit the SOURCE modules, regenerate the deliverable, redeploy the served copy, then
verify the served sha.** (§7.5.)

## 5.3 The IDE module inventory (line counts + SHAs, from `context_management/BUILD_STATE.md`)

| module | lines | sha256[:16] | what it is |
|---|---|---|---|
| `pine-ide/pine-ide/pine-ide.mjs` | 742 | `9ec1112a1ed68710` | the kernel: run/loadBars/capture/look/runGate |
| `pine-ide/pine-ide/vision.mjs` | 458 | `d032a26721176649` | Pine primitives → Vela drawings; box/label colour mapping; `locked:true` |
| `pine-ide/pine-ide/gate.mjs` | 261 | `8015960811976eec` | the MECH_VETO (PASS with zones==0 or labels==0 → FAIL) |
| `pine-ide/pine-ide/pine-editor.mjs` | 89 | `30e19590aad991dd` | the editor surface |
| `pine-ide/pine-ide/vil-rail.mjs` | 533 | `1686b1a1ddc73f67` | the rail (ledger, proxy, artifacts) |
| `pine-ide/pine-ide/microtabs.mjs` | — | — | the micro-tab strip |
| `pine-ide/pine-ide/agent-face.mjs` | — | — | the agent desk face |
| `pine-ide/pine-ide/study-legend.mjs` | — | — | the legend |
| `pine-ide/pine-ide/input_parser_v2.mjs` | — | — | the Pine input parser (v2) |
| `pine-ide/pine-station/server.mjs` | 297 | `2fe3fc8775d87c0a` | the station (contract above) |
| `pine-ide/pine-station/lib/run.mjs` | 345 | `cbf8f8d68a7af5b0` | `runPine` — PineTS transpile+run; future anchors ≤500 bars (`:114-123`) |
| `pine-ide/pine-station/lib/bars.mjs` | 229 | `134a32fea8671a12` | fixture resolution, cells, ticks |
| `pine-ide/pine-station/lib/canon.mjs` | — | — | the canon-by-path+sha resolver |
| `pine-ide/pine-station/lib/catalog.mjs` | — | — | the built-in study catalog |
| `pine-ide/ide/renderer/pine.html` | 46 | `5a9b605ef90d03c3` | the standalone IDE page |
| `pine-ide/ide/renderer/tabs/_shell.js` | 620 | `e540b11a88985908` | the mount/registration kernel |
| `pine-ide/ide/renderer/tabs/pineshell.js` | 187 | `98511cb4158a4a37` | `window.PlutusPineShell` |
| `pine-ide/charts/workbench.js` | 531 | `6edcc7cb34babf8a` | the Vela workbench source |
| `pine-ide/charts/workbench.bundle.js` | 57274 | `7ff93dcf5b2c9e77` | the BUILT workbench (the render path) |
| `fixtures/bars/2026-07-06.json` | 1 | `0c8f7d7aa3171af8` | the world: 1.9 MB, 12 cells |

## 5.4 THE REFERENCE LIBRARY — measured vocabulary, and THE HALLUCINATION (binding correction)

### 5.4.1 The hallucination, measured FALSE 2026-10-02

A prior turn claimed the library's tags read **"30m LQ Sellside Liquidity"** and **"Liquidity
Void"** (the claim even landed in `context_management/TASK_QUEUE.md` §D as "the library's tags
carry the timeframe too (`30m LQ Sellside Liquidity`)"). **It is FALSE.** OCR of all 39 images
(`/tmp/liblabels/ALL_OCR.txt`, produced with PIL 2× upscale + `tesseract <img> - --psm 11`, and
shipped in this pack as `04_REFERENCE_LIBRARY/ALL_OCR.txt`):

| token | occurrences in the OCR of all 39 frames |
|---|---|
| `Sellside` | **0** |
| `Buyside` | **0** |
| `LQ` (as a tag token) | **0** |
| `Void` | **0** |

**None of these exist in the library.** The label wiring that was built on that claim (one label
per zone, ~34 stacked `Sellside/Buyside Liquidity` tags) was **REVERTED**; D3 was regenerated and
reproduced the operator-approved artifact **bit-for-bit** (`82da437af969a315`), commit `53a29ac`,
`SERVED_PINE_OK`.

**Record it as a negative example / dead path.** If you find yourself about to emit a
`Sellside Liquidity` / `Buyside Liquidity` / `Liquidity Void` label because "the library has
them": stop. They do not. And do not re-derive the feature from the doc line in
`TASK_QUEUE.md` §D — that line is the artifact of the error.

**The lesson the revert recorded, verbatim from the commit message:** *"I matched the feature's
EXISTENCE and missed its DENSITY."* Even a real tag must be sparse (~3-5 per chart), not one per
zone.

### 5.4.2 The REAL library vocabulary (measured over the 39 images)

Re-measured for this handover from `ALL_OCR.txt` (method stated so you can re-run it):

```
grep -o '<token>' ALL_OCR.txt | wc -l            # raw occurrences
python3: sum(1 for im in split_by_image if t in im)   # frames containing the token
```

| token | occurrences | frames (of 39) |
|---|---|---|
| `Unmitigated` | 5 | 3 |
| `Mitigated` (standalone) | 1 | 1 — the family `Unmitigated\|Mitigated` appears in **4** frames, 6 occurrences |
| `MoM` (case-insensitive; OCR renders it `moll`/`Moat` in places) | 17 | 12 |
| `BoM` | 3 | 3 |
| `Shield` | 10 | 8 (`Liquidity Shield` 5×) |
| `ZoC` | 2 | 2 |
| `CONQUERED` | 1 | 1 |
| `PIERC*` (`PIERCING`/`PIERC…`) | 10 `PIERC` + 9 `PIERCING` = 19 raw | 9 |

> A prior measurement in the mission brief stated "Unmitigated 5, Mitigated 7, MoM 17, BoM 3,
> Shield 10, ZoC 2, CONQUERED 1, PIERC* 12". Re-measurement agrees on 5/17/3/10/2/1 and differs
> on `Mitigated` (1 standalone vs 7 — the 7 likely counts the `Unmitigated|Mitigated` family by a
> looser rule) and `PIERC*` (19 raw vs 12 — the 12 likely counts frames or a narrower pattern).
> **Where a count matters, re-run the command above; never inherit one.** The
> `Sellside/Buyside/LQ/Void = 0` result is robust under every rule tried (case-insensitive
> included) and is the load-bearing correction.

**Real tag formats (verbatim from the OCR — these are the shapes to match):**

```
30m (Unmitigated) | MoM
30m (Unmitigated) | BoM
4H Liquidity Shield ~ ZoC - BEAR CONQUERED
SH Liquidity Shield ~ PIERCLO:
30m MoM Liquidity Shield
PIERCING BREAKOUT SURGE
4H BoM Zone pierced = ALL 4H liquidity near the fallen zone will be swept.
15m (Unmitigated) | Bull
4H Liquidity Shield — 2xC — BEAR CONQUERED
```

**The library's picture, measured (from `reports/lqz_panel_judge.md`):** 39/39 frames measured,
11 families, 1203 bands, 6-61 bands per frame (mean ~31), 38/39 irregular. **BIMODAL**: thin
1-2 px lines PLUS large translucent rectangles (16, 17, 44, 70, 107, 122, 150, 156 px). Library
band mean **15.9 px**, max **156 px**. The deliverables: mean **1.5 px**, max **18 px** —
**8.7× on the maxima**. The one frame that reads zero bands is the ROOT frame
(`Screenshot from 2026-07-19 17-55-53.png`, EUR/USD 1h) — the operator's LOCAL BOXES + `WL`/`RWL`/
`BREAKOUT SURGE` annotation vocabulary, NOT a ladder frame. It must not be counted as a
deliverable failure, and it is a DIFFERENT kind of reference.

### 5.4.3 The refinement findings (measured — record them, they are the current work)

- **D3 @15m (the library's own TF) = 10 bands vs the library's 4-22 (mean 11)** → **density
  MATCHES.**
- **Spacing irregular** → MATCHES (detected levels, not a grid).
- **Colours** `#3E8A46` / `#7F3613` family → MATCH.
- **Thickness 1 px** → MATCH.
- **Side mix: 44 % green vs the library's 57-92 %** → **REGIME-DRIVEN**, not a defect: the fixture
  is a downtrend, and the spec's semantics are `green = SELL_SIDE = below price` (green zones
  below get consumed in a downtrend).
- **The tolerance sweep (tol 0.5 → 1.5) is marginal** — it merges bands; the mix is structural.
- **The remaining lever is the BAND HEIGHT / the zone-fill layer**, not the line count: the
  emitter's fill code EXISTS and is gated to 3+-source bands (`lqzFill3`, `lqzFillA=10` very
  faint, `lqzLineTol=0.0`) in `plutus-vision-lqz/lqz-render.pine`. The operator owns that call.

## 5.5 The known defect register (what is open, what is named)

| id | what | state | resume |
|---|---|---|---|
| P8 | the operator's panel verdict (D1/D2) | OPEN — D3 approved | only the operator can close it |
| F-XX | the sweeps standalone leg fails in Vela's extraction (`get_left`) at all 4 TFs | NAMED, bounded (deliverables unaffected; D1 embeds 103 `swp_` refs; `verify_four.py` 4/4) | reconcile the engine's UDT-geometry extraction — NOT a version pin |
| EN-021 | 36 native primitives render via the BRASS fallback (`color: undefined`) | OPEN, fix shape known | guard the colour at the three native emitters, re-measure the payload |
| H2 | the settings dialog is unreachable from the exposed shell surface | UNRUN, named | a `setInput(name, value)` passthrough, or Vela dialog internals |
| — | the station's wedge under sustained ~44 KB compiles (50 % CPU, state `D`, both routes hung) | NAMED, remedy exists | `bash scripts/pv-ide.sh`; mechanism unclaimed |
| N-1 | drawings must be non-interactable | OPEN (acceptance = a drag test) | `vision.mjs` `locked:true` — verify per drawing class |
| N-7 / T-14 | no `D` timeframe cell in the fixture | BLOCKED on data | the operator's data source decides |
| — | no container round for this project | NAMED | every verdict is host-live, not container-grade |

---

# 6. WHAT WAS REJECTED (dead paths — each with the transcript signature that means you are back on it)

| # | plan / claim | why it is dead | how it appears in a transcript |
|---|---|---|---|
| 6.1 | **wire `lqzLabel` to emit one `Sellside/Buyside Liquidity` label per zone** | the tags DO NOT EXIST in the library (OCR: `Sellside` 0, `Buyside` 0); the emitted 34 stacked labels crowded the ladder; reverted, D3 restored bit-for-bit to `82da437af969a315` (commit `53a29ac`) | "the library labels each zone" / "add the side name" / any diff touching `lqzLabel` in `lqz-render.pine` |
| 6.2 | a **fallback band** when a detector is starved | the pin's proof contract forbids it and the starvation drill PROVED the honest behaviour (zero at 2-5 bars) is correct — a fallback band is a SYNTHETIC zone | "the chart looks empty, add a default" / "emit at least one zone" |
| 6.3 | **pin `pinets`/`vela-pinets` back** to fix SWEEPS | `package-lock.json` and the disk AGREE (`0.10.0 / 0.2.14 / 0.8.0`) — there is no drift to pin back | "maybe the engine version regressed" / any `npm i pinets@<older>` |
| 6.4 | edit `sources/liquidity-sweeps.pine` to route around the extraction error | the source is the FROZEN reference; editing it breaks the parity instrument itself | any diff under `sources/` |
| 6.5 | a **local VLM / 4B model** issuing the visual verdict | it answered 4 presence questions and passed the tan-striped 30m and the clean 30m identically (F-08/F-12/T-03/T-07) | "run the reader and report PASS" as the verdict |
| 6.6 | **parity as a proxy for accuracy** | parity proves the merge is faithful, not that the sources are right; a zone on the wrong swing still matches its source exactly (F-17) | "SMC 195/195 so the zones are correct" |
| 6.7 | a **video file** as evidence | 45 s recorded, never watched (F-10) | "the recording shows it" |
| 6.8 | **`node --check`** as UI verification | syntax ≠ rendering (F-20) | "it parses, so it renders" |
| 6.9 | quoting a **gate line** as evidence | `VIL GATE: PASS` was cited in 4 documents after being ruled theatre (F-25) | "the gate says PASS" without the frame |
| 6.10 | a **viewport control / `fitContent`** in the composer | no viewport API exists in the CDP composer; building one is a new subsystem against R-8 | "add a viewport setter so panels match" |
| 6.11 | **loosening `SPEC.md`** so a wave passes | SPEC.md is the merge gate's bound spec; editing it to loosen a gate is a wave-failing violation (I-10) | any diff to `SPEC.md`'s step-4 expectation |
| 6.12 | a **second notifier / keep-alive daemon / plugin supervisor** | this project has no host fold to continue a loop; the four processes are the whole machine | "add a watcher so it stays up" |
| 6.13 | **editing the bundle** `workbench.bundle.js` / `app.bundle.js` by hand | it is a BUILD OUTPUT; the edit vanishes on the next `build.mjs` run and the served sha lies | any diff to `*.bundle.js` |
| 6.14 | **`git add -A`** | sweeps foreign files; the pin mandates explicit-path staging and a secret scan before commit | any commit whose file list you did not name |
| 6.15 | a longer **generated canon head** to clear the doc floor | the floor must hold ACROSS regenerations; the fix is MORE HAND CONTENT inside the markers | a `gen_canon.py` diff that adds boilerplate |

## 6.1 THE LABEL REVERT — the full record (read this before touching labels)

**What was attempted:** `plutus-vision-lqz/lqz-render.pine` had a dead `lqzLabel` input. A round
wired it so each zone emitted a side-name label, on the belief that the library tags zones with
`Sellside/Buyside Liquidity`.

**What it produced:** ONE LABEL PER ZONE — **34 stacked tags** crowding the ladder, while the
library's tags are sparse (~3-5 per chart).

**What killed it:** the operator's question — *"why are you adding buyside/sellside liquidity
labels"* — plus the capture. Then the OCR measurement: those strings are not in the library at
all (0 occurrences of `Sellside`, `Buyside`, `LQ`, `Void` across all 39 frames).

**The revert, exact:** the module restored, D3 regenerated — the deterministic build reproduced
`82da437af969a315` BIT-FOR-BIT, the operator-approved artifact. `SERVED_PINE_OK`. Commit `53a29ac`.

**What was KEPT from the round (in the logs, and it is real work):**

- the tolerance sweep (marginal — merges bands; the mix is structural);
- the apples-to-apples at 15m (the library's own TF): **D3 = 10 bands vs the library's 4-22
  (mean 11)** — the density MATCHES;
- the mix (44 % green) is REGIME (this fixture's downtrend consumes below-price liquidity — the
  spec's own semantics);
- spacing irregular, colours the `#3E8A46`/`#7F3613` family, thickness 1 px — ALL MATCHED.

**The refinement's remaining options, as the revert left them for the operator:**
(A) the sparse-label variant; (B) the coverage nudge toward the measured 99-100 %; (C) the D1
brass (its 36 uncoloured natives — D3 is clean).

---

# 7. THE DRIVE / PATCH CONTRACT (how you run it, and what you may touch)

## 7.1 The rig — one command (headed), or four (headless)

```bash
# HEADED (needs display :3 + chrome) — brings up all four processes and loads a file
bash scripts/pv-ide.sh [file.pine] [PAIR] [TF]      # default: plutus-vision-v0.pine EUR/USD 1H
./launch-pine-ide [file.pine] [PAIR] [TF]           # thin wrapper → pv-ide.sh
bash launch-pine-ide --shot /tmp/now.png            # capture the IDE window (then OPEN it)
```

`scripts/pv-ide.sh` fails LOUD with a named code before doing anything destructive:
`DISPLAY_DOWN` · `FIXTURE_ABSENT` · `ENGINE_ABSENT` · `CHROME_STUCK` · `PORT_HELD` ·
`STATION_DOWN` · `RAIL_DOWN` · `SERVER_DOWN`. Read those, they tell you exactly what is missing.

## 7.2 The shell API (`window.PlutusPineShell`, defined by `tabs/pineshell.js` + the kernel)

```javascript
P.run({silent:true})       // compile; returns {ok, run:{title, bars, counts, drawings, sourceSha}}
P.capture()                // capture; returns {png, sha256, stats, path, bytes}
P.runGate()                // gate; appends a row to vil/<week>.jsonl
P.look()                   // the orchestrator's look
P.loadBars({pair, timeframe})
P.editor.{setSource, flush, getSource}
P.tabs.{active, list, get, activate}   // a tab CARRIES ITS OWN `source`
P.exportWorkspace() / P.importWorkspace(state)   // the persistence pair (see TRAP 4 remedy)
P.state().lastVision       // the kernel's last vision (extended counts, extent)
P.workbench.getBars()      // the bars the chart holds
P.chart.drawings.toJSON()  // the drawings actually on the chart
```

## 7.3 THE HEADLESS PATH (no display — first-class for a foreign sandbox)

You do NOT need `:3` or Chrome to compile, run, or read counts. Three processes, no display:

```bash
# 1 · THE STATION (PineTS compile + run) — the workhorse
cd <tree>/pine-ide/pine-station
PINE_STATION_PORT=9741 PINE_STATION_HOST=127.0.0.1 \
PLUTUS_BARS_FIXTURE=<tree>/fixtures/bars/2026-07-06.json \
PLUTUS_LIVE_ROOT=<tree> node server.mjs &          # → logs "[PINE-STATION] listening on http://127.0.0.1:9741"

# 2 · THE RENDERER HOST + fixture bars feed
PV_FIXTURE=<tree>/fixtures/bars/2026-07-06.json \
  python3 <tree>/scripts/pv-server.py 9851 <tree>/pine-ide/ide/renderer &

# 3 · THE VIL RAIL (optional: ledger + proxy; needed only for the gate/rows)
PLUTUS_VIL_PORT=9754 PLUTUS_STATION_URL=http://127.0.0.1:9741 \
PLUTUS_VIL_DIR=<tree>/vil PLUTUS_VIL_EVIDENCE=<tree>/evidence \
  node <tree>/pine-ide/pine-ide/vil-rail.mjs &
```

**Liveness probe = a COMPILE, never `GET /`:**

```bash
curl -s -m 90 -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json' \
  -d '{"script":"//@version=6\nindicator(\"probe\")\nplot(close)","pair":"EUR/USD","timeframe":"1H","limit":300}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('UP' if d.get('success') else 'REFUSED', d.get('data',{}).get('title'))"
```

**Compile a deliverable headlessly (the canonical call):**

```bash
curl -s -m 90 -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json' \
  -d "{\"script\":$(python3 -c "import json;print(json.dumps(open('lqz-plutus.pine').read()))"),\
\"pair\":\"EUR/USD\",\"timeframe\":\"1H\",\"limit\":1603}"
# ASSERT the title from data.title — and read counts at data.counts, bars at data.bars (NOT under counts)
```

**Read the renderer page over plain HTTP** (no browser needed for the page itself):

```bash
curl -s http://127.0.0.1:9851/pine.html | head -5      # the IDE page
curl -s http://127.0.0.1:9851/api/v1/chart/bars?pair=EUR/USD&timeframe=1H | head -c 300
curl -s http://127.0.0.1:9741/cells                    # the fixture inventory (12 cells)
```

**Capture without X11:** if you have a headless Chrome/CDP, drive `P.capture()` through
`Runtime.evaluate` (the pattern is in `scripts/pv-load.mjs`: find the `:9851/pine.html` tab on
`/json/list`, connect the websocket, evaluate the async expression). If you have neither X11 nor
Chrome, **your verdict instrument is the station's `counts` + `drawings` payload** — and you must
say so: a count is not a look (see §9.3).

## 7.4 The station /run JSON contract (quote it, do not paraphrase it)

```
REQUEST   POST http://127.0.0.1:9741/run
          Content-Type: application/json
          { "script": "<the full Pine source>",       // OR "canon": true
            "pair": "EUR/USD", "timeframe": "1H", "limit": 1603 }

RESPONSE  200 { "success": true,
                "data": { "title": "LQZ Plutus — operator candle liquidity",
                          "kind": "...", "sourceSha": "<sha of the script>", "runMs": 186,
                          "bars": 1603,
                          "counts": { "boxes": 0, "lines": 112, "labels": 0, "plots": 0, ... },
                          "drawings": { ... },
                          "warnings": [ ... ], "trades": [ ... ] } }
FAILURE   4xx/5xx { "success": false, "error": "<message>", "code": "PINE_COMPILE_ERROR", ... }
```

## 7.5 THE SERVED-COPY LAW (TRAP 1 — the most expensive trap in the project)

The browser serves `pine-ide/ide/renderer/`. **A rebuilt `.pine` at the project root is INVISIBLE
until it is copied there.** The renderer copies of the four deliverables are symlinks to the repo
root for `plutus-vision-v0.pine` and real files for D1/D2/D3 — so a regeneration that writes only
the root file leaves the served copy stale.

```bash
# after ANY regeneration:
cp lqz-plutus.pine pine-ide/ide/renderer/       # (or keep the symlink layout)
bash scripts/verify_served_pine.sh              # MUST end SERVED_PINE_OK
```

`verify_served_pine.sh` compares THREE shas per deliverable: source (root) == renderer copy ==
served over HTTP. Any mismatch prints `SERVED_PINE_DRIFT` and exits 1. **Run it before ANY visual
verdict.**

## 7.6 The other six traps (each cost a round)

| # | trap | remedy |
|---|---|---|
| 2 | **the tab carries its own `source`** — `P.run()` compiles the TAB's source, not the editor textarea | set `P.tabs.active().source = src` **and** `P.editor.setSource(src)` |
| 3 | **the debounced flush** — `setSource` + an immediate `run()` can compile the PREVIOUS source (measured: 7 runs needed once) | a FIXED POINT — run until the returned title IS this deliverable, asserted every attempt (budget ≥ 3× the observed worst case) |
| 4 | **the frozen compositor** — `P.capture()` returns the last COMPOSITED layer (measured byte-identical across THREE source versions; two rAF ticks + a 6 s settle did NOT break it) | `export → reload → import` (§7.7) |
| 5 | **`P.run()` returns null** on a fresh page (a mount race) | null-guard and retry |
| 6 | **a fresh row can carry a stale frame** — a frozen compositor writes a NEW file with OLD content; `createdAt` is fresh, `pineSha` current, mtime NEWER than the source. **sha and mtime are both blind.** | reload before EVERY capture; distrust a frame whose `nonBg` is far from its deliverable's known range |
| 7 | **the engine's 50-line default** — an undeclared `max_lines_count` silently discards zones (measured: 112 requested, 50 drawn) | declare `max_{lines,labels,boxes}_count = 500` in every `indicator()` |

## 7.7 THE DURABLE LOAD — `export → reload → import` (the remedy for TRAP 4, measured)

```javascript
const src = await (await fetch('/lqz-plutus.pine', {cache:'no-store'})).text();
P.editor.setSource(src); P.editor.flush();
P.tabs.active().source = src;                   // 1 · load
const ws = P.exportWorkspace();                 // 2 · export (~19 KB, the source inside)
await call("Page.reload", {ignoreCache:true});  // 3 · RELOAD — fresh compositor
// ... wait for the mount (LONGER than 14 s) ...
await P.importWorkspace(ws);                    // 4 · IMPORT — the source restored
const rr = await P.run({silent:true});          // 5 · run — FIRST TRY, title asserted
await P.capture();
```

**Measured:** `tabSrcLen 18132 · hasGuard true · hasTitle true · title "LQZ Plutus — operator candle
liquidity" in 1 try · nonBg 0.45467`.

## 7.8 Files you may touch, files you may not

| MAY touch | MUST NOT touch |
|---|---|
| `plutus-vision-lqz/*.pine` (the modules) | `plutus-vision-v0.pine` (the parity reference) |
| the generators `scripts/lqz_*build.py`, `lqz_assemble.py` | `sources/*.pine` (the frozen LuxAlgo originals) |
| `scripts/lqz-panel.mjs`, `lqz_panel_ide.py` (the composer) | `fixtures/bars/2026-07-06.json` (byte-identical to the pipeline's reference) |
| `pine-ide/pine-ide/vision.mjs` (the renderer mapping) | the dashboard's ports `9430/9441/9444/9448` |
| `pine-ide/charts/workbench.js` (source) + rebuild | `*.bundle.js` by hand |
| `OPERATING_MANUAL.md`, the canon docs (inside the markers) | `SPEC.md`'s step-4 expectation |
| `Checkpoints/` (a NEW checkpoint per milestone) | an existing checkpoint's contents |

---

# 8. IMPLEMENTATION ORDER (deletes first; first reply = evidence, not a redesign)

**Step 0 (before anything):** extract, then run the headless rig (§7.3) and the rig check. Report
`UP <title>` verbatim. If it does not come up, report the named code — do not proceed on theory.

1. **DELETE nothing yet.** First READ: `OPERATING_MANUAL.md` (232 lines), then this file's §5.4
   and §6.1, then `context_management/DECISION_CHAIN.md`.
2. **Verify the freeze:** `sha256sum` the four deliverables and compare to §5.1. If any differs,
   STOP and report — the pack's premise is the SHAs.
3. **Verify the served copies:** `bash scripts/verify_served_pine.sh` → `SERVED_PINE_OK`.
4. **Compile all three deliverables at the station** (`limit=1603`) and assert each TITLE. Post
   the three JSON count blocks verbatim.
5. **Re-derive the library numbers yourself** (§5.4.2 commands) before quoting any of them. In
   particular re-run the `Sellside/Buyside/LQ/Void` sweep — a zero result is your proof the dead
   path stays dead.
6. **Reproduce the refinement measurement** if you have pixels: D3 @15m → band count vs the
   library's 4-22. If you have no display, say so and record it as UNRUN — never as a pass.
7. **Then, and only then, continue the refinement stream (R-13):** the lever is the zone-fill
   layer in `plutus-vision-lqz/lqz-render.pine` (`lqzFill3`, `lqzFillA`, `lqzLineTol`), by INPUT
   VALUES. Do not add features. Do not add labels. Regenerate → redeploy → `SERVED_PINE_OK` →
   compile → look (or state UNRUN).
8. **Deletes (only if you are consolidating):** the derived renderer copies
   (`lqz-luxalgo-both.pine`, `plutus-vision-v1-tol10.pine`) are calibration artifacts — keep them
   unless the operator says otherwise; the dashboard leftovers (`app.js`, `novnc/`, trade tabs) are
   inert — do not delete if you want the fork diffable.

**Your first reply is EVIDENCE, not a plan:** the four SHAs, the three compile titles, the
`SERVED_PINE_OK` line, and the OCR zero-count proof. Anything less is a renegotiation.

---

# 9. PROOF / ACCEPTANCE (tool-result evidence only — no prose verdicts)

## 9.1 The gate chain (each gate's command, its expected output, and where it lives)

| gate | command (canonical form) | expected output | lives in |
|---|---|---|---|
| L0 compile | `curl -s -m 90 -X POST :9741/run -H 'Content-Type: application/json' -d '{…}'` | `{"success":true,…}` + the run's OWN title | the station |
| L1 unit | `bun test ./scripts/` | **12 pass · 0 fail** (PATH form) | `scripts/lqz_core.test.ts` · `lqz_render.test.ts` · `lqz_ship.test.ts` · `lqz_w6.test.ts` |
| L1.5 adversarial | `python3 scripts/lqz_adversarial.py` | **7/7 PASS**, zero confirmed | `scripts/lqz_adversarial.py` |
| L2 parity | `python3 scripts/compare.py; RC=$?` | SMC 195/195 · POOLS 25/25 · VOIDS 380/500 · SWEEPS named (F-XX) | `scripts/compare.py` → `COMPARE.json` |
| L2b merged sections | `python3 scripts/verify_four.py` | **4/4 subsystems executed** | `scripts/verify_four.py` |
| L3/L4 grids | `python3 scripts/lqz_panel_ide.py` then OPEN each PNG | 4 TF grids + the 4TF grid | `scripts/lqz_panel_ide.py` |
| L-ART drift | `bash scripts/verify_served_pine.sh` | `SERVED_PINE_OK` | `scripts/verify_served_pine.sh` |
| ViL ship gate | `python3 scripts/vil.py` | `VIL GATE PASS` on 15m/30m/1H/4H | `scripts/vil.py` (replaces the code audit — R-12) |
| SEAL | `python3 scripts/seal_checkpoint.py …` | `tracked == sealed` | `scripts/seal_checkpoint.py` |

**THE CANONICAL UNIT RUN IS `bun test ./scripts/`.** Without the `./` bun treats the argument as a
FILTER and the walk reaches `Checkpoints/**`, running the sealed copies → **24 across 8** (the
delta IS the sealed duplicates). Measured trap, not a style preference.

## 9.2 The acceptance bar for a wave (a wave that cannot meet a bar reports the bar it missed)

1. `git status --porcelain` empty at the boundary, and the wave's commits carry SHAs.
2. `bun test ./scripts/` → 12 pass · 0 fail.
3. `python3 scripts/lqz_adversarial.py` → 7/7, zero confirmed defects.
4. `python3 scripts/compare.py` → SMC 195/195 · POOLS 25/25 · VOIDS 380/500 exact; SWEEPS stated
   as F-XX (named), never claimed green.
5. `python3 scripts/verify_four.py` → 4/4.
6. `bash scripts/verify_served_pine.sh` → `SERVED_PINE_OK`.
7. If the change touches pixels: the affected grid is REBUILT and **every changed panel is
   OPENED** and recorded per panel (found / missing / wrong) with the grid's sha.
8. The seal: a new rev with `tracked == sealed`, a manifest naming the shas and honest gaps.
9. Every target canon doc ≥ 200 lines with the hand block INSIDE the markers.
10. **None of the above may be satisfied by silencing a check.** A red instrument stays red and is
    NAMED; loosening a gate is a wave failure.

## 9.3 The verdict law (PRODUCT_TEST_SPEC.md — the project's own acceptance doc)

**The verdict comes from the agent looking at the product. No mechanism may issue a PASS.** A
PASS is valid only when the agent has, in the same turn: (1) written the named expectation BEFORE
the render; (2) performed the interaction by real input; (3) captured the frame and OPENED it;
(4) written the verdict sentence naming what was found / missing / wrong. Missing any of the four
→ INCONCLUSIVE, never PASS.

The three questions every verdict answers: **Q1 "IS IT RENDERED PROPERLY?"** · **Q2 "IS IT
ACCURATE?"** (pick a NAMED drawing, state what it claims, look at that bar, say whether the claim
matches the pixels) · **Q3 "ARE THE ZONES CORRECT?"** (does each zone's price band sit where the
swing/liquidity it claims actually is?).

**The banned substitutes** (each already tried and ruled out): a local VLM issuing the verdict · a
batch capture read later · background jobs between action and observation · parity as a proxy for
accuracy · a video file as evidence · `node --check` as UI verification · a gate line quoted as
evidence.

**If you cannot look** (no display, no Chrome): you must say `UNRUN — no capture path` and lean on
the station payload as a *count instrument*, never as a verdict. The two instruments are NOT
comparable (below).

## 9.3b THE SHIPPED-PACK VERIFICATION (re-run at pack time — expect these numbers)

The pack was extracted to a FOREIGN path and run there. Measured, verbatim:

```
  station log   [PINE-STATION] listening on http://127.0.0.1:19741 engine=pinets@0.10.0
  probe         UP probe
  D1 (lqz-luxalgo.pine)      LQZ LuxAlgo                             boxes 481 lines 191 labels 3
  D2 (lqz-plutus.pine)       LQZ Plutus — operator candle liquidity   boxes   0 lines 112 labels 0
  D3 (plutus-vision-v1.pine) Plutus Vision v1                        boxes   5 lines 205 labels 97
  served check  SERVED_PINE_OK   (source == renderer == served for all four .pine)
  renderer      GET :19851/pine.html -> 200 · bars feed -> 1603 bars
```

**Relocatability is PROVEN, not asserted:** the station booted from `/tmp/...` with no path from
the build machine, the engine resolved (`pinets@0.10.0`), and every deliverable compiled with its
OWN title. If your numbers differ, you are on a different window or a different file.

## 9.4 The two instruments, and the honest gaps

| instrument | window | what it reports |
|---|---|---|
| the STATION (`POST :9741/run`) | the `limit` you pass (1603 is the full fixture) | D1 `481 boxes / 191 lines / 3 labels` · D2 `0 / 112 / 0` · D3 `5 / 205 / 97` — re-measured on the shipped files (a doc row reading D1 `481 / 182` is STALE, pre-label-fix) |
| the IDE's `lastVision` | 400 bars by default | D1 `117 / 36`, D2 `58`, D3 `79 / 21` |

**They are not comparable.** A count that "does not match" is usually a different window, not a
failure. Always state the instrument and the bar count beside the number.

**Honest gaps (carry them forward, do not paper over them):**

1. **P8 is open for D1/D2.** D3 is approved; the others await the operator.
2. **No container round.** Every verdict in this project is host-live, not container-grade.
3. **The station's half-alive state** is not fixed (only the launcher's probe is). Intermittent;
   the fix is proven by mechanism, not reproduction.
4. **The band-height delta is unadjudicated** — the library's bands are far larger than any
   deliverable's (8.7× on maxima). The operator's call.
5. **The settings dialog is unreachable** from the exposed surface (H2 UNRUN, named).
6. **The 36 native primitives render via BRASS** (`color: undefined`).
7. **The viewports differ per panel** (no viewport setter exists).
8. **F-XX**: the sweeps standalone leg fails in Vela's extraction.
9. **No `D` timeframe** in the fixture.

---

# 10. ZIP MAP + READ ORDER

```
PLUTUS_PINE_IDE_CONTEXT_HANDOVER.zip
├── README.txt                          ← START HERE (read order + conflict rule + exclusions)
├── PLUTUS_PINE_IDE_CONTEXT_HANDOVER.md ← paste this first (also inside 00_HANDOVER/)
├── SPEC.md                             ← the BINDING spec (also inside 01_BINDING_SPEC/)
│
├── 00_HANDOVER/
│     PLUTUS_PINE_IDE_CONTEXT_HANDOVER.md      the primary dump (this file)
│     PINE_IDE_OPERATORS_MANUAL.md             how to run it, headless + headed, symptom→action
│     KICK_PROMPT.md                           paste-ready first message (also §11 below)
│     README.txt                               the read order + conflict rule + exclusions
│
├── 01_BINDING_SPEC/
│     SPEC.md                                  the fence v2 bound spec (job: fence)
│     GOAL_PIN.txt                             the /goal pin that drove this stream
│     DPL1_SPEC.md                             the vision project's own build spec (packages/…/v0)
│
├── 02_PINE_IDE/                        ← THE FULL INJECTABLE (extract & run; no local paths needed)
│     pine-ide/                               the IDE tree:
│       pine-station/  (server.mjs + lib/ + node_modules incl. pinets + @luxalgo/vela-pinets)
│       pine-ide/      (pine-ide.mjs, vision.mjs, gate.mjs, pine-editor.mjs, vil-rail.mjs, …)
│       ide/renderer/  (pine.html, tabs/, styles, tokens, the charts symlink dereferenced)
│       charts/ chart/ tv-feed/
│     scripts/pv-ide.sh · pv-server.py · pv-load.mjs · verify_served_pine.sh · the lqz_* generators
│     launch-pine-ide                         the one-command launcher (relocatable)
│     fixtures/bars/2026-07-06.json           the world (1.9 MB, 12 cells)
│     lqz-luxalgo.pine · lqz-plutus.pine · plutus-vision-v1.pine   the three deliverables
│     plutus-vision-v0.pine                   the parity reference (NEVER EDIT)
│     plutus-vision-lqz/                      the module sources (lqz-core.pine, lqz-render.pine)
│     setup.sh                                npm install for pine-station (and tv-feed)
│
├── 03_SUPERSEDED_READ_ONLY/            ← history; do NOT implement anything from here
│     OPERATING_MANUAL.md (the project root copy, superseded by 00_HANDOVER/PINE_IDE_OPERATORS_MANUAL.md)
│     RECEIPT.md · BUILD_REPORT.md · DEBUG_LOG.md · TESTING_LOG.md · FAILURE_LOG.md ·
│     THEATRICALITY_LOG.md · SPEC_VIOLATION_LOG.md · SHIP_DOCS_MANIFEST.md
│     context_management/*.md (the 12 canon docs as of the seal)
│     reports/*.md (the runtime forensic, the panel judge, the look record, the crash test,
│                  the second-operator report, the adversarial audit)
│
├── 04_REFERENCE_LIBRARY/               ← the refinement target (read-only)
│     WINNING_TRADE_LIBARARY/ (39 PNGs in 10 families + the root annotation frame)
│     ALL_OCR.txt                             tesseract OCR of all 39 frames (the vocabulary proof)
│     LIBRARY_REFERENCE.md                    the MEASURED vocabulary + the hallucination correction
│
└── 05_DOCTRINE_READ_ONLY/              ← WHAT THE INDICATORS *ARE* (E1/E2/E3 + the TTE)
      Trident_Fractal_Architecture_FirstPrinciples_v2.3.md   (Earth/Fire/Water/Air)
      PLUTUS_E1_E2_E3_MACRO_CONTEXT.md                       (the E1/E2/E3 fundamental law)
      VISUAL_TELESCOPE_CHARTING_T2.md                        (§13 = the LQZ pattern criteria)
      PLUTUS_ARCHITECTURE_BIBLE_4.5.md                       (supplementary master context)
      DPL1_SPEC.md                                           (the vision build spec — same file as 01)
```

## READ ORDER (do it in this order)

1. **`README.txt`** (zip root) — the read order, the conflict rule, the exclusions.
2. **`00_HANDOVER/PLUTUS_PINE_IDE_CONTEXT_HANDOVER.md`** — this file. Rulings, freeze, dead paths.
3. **`01_BINDING_SPEC/SPEC.md`** — the bound spec. Then `01_BINDING_SPEC/GOAL_PIN.txt` for the
   mission and its proof contract.
4. **`00_HANDOVER/PINE_IDE_OPERATORS_MANUAL.md`** — the runbook. Then extract `02_PINE_IDE/`,
   `bash 02_PINE_IDE/setup.sh`, and run the headless rig check.
5. **`05_DOCTRINE_READ_ONLY/`** — WHAT the indicators are (the E1 zone-geometry layer of the TTE;
   the four-element doctrine; §13 of the TTE spec carries the LQZ pattern criteria). Read this
   BEFORE you tune anything: it is the semantic authority for what a "zone" means.
6. **`04_REFERENCE_LIBRARY/LIBRARY_REFERENCE.md`** + `ALL_OCR.txt` — the visual/accuracy target,
   measured. Re-run the OCR counts yourself.
7. **`03_SUPERSEDED_READ_ONLY/`** — history and forensics only. Do not implement from it. In
   particular `OPERATING_MANUAL.md` there is the OLD root copy: the manual in `00_HANDOVER/` wins.

## THE DOCTRINE FOLDER (added by operator addendum — READ-ONLY)

`05_DOCTRINE_READ_ONLY/` exists so a foreign agent understands **what the Pine IDE indicators
ARE**: they are the **E1 zone-geometry layer of the TTE (Visual Telescope)** — the liquidity/S-D
zone renderer, not a standalone chart toy. The five files are copied VERBATIM from the operator's
PLUTUS master context; **read them, never modify them**. The load-bearing one for the indicator
work is `VISUAL_TELESCOPE_CHARTING_T2.md` §13, which carries the exact LQZ pattern criteria the
deliverable implements. `Trident_Fractal_Architecture_FirstPrinciples_v2.3.md` gives the
four-element doctrine (Earth = liquidity, Fire = S/D, Water = shapes, Air = Fib) that tells you
which family a zone belongs to. `PLUTUS_E1_E2_E3_MACRO_CONTEXT.md` gives the E1/E2/E3 law.
`PLUTUS_ARCHITECTURE_BIBLE_4.5.md` is the supplementary master context. `DPL1_SPEC.md` is this
project's own build spec (also in `01_BINDING_SPEC/`).

---

# 11. KICK PROMPT (paste-ready — no essay, evidence only)

```text
You are the builder/operator of the PLUTUS VISION Pine IDE, handed a self-contained pack
(PLUTUS_PINE_IDE_CONTEXT_HANDOVER.zip). You have your own machine and NO access to the
machine that produced it. Read, in order:

  1. README.txt (zip root)
  2. 00_HANDOVER/PLUTUS_PINE_IDE_CONTEXT_HANDOVER.md      ← the rulings, freeze, dead paths
  3. 01_BINDING_SPEC/SPEC.md and 01_BINDING_SPEC/GOAL_PIN.txt
  4. 00_HANDOVER/PINE_IDE_OPERATORS_MANUAL.md
  5. 05_DOCTRINE_READ_ONLY/VISUAL_TELESCOPE_CHARTING_T2.md §13 (what a zone IS)

Then DO THIS, in this order, and reply with EVIDENCE ONLY (verbatim tool output, file:line,
sha256[:16]) — never prose verdicts, never a plan:

  A. Extract 02_PINE_IDE/ and run `bash setup.sh` (npm install in pine-ide/pine-station).
  B. Start the HEADLESS rig (manual §3): station on :9741, renderer+bars on :9851.
     Probe liveness by COMPILE: POST /run a trivial probe and require "success":true.
     (NEVER probe GET / on :9741 — it can hang on a WORKING station.)
  C. `sha256sum` the four deliverables and confirm:
        lqz-luxalgo.pine      db06b60574125039…
        lqz-plutus.pine       68881deaca0c66a1…
        plutus-vision-v1.pine 82da437af969a315…   (OPERATOR-APPROVED — do not change it)
        plutus-vision-v0.pine 605bff82d3539e9e…   (PARITY REFERENCE — NEVER EDIT)
  D. Compile each of D1/D2/D3 via POST /run (limit 1603, EUR/USD, 1H) and assert each TITLE:
        LQZ LuxAlgo · LQZ Plutus — operator candle liquidity · Plutus Vision v1
     Post the three JSON count blocks verbatim.
  E. Run `bash scripts/verify_served_pine.sh` → require SERVED_PINE_OK.
  F. Re-derive the library vocabulary yourself from 04_REFERENCE_LIBRARY/ALL_OCR.txt:
        grep -o 'Sellside' ALL_OCR.txt | wc -l   → MUST be 0
        grep -o 'Buyside'  ALL_OCR.txt | wc -l   → MUST be 0
        grep -o 'LQ '      ALL_OCR.txt | wc -l   → MUST be 0
        grep -o 'Void'     ALL_OCR.txt | wc -l   → MUST be 0
     These are DEAD PATHS. Do not emit "Sellside/Buyside Liquidity" labels. Ever.
  G. Only then continue the refinement stream (R-13): the lever is the zone-FILL layer in
     plutus-vision-lqz/lqz-render.pine (lqzFill3 / lqzFillA / lqzLineTol), by INPUT VALUES.
     Regenerate → redeploy the served copy → SERVED_PINE_OK → compile → LOOK (or state UNRUN).

HARD RULES: never edit plutus-vision-v0.pine or sources/*.pine. Never hand-edit *.bundle.js.
Never add a fallback band. Never quote a gate line as evidence. A capture nobody opened is not
evidence. A blocked op names its resume — it is never a pass.

FIRST REPLY: the four SHAs, the three compile titles with counts, SERVED_PINE_OK, and the four
OCR zero-counts. That is it.
```

---

# 12. GREP CONTRACTS (literal strings — run these, do not guess)

```bash
# THE FREEZE
sha256sum lqz-luxalgo.pine lqz-plutus.pine plutus-vision-v1.pine plutus-vision-v0.pine

# THE TITLES (must match the deliverables)
grep -n 'indicator(' lqz-luxalgo.pine lqz-plutus.pine plutus-vision-v1.pine

# THE PARITY REFERENCE IS UNTOUCHED
git log --oneline -- plutus-vision-v0.pine        # expect: no commits since 4d993b7

# THE FROZEN SOURCES
git log --oneline -- sources/liquidity-sweeps.pine  # expect: the single baseline commit

# THE DEAD LABEL PATH (must return nothing in the modules)
grep -rn 'Sellside\|Buyside' plutus-vision-lqz/ pine-ide/pine-ide/ | grep -v '\.md'

# THE REAL LIBRARY VOCABULARY (the four zeros are the proof)
for w in Sellside Buyside 'LQ ' Void; do printf '%-10s %s\n' "$w" "$(grep -o "$w" 04_REFERENCE_LIBRARY/ALL_OCR.txt | wc -l)"; done

# THE FILL LEVER (the refinement surface)
grep -n 'lqzFill3\|lqzFillA\|lqzLineTol\|box.new' plutus-vision-lqz/lqz-render.pine

# THE 500-CEILING DECLARATION (every deliverable must carry it)
grep -c 'max_boxes_count = 500' lqz-luxalgo.pine lqz-plutus.pine plutus-vision-v1.pine

# THE SERVED-COPY LAYOUT
ls -la pine-ide/ide/renderer/*.pine

# THE STATION CONTRACT
sed -n '1,30p' pine-ide/pine-station/server.mjs

# THE MECH_VETO
grep -n 'MECH_VETO' pine-ide/pine-ide/gate.mjs

# THE RELOCATABLE ROOT
sed -n '8p' scripts/pv-ide.sh

# THE STATION PROBE (a launch is a compile)
sed -n '40,50p' scripts/pv-ide.sh

# THE DEAD-PATH DOC LINE (the hallucination's residue — do not act on it)
grep -n '30m LQ Sellside Liquidity' context_management/TASK_QUEUE.md
```

**Grep contracts that must be ZERO:**

```bash
grep -rn 'lqzLabel' plutus-vision-lqz/ | wc -l          # the reverted label wiring — expect 0 live uses
grep -rn 'fitContent\|setVisibleRange' scripts/lqz-panel.mjs   # the viewport control — not built
grep -rn 'node --check' scripts/ | wc -l                # banned as UI verification
```

---

# 13. FALSE CEILINGS ALREADY POPPED (do not re-derive these)

1. **"The station is dead."** Measured false: `GET /` and `/health` can hang while `POST /run`
   compiles. The launcher probes by compile. A rig can be declared dead while it works.
2. **"A count is a render."** Measured false: `labels 2` in a payload with ZERO text pixels is the
   same class as an invisible ladder — a count is not a look (D-XX).
3. **"A sha-match against an older frame means staleness."** Measured false FOUR times: the render
   is DETERMINISTIC — the same script on the same bars produces the same bytes. A sha-match is an
   INFERENCE of staleness; the content is the truth (the "four times determinism was mistaken for
   staleness" table in `DECISION_CHAIN.md`).
4. **"The IDE window is the only window."** Measured false: TWO chart windows exist on `:3` —
   `Pine IDE` (this project, `14680067`) and `PLUTUS-CHART` (`4194307`, the trade desk). Resolve
   by NAME, never by guessing.
5. **"The 15m shortfall is a bug."** Measured: 15m carries the fixture's REAL 325 bars vs 400 on
   the others; the detectors' windows are measured in BARS, so the difference is STRUCTURAL.
6. **"The engine version regressed."** Measured: lock and disk agree at `0.10.0 / 0.2.14 / 0.8.0`.
   There is no drift to pin back.
7. **"The labels must be dense like the library's."** Measured false: the library's tags are
   SPARSE (~3-5 per chart) and use a different vocabulary. Density was the defect in the revert.
8. **"`bun test scripts/` is the same as `bun test ./scripts/`."** Measured false: without `./` it
   is a FILTER and the walk reaches `Checkpoints/**` → 24 tests across 8 files.
9. **"The parity reference can be nudged."** Never. `605bff82d3539e9e` is the baseline of the only
   accuracy instrument this project has.
10. **"A local VLM can judge the render."** Measured false — it passed a tan-striped 30m and a
    clean 30m identically. The operator's eye (or the agent's own read) is the only judge.

---

# 14. QUESTIONS YOU MAY ASK THE OPERATOR (only unruled items)

Ask NOTHING that a ruling, a doc, or a command already answers. These are genuinely open:

1. **Which refinement variant?** (A) the sparse-label variant, (B) the coverage nudge toward the
   measured 99-100 %, (C) the D1 brass. Each is a look decision the operator owns (R-13).
2. **The fill lever values** — `lqzFill3` / `lqzFillA` / `lqzLineTol` in
   `plutus-vision-lqz/lqz-render.pine`. The geometry exists; the values are the operator's call.
3. **Is the ROOT library frame's LOCAL-BOX vocabulary wanted** (WL / RWL / BREAKOUT SURGE boxes
   around swings)? It is a second feature, not a tuning change, and it is not in the emitter.
4. **The `D` timeframe data source** — the fixture has no D cell; aggregating 1H→D gives ≈67 bars
   that differ from broker daily candles (N-7 / T-14).
5. **P8 for D1/D2** — the operator's panel verdict on the other two deliverables.
6. **Should `lqzSource='both'` stay D1's default?** It is the measured DISPLAYING config
   (`luxalgo` → 0 labelled zones → MECH_VETO unsatisfiable; `both` → 117/42/2 PASS). The
   alternative readings are the operator's calibration.

Everything else: derive it from disk, or measure it.

---

# 15. SELF-CHECK (seven bullets you must be able to say without looking)

1. **The freeze.** "D3 is `82da437af969a315` and is OPERATOR-APPROVED. `plutus-vision-v0.pine` is
   `605bff82d3539e9e` and is never edited. The engine is `pinets 0.10.0 / vela-pinets 0.2.14 /
   vela 0.8.0`, lock == disk."
2. **The machine.** "Four processes: `:9741` station (PineTS, AGPL-isolated), `:9754` rail,
   `:9851` renderer+bars, `:9222` CDP (headed only). Liveness is a COMPILE (`POST /run`), never
   `GET /`."
3. **The product.** "Three deliverables (D1 LuxAlgo bundle, D2 candle strategy, D3 winner+SMC) on
   one self-hosted Pine IDE over a bundled FX fixture; the IDE is the only surface; the library is
   the refinement target."
4. **The dead path.** "`Sellside`/`Buyside`/`LQ`/`Void` appear ZERO times in the library's 39
   frames; the label wiring built on that claim was reverted and D3 restored bit-for-bit. I will
   not re-add it."
5. **The verdict law.** "A PASS needs a frame I opened, an expectation written before the render,
   real input, and a verdict sentence. A count is not a look. A blocked op names its resume."
6. **The served copy.** "The IDE serves `pine-ide/ide/renderer/`; after any regeneration I copy,
   then run `verify_served_pine.sh` and require `SERVED_PINE_OK` before any visual verdict."
7. **The refinement lever.** "The gap is the zone-FILL layer (`lqzFill3` / `lqzFillA` /
   `lqzLineTol` in `plutus-vision-lqz/lqz-render.pine`), by input values — density, spacing,
   colours and thickness already match the library at the library's own TF."

---

# APPENDIX A · THE CANON DOC SET (12 files, in `03_SUPERSEDED_READ_ONLY/context_management/`)

| doc | purpose |
|---|---|
| `CURRENT_STATE.md` | the system as it is NOW: topology, ports, the indicator's section/type/function/input maps |
| `BUILD_STATE.md` | the sha chain, the module inventory, the frozen list, the rig pins |
| `DECISION_CHAIN.md` | the operator's rulings verbatim + every adjudication (ADJ-1..ADJ-6) + the one-line rulebook |
| `EVIDENCE_STATE.md` | the evidence ledger |
| `TASK_QUEUE.md` | every task, gate, evidence, status + the invariants I-1..I-10 + the acceptance bar |
| `NEXT_STEPS.md` | what is next, with the measured pair |
| `CHANGELOG.md` | the session's change log |
| `COMPACTION_SURVIVAL.md` | what must survive a compaction |
| `POST-COMPACTION_PROMPT.md` | the resume prompt |
| `RUNNING_BUILD_LOG.md` | the high-frequency build log (append-only, hand-preserved) |
| `RUNNING_DEBUG_LOG.md` | the high-frequency debug log (append-only, hand-preserved) |
| `CANON_MANIFEST.md` | the manifest + the floors |

Regenerate with `python3 scripts/gen_canon.py` — it is **append-safe and hand-preserving** (D-14;
it once clobbered 642 lines across 12 docs, recovered from git). Never add a longer generated head
to clear a floor: add HAND content inside the `<!-- LQZ:CANON-HAND -->` markers.

# APPENDIX B · THE CHECKPOINTS (in `03_SUPERSEDED_READ_ONLY/` by reference; not shipped whole)

| checkpoint | what it is | HEAD |
|---|---|---|
| `v1-working-baseline` | the seal at the operator's D3 approval ("looks good") | `484dae9` |
| `v1-lqz-pin-execution-2026-10-02` | the pin-execution seal, rev 9+ (`tree/` + `artifacts/` + `canon/` + `ship/`), mode `no-lock`, `tracked == sealed` | `1c64f20` at rev 9 |
| `v1-look-session-2026-10-02` | the look session | — |
| `v1-clean-baseline` | the v1 baseline | — |
| `plutus-vision-v0-station-verified` | the station-verified v0 | — |
| `plutus-vision-v0-round-zero` | round zero | `4d993b7` |

**Only the live tree is shipped in `02_PINE_IDE/`.** The checkpoints are referenced here for
ancestry; re-derive any of them from `02_PINE_IDE/` + the artifacts in `03_SUPERSEDED_READ_ONLY/`
if you need one.

# APPENDIX C · EXCLUSIONS FROM THE PACK (measured, and why)

| excluded | why |
|---|---|
| `.git/` | history is not needed to run the product; the pack carries the SHAs instead |
| `Checkpoints/` (full copies) | each is a full tree copy (hundreds of MB); the live tree is shipped and the ancestry is listed above |
| `evidence/` (128+ PNGs) and `vil/` (ledger, recordings) | runtime evidence; the verdicts that matter are quoted in `reports/` |
| `node_modules` OUTSIDE `pine-ide/pine-station/` | not needed: the IDE's runtime deps are the station's engine (shipped) |
| `*.bak-*`, `plutus-vision-v0.pine.bak-*` | superseded working copies |
| `pine-ide-fork/` | the pre-consolidation fork; `pine-ide/` supersedes it |
| `packages/plutus-vision-v0/` (except `DPL1_SPEC.md`) | build-package scaffolding; the spec is in `01_BINDING_SPEC/` |
| `probes/`, `parity_frames/`, `vision_frames/`, `rig/`, `sources/` (the 48 LuxAlgo source files beyond the four) | historical probe/parity material; `sources/` IS shipped inside `02_PINE_IDE/` |

**Secret sweep result (measured):** no `.env`, no `*.pem`/`*.key`/`id_rsa*`/credentials file exists
in any packed tree. The sweep's only hits were the literal words `TOKEN` (a CSS design-token
identifier in `tokens.css` and `STATIC_TOKENS` in the chart bundles) and one **non-secret local
dev fallback**: `AUTH_TOKEN: 'rw_dev_plutus_backtest'` in `pine-ide/ide/renderer/app.js:22` and
`pine.html:13`. It is a placeholder bearer for a LOCALHOST-ONLY dashboard API (`:9430`) that this
pack does not include and a foreign agent cannot reach. It is documented here rather than scrubbed
because it is present in `pine.html` — the IDE page itself — and removing it would break the page
while removing nothing real. **No credential to any reachable service is in this pack.**

---

*End of handover. The zip's `00_HANDOVER/KICK_PROMPT.md` is §11 verbatim. Start there.*
