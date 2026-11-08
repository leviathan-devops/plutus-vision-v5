# PINE IDE — OPERATOR'S MANUAL
### PLUTUS VISION · a self-hosted Pine v6 IDE + three liquidity deliverables

**Audience:** a foreign agent or human with their OWN machine and **no access to the machine that
built this**. Everything here works from the extracted tree; no absolute path is required.
**Read `PLUTUS_PINE_IDE_CONTEXT_HANDOVER.md` first** (the rulings and the dead paths), then this.

```
Tree inside the zip:   02_PINE_IDE/
Entry point:           launch-pine-ide  (headed)  |  node/py processes (headless — §3)
Ports owned:           :9741 station · :9754 rail · :9851 renderer+bars · :9222 CDP
Display (headed only): :3
Engine:                pinets 0.10.0 · @luxalgo/vela-pinets 0.2.14 · vela 0.8.0
```

---

## 1 · PREREQUISITES

| requirement | version | why | check |
|---|---|---|---|
| **Node.js** | **>= 20** (22 LTS recommended) | the station and the rail are ESM; the station uses `fs`, `http`, top-level await | `node -v` |
| **npm** | >= 10 | installs the station's engine (`pinets`, `@luxalgo/vela-pinets`) | `npm -v` |
| **Python 3** | >= 3.10 | `scripts/pv-server.py` (static host + fixture bars) and the helper scripts | `python3 -V` |
| **bash** | any POSIX-ish bash | `launch-pine-ide`, `scripts/pv-ide.sh`, `verify_served_pine.sh` | `bash --version` |
| **bun** | >= 1.1 | OPTIONAL — only for `scripts/pv-load.mjs` (the CDP loader) and the `*.test.ts` suites | `bun -v` |
| **curl** | any | the liveness probe and the compile calls | `curl --version` |
| Chrome/Chromium + X11 display | any recent | OPTIONAL — only the HEADED path (§4) | `google-chrome-stable --version` |

**Nothing else.** No TradingView account, no network, no broker, no database. The IDE runs on the
bundled fixture. The only network calls are to `127.0.0.1`.

---

## 2 · SETUP

```bash
unzip PLUTUS_PINE_IDE_CONTEXT_HANDOVER.zip
cd PLUTUS_PINE_IDE_CONTEXT_HANDOVER/02_PINE_IDE

bash setup.sh          # runs: npm install --omit=dev   inside pine-ide/pine-station
```

`setup.sh` (shipped, 30 lines) installs the engine into `pine-ide/pine-station/node_modules`.
**The pack ALREADY CONTAINS that directory (39 MB, the AGPL engine)** — so `setup.sh` is a no-op
if the deps are intact and only matters if you re-extract without them or prune them. It prints
`ENGINE_OK` when `pinets` and `@luxalgo/vela-pinets` both resolve.

Verify by hand any time:

```bash
ls pine-ide/pine-station/node_modules/pinets/package.json
ls pine-ide/pine-station/node_modules/@luxalgo/vela-pinets/package.json
```

**Licence note:** `pinets` and `@luxalgo/vela-pinets` are **AGPL-3.0**. They are the station's
private dependency and are imported by `pine-ide/pine-station/server.mjs` ONLY. Keep the station a
separate process; never inline it into a bundle you ship under another licence.

---

## 3 · THE HEADLESS LAUNCH (no display — the default path for a foreign sandbox)

You do **not** need a display, a browser, or X11 to compile and run indicators. Two processes are
the minimum; three if you want the gate/ledger.

> ### 3.0 THE ONE ENV VAR THAT MATTERS (measured, 2026-10-02)
>
> **`PLUTUS_BARS_FIXTURE` is the ONLY required env var.** Measured on the extracted pack:
>
> | env given | result |
> |---|---|
> | *(none)* | the station LISTS on the port but resolves the fixture from a **build-machine path** (`…/PLUTUS/LIVE/agent/reference/fixtures/bars/2026-07-06.json`) — on a foreign machine `present=false` and `/bars` fails |
> | **`PLUTUS_BARS_FIXTURE=<tree>/fixtures/bars/2026-07-06.json`** | **fully working** — `present=true`, `POST /run` compiles |
> | `PLUTUS_LIVE_ROOT=<tree>` alone | resolves `<tree>/agent/reference/fixtures/…` → `present=false` (that layout is the pipeline's, not this pack's) |
>
> So: **always export `PLUTUS_BARS_FIXTURE`** (the manual's commands below do). `PLUTUS_LIVE_ROOT`
> is harmless but is NOT what points at the fixture. And if you prefer, `POST /run` also accepts a
> `bars` array inline instead of a fixture — see §5.1.
>
> `PLUTUS_CANON_PINE` (default: a build-machine path) only affects `POST /run {"canon": true}`,
> which the three deliverables never use. On a foreign machine `/canon` returns
> `503 CANON_PINE_ABSENT` — expected, harmless, and NOT a defect.

```bash
cd <tree>/02_PINE_IDE
TREE="$PWD"
FIX="$TREE/fixtures/bars/2026-07-06.json"

# ── 1 · THE STATION  (PineTS compile + run) ────────────────────────────────────────────
cd "$TREE/pine-ide/pine-station"
PINE_STATION_PORT=9741 \
PINE_STATION_HOST=127.0.0.1 \
PLUTUS_BARS_FIXTURE="$FIX" \
PLUTUS_LIVE_ROOT="$TREE" \
  node server.mjs > /tmp/pv-station.log 2>&1 &
cd "$TREE"
# expect in the log:  [PINE-STATION] listening on http://127.0.0.1:9741 (pid …) engine=PineTS@…

# ── 2 · THE RENDERER HOST + FIXTURE BARS FEED ──────────────────────────────────────────
PV_FIXTURE="$FIX" python3 scripts/pv-server.py 9851 "$TREE/pine-ide/ide/renderer" \
  > /tmp/pv-ide-http.log 2>&1 &
# expect:  GET http://127.0.0.1:9851/pine.html  → 200

# ── 3 · THE VIL RAIL (optional: ledger writer + station proxy) ─────────────────────────
PLUTUS_VIL_PORT=9754 \
PLUTUS_STATION_URL=http://127.0.0.1:9741 \
PLUTUS_VIL_DIR="$TREE/vil" \
PLUTUS_VIL_EVIDENCE="$TREE/evidence" \
  node pine-ide/pine-ide/vil-rail.mjs > /tmp/pv-vil-rail.log 2>&1 &
# expect:  GET http://127.0.0.1:9754/health → 200   (GET / → 404 is HEALTHY: there is no / route)
```

### 3.1 THE LIVENESS PROBE IS A COMPILE, NEVER `GET /`

```bash
curl -s -m 90 -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json' \
  -d '{"script":"//@version=6\nindicator(\"probe\")\nplot(close)","pair":"EUR/USD","timeframe":"1H","limit":300}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('UP' if d.get('success') else 'REFUSED', d.get('data',{}).get('title'))"
# EXPECT:  UP probe
```

**WHY NOT `curl http://127.0.0.1:9741/`:** measured — `GET /` and `GET /health` **can HANG**
(`http_code=000`, curl exit 28, the full client timeout) **while `/catalog`, `/cells`, `/bars`
answer 200 and `POST /run` compiles normally.** Every checker that pings `/` declares a WORKING
station dead. **A rig can be declared dead while it works.** The launcher's own probe POSTs a
trivial script and requires `"success":true` (`scripts/pv-ide.sh` lines 40-50).

For completeness, the port check (a 404 on `:9754` is healthy):

```bash
for p in 9741 9754 9851; do printf ':%s ' "$p"; curl -s -o /dev/null -w 'http=%{http_code}\n' --max-time 5 "http://127.0.0.1:$p/"; done
# EXPECT :9741 200 (or a hang → probe by compile) · :9754 404 (no / route — healthy) · :9851 200
```

### 3.2 Headless process map

```
:9741  pine-station/server.mjs      PineTS transpile + run. The ONLY process that touches AGPL.
:9851  scripts/pv-server.py         serves pine-ide/ide/renderer/ (the IDE page + assets)
                                    and GET /api/v1/chart/bars?pair=&timeframe= (the fixture feed)
:9754  pine-ide/pine-ide/vil-rail.mjs  ledger writer (vil/<week>.jsonl) + POST /station/run proxy
:9222  Chrome CDP                   HEADED ONLY — the shell drives the page through it
```

**Never touch** `9430 / 9441 / 9444 / 9448` — those belong to a different (dashboard) session on
the machine that built this; the pack's tree does not need them.

---

## 4 · THE HEADED LAUNCH (optional — only if you have a display + Chrome)

The one command, relocatable (it resolves its own root at `scripts/pv-ide.sh:8`):

```bash
bash launch-pine-ide [file.pine] [PAIR] [TF]     # default: plutus-vision-v0.pine EUR/USD 1H
bash launch-pine-ide --shot /tmp/now.png         # capture the IDE window
```

`launch-pine-ide` is a 3-line wrapper: `exec bash "$(dirname "$(readlink -f "$0")")/scripts/pv-ide.sh" "$@"`.

`scripts/pv-ide.sh` does, in order, and **fails LOUD with a named code** at each step:

| step | what it does | named failure |
|---|---|---|
| 0 | `--shot` mode: `DISPLAY=:3 import -window <id>` | `NO_WINDOW: launch pine-ide first` |
| 1 | requires the X11 socket `/tmp/.X11-unix/X3` | `DISPLAY_DOWN: agent display :3 absent` |
| 2 | requires `fixtures/bars/2026-07-06.json` | `FIXTURE_ABSENT: <path>` |
| 3 | requires `pine-station/node_modules/pinets` | `ENGINE_ABSENT: run npm install in …` |
| 4 | kills any prior Chrome (profile `/tmp/pv-ide-chrome`), frees `9741/9754/9851` | `CHROME_STUCK` · `PORT_HELD: :N still owned by pid …` |
| 5 | starts the station, waits for a COMPILE | `STATION_DOWN: /tmp/pv-station.log (probed POST /run — GET / can hang on a WORKING station)` |
| 6 | starts the rail, waits for `GET /` (404 accepted) | `RAIL_DOWN: /tmp/pv-vil-rail.log` |
| 7 | starts the renderer, waits for `/pine.html` | `SERVER_DOWN: /tmp/pv-ide-http.log` |
| 8 | launches Chrome `--app=…/pine.html` on `:3` with `--remote-debugging-port=9222` (software GL: `--use-gl=swiftshader`) | — |
| 9 | `bun scripts/pv-load.mjs <file> <PAIR> <TF>` — loads, runs, frames, prints counts | `NO_PAGE` · `NO_HANDLE` · `RUN_FAILED` · `EVAL_FAILED` · `DOUBLE_MOUNT` · `NOTHING_DRAWN` |

**Chrome flags matter:** `--disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader` because
the chart is a WebGL canvas and a GPU-less sandbox otherwise renders nothing.

**Windows on `:3`:** there can be TWO chart windows. `Pine IDE` (this project) and a trade-desk
`PLUTUS-CHART`. Resolve by NAME — `DISPLAY=:3 xdotool search --name "Plutus Vision" | head -1` —
never by guessing an id (ids change on relaunch).

---

## 5 · HOW TO USE IT

### 5.1 The API — compile and run an indicator

```bash
curl -s -m 90 -X POST http://127.0.0.1:9741/run \
  -H 'Content-Type: application/json' \
  -d "{\"script\":$(python3 -c "import json;print(json.dumps(open('lqz-plutus.pine').read()))"),\
\"pair\":\"EUR/USD\",\"timeframe\":\"1H\",\"limit\":1603}"
```

**The request contract (quote it, do not paraphrase):**

```
POST /run
{
  "script":    "<the full Pine v6 source>",   // OR "canon": true  (reads the canon by path+sha)
  "pair":      "EUR/USD",                     // must be a fixture cell
  "timeframe": "1H",                          // 15m | 30m | 1H | 4H
  "limit":     1603,                          // 0/absent = keep the FULL history
  "symbol":    "EUR/USD",                     // optional
  "maxPoints": 1500,                          // optional
  "overlay":   { "script": "<second source>" } // optional: a SECOND source over the SAME bars
}
```

**The response contract:**

```
200 { "success": true, "data": {
        "title":    "LQZ Plutus — operator candle liquidity",
        "sourceSha":"<sha256 of the script>",
        "runMs":    186,
        "bars":     1603,
        "counts":   { "boxes": 0, "lines": 112, "labels": 0, "plots": 0, "plotPoints": 0,
                      "markers": 0, "tables": 0, "polylines": 0, "linefills": 0, "trades": 0 },
        "drawings": { … },
        "warnings": [ … ], "trades": [ … ] } }
4xx/5xx { "success": false, "error": "<message>", "code": "PINE_COMPILE_ERROR", "line": 4, "column": 25 }
```

**Two fields people get wrong:**
- `bars` is at **`data.bars`**, NOT under `counts`.
- The deliverable's identity is **`data.title`** AND **`data.sourceSha`** — assert the title, and
  when two files can share a title, assert the `sourceSha` too.

**Named refusals (normal, not failures):**

| input | response |
|---|---|
| empty / null script | `400 :: primary: a script or canon:true is required` (`PINE_SCRIPT_ABSENT`) |
| not Pine | `422 :: Unexpected token (2:6)` (`PINE_COMPILE_ERROR`) |
| unknown identifier | `422 :: <name> is not defined` |
| absent pair/timeframe | `500 :: no bars cell for … (available: 12 cells listed)` |
| `limit=1` | `400 :: bars absent (1)` |
| `limit=0` | **`200` — keep the full history** (documented) |
| unknown route | `500 :: no route GET /nope` (`PINE_ROUTE_ABSENT`) |
| body > 12 MB | `PINE_BODY_TOO_LARGE` |
| concurrent load | serialized: ~16-19 s each, NO busy signal — budget ~20 s per compile |

### 5.2 The expected results (the table a zero-context operator needs)

**The titles — assert these:**

| deliverable | `indicator()` title |
|---|---|
| `lqz-luxalgo.pine` (D1) | `LQZ LuxAlgo` |
| `lqz-plutus.pine` (D2) | `LQZ Plutus — operator candle liquidity` |
| `plutus-vision-v1.pine` (D3) | `Plutus Vision v1` |
| `plutus-vision-v0.pine` | (the parity reference — never edited) |

**The counts — re-measured 2026-10-02 on the SHIPPED files. Two instruments, two windows:**

| deliverable | STATION @ `limit=1603` (full fixture) | IDE `lastVision` (~400 bars) |
|---|---|---|
| D1 `lqz-luxalgo.pine` | boxes 481 · lines 191 · labels 3 | 117 boxes / 36 lines (0 coloured under `lqzSource='luxalgo'`; with `'both'`: 117 / 42 / 2) |
| D2 `lqz-plutus.pine` | boxes 0 · lines 112 · labels 0 | 58 lines, **100 % coloured** |
| D3 `plutus-vision-v1.pine` | boxes 5 · lines 205 · labels 97 | 79 lines / 21 labels, **100 % coloured** (4 colours) |

At 15m (the IDE instrument): D1 2 emitter lines / 0 coloured · D2 38, 38 coloured · D3 56, 56
coloured. **The 15m/1H difference for D1 is STRUCTURAL** (the detectors' windows are measured in
BARS; 15m carries the fixture's real 325 vs 400).

**Two instruments, two windows — never compare them:** the STATION reports over the `limit` you
pass (1603 = full fixture); the IDE's `lastVision` reports over 400 bars by default. A count that
"does not match" is usually a different window. Always state the instrument and the bar count.

### 5.3 The fixture (the world)

`fixtures/bars/2026-07-06.json` — 1.9 MB, 12 cells = **3 pairs (EUR/USD, GBP/USD, DXY) × 4
timeframes (15m, 30m, 1H, 4H)**, anchored at `2026-07-06T06:00:00Z` (Monday pre-London; every bar
satisfies `t <= anchor`). Provenance: TradingView chart history via the tvDatafeed wire protocol,
fetched 2026-09-24. **There is no `D` cell** — a daily timeframe is BLOCKED on data (N-7/T-14).

```bash
curl -s http://127.0.0.1:9741/cells        # the inventory
curl -s 'http://127.0.0.1:9851/api/v1/chart/bars?pair=EUR/USD&timeframe=1H' | head -c 300
```

### 5.4 The renderer page (what the browser shows)

- `http://127.0.0.1:9851/pine.html` — **THE IDE PAGE** (the standalone shell). Loads
  `tabs/_shell.js` + `tabs/pineshell.js`; the shell auto-mounts into `[data-shell-host]`.
- `http://127.0.0.1:9851/index.html` — the FORKED DASHBOARD page (loads `app.js`, novnc, trade
  tabs). NOT the IDE. Ignore it.
- The shell API on the page: `window.PlutusPineShell` — `run`, `capture`, `runGate`, `look`,
  `loadBars`, `editor.{setSource,flush,getSource}`, `tabs.{active,list,get,activate}`,
  `exportWorkspace` / `importWorkspace`, `state().lastVision`, `workbench.getBars()`,
  `chart.drawings.toJSON()`.

**Load → run → capture, the safe sequence (the durable load):**

```javascript
const src = await (await fetch('/lqz-plutus.pine', {cache:'no-store'})).text();
P.editor.setSource(src); P.editor.flush();
P.tabs.active().source = src;                   // a TAB carries its own source
const ws = P.exportWorkspace();                 // export (~19 KB, source inside)
await call("Page.reload", {ignoreCache:true});  // fresh COMPOSITOR (breaks a frozen capture)
// … wait for the mount (LONGER than 14 s) …
await P.importWorkspace(ws);                    // restore the source (defeats the reload clobber)
const rr = await P.run({silent:true});          // null-guard; assert rr.run.title
await P.capture();
```

### 5.5 Capturing without a display

If you have a headless Chrome with CDP, use the pattern in `scripts/pv-load.mjs`: find the
`http://127.0.0.1:9851/pine.html` page on `http://127.0.0.1:9222/json/list`, open its
`webSocketDebuggerUrl`, and `Runtime.evaluate` the async expression (await the kernel, set the
source, run, frame, return the counts). `P.capture()` returns `{png, sha256, stats, path, bytes}`.

**If you have neither X11 nor Chrome:** your instrument is the station's `counts` + `drawings`
payload. Use it as a COUNT instrument and say so — **a count is not a look** (see the handover
§9.3). Report `UNRUN — no capture path` rather than a PASS.

---

## 6 · SYMPTOM → ACTION (every code this rig emits)

| symptom / code | what it means | action |
|---|---|---|
| `STATION_DOWN` | the station did not answer a compile | `tail -50 /tmp/pv-station.log`; check `node -v >= 20`; check `pine-ide/pine-station/node_modules/pinets` exists (`ENGINE_ABSENT`) |
| `ENGINE_ABSENT` | `pine-ide/pine-station/node_modules/pinets` missing | `bash setup.sh` (or `cd pine-ide/pine-station && npm install`) |
| `FIXTURE_ABSENT` | `fixtures/bars/2026-07-06.json` missing | re-extract; it is 1.9 MB and ships in the pack |
| `PORT_HELD: :N still owned by pid …` | a previous instance (or a supervisor) holds the port | `fuser -k N/tcp` — or find the supervisor and stop it; `ss -ltnp \| grep :N` names the owner |
| `CHROME_STUCK` | a previous Chrome with the profile `/tmp/pv-ide-chrome` did not die | `pkill -f user-data-dir=/tmp/pv-ide-chrome` |
| `DISPLAY_DOWN` | no X11 display `:3` | you are on the headless path — use §3; or create a display (nested weston / Xvfb) and export `DISPLAY` |
| `NO_WINDOW: launch pine-ide first` | `--shot` ran before the IDE window existed | run `bash launch-pine-ide …` first, then `--shot` |
| `SERVED_PINE_DRIFT` | the file the IDE SERVES is not the file under test | `cp <f>.pine pine-ide/ide/renderer/` then re-run `bash scripts/verify_served_pine.sh`; require `SERVED_PINE_OK` |
| `PINE_STATION_DOWN` inside the page/rail | the page cannot reach the station | probe by COMPILE first (§3.1). If the compile works, the page's probe route is the problem — this is the documented half-alive case; restart the rig with `bash scripts/pv-ide.sh` |
| `PINE_COMPILE_ERROR` with a line/column | the Pine source is wrong | read the message; it names the LINE. The last good frame is retained |
| `VIL_WEEK_INVALID` | the gate needs the week set | set `input.pine-week` (e.g. `2026-W29`) before `runGate()` |
| `MECH_VETO:boxes=N:labels=0` | the gate's rule: a frame with zones but ZERO labels FAILS | by design (D1/D2 emit 0 labels); a FAIL there is a statement about their SCOPE, not a render defect |
| `NO_PAGE` | no `:9851/pine.html` tab on CDP `:9222` | the headed rig is not up, or Chrome died; relaunch |
| `DOUBLE_MOUNT` | two pine shells mounted | a second manual `mount()` — the page comment says `_shell.js` auto-mounts |
| `NOTHING_DRAWN` | the run compiled but 0 drawings reached the chart | check the deliverable's own config (`lqzSource`, the 500-caps) — a starved detector legitimately draws 0 zones |
| a capture identical to an older one | the compositor may be FROZEN | reload before every capture (`export → reload → import`); a sha-match is an INFERENCE of staleness, not a verdict |
| `ANCHOR_DROPPED:N` | N labels were dropped by the 500-label cap / the anchor rule | recorded as a delta; not chased |
| compile takes 15-20 s | the station serializes compiles | normal; budget ~20 s each |

---

## 7 · THE WORKFLOW LAWS (the habits that keep the product honest)

1. **EDIT SOURCE, THEN REGENERATE, THEN REDEPLOY.**
   ```
   edit  plutus-vision-lqz/*.pine            (the modules)
   run   python3 scripts/lqz_vision_build.py (or lqz_luxalgo_build.py / lqz_assemble.py)
   cp    <out>.pine pine-ide/ide/renderer/   (or keep the symlink)
   run   bash scripts/verify_served_pine.sh  → SERVED_PINE_OK
   ```
   **Never edit a generated `.pine` deliverable directly** — the next regeneration overwrites it.
   **Never edit a `*.bundle.js`** — it is a build output (`charts/build.mjs`); edit
   `charts/workbench.js` / `chart/app.js` and rebuild.

2. **VERIFY THE SERVED SHA BEFORE ANY VISUAL VERDICT.** `SERVED_PINE_OK` compares source ==
   renderer copy == served-over-HTTP, for all four `.pine` files. A visual verdict taken on a
   stale served copy is theatre (this was a real defect, EN-028).

3. **ASSERT THE TITLE *AND* `sourceSha`.** Two files can share a display title (`LQZ LuxAlgo`
   exists for both the shipped D1 and its `-both` variant). A title-only assertion reports the
   PREVIOUS file's counts under the new file's name (D-10).

4. **DECLARE THE 500 CAPS IN EVERY `indicator()`.** An undeclared `max_lines_count` silently
   discards zones (measured: 112 requested, 50 drawn). Every deliverable declares
   `max_labels_count = 500, max_lines_count = 500, max_boxes_count = 500`.

5. **A CAPTURE NOBODY OPENED IS NOT EVIDENCE.** Open the PNG. A file on disk is not a look.

6. **A BLOCKED OP NAMES ITS RESUME.** Never a pass. Never a soft pass.

7. **NEVER EDIT:** `plutus-vision-v0.pine` (the parity reference) · `sources/*.pine` (the frozen
   LuxAlgo originals) · `fixtures/bars/2026-07-06.json` (byte-identical to the pipeline's
   reference) · `SPEC.md`'s step-4 expectation.

8. **TUNE BY INPUT VALUES, NOT BY LOGIC EDITS.** The operator's ruling: no reinventing or
   customizing. The knobs are the declared inputs (`lqzSource`, `lqzTol`, `lqzMinAgree`,
   `lqzMaxZones`, `lqzFill3`, `lqzFillA`, `lqzLineTol`, `wickBodyMult`, `rejectATRMult`).

9. **GIT: STAGE BY EXPLICIT PATH.** Never `git add -A`. Secret-scan the staged set before every
   commit. Never commit `node_modules`, runtime state, or bulk evidence. No `--no-verify`, ever.

---

## 8 · THE DELIVERABLES — what each one is, and what it should look like

| file | what it is | expected at 15m (station) | the look |
|---|---|---|---|
| `lqz-luxalgo.pine` (D1) | the three LuxAlgo liquidity detectors, ONE display | 2 emitter lines, 0 coloured under `lqzSource='luxalgo'`; under `'both'`: 117 boxes / 42 lines / 2 labels | thin full-width horizontal lines; the detector paint suppressed so the LQZ layer is the display |
| `lqz-plutus.pine` (D2) | the operator's own candle strategy | 38 lines, **100 % coloured** | a DENSE ladder of thin full-width lines, green below / red-brown above, irregularly spaced; no labels (by design) |
| `plutus-vision-v1.pine` (D3) | the winner + the LuxAlgo SMC — **the refinement target** | 5 boxes / 57 lines / 22 labels, 100 % coloured, four colours | the ladder PLUS large translucent zone bands PLUS the SMC structure vocabulary (`CHoCH`, `BOS`, `EQH`, `EQL`, `BC`) |
| `plutus-vision-v0.pine` | **THE PARITY REFERENCE — NEVER EDIT** | — | sha `605bff82d3539e9e` |

**THE LOOK (the operator's target, from the library):** thin full-width horizontal lines, green
below price / red-brown above, irregularly spaced, plus large translucent zone bands, plus (on D3)
the structure vocabulary. **Candles must stay readable.**

**D1's `lqzSource` is the ONLY lever that moves its ladder** (measured at 15m): `luxalgo` → 0
coloured lines; **`both` → 3**. `lqzTol` (0.5→1.5), `lqzMinAgree` (2→1) and `lqzMaxZones` (60) are
all INERT at 15m. **The measure is the COLOURED count, not the raw count.**

---

## 9 · WHAT THE INDICATORS *ARE* (read `05_DOCTRINE_READ_ONLY/` before tuning)

These indicators are not a chart toy. They are the **E1 zone-geometry layer of the TTE (Visual
Telescope)** — the liquidity / supply-demand zone renderer that the wider PLUTUS system consumes.
Before you change what a zone looks like, read:

- `05_DOCTRINE_READ_ONLY/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md` — the four-element
  doctrine: **Earth = liquidity · Fire = S-D · Water = shapes · Air = Fib**. It tells you which
  family a zone belongs to and therefore which colour/behaviour it should carry.
- `05_DOCTRINE_READ_ONLY/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md` — the E1/E2/E3 fundamental law (what
  layer this indicator is and what it feeds).
- `05_DOCTRINE_READ_ONLY/VISUAL_TELESCOPE_CHARTING_T2.md` — the TTE engineering spec; **§13 carries
  the exact LQZ pattern criteria this indicator implements.** This is the semantic authority for
  "is this zone correct?".
- `05_DOCTRINE_READ_ONLY/PLUTUS_ARCHITECTURE_BIBLE_4.5.md` — the supplementary master context.
- `05_DOCTRINE_READ_ONLY/DPL1_SPEC.md` — this project's own build spec.

**Read-only.** Do not modify them. They exist so a foreign agent understands WHAT the zones mean,
not just how many pixels they cover.

---

## 10 · QUICK REFERENCE CARD

```bash
# ── headless bring-up (no display) ───────────────────────────────────────────────────────
cd pine-ide/pine-station && PINE_STATION_PORT=9741 PINE_STATION_HOST=127.0.0.1 \
  PLUTUS_BARS_FIXTURE="$PWD/../../fixtures/bars/2026-07-06.json" \
  PLUTUS_LIVE_ROOT="$PWD/../.." node server.mjs &  cd ../..
PV_FIXTURE="$PWD/fixtures/bars/2026-07-06.json" python3 scripts/pv-server.py 9851 pine-ide/ide/renderer &

# ── liveness (a compile, never GET /) ────────────────────────────────────────────────────
curl -s -m 90 -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json' \
  -d '{"script":"//@version=6\nindicator(\"probe\")\nplot(close)","pair":"EUR/USD","timeframe":"1H","limit":300}'

# ── compile a deliverable, assert the title ──────────────────────────────────────────────
curl -s -m 90 -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json' \
  -d "{\"script\":$(python3 -c "import json;print(json.dumps(open('plutus-vision-v1.pine').read()))"),\"pair\":\"EUR/USD\",\"timeframe\":\"1H\",\"limit\":1603}" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['data']['title'], d['data']['counts'])"

# ── the drift guard (before any visual verdict) ──────────────────────────────────────────
bash scripts/verify_served_pine.sh        # MUST end SERVED_PINE_OK

# ── the identity of the freeze ───────────────────────────────────────────────────────────
sha256sum lqz-luxalgo.pine lqz-plutus.pine plutus-vision-v1.pine plutus-vision-v0.pine

# ── the fixture inventory ────────────────────────────────────────────────────────────────
curl -s http://127.0.0.1:9741/cells

# ── headed (optional) ────────────────────────────────────────────────────────────────────
bash launch-pine-ide plutus-vision-v1.pine EUR/USD 1H
bash launch-pine-ide --shot /tmp/now.png   # then OPEN /tmp/now.png

# ── ports ────────────────────────────────────────────────────────────────────────────────
ss -ltnp | grep -E ':(9741|9754|9851|9222)'
tail -20 /tmp/pv-station.log /tmp/pv-vil-rail.log /tmp/pv-ide-http.log
```

**THE FIVE THINGS THAT MUST BE TRUE BEFORE YOU CLAIM ANYTHING:**

1. The four SHAs match the handover §5.1.
2. `POST /run` returns `success:true` and the deliverable's OWN title.
3. `bash scripts/verify_served_pine.sh` ends `SERVED_PINE_OK`.
4. Any visual verdict is backed by a frame YOU opened (or the claim is `UNRUN — no capture path`).
5. `plutus-vision-v0.pine` is still `605bff82d3539e9e`.

---

## 11 · LOCAL-PATH AUDIT (what still contains `/home/leviathan`, and why it does not block you)

**Verified:** the pack was extracted to a foreign path and run there — the station booted, the
engine resolved (`pinets@0.10.0`), all three deliverables compiled with their own titles, the
renderer served `pine.html` (200) with a 1603-bar feed, and `verify_served_pine.sh` returned
`SERVED_PINE_OK`. **No `/home/leviathan` path is required at runtime.**

What remains, classified (measured by grepping the packed tree):

| class | files | is it on the runtime path? | what to do |
|---|---|---|---|
| **tree-resolving launcher** | `launch-pine-ide`, `scripts/pv-ide.sh`, `scripts/verify_served_pine.sh` | YES — and they resolve their OWN root via `readlink -f "$0"` | nothing: they work anywhere |
| **the station's fallback roots** | `pine-ide/pine-station/lib/bars.mjs:25`, `lib/canon.mjs:26`, `bars.mjs:33` (`process.env.HOME \|\| '…'`) | YES, as FALLBACKS only | export `PLUTUS_BARS_FIXTURE` (§3.0). Never rely on the fallback |
| **headed-path helpers** | `scripts/lqz-panel.mjs:44` (LIB_DIR), `scripts/lqz_panel_ide.py:21,42` (the tree root + the library frame) | headed grid composition only | edit those two constants to YOUR paths if you compose grids |
| **one-off historical helpers (58 files)** | `scripts/fix_*.py`, `inspect_*.py`, `test_*.mjs`, `goal_audit.py`, `gen_canon.py`, `show_ide.sh`, `pv-ide-cdp.sh`, `lqz_adversarial.py`, … | NO | ignore them; they were session scaffolding. Do not run them. `gen_canon.py` regenerates the canon docs and needs the tree root edited to yours if you ever do |
| **docs / reports / canon / checkpoints** | `03_SUPERSEDED_READ_ONLY/**` and `05_DOCTRINE_READ_ONLY/**` | NO (they are prose) | read them; the paths are provenance |

**Rule of thumb:** if a script does not begin with `W="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"`
or take its paths from env, treat it as historical.

---

*End of manual.*
