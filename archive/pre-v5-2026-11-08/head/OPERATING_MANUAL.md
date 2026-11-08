# THE PLUTUS VISION OPERATING MANUAL

**Read THIS first. The runtime ledger (`lqz_runtime_forensic.md`) is the forensic record —
what broke and why. This file is how to RUN the thing.**

Project root: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION`
Ports: **9741 station · 9754 rail · 9851 server · 9222 CDP · display :3**

---

## 1 · THE THREE COMMANDS

### 1.1 THE RIG CHECK — compile, never ping

```bash
# THE CHECK THAT MATTERS: compile a trivial script and read the title.
curl -s -m 90 -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json' \
  -d '{"script":"//@version=6\nindicator(\"probe\")\nplot(close)","pair":"EUR/USD","timeframe":"1H","limit":300}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('UP' if d.get('success') else 'REFUSED', d.get('data',{}).get('title'))"
```

**WHY NOT `curl http://127.0.0.1:9741/`:** measured — `GET /` and `GET /health` can **HANG**
(`http_code=000`, `curl exit 28`) while `/catalog`, `/cells`, `/bars` answer 200 and
**`POST /run` compiles normally**. The VIL rail reads the hung route and reports
`PINE_STATION_DOWN`. **A rig can be declared dead while it works.**

The port check, for completeness:
```bash
for p in 9741 9754 9851 9222; do printf ':%s ' "$p"; curl -s -o /dev/null -w 'http=%{http_code}\n' --max-time 5 "http://127.0.0.1:$p/"; done
# EXPECT :9741 200 · :9754 404 (no / route — healthy) · :9851 200 · :9222 200
```

### 1.2 THE COMPILE — the API the docs must state

```bash
curl -s -m 90 -X POST http://127.0.0.1:9741/run \
  -H 'Content-Type: application/json' \
  -d "{\"script\":$(python3 -c "import json;print(json.dumps(open('lqz-plutus.pine').read()))"),\
\"pair\":\"EUR/USD\",\"timeframe\":\"1H\",\"limit\":1603}"
```

**Returns:** `{success, data:{title, bars, counts:{boxes,lines,labels,…}, drawings:{…}}}`
**Note:** `bars` is at `data.bars`, NOT under `counts`.

**ASSERT THE TITLE.** It is the compiled script's OWN identity — the only deterministic
per-panel check in the system.

**THE EXPECTED TITLES — the table this manual lacked** (a zero-context operator following a stale
string declared a good compile FAILED; that happened):
| deliverable | the title its `indicator()` declares |
|---|---|
| `lqz-luxalgo.pine` | **`LQZ LuxAlgo`** |
| `lqz-plutus.pine` | **`LQZ Plutus — operator candle liquidity`** |
| `plutus-vision-v1.pine` | **`Plutus Vision v1`** |
| `plutus-vision-v0.pine` | (the parity reference — never edited) |

**IF A TITLE MISMATCHES, REGENERATE — do not update the consumer.** `scripts/lqz_assemble.py`
defaults `--title "LQZ"`; regenerating without the flag silently drops the descriptive title,
which then breaks `scripts/lqz-panel.mjs` (its `expect`) and `scripts/lqz_ship.test.ts:103` at
once. **Measured, this session:** exactly that happened, and a second operator found it.

**THE REFUSALS, so a reader knows what normal looks like:**
| input | response |
|---|---|
| empty / null script | `400 :: primary: a script or canon:true is required` |
| not Pine | `422 :: Unexpected token (2:6)` |
| unknown identifier | `422 :: <name> is not defined` |
| absent pair/timeframe | `500 :: no bars cell for … (available: 12 cells listed)` |
| `limit=1` | `400 :: bars absent (1)` |
| `limit=0` | **`200` — DOCUMENTED as "keep the full history"** |
| concurrent load | **serialized ~16 s each; no busy signal — budget ~20 s per compile** |

### 1.3 THE CAPTURE — through the IDE

```bash
# THE COMPOSED GRIDS (from the ledger) — writes reports/panel-grid-IDE-<TF>-2026-W29.png
python3 scripts/lqz_panel_ide.py

# THE OLDER GRID (live X11/CDP) — NOTE: it writes reports/panel-grid-<TF>.png IN THE REPO,
# overwriting an artifact the RECEIPT cites by sha. Run it only when you intend to replace it.
bun scripts/lqz-panel.mjs 1H

# a single frame, the X11 path
DISPLAY=:3 xdotool search --name "Pine IDE" | head -1     # resolve the window id (CHANGES on relaunch)
# ⚠ TWO CHART WINDOWS EXIST ON :3. "Pine IDE" -> 14680067 is THIS project's IDE.
#   A second window, "PLUTUS-CHART" (4194307), shows a DIFFERENT study (the trade desk).
#   A hand-capture can grab the wrong one — always resolve by NAME, never by guessing.
DISPLAY=:3 import -window <ID> -silent /tmp/look.png
sha256sum /tmp/look.png | cut -c1-16
# THEN OPEN IT. A capture nobody opened is not evidence.
```

**THE SHA IS AN IDENTITY, NOT A FRESHNESS SIGNAL.** The render is DETERMINISTIC — the same script
on the same bars produces the same bytes. **Two runs of the same deliverable SHOULD share a sha.**
A staleness test that compares a frame's sha against a PREVIOUS frame's sha measures CHANGE, not
freshness, and will cry wolf on every correct re-run. **To judge freshness, compare the frame's
CONTENT against expectations** — the station's counts, and `nonBg`'s known range per deliverable.

---

## 2 · THE IDE'S OWN PIPELINE (the operator's law: EVERYTHING RUNS THROUGH THE IDE)

The page at `:9851/pine.html` exposes a shell:

```javascript
P.run({silent:true})      // compile; returns {run:{title, bars, counts, drawings}}
P.capture()               // capture; returns {png, sha256, stats, path, bytes}
P.runGate()               // gate; writes a row to vil/<week>.jsonl
P.look()                  // the orchestrator's look
P.loadBars({pair, timeframe})
P.editor.{setSource, flush, getSource}
P.tabs.{active, list, get, activate}    // a tab CARRIES ITS OWN `source`
P.gate.{catalog, rows, verdict, look, judge}
```

**THE VERDICT SURFACE — the operator's own buttons:**
```html
<button data-act="look-pass"         title="The orchestrator's look: PASS (refused on a blank/failed frame)">PASS</button>
<button data-act="look-fail"         title="The orchestrator's look: FAIL">FAIL</button>
<button data-act="look-inconclusive">INCONCL.</button>
<button data-act="rows-refresh">ROWS ↻</button>
```
**The WEEK must be set first** (`input.pine-week`, e.g. `2026-W29`) or the gate refuses with
`VIL_WEEK_INVALID`. Rows land in `vil/2026-W29.jsonl`.

**A TYPICAL RUN:**
```javascript
const t = P.tabs.active(); t.source = src;        // the durable load (see TRAP 2)
P.editor.setSource(src); P.editor.flush();        // keep the UI in sync
await P.loadBars({pair:'EUR/USD', timeframe:'1H'});
const rr = await P.run({silent:true});            // null-guard it
// ... rAF + settle ...
const c = await P.capture(); const g = await P.runGate();
```

---

## 3 · THE TRAPS — each cost a round, each has its remedy

| # | trap | remedy |
|---|---|---|
| **1** | **THE SERVED COPY.** The browser serves `pine-ide/ide/renderer/`. A rebuilt `.pine` at the project root is INVISIBLE until copied there. | `cp <f>.pine pine-ide/ide/renderer/` then `bash scripts/verify_served_pine.sh` → `SERVED_PINE_OK` |
| **2** | **THE TAB CARRIES ITS OWN `source`.** `P.run()` compiles the TAB's source, not the editor's textarea — measured holding a DIFFERENT script (stub taps). | set `P.tabs.active().source = src` **and** `P.editor.setSource(src)` |
| **3** | **THE DEBOUNCED FLUSH.** `setSource` + an immediate `run()` can compile the PREVIOUS source. Measured: 7 runs needed once. | a FIXED POINT — run until the returned title IS this deliverable, asserted every attempt (budget ≥ 3× the observed worst case) |
| **4** | **THE FROZEN COMPOSITOR.** `P.capture()` returns the last COMPOSITED layer — measured returning the byte-identical frame across THREE source versions. Two `requestAnimationFrame` ticks and a 6 s settle did NOT break it. | **`export → reload → import`** — see §3.1. A plain reload breaks the freeze but CLOBBERS the editor; the import defeats the clobber. **The two remedies compose.** |
| **5** | **`P.run()` RETURNS NULL** on a fresh page (a mount race). | null-guard the call and retry |
| **6** | **A FRESH ROW CAN CARRY A STALE FRAME.** A frozen compositor writes a NEW file with OLD content — the `createdAt` is fresh, the `pineSha` is current, the PNG's mtime is NEWER than the source. **sha and mtime are both blind.** | reload before EVERY capture; and distrust a frame whose `nonBg` is far from its deliverable's known range |
| **7** | **THE ENGINE'S 50-LINE DEFAULT.** An undeclared `max_lines_count` silently discards zones (measured: 112 requested, 50 drawn). | declare `max_{lines,labels,boxes}_count = 500` in every `indicator()` |

### 3.1 THE DURABLE LOAD — `export → reload → import` (the remedy for TRAP 4)

**The shell's persistence pair solves the freeze AND the clobber at once:**
```javascript
const src = await (await fetch('/lqz-plutus.pine', {cache:'no-store'})).text();
P.editor.setSource(src); P.editor.flush();
P.tabs.active().source = src;                  // 1 · load
const ws = P.exportWorkspace();                // 2 · export (~19 KB, the source inside)
await call("Page.reload", {ignoreCache:true}); // 3 · RELOAD — fresh compositor
// ... wait for the mount (LONGER than 14 s) ...
await P.importWorkspace(ws);                   // 4 · IMPORT — the source restored
const rr = await P.run({silent:true});         // 5 · run — FIRST TRY, title asserted
await P.capture();
```
**MEASURED:** `tabSrcLen 18132 · hasGuard true · hasTitle true · title "LQZ Plutus — operator
candle liquidity" in 1 try · nonBg 0.45467`.

**`exportWorkspace()` SYNCS the editor into the tab; `importWorkspace(state)` RESTORES the tabs.**
Use this instead of the bare reload whenever a capture must be trusted.

---

## 4 · WHEN THE RIG DEGRADES — THE RESTART

**Symptom:** stale frames, wrong scripts, an exhausted title loop, a capture that ignores a
reload — **six different approaches all failing.**

**Cause:** the shell is in a degraded state a page reload does not clear (a tab's cached source,
a frozen compositor). The page has been through many reloads and hundreds of runs.

**THE REMEDY:**
```bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
bash launch-pine-ide lqz-plutus.pine EUR/USD 1H
```
**After it, every run succeeded FIRST TRY with its title asserted.** Its cost: `pv-ide.sh` opens
with `fuser -k 9741/tcp 9754/tcp 9851/tcp`, so it restarts the station, rail and server, and
takes the IDE window down and back up (~20 s).

---

## 5 · THE DELIVERABLES AND WHAT THEY SHOULD LOOK LIKE

| file | what it is | expected at 15m |
|---|---|---|
| `lqz-luxalgo.pine` | the three LuxAlgo detectors, one display | **2 emitter lines, 0 coloured** — supply-starved by `lqzSource='luxalgo'` |
| `lqz-plutus.pine` | the operator's candle strategy | 38 lines, **100 % coloured** |
| `plutus-vision-v1.pine` | SMC + the liquidity detector | 5 boxes / 57 lines / 22 labels, **100 % coloured, four colours** |
| `plutus-vision-v0.pine` | **THE PARITY REFERENCE — NEVER EDIT** | sha `605bff82d3539e9e` |

**THE LOOK:** thin full-width horizontal lines, green below price / red-brown above, irregularly
spaced, plus large translucent zone bands and (on D3) the SMC structure vocabulary — `CHoCH`,
`BOS`, `EQH`, `EQL`, `BC`. **Candles must stay readable.**

**TWO INSTRUMENTS PRODUCE DIFFERENT COUNTS — know which one you are reading.**
| instrument | window | what it reports |
|---|---|---|
| **the STATION** (`POST :9741/run`) | the `limit` you pass (1603 is the full fixture) | D1 `481 boxes / 182 lines`, D2 `112 lines`, D3 `205 lines / 97 labels` |
| **the IDE's `lastVision`** | 400 bars by default | D1 `117 / 36`, D2 `58`, D3 `79 / 21` |
**They are not comparable.** A count that "does not match" is usually a different window, not a
failure. Always state the instrument and the bar count beside the number.

**MEASURED LADDERS (the station, the authoritative instrument, 325/400 bars as the IDE uses):**
| deliverable | 15m | 1H |
|---|---|---|
| D1 | 2 emitter lines, 0 coloured | 4, 0 |
| D2 | 38, **38 coloured** | 58, **58 coloured** |
| D3 | 56, **56 coloured** (4 colours) | 79, **79 coloured** (4 colours) |

---

## 6 · THE OPERATOR'S CALIBRATION (owner: the operator)

| input | measured effect |
|---|---|
| `lqzSource` | **the ONLY lever that moves D1's ladder.** `luxalgo` → 0 coloured lines at 15m; **`both` → 3** |
| `lqzTol` 0.5→1.5 | **inert** at 15m |
| `lqzMinAgree` 2→1 | **inert** at 15m |
| `lqzMaxZones` 60 | **not binding** (2-5 emitted) |
| `lqzFillA` / `lqzFill3` | the zone fill layer's alpha and gating |

**THE MEASURE IS THE COLOURED COUNT, NOT THE RAW COUNT.** A raw count of 5 with 0 coloured means
five invisible lines; `both`'s 8 with 3 coloured means three VISIBLE ones.
