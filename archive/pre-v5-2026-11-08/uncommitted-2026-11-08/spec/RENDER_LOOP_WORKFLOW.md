# THE RENDER LOOP — the workflow

**This is the only workflow. Every other document in `spec/` is input to it or a record of it.**

```
RENDER IT.  SCREENSHOT IT.  LOOK AT IT.
Does the price action react to the E1 zones, the E2 path, the E3 trades?
    TRUE  -> next week, next asset
    FALSE -> debug why. That is the work.
DONE = any random week, any random asset, renders correctly and price respects it.
```

**FORBIDDEN as evidence:** grep · sha256sum · wc -l · diff · file existence · JSON schema ·
counts from the renderer's own report · a compile line · a green suite · any statement about
the chart that is not read off pixels I opened this turn.

**A count is not a look.** The renderer reporting `boxes:11 labels:12` while the chart shows
nothing is the exact failure this workflow exists to catch — measured, twice, this session.

---

## §1 · THE RIG — exact commands (every line load-bearing)

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
# station :9741 (PineTS) · rail :9754 · server :9851
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

**★ Do not unset `XDG_RUNTIME_DIR`.** Measured: `env -u XDG_RUNTIME_DIR … chrome` →
`XDG_RUNTIME_DIR is invalid or not set` → same Wayland death. Leave it; set only
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
empty. The fixture is `fixtures/bars/2026-07-06.json` and it is DXY → **pair must be `DXY`**.

### 1.5 Capture — window-scoped, never device-scoped

```bash
WIN=$(DISPLAY=:4 xdotool search --name "Plutus Vision" | head -1)
bash $S shot $WIN /tmp/pv-chart.png
```

**LAW: window-scoped only.** `shot` refuses `WIN=root` by design — *"you are explicitly
forbidden from doing device level screenshots."*

## ★★★ 1.5b · CAPTURE VIA CDP, NOT `import` — `import` RETURNS A STALE PIXMAP

**MEASURED 2026-10-25, and it cost the session hours.** On the nested-weston agent display,
`import -display :4 -window <id>` returned a **stale frame**: the editor pane still painted a
smoke test and the chart still showed an earlier week, while the DOM held the real source and
`document.createTreeWalker` found **zero** nodes containing the old string. The page was live;
the capture was not. Every "the chart is empty" verdict that night was read off a stale pixmap.

```
TRUE TEST OF A STALE CAPTURE — run it whenever a capture disagrees with what you believe:
  the string you expect to be GONE must appear ZERO times in the DOM.
    walker over document.body → count nodes containing it
    0 hits + the capture still showing it  =>  THE CAPTURE IS STALE, NOT THE PAGE
```

**THE CORRECT CAPTURE — the browser's own compositor:**

```bash
python3 - <<'PY'
import json, base64, urllib.request, websocket
tl = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=5))
page = [t for t in tl if t.get("type") == "page" and "pine.html" in t.get("url", "")][0]
c = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=40)
c.send(json.dumps({"id": 1, "method": "Page.captureScreenshot",
                   "params": {"format": "png", "captureBeyondViewport": True}}))
while True:
    m = json.loads(c.recv())
    if m.get("id") == 1:
        open("/tmp/pv-chart.png", "wb").write(base64.b64decode(m["result"]["data"]))
        break
c.close()
PY
```

**`import` is still correct for the RIG liveness check** (is the window there, is it sized) —
it is NOT the channel for judging what the chart paints. **Never verdict a render off `import`.**

### 1.6 LOOK

```
read /tmp/pv-chart.png        <- in the SAME turn as the capture. Always.
```

---

## §2 · THE KNOWN FAILURE MODES (all measured this session — check these FIRST)

```
┌────┬──────────────────────────────────┬─────────────────────────────────────────┐
│ #  │ WHAT YOU SEE ON THE CHART        │ WHAT IT IS                              │
├────┼──────────────────────────────────┼─────────────────────────────────────────┤
│ F1 │ entirely empty desktop,          │ chrome died on the Wayland ozone probe  │
│    │ no window at all                 │ -> missing --ozone-platform=x11         │
│ F2 │ chart shows FIXTURE_CELL_ABSENT  │ pair != fixture. The fixture is DXY;    │
│    │ with `0 bars` in the status row  │ the chart asked for EUR/USD             │
│ F3 │ candles absent, axes present,    │ the fixture is DEGENERATE —             │
│    │ OHLC readout O=H=L=C             │ every bar the same price                │
│ F4 │ candles fine, NO study drawings  │ the payload reached the script but the  │
│    │ (no zones, no labels, no lines)  │ draw sites produced nothing             │
│ F5 │ drawings present but in the      │ wrong price scale / off-screen          │
│    │ wrong place on the y-axis        │ geometry                                │
│ F6 │ drawings present but on the      │ wrong time anchor / window              │
│    │ wrong days                       │                                         │
│ F7 │ a zone label reads a NUMBER      │ the ZFP fabrication is alive            │
│    │ where the report scored nothing  │                                         │
└────┴──────────────────────────────────┴─────────────────────────────────────────┘
```

**F1/F2/F3 are ENVIRONMENT. F4/F5/F6/F7 are the INDICATOR.** Conflating them is how a session
burns a day fixing the wrong layer. **Read the status row and the OHLC readout FIRST** — they
discriminate F2 and F3 in one glance, before any code is touched.

---

## §3 · THE TEST SUITE — every test pixel-based

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
FAIL = F7 (the fabrication is alive)
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

---

## §4 · THE DEBUG TREE — when FALSE

```
  a  did ANYTHING render?              no  -> F1/F2/F3 (env) or F4 (draw sites)
  b  zones at the right PRICES?        no  -> F5 -> the payload is not reaching the render
  c  zones on the right DAYS?          no  -> F6 -> window / anchor
  d  ZFP honest?                       no  -> F7 -> the fabrication
  e  zones correct at right price+time, but price did NOT react?
         -> THE ZONES ARE WRONG. UPSTREAM DATA. Not the indicator.
```

**(e) is the line that matters most.** If the indicator faithfully draws a zone at the right
price and time and price sails through it, the indicator did its job and the *zone* was bad.

---

## §5 · THE RECORD — one row per loop, forever

```
week | asset | F# (if any) | E1 zones N/M | E2 path | E3 R | verdict | note
```

Over days that table is the progress. **A failure class that repeats becomes the fix list.**

---

## §6 · WHAT THIS WORKFLOW FORBIDS

```
✗ reporting a count as a render              ✗ a verdict from an unopened PNG
✗ fixing the indicator when the fixture is degenerate
✗ testing on the week the zones were transcribed from
✗ any grep/hash/existence/diff as a PASS reason
✗ device-level screenshots
✗ touching :0 :1 :2
✗ improvising a weston instead of agent-display.sh
```
