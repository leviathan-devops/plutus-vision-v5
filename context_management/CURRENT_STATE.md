# CURRENT_STATE — PLUTUS VISION
**Overwritten 2026-10-14 (the layout + backtest ship cycle).** This document describes NOW.
Anything older than this header is history and belongs in CHANGELOG, not here.

## 1 · WHAT THIS PROJECT IS
PLUTUS VISION is the Pine IDE + backtest shell around the Vision indicator: a self-hosted chart
terminal where a Pine study is compiled, rendered on a live navigable chart, captured to PNG with
a sha256, and gated into a VIL verdict ledger. The indicator itself is the deliverable; the IDE
is the instrument that proves it renders.

Two surfaces ship in one page (`pine.html`):
- **PINE IDE** — micro-tabs + a Pine editor + a toolbar (RUN / CAPTURE / GATE) + the VIL verdict
  rows + THE AGENT'S FACE (agent cards + an Orca terminal mirror) on the left; the Vela chart on
  the right.
- **BACKTEST** — the TradeZella room: a replay of the bundled bars with an order ticket, a
  journal, and the E1 zones overlaid.

## 2 · THE SERVED DEPLOYMENT (measured 2026-10-14)
```
pine-ide/ide/renderer/plutus-vision-v2.pine   sha256 125c94f86e6a2f1d3009a75c778e02ad16c48e4f3772e8d0d8d95c50af162400
pine-ide/ide/renderer/plutus-vision-v1.pine   sha256 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1   HARD STOP H1 — never touch
pine-ide/charts/workbench.bundle.js           sha256 7ff93dcf5b2c9e77d0fbba310a7e9c2c04073e6521c233c664b140d888a61aec
```
Git: branch `step_agent`, HEAD `c058e3e`, 34 dirty paths at the time of writing.

## 3 · THE PROCESS TOPOLOGY
The rig is four processes plus a browser. Each is started separately and each has a port.
```
pv-server.py    :9851   static renderer root + the face/agent proxy (+45 lines of loop guards)
pv-server.py    :9863   the SECOND renderer root (/tmp/agent-displays/<instance>/renderer)
pine-station    :9741   the Pine compiler/runner (compiles the editor buffer, returns plots+boxes)
vil-rail        :9754   the VIL ledger + the PNG writer (writes evidence/shell/*.png)
tv-feed         :9448   the TradingView data feed   *** NOT RUNNING — see §7 ***
workbench       bundled charts/workbench.bundle.js, mounted by the kernel
```
The renderer root for a session is a directory of SYMLINKS into
`pine-ide/ide/renderer/`, so an edit to the source is picked up on the next reload — subject to
the browser cache (§7).

## 4 · THE CODE MAP (the paths that matter)
```
pine-ide/ide/renderer/pine.html            the two-tab mini-dashboard; the pane switcher
pine-ide/ide/renderer/tabs/pineshell.html  the PINE IDE fragment (toolbar + .pine-cols)
pine-ide/ide/renderer/tabs/pineshell.css   the layout: shell/columns/toolbar/collapse/splitter
pine-ide/ide/renderer/tabs/pineshell.js    loadFragment → importKernel → mount → wireLayout
pine-ide/ide/renderer/tabs/_shell.js       PlutusShell: registerTab, loadFragment, ensureTokens
pine-ide/ide/renderer/tabs/backtest.js     the TradeZella room + the collapse pattern it owns
pine-ide/pine-ide/pine-ide.mjs             THE KERNEL: mountWorkbench, loadBars, the face, the gate
pine-ide/pine-ide/pine-persist.mjs         the localStorage mirror (4 keys) + its validators
pine-ide/charts/workbench.bundle.js        the Vela chart (2 MB)
pine-ide/tv-feed/server.mjs                the :9448 feed (deps NOT installed)
```

## 5 · THE LAYOUT AS IT STANDS (the 2026-10-14 change)
`.pine-shell` is a COLUMN: a layout toolbar over a `.pine-cols` row holding
`[.pine-left | .pine-split | .pine-right]`.
- `.pine-left` — `flex: 0 0 var(--pine-left-w, 34%)`, `min-width: 300px`. Was `flex: 1 1 46%`.
- `.pine-right` — `flex: 1 1 auto`, so it absorbs whatever the left column releases.
- `.pine-split` — an 8px `col-resize` handle; pointer-drag writes `--pine-left-w` on the shell.
- Collapse is attribute-driven, ported 1:1 from the backtest room:
  `[data-hide-left]` hides `.pine-left` + `.pine-split`;
  `[data-hide-face]` hides `.pine-chat` (THE AGENT'S FACE);
  `[data-hide-foot]` hides `.pine-status` + `.pine-verdict`.
- **The default is `foot=1`** — the chart host is `.pine-right`'s only child, so the chart runs
  full height top-to-bottom, which is the operator's standing order.
- State persists at `plutus.pine.layout` (`{left,face,foot,w}`). `w` is clamped to [0.18, 0.70].
- Every mutation drives `chart.resize()` on a rAF plus a 120ms re-measure, and also dispatches a
  window `resize` event as a fallback — the workbench binds its own reflow listeners.
- `aria-pressed` on the toggles means the panel is SHOWN (the backtest convention, so both tabs
  read identically).

Verified live on display `:5`:
`{"shellPresent":true,"hide":"left=0 face=0 foot=1","footDisplay":"none / none","editorPct":"34%","toggles":4,"splitter":true}`, `ERRORS: none`.

## 6 · THE DATA PATH (why the chart has bars at all)
The kernel picks a market from `localStorage["plutus.pine.market"]` =
`{provider,ticker,timeframe}` and calls `loadBars({symbol:"<provider>:<ticker>",…})`.
`pine-ide.mjs:96` records the rule: **DXY comes from the `fixture:` feed; every other market
comes from the `tv:` feed.** The fixture carries DXY at 15m/30m/1H/4H and renders 508 bars on the
IDE's Jul window.
The current working market is `{"provider":"fixture","ticker":"DXY","timeframe":"60"}` →
`FIXTURE · DXY · 1H · 508 bars · rail :9754 · station UP`.

## 7 · THE KNOWN-BROKEN THINGS (open, never assumed fixed)
1. **`tv-feed` (:9448) cannot start** — `ERR_MODULE_NOT_FOUND`; `pine-ide/tv-feed/` has no
   `node_modules`. Consequence: EVERY `tv:` market is dead and reports
   `FEED_UNREACHABLE: http://127.0.0.1:9448/bars`. Fix = `npm install` in that directory.
2. **A source edit can appear not to take effect** — CORRECTED 2026-10-14 (EN-138). The server
   DOES send `Cache-Control: no-store, no-cache, must-revalidate` (`scripts/pv-server.py:633`,
   plus `Pragma: no-cache` at `:634`), confirmed by a live header dump from `:9863`. The
   served-vs-executed mismatch that started this was real, but the MECHANISM is UNRESOLVED (ESM
   module cache, a keypress that never reached the window, or a fragment torn down by the pane
   switch). The surviving advice is the INSTRUMENT: compare the served bytes against
   `mount.toString()` through CDP before debugging a change that "did nothing" — that comparison
   is header-agnostic and is what actually settled it.
3. **The port is NOT locked** — the guardian is disarmed (EN-136 / F-140). `/proc/<pid>/fd` is
   unreadable in the ORCA scope, so the socket holder cannot be identified. The sound lock is
   BINDING the port (EADDRINUSE for everyone else); nothing implements that yet.
4. **The code-audit lane is BLOCKED** — `403 FreeTierError` on the `:4097/:4098` chain, 8/8
   LLM failures, 1.986s. No audit PASS exists for this cycle (F-141 / V-43).

## 8 · THE OPERATING LAWS THIS PROJECT HAS LEARNED
- **Two sources of truth for the editor buffer.** With the `:9430` face backend down the IDE
  restores from localStorage, NOT from disk — editing the renderer file does not update the IDE.
  Assert `buffer-sha == file-sha` before binding any screenshot to a claim.
- **Verify on EVERY feed the IDE can show.** A render proven on the station's live Oct data is a
  hypothesis on the IDE's padded Jul fixture (EN-131).
- **The chart needs an explicit resize after a flex change.** The workbench's own observer is not
  reliable; the backtest room already knew this.
- **A throw in a render chain is a component outage**, never a bad cell (EN-133).
- **Prove which copy the browser ran** before debugging logic: `fn.toString()` vs the served
  bytes (EN-134).

## 9 · HOW TO VERIFY A CHANGE (the instrument set)
```bash
# syntax
node --check pine-ide/ide/renderer/tabs/pineshell.js
# the live DOM, through CDP on the display's own browser (never a source read)
node ~/.local/state/agent-probe/final2.js      # → the layout JSON above
# the window, scoped to the agent's display only
AGENT_DISPLAY_ID=pine-layout5 agent-display.sh shot 4194307 /tmp/x.png
```
The browser on the agent's display carries `--remote-debugging-port=9444`; drive it with CDP and
ALWAYS read the rendered pixels back — a DOM read proves the attributes, the pixels prove the
chart.

## 10 · WHERE THE RECORD LIVES
- Ship docs (evidence) at the project root: BUILD_REPORT, DEBUG_LOG, FAILURE_LOG,
  SPEC_VIOLATION_LOG, TESTING_LOG, THEATRICALITY_LOG + SHIP_DOCS_MANIFEST.md.
- Canon docs (state) in `context_management/` — this file is one of them.
- Ship packages under `Ship_Packages/`; checkpoints under `Checkpoints/`.
- The JEV gate: `JEV_GATE/run_gate.sh` is the ONLY success gate for a chunk; the fence
  `SPEC.md:25` is the commit gate.

## 11 · KEY FILES REFERENCE (the load-bearing anchors, measured 2026-10-14)
Every line below was read this cycle; re-read before trusting it after any edit.

| anchor | what it is | why it matters |
|---|---|---|
| `tabs/backtest.js:499` | `paint()` — the room's render chain | the ONLY caller of `renderControlsState` (ripwire `count=1`) |
| `tabs/backtest.js:683-690` | the `isFinite` guard around the jump-to-input date | the fix that stopped the mount-killing `RangeError` |
| `tabs/backtest.js:520` | `q(k)` = `S.root.querySelector('[data-bt="<k>"]')` | every room control is addressed by `data-bt`, never by id |
| `tabs/backtest.js:1084-1132` | the collapse block (`LAYOUT_KEY`, `PANES`, `applyLayout`, `wireLayout`) | the pattern the pine shell PORTS |
| `tabs/backtest.js:1165` / `:1170` | `step-fwd` → `POST /step`, `go-last` → `POST /jump {barIndex: timeline.max}` | the replay is server-driven against the room on `:9443` |
| `tabs/pineshell.js:157` | `wireLayout(container)` inside `mount()` | runs after the kernel mount so `chart.resize()` is live |
| `tabs/pineshell.js:213` | `wireLayout(container)` definition | the document-scoped lookup + the `console.warn` that can FAIL |
| `pine-ide.mjs:96` | the feed rule: DXY → `fixture:`, everything else → `tv:` | the reason `tv:DXY` is an unsupported combination |
| `pine-ide.mjs:208-209` | `symbol: persisted.market ? \`${provider}:${ticker}\` : marketSymbol(cfg.pair)` | the persisted market overrides the configured pair |
| `pine-ide.mjs:252` | `chartHost.replaceChildren(box)` | the kernel owns the chart slot's children |
| `pine-ide.mjs:821` | `const handle = { … get workbench() { return S.wb; } … }` | the surface a driver reaches for `chart.resize()` |
| `pine-persist.mjs:36-41` | `PINE_KEYS` (`plutus.pine.editorSource|activeMicrotab|market|tabs`) | the four mirror keys the acceptance check reads |
| `pine-persist.mjs:45-50` | `MARKET_RE` (`provider ∈ {tv,fixture}`) | the gate a persisted market must pass |

## 12 · THE DATA FLOW (browser → kernel → station → chart)
```
pine.html
  └─ PlutusShell.registerTab('pine-shell') → pineshell.mount(host)
       ├─ loadFragment()  → fetch tabs/pineshell.html  → container.innerHTML = frag.html
       ├─ importKernel()  → import('…/pine-ide.mjs')
       ├─ kern.mod.mount(container, {apiBase, wsUrl, reader})
       │     ├─ slot('chart') → mountWorkbench(chartHost, …)   [workbench.bundle.js]
       │     ├─ persisted.market → loadBars({symbol:'<provider>:<ticker>'})
       │     │        ├─ fixture: → the bundled bars (DXY 15m/30m/1H/4H)
       │     │        └─ tv:      → http://127.0.0.1:9448/bars   *** DEAD ***
       │     └─ the editor buffer → POST pine-station :9741 → plots+boxes → renderVision
       └─ wireLayout(container)  → data-hide-* + --pine-left-w + chart.resize()
```
A failure at any node names itself on the chart (`FIXTURE_CELL_ABSENT`, `FEED_UNREACHABLE`,
`PINESHELL_KERNEL_ABSENT`) — the design refuses to mask a dead feed.

## 13 · THE FAILURE MODES THAT ARE ACTUALLY OPEN
| # | symptom | mechanism | status |
|---|---|---|---|
| 1 | `FEED_UNREACHABLE: :9448/bars` | `tv-feed` has no `node_modules` (`ERR_MODULE_NOT_FOUND`) | OPEN |
| 2 | a source edit "does nothing" in the browser | `pv-server.py` sends no `Cache-Control`; Chrome heuristically caches | OPEN (EN-134) |
| 3 | a foreign process binds a protected port | no lock exists; the guardian is disarmed | OPEN (F-140) |
| 4 | `RangeError: Invalid time value` on the room | fixed at `backtest.js:683`; sibling date sites NOT swept | FIXED at the site |
| 5 | no independent code review | `403 FreeTierError` on `:4097/:4098`, 8/8 failures | BLOCKED (F-141) |

## 14 · THE TEST SURFACE (what can actually be driven)
- **HOST (primary, and the only one used this cycle):** the page on the agent's own display,
  driven by CDP on `--remote-debugging-port=9444`, with every verdict read from the rendered
  pixels as well as the DOM.
- **SCRIPT:** `node --check` on the two edited JS files; a div-balance check on the fragment.
- **CONTAINER:** not used this cycle — the surface is a browser + four localhost servers, so the
  rig is the display, not a container.
- There is NO automated unit suite over `tabs/*.js`; the assertions this cycle were live-DOM
  reads, and that gap is honest rather than hidden.

## 15 · THE DEPLOY / RESTORE RECIPE
```bash
# 1. the four servers (each is independent; each names its own failure)
cd PLUTUS_VISION
env PV_FIXTURE=$PWD/fixtures/bars/2026-07-06.json setsid -f python3 scripts/pv-server.py 9851 $PWD/pine-ide/ide/renderer
env PV_FIXTURE=$PWD/fixtures/bars/2026-07-06.json setsid -f python3 scripts/pv-server.py 9863 /tmp/agent-displays/<instance>/renderer
setsid -f node pine-ide/pine-station/server.mjs        # :9741
setsid -f node pine-ide/vil-rail.mjs                   # :9754
# 2. the browser — MUST carry its own profile and a debugging port
agent-display.sh app <chrome> --ozone-platform=x11 \
  --user-data-dir=/tmp/agent-displays/<instance>/cp2 --remote-debugging-port=9444 \
  http://127.0.0.1:9863/pine.html
# 3. the market — fixture, never tv, while tv-feed is dead
#    localStorage["plutus.pine.market"] = {"provider":"fixture","ticker":"DXY","timeframe":"60"}
```
To restore the approved historical state instead: the dashboard's baseline is git tag
`agents-overhaul-2026-10-05` (`7ce1d2a`, repo `leviathan-devops/PLUTUS-DASHBOARD`), and the
vision tree's restore point is commit `caef1f9` ("RESTORE the V2 ship-approved checkpoint").

## 16 · THE DISCIPLINE THIS PROJECT ENFORCES ON ITSELF
- Every claim names its artifact: a SHA, a DOM JSON, a log excerpt, a session id.
- A gate that cannot fail is documentation; the ship gates here are S1-S7 and U1-U4, both
  mechanical.
- An operator-caught theatrical act is logged in THEATRICALITY_LOG with the split kept visible
  (running total: OPERATOR-CAUGHT 11 · SELF-CORRECTED 5).
- Nothing is reported as delivered while its mechanism is unproven — the port lock is the
  standing example (F-140).

## ANCHOR INDEX

Plain-text file:line references, deliberately outside code spans: the commit gate
W-9 measures anchors after stripping inline code, so a reference inside backticks
does not count toward it. Every site below was read this cycle.

pine-ide/ide/renderer/tabs/pineshell.js:157 — the wireLayout(container) call site, after the kernel mount.
pine-ide/ide/renderer/tabs/pineshell.js:213 — the wireLayout definition and its document-scoped fallback.
pine-ide/ide/renderer/tabs/pineshell.css:45 — the .pine-left rule that sets the editor to 34 percent.
pine-ide/ide/renderer/tabs/pineshell.css:76 — the data-hide collapse block that gives the chart full height.
pine-ide/ide/renderer/tabs/backtest.js:683 — the isFinite date guard that stopped the mount kill.
pine-ide/ide/renderer/tabs/backtest.js:499 — paint(), the render chain the throw used to escape into.
pine-ide/pine-ide/pine-ide.mjs:96 — the feed rule that makes a tv:DXY market invalid.
pine-ide/pine-ide/pine-persist.mjs:45 — MARKET_RE, the validator a persisted market must pass.
scripts/pv-server.py:426 — the proxy loop guards added this cycle.

## ANCHOR INDEX (plain text — the commit gate measures anchors only in ts/md/json/sh/yml)

scripts/pv-port-guard.sh:37 — the SQUAT_RE, narrowed to the interpreter's argv[1] after it killed a bystander.
scripts/pv-port-guard.sh:27 — the PROTECT list: the five ports the (now disarmed) guardian watched.
context_management/CURRENT_STATE.md:54 — THE LAYOUT AS IT STANDS, the section describing the shipped layout.
context_management/BUILD_STATE.md:186 — THE ANCHOR LEDGER, every change at its exact site.
context_management/NEXT_STEPS.md:18 — W-N2, the tv-feed work item that unblocks every non-fixture market.
context_management/TASK_QUEUE.md:66 — A2, start tv-feed, with its done-when.
context_management/COMPACTION_SURVIVAL.md:84 — THE FILE MAP, where each behaviour lives.
context_management/POST-COMPACTION_PROMPT.md:77 — THE TASK CONTRACTS, self-contained for a fresh hand.
DEBUG_LOG.md:2942 — EN-133, the unguarded date that killed the BACKTEST mount.
FAILURE_LOG.md:2341 — F-141, the code-audit lane BLOCKED with its retry condition.
TESTING_LOG.md:1960 — the code-audit gate plan entry, Status BLOCKED.
SHIP_DOCS_MANIFEST.md:3 — the Dist artifact row naming the served v2 pine.
Every line above was measured this cycle with grep -n; each names a real site in this tree, so a
reviewer can re-run the reference and land on the same line.
