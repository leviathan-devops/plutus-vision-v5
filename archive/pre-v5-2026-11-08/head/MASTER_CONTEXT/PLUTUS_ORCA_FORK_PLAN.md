# PLUTUS → ORCA FORK PLAN v1.0 — FULL MIGRATION SPEC

**TRIGGER:** operator order to fork `stablyai/orca` and build Plutus natively into it — dashboard into Orca dashboard, TV MCP into Orca browser, headed agent into Orca CLI.
**DUTY:** the single build authority for the migration. A fresh build agent with zero prior context reads this file + the three scout payloads and can execute F0→F5 without re-reading source.
**STATUS:** PLAN — unbuilt. Landing zone measured this session. No code moved yet.
**OPERATOR THESIS (verbatim intent):** "the entire plutus dashboard + tv mcp can run directly on orca. we can literally fork orca and build plutus natively into it. the plutus headed agent can run in orca cli, the dashboard can be built into the orca dashboard, already has built in browser that i just tested works for chart rendering and full interaction — this has literally everything built in."
**VERDICT ON THESIS:** MOSTLY TRUE with three adapters required (drawing precision, panel→sidecar calls, trade-DB storage). §4 adjudicates every capability DIRECT / ADAPTER / DROP with mechanism. Nothing in the thesis is rejected outright; nothing is accepted without an adapter where the evidence demands one.

## §0 ABSORPTION ORDER

1. Read this file fully before ANY migration action. A decision made on a partial read is the suppressed default, not the engineering answer.
2. Then load the three scout payloads by need (never whole unless full-context work): `agent://TvExtractor` (TV_Browser_v3.0 38 tools + transport + 14-item parameterize list + 12 GAPs), `agent://DashExtractor` (Plutus_Dashboard Electron + sidecar + orchestrator + 10 GAPs), `agent://OrcaExtractor` (Orca CLI + browser + orchestration + plugins + 10 GAPs).
3. Re-verify live anchors before building: `orca status --json` reachable + ready, `orca worktree ps --json` current worktree, frozen pair SHAs if Plutus engines are forked in, MPSE battery fingerprint `8acfe74f272bf736de101e297b731cfa97c9fdd4a1684e63363489f116af7b7e`.
4. Doctrine is QUOTED (D13). Anything unquotable does not get built. Where this file and disk conflict, disk wins — re-verify, then append §18.

## §1 PROBLEM STATEMENT

1. Plutus today is three runtimes taped together: an Electron Mission-Control dashboard (`Plutus_Dashboard/dashboard/electron/main.js` 530L owning Express `127.0.0.1:9430` + WS `127.0.0.1:9431` + CDP bridge Weston `DISPLAY :2` → Chrome `--remote-debugging-port 3690` → `Page.screencast` → IPC `tv-frame` → `trade-canvas.js` drawImage), a Bun sidecar (`plutus-sidecar/server.ts` 570L on `:9420`) wrapping the REAL v4.5.2 engines (`pipeline-handler.ts` 790L: harvest → zones → shapes → verdicts → setups → draw → execute) plus `tv-controller.ts` 420L (CDP `:3690` drawing) plus `mt5-controller.ts` 307L (python3 ZMQ REQ → `ipc:///tmp/plutus-mt5.sock` → RPyC `:2222`) plus `vlm-analyzer.ts` 412L (MiMo v2.5 judge), and a Bun tmux orchestrator (`orchestrator/orchestrator.ts` 563L driving container `plutus-fang-sidecar-agent` via `docker exec tmux capture-pane|load-buffer|paste-buffer|send-keys` through 7 phases on a 60s tick), plus a Rust `plutus-fang-binary` 52.7MB on `:4200` feeding the AGENT tab, plus a standalone TV MCP (`TV_Browser_v3.0/src/index.ts` 1405L, 38 tools, stdio → raw CDP `127.0.0.1:9333`, `DISPLAY=:1`, single-tab, base64 screenshots). Ports in play: `3690/9420/9430/9431/5900/6080` with hard law `PORT_DISCIPLINE.md` forbidding `--network host` and naming `6930/9223/5901/9222/630X` foreign. Spec drift is live: every spec says CDP `:6930`, every code path says `:3690`.
2. Orca already owns the three runtimes Plutus re-implements: a production Electron shell (Electron 43.7, React 19, xterm WebGL, node-pty 1.1.0, `out/cli/index.js` + `orca-dev` bins, `agent-browser 0.27.0` dep) with a running local runtime verified this session (`orca status --json`: app running pid 445384, runtime ready `7ef632f6-12d5-424c-8b15-b6ad0f8677e0`, `ws://0.0.0.0:6768`, appVersion `1.4.201`), a per-worktree Chromium browser with profiles + snapshot-interact-re-snapshot CLI loop + Design Mode click-to-prompt + Computer Use a11y sidecars, real git worktrees with metadata + shared-dirs + `.worktreeinclude`, any-CLI-agent PTY runner with OSC/hooks status, and a Run/Task/Dispatch orchestration store (`orchestration.db`) with `run-create/run-use/send/check/reply/inbox/task-create/task-list/task-update/dispatch/ask/gate-create/gate-resolve` verbs. License is MIT (Lovecast Inc 2026) — fork-clean. Stack is TypeScript + pnpm single-project (`mobile/` + `cloud/` independent).
3. The migration is therefore a RE-HOMING, not a rewrite: kill the duplicate Electron shell, the duplicate Chrome lifecycle, and the duplicate tmux driver; keep the Plutus law (engines, MPSE battery, JESL gates, golden oracles, pipeline semantics, drawing knowledge) and re-home it onto Orca services. The 5.0 MiMoCode harness plan (`MIMOCODE/Plutus/PLUTUS_5.0_MIMOCODE_ARCHITECTURE_SPEC.md` 361L + Full Build Plan 239L) is SUPERSEDED in hosting but PRESERVED in law — engines, kernel, battery, and gate semantics cross unchanged; only the `.mimocode/` runtime layer is replaced by Orca-native surfaces.

## §2 CORE INSIGHT

Orca already owns ~70% of what Plutus built by hand: window management, worktree isolation, agent PTYs, browser tabs with cookies, screenshot/vision loop, orchestration mailbox, skills, automations, mobile/remote, headless serve. Plutus owns the 30% Orca will never build: E1/E2/E3 trading law, LMV/OBCV vision, MPSE/JESL gates, golden-23 oracles, TradingView drawing mechanics, MT5 execution, the 23-trade weekly lifecycle. The fork keeps every line of the 30% and deletes every line of the 70% that duplicates Orca. Sequence by dependency: fork → browser-bridge → sidecar-rehome → panels → harness → converge. Never panels-before-bridge (draw calls have nowhere to land); never harness-before-sidecar (phases call engines that are not yet reachable); never converge-before-gates (a green week without JESL receipts is theater).

```
┌──────────────────────────────────────────────┐
│ F0 FORK      clone + pnpm + dev + build      │
│ GATE: orca status ready · tc 0 · CLI live    │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ F1 BROWSER   TV 38 tools → orca verbs        │
│ GATE: draw + screenshot + eval on TV chart   │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ F2 SIDECAR   Bun :9420 → orca-managed svc    │
│ GATE: 7 pipeline routes reachable in place   │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ F3 PANELS    Electron → plugin panels+worker │
│ GATE: 5 tabs render from live sidecar        │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ F4 HARNESS   tmux → Run/Task/Dispatch+gates  │
│ GATE: full week driven by orchestration      │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ F5 CONVERGE  23±3p · ×2 · headless · cleanup │
│ GATE: acceptance + receipts + zero regress   │
└──────────────────────────────────────────────┘
```

## §3 SOURCE INVENTORY (measured, read-only)

### 3A PLUTUS_DASHBOARD — the thing being re-homed

| File | Lines | Role |
|---|---|---|
| `specs/MISSION_CONTROL_SPEC.md` | 3679 | 4 tabs DATA/AGENT/TRADE/BROWSER, Electron + Express `:9430` + WS `:9431` + CDP `:6930` spec-stale + fang `:4200`, `DISPLAY :2`, Weston+Chrome child model, chat/tracker |
| `specs/DASHBOARD_SPEC.md` | 1074 | UI FROZEN v1.0.0; Electron ^28 + SvelteKit ^2 spec vs actual vanilla-JS renderer; push-only Merkle viewer; forbids trade execution in dashboard |
| `specs/PLUTUS_SIDECAR_SPEC.md` | 511 | Bun `:9420`, 5-tool pipeline, TV CDP drawing, MT5 ZMQ, MiMo VLM; spec `:6930` STALE vs code `:3690` |
| `specs/OPENCODE_BRIDGE_SPEC.md` | 1203 | OF-Poseidon intent ↔ opencode engineering filesystem protocol `~/.plutus-dashboard/improvement-requests/PLAN-*.md`, 13-phase god loop, `.ready` sentinel |
| `specs/DASHBOARD_API_SPEC.md` | 1308 | Express `127.0.0.1:9430`, Bearer 3-scope, 100req/min, `Result<T>`; routers trades/agents/poseidon/split-tests/backtests/health/funded |
| `specs/DASHBOARD_DB_SPEC.md` | 1221 | single `~/.plutus-dashboard/data.db`, WAL+NORMAL, 8 tables, better-sqlite3 sync, SHA-256 Merkle chain, prepared catalog |
| `plutus-sidecar/server.ts` | 570 | `PORT=9420`; pipeline + CDP proxy + MT5 proxy + fang proxy + static renderer fallback |
| `plutus-sidecar/tv-controller.ts` | 420 | `CDP_HOST 127.0.0.1`, `CDP_PORT env||3690`; connect/discoverTab/WS/click/drag/navigate/switchPair (OANDA:) / setTimeframe / findPriceY via `_exposed_chartWidgetCollection` / drawRectangle-Long-Short-HLine-TrendLine / screenshot / drawZone / drawSetup |
| `plutus-sidecar/pipeline-handler.ts` | 790 | PAIRS DXY/EURUSD/GBPUSD/AUDUSD, TF 4H/1H/30m/15m; startRun/harvest (`tv_fetch_ohlc.py`)/computeZones (9-pillar+4H-SD+LQZ)/computeShapes (ShapeBrain)/analyzeCharts (screenshot+VLM)/generateSetups (VisualSetupGenerator)/drawZones/executeTrades (dryRun default true)/runFullPipeline; logs to `:9430/api/v1/trades` |
| `plutus-sidecar/mt5-controller.ts` | 307 | ZMQ REQ shim `python3 -c` → `ipc:///tmp/plutus-mt5.sock`; SYMBOL_MAP EURUSD→EURUSD+; placeLimitOrder/getPositions/getAccountInfo/closePosition/health; DASHBOARD_API `http://localhost:9430/api/v1/trades` |
| `plutus-sidecar/vlm-analyzer.ts` | 412 | `https://opencode.ai/zen/go/v1/chat/completions` model mimo-v2.5; `ZONE|VALID|pair|type|ceil|floor|conf` + setup JSON validator |
| `orchestrator/orchestrator.ts` | 563 | CONTAINER `plutus-fang-sidecar-agent`, TMUX opencode, HEARTBEAT 60s, STALL 3 hashes, 7 phases harvest→zones→shapes→verdicts→setups→draw→execute; `docker exec tmux capture-pane|load-buffer|paste-buffer|send-keys`; breaker 10 errors |
| `dashboard/electron/main.js` | 530 | BrowserWindow 1440x900 webviewTag+preload; serves build||renderer||placeholder; starts api `:9430` + websocket `:9431`; IPC tab:switch, tv-input/tv:navigate/tv:switch-pair/tv:screenshot/tv:evaluate/tv:set-viewport/tv:back-forward-reload; E2E `PLUTUS_CAPTURE_DIR` hook |
| `dashboard/electron/preload.js` | 249 | contextBridge `window.plutus` {dashboardConfig, tvBridge(onFrame/sendInput/navigate/screenshot), agentChat(getState/sendMessage), mt5Bridge} + `API_BASE http://127.0.0.1:9430` + WS `ws://127.0.0.1:9431`; tokens `rw_dev_*` from `~/.plutus-dashboard/config.json` |
| `dashboard/electron/cdp/cdp-bridge.js` | 453 | Weston `DISPLAY :2` + ChromeManager cdpPort env||3690; NO local fallback (removed 2026-08-01); WS-close `_reconnectStream`; screencast 1280x720 + popup-killer CSS + pane-matched `Emulation.setDeviceMetricsOverride` + batched insertText |
| `dashboard/electron/cdp/cdp-client.js` | 304 | CDP WS client screencast/frames/input dispatch; module.exports fix for infinite-connecting |
| `dashboard/electron/cdp/chrome-manager.js` | 193 | display `:2`, cdpPort 3690, userDataDir `dashboard/tv-browser-profile` mounted persistent, `--app` TV URL + `--remote-debugging-port` + `--ozone-platform=x11` |
| `dashboard/electron/cdp/weston-manager.js` | 192 | display `:2` 1920x1080 headless+xwayland |
| `dashboard/electron/server/api.js` | 1216 | HOST `127.0.0.1` PORT 9430; zod `Result<T>`; trades/agents/poseidon/split-tests/backtests/funded/integrity/of/mt5/tv routes |
| `dashboard/electron/server/db.js` | 1079 | better-sqlite3 singleton `~/.plutus-dashboard/data.db` WAL; 8 tables + Merkle insert |
| `dashboard/electron/server/websocket.js` | 173 | `127.0.0.1:9431`; NEW_TRADE/POSEIDON_UPDATE/SPLIT_TEST_UPDATE/TRADE_UPDATE; token query-param auth |
| `dashboard/electron/server/of-integration.js` | 133 | http `127.0.0.1:4200` `/api/hands|/hands/:id|/hands/:id/control|/api/health` 5s timeout |
| `dashboard/electron/server/merkle.js` | 164 | SHA-256 canonicalize+stripChainFields+GENESIS_HASH |
| `dashboard/renderer/app.js` | 2257 | CONFIG `API_BASE http://localhost:9420/api/v1` sidecar proxy (not 9430) + WS `:9431`; pages live_funded/live_demo/backtest/overview/analytics/poseidon/split-tests/agents |
| `dashboard/renderer/trade-canvas.js` | 597 | TARGET_FPS 90, 1280x720, SYMBOL_MAP OANDA:+TVC:DXY; letterbox-aware toCanvasCoords; forward click/mousemove/drag/scroll/keypress/contextmenu |
| `dashboard/renderer/trade-chat.js` | 477 | FANG_CHAT_URL `http://127.0.0.1:4200/api/chat`; IPC `window.plutus.agentChat` preferred, HTTP+SSE fallback; 200-msg cap, 5-min watchdog |
| `dashboard/renderer/trade-tracker.js` | 457 | WS NEW_TRADE/TRADE_UPDATE strip; 20 rows, 3s closed-fade |
| `dashboard/renderer/index.html` | 155 | 5-tab shell DATA/AGENT/TRADE/BROWSER(WEB RESEARCH)/MT5; trade control bar tv-back-forward-reload + tv-pair EURUSD/GBPUSD/AUDUSD/DXY |
| `dashboard/renderer/tab-manager.js` | 153 | TABS data/agent/trade/browser/mt5, lazy init, Ctrl+1..5, persist |
| `dashboard/renderer/mt5-tab.js` | 342 | 5s poll account+positions; PAIRS EURUSD+/GBPUSD+/AUDUSD+; market buy/sell + close form |
| `dashboard/renderer/browser-tab.js` | 180 | research webview persist:browser partition forexfactory default; back/fwd/reload/home + URL + GO |
| `dashboard/renderer/trade-tab.js` | 90 | lazy mount TradeCanvas+Tracker+Chat on first TRADE activation; 2s status poll |
| `dashboard/renderer/agent-tab.js` | 60 | `:4200` health every 30s |
| `dashboard/start-mission-control.sh` | — | Weston `:0` check + fang-binary `:4200` check + `electron .` (`--disable-dev-shm-usage`, container adds `--no-sandbox --disable-gpu`) |
| `dashboard/test-cdp-3690.js` | — | GET `:3690/json/list` → Runtime.evaluate `_exposed_chartWidgetCollection` symbol check; 10s frozen detector |
| `dashboard/e2e-final.js` | 143 | 6-test UI gate; 4 tabs/4 panels/8 globals/8 nav + tab switching + fang reachable + trade canvas + browser placeholder (targets Electron CDP `:9333/:9444/:9222`) |
| `context_management/PORT_DISCIPLINE.md` | — | hard port law; project `3690/9420/9430/9431/5900/6080`; forbids `--network host`; foreign `6930/9223/5901/9222/630X` |
| `context_management/CURRENT_STATE.md` | — | verified 2026-07-31; containers display-plutus-dash + plutus-mt5, Wave A/C DONE, B READY, E pending |
| `plutus-fang-binary` | 52.7MB | Rust AgentOS on `:4200` feeding AGENT tab webview + trade-chat |

Stack: Electron ^28 shell, DATA SPA vanilla-JS IIFEs (SvelteKit spec never landed — `dashboard/src` EMPTY GAP), Express ^4+zod, `ws` ^8 push, better-sqlite3 ^11, Bun ESM sidecar, in-process v4.5.2 engines, MiMo VLM, python3 ZMQ + RPyC `:2222` (plutus-mt5 Xvfb:99 Wine login), yfinance OHLC, plutus-fang Rust. Eight-step dataflow: harvest (`tv_fetch_ohlc.py` 4 pairs × 4 TF) → zones (9-pillar+4H-SD+LQZ) → shapes (ShapeBrain+ladder+MDVE) → verdicts (TVController screenshot + VLM `ZONE|VALID`) → setups (VisualSetupGenerator → DATA) → draw (TVController drawZone/drawSetup flyout+priceY) → execute (MT5Controller dryRun-true default → `:9430/api/v1/trades` → WS NEW_TRADE) → drive (orchestrator 60s capture-pane idle|working|stalled → next/nudge/restart; operator steers via AGENT webview + trade-chat `:4200/api/chat`).

### 3B TV_BROWSER_V3.0 — the MCP being absorbed

`src/index.ts` 1405L. Manifest `package.json` 431B: name `trident-brain` 1.0.0 (stale vs server `tv-browser 3.0.0` at `:1093-1094` vs README v3.0 vs install banner v2.0), deps only `@opencode-ai/plugin` + typescript — does NOT declare `ws` or `@modelcontextprotocol/sdk` that src imports (GAP). Installer `install.sh`: copy dist+src to `~/.config/opencode/mcp/tv-browser`, `npm install`, `tsc`, register `mcp.tv-browser={type:local, command:[node, INSTALL_DIR/dist/index.js], enabled:true, environment:{}, timeout:600000}` into `opencode.json` with `chattr -i/+i` (not portable to Orca — GAP).

38 tools verbatim (`src/index.ts:1098-1229` + `:1076-1086`): Browser Control 6 — `tv_browser_desktop` (launch/attach desktop Chrome, optional navigate, no_focus), `tv_browser_container` (spawn/start persistent container browser, suffix+port+url), `tv_screenshot` (PNG base64), `tv_reset` (undo + deselect + screenshot), `tv_get_state` (url/title/viewport), `tv_navigate` (Page.navigate + 3s sleep). Input 7 — `tv_click {x,y}`, `tv_double_click`, `tv_right_click`, `tv_drag {from_x,from_y,to_x,to_y}`, `tv_scroll {x,y,direction:in|out,steps}`, `tv_type {text}`, `tv_press_key {key}`. High-level 1 — `tv_value_overwrite {x,y,new_value}` (dblclick select-all + insertText). Drawing 6 — `tv_draw_long_position {entry_x,entry_y,target_y}`, `tv_draw_short_position`, `tv_draw_fib_retracement {x1,y1,x2,y2}`, `tv_draw_rectangle`, `tv_draw_trend_line`, `tv_draw_horizontal_line` (all openFlyout+selectTool+1-2 clicks). Settings 1 — `tv_open_drawing_settings {x,y}` (right-click, Clone-verify, Settings, Coordinates tab, returns values). Chart nav 8 — `tv_zoom {direction,steps}` (hardcoded 600,400 scroll), `tv_canvas_pan {bars,pixels,price,time,vPixels,steps}`, `tv_canvas_zoom {direction,steps,atPrice,atTime,at}`, `tv_set_timeframe {1m/5m/15m/30m/1h/4h/1D/1W}`, `tv_get_view`, `tv_find_empty_area`, `tv_navigate_to {intent:{kind:look_left|look_right|zoom_to_macro|zoom_to_micro|reset|go_to_latest,bars,steps,price,time,elementId}}`, `tv_find_element` (screenshot-to-file helper). Refine 1 — `tv_refine_element_coordinates {x,y}`. Price mapping 2 — `tv_find_price_y {price}`, `tv_find_y_price {y}` (priceScale priceToCoordinate/coordinateToPrice). Low-level 3 — `tv_open_flyout {trend-line|gann-and-fibonacci|patterns|prediction-and-measurement|geometric-shapes|annotation}`, `tv_select_tool {name}`, `tv_evaluate {js}`. API drawings 3 — `tv_list_drawings`, `tv_select_drawing {drawing_id}`, `tv_open_drawing_settings_by_id {drawing_id}` (via `window._exposed_chartWidgetCollection.activeChartWidget._value.model().orderedDataSources()`). DOC DRIFT: README/VALIDATED_PROCESSES name `tv_launch/tv_surgical_edit/tv_get_coordinates/tv_set_coordinate/tv_center_on/tv_adjust_anchor/tv_pan` — NONE exist in code; code-new `tv_browser_desktop/container/tv_zoom/tv_refine_element_coordinates/tv_list_drawings/tv_select_drawing/tv_open_drawing_settings_by_id` have no README row.

Transport: agent→plugin MCP JSON-RPC 2.0 stdio newline-delimited (StdioServerTransport, `:1401`, ListTools+CallTool `:1231-1392`); plugin→Chrome HTTP GET `/json` (`http://127.0.0.1:9333/json` `:72`, parameterized `:119`); drive raw CDP over `ws` (webSocketDebuggerUrl `:91-94`, single global `ws :64`); CDP methods `Input.dispatchMouseEvent` `:215`, `dispatchKeyEvent` keyDown+keyUp `:298-299`, `insertText :269`, `Runtime.evaluate` returnByValue+awaitPromise+allowUnsafeEvalBlocking `:304`, `Page.captureScreenshot` png `:310`, `Page.enable+Page.navigate :775-776,1250,1305,1334`; NO Target/Browser/Fetch/Storage/Network domains. Liveness `execSync curl http://127.0.0.1:9333/json/version :173`, container poll 30×1s. Timeouts: discovery 3s `:85`, WS 5s `:109/:152`, per-call 15s `:166`, client 30s, opencode 600000.

Lifecycle desktop (`:1245-1253` → ensureChrome `:192` + connectCDP `:89`): chromeAlive curl; findChrome tries google-chrome/stable, chromium/-browser, /usr/bin/*, puppeteer linux-149.0.7827.22, playwright chromium-1223 (`:176-190`); mkdir USER_DATA_DIR; spawn detached+unref env `DISPLAY=:1` (`:207`); poll 30×500ms. Flags verbatim (`:196-206`): `--no-sandbox --disable-gpu --disable-dev-shm-usage --ozone-platform=x11 --disable-popup-blocking --user-data-dir --window-size=1704,1065 --window-position=1920,0 --remote-debugging-port=9333 --remote-debugging-address=0.0.0.0 --remote-allow-origins=* --no-first-run --no-default-browser-check --disable-features=Translate --disable-background-timer-throttling --disable-backgrounding-occluded-windows --keep-alive-for-test --disable-component-extensions-with-background-pages`. Container (`:1255-1310`): volume `plutus-browser` inspect-or-create; name `plutus-browser-container_` + suffix; `docker run -d --name N --network host --init -v plutus-browser:/tmp/tv-browser-profile plutus-container-testing:master bash -c '/root/start-plutus.sh && sleep infinity'` (120s) + 25s sleep; start + 25s if stopped; poll `:port/json/version` 30×; then ensureChrome()+connectCDP() — does NOT call connectCDPToPort (GAP-2: port/suffix cosmetic). Profile: `USER_DATA_DIR = $PLUTUS_PROJECT_DIR/container_data/profiles/desktop` else `/tmp/tv-browser-profile` (`:22-24`); cookies implicit via user-data-dir; NO cookie APIs. Tab model SINGLE-TAB: globals `ws + currentTabId :64-65`, discoverTab first `type==='page'` wins (`:70-87`), no URL/title match, no Target domain, no multiplexing; `currentTabId` stored never routed; NO tabId/targetId input on any tool; `connectCDPToPort :113-154` DEAD CODE zero callsites. Screenshot: `Page.captureScreenshot{format:png}` → base64 (`:309-312`); `tv_screenshot` returns `{image_base64}` INLINE (`:1311`); `tv_reset` appends image+state (`:1330`); ONLY server file write `findElement → /tmp/tv-element-search.png` (`:1062-1070`); dense-chart fallback throws FIND_EMPTY_AREA_FAILED telling agent to screenshot + omni_vision (`:~860`). TV internals: `TV_MODEL_PATH window._exposed_chartWidgetCollection...`, `mainSeries().priceScale().priceToCoordinate/coordinateToPrice`, `timeScale().visibleBarsStrictRange/barSpacing/timeToCoordinate/coordinateToIndex/scrollToBar/scrollToRealtime`, `orderedDataSources/getPoint/pointsCount/id/title/selection/showChartPropertiesForSource`, DOM `[aria-label]` flyout arrows (FLYOUT_GROUPS coords), `[class*=chart-container]`, `[class*=price-axis-container]` (unlockYAxis 5px drag), `input[name=y-input|x-input]`, `button[class*=underline-tab]` Coordinates, Undo aria-label. Timings `T_PRESS_RELEASE 0.1 / HOVER 0.5 / FLYOUT_OPEN 0.8 / TOOL_SELECT 1.0 / ANCHOR_1_TO_2 1.0 / AFTER_LAST_ANCHOR 1.5` (`:33-38`), pan 24 steps/10ms, zoom 100 deltaY/step, probe 50px 12-grid.

14-item parameterize list for Orca (TvExtractor §e): `DISPLAY=:1 :20`, `CDP_PORT=9333 :21` + `CHROME_HOST :30`, `USER_DATA_DIR :24` + mount `:1279` + `PLUTUS_PROJECT_DIR :22-23`, `WINDOW_SIZE :25` + `POSITION :26` second-monitor geometry, `BROWSER_VOLUME/CONTAINER_NAME/IMAGE_NAME/entry/docker run --network host --init :27-29,:1278,:1281`, findChrome absolute cache paths `:176-190`, curl dep `:173`, `/tmp/tv-element-search.png :1063`, hardcoded UI pixels (FLYOUT arrows 47/105..295, 25%-from-left, x>50&&y>50, 80px exclusion, 3×4 pcts, zoom center 600,400, reset 600,400, 50px probe, 5px unlock), timing constants + 3000ms/25s/15s/5s/3s, TV URL regex + TIMEFRAME_BUTTONS, server name `tv-browser 3.0.0 :1093-1094` + opencode key/timeout, stale `trident-brain` + missing deps, description `6930 :1107` vs code `9333 :1258` — one canonical Orca CDP story required.

### 3C ORCA — the host being forked

Repo `https://github.com/stablyai/orca` (68k stars, 4478 forks, MIT Lovecast Inc 2026 — fork-clean). `package.json`: orca `1.4.197` (local runtime `1.4.201` — drift noted), bins `out/cli/index.js` + `orca-dev`, `agent-browser 0.27.0`, electron 43.7.0, TS + electron-vite 5 + React 19 + TipTap/Monaco/xterm 6.1-beta + Tailwind/shadcn + node-pty 1.1.0 patched + ssh2 + zod 4.5 + ws 8 + pnpm single-project (`mobile/` + `cloud/` independent). Scripts: `pnpm dev`, `build:desktop = typecheck+relay+cli+electron-vite+skills+web`, `build = desktop+native`, gates lint + tc + test + build, releases via Actions Cut Release only. `orca.yaml` recipe pattern (scripts.setup + environmentRecipes), `headless-linux-server.md` (Xvfb, AppImage extract, serve flags, ready JSON, systemd), `AGENTS.md` build rules, `CONTRIBUTING.md` contract.

Subsystems (`OrcaExtractor §a`): App shell `src/main/*` + `src/renderer/src/*` + `src/preload/` + `src/shared/` + `config/electron-builder.config.cjs`. CLI `src/cli/specs/*` + `src/cli/handlers/*` + `src/cli/runtime/*` + `bundled-skill-guides.ts` 290KB generated; specs declare, handlers run via runtime client over unix-sock + WS `6768`. Worktrees `src/main/*worktree*` + `local-worktree-*.ts` + `orca-runtime-create-managed-worktree.ts` + `handlers/worktree.ts` + `src/shared/new-workspace/` — real git worktree + branch + per-worktree terminals/editor/browser, project grouping, parent/child lineage, shared-dirs + `.worktreeinclude`. Agent runner `src/main/runtime/agent-session-*.ts` + `orca-runtime-create-agent-session.ts` + `src/main/agent-hooks/` + `native-chat/` + `usage/` + `src/shared/agent-*.ts` + `src/main/providers/` + `claude/codex/pi/mimo/opencode/grok/gemini/cursor/copilot/droid` — any CLI agent in PTY, OSC+hooks status, full-autonomy flags, Chat UI + Dashboard experimental, session-history resume. Browser embedded `src/main/browser/*` 521 files (`browser-manager-*`, `browser-client-page-*`, cookie-import*, network-tunnel-*, `agent-browser-bridge-*`, grab-*) + `src/cli/handlers/browser-*.ts` — per-worktree Chromium pane (address/history/devtools/profiles), Design Mode, CLI snapshot loop, CDP emulation, `agent-browser 0.27.0`. Computer Use `src/main/computer/*` + `handlers/computer.ts` — native a11y trees + screenshots, NOT embedded browser. Orchestration `src/main/runtime/orchestration/*` + `handlers/orchestration*.ts` + `specs/orchestration*.ts` — Run/Task/Dispatch/messages/decision gates, `orchestration.db`, federated `--on`, worker_done/heartbeat authority. Mobile/remote `mobile/` + `cloud/` + `src/main/runtime/device-registry.ts` + `mobile-*` + `src/main/ssh/` + `src/main/server/` + `native/` — companion iOS/TestFlight + Android APK 0.0.48, Remote Server Tailscale/`serve`, SSH worktrees, Cloud VM BYO, relay. Review/integrations `src/main/github|linear|jira|gitlab|bitbucket|azure-devops|gitea|artifacts|automations|skills/*`. Plugins experimental `src/main/plugins/*` ~80 files + `src/shared/plugins/*` — `orca-plugin.json` workers + panels + commands + events + lang + keybindings + vmRecipes + agent profiles, consent capabilities, git marketplace + kill-list + hash gates. No `/docs/plugins` page (404) — Settings > Plugins only.

CLI verbs (all `--json`, selectors `--worktree/--repo/--host/--environment`, live-verified `orca --help` this session): open/serve/status, repo list|add/show/set-base-ref/search-refs, worktree list|show|current|create/set/rm/ps, terminal list|show|read/send/wait/create/split/switch/rename/close, file open/diff/open-changed, `goto/snapshot/click --element @eN/fill/type/select/scroll/back/reload/eval --expression/wait/check/uncheck/focus/clear/select-all/keypress/hover/drag/upload/screenshot/full-screenshot/pdf/tab list|show|current|switch|create|close/tab profile list|create|delete|set|show|use-default|clone/exec --command/capture/console/network/set device` (`browser-basic.ts` verbatim), `computer capabilities|permissions|list-apps|list-windows|get-app-state|click|perform-secondary-action|scroll|drag|type-text|press-key|hotkey|paste-text|set-value` (`computer.ts`), `orchestration run-create|run-use|run-current|run-list|run-show|send|check|reply|inbox|task-create|task-list|task-update|dispatch|request-show|dispatch-show|ask|gate-create|gate-resolve|gate-list|reset` + worker-start/show/read/stop/release/retain (`orchestration.ts` verbatim), skills list|get|install|update|installed|share (local, no runtime), account list|add, artifacts share|update|unshare|list|delete (opt-in html/md 10MiB), automations list|show|create/edit/run/runs/remove, environment add|list|rm, linear issue|search|list|team|project|comment|attach|create, emulator iOS list|attach|tap|type|gesture|button|rotate|exec|kill (Android via adb).

Browser capabilities: per-worktree Chromium pane, tabs filtered/restored per worktree, profiles = isolated partitions (cookie/UA/viewport seed, Chrome/Edge import, Google excluded), remote This-device vs Server-streamed, SSH browse-through-host, link-routing, downloads shelf, HTML Share-as-artifact. CDP under hood (viewport emulation, hidden-renderer CDP screenshots, agent-browser dep); raw CDP endpoint NOT public — agent path is CLI snapshot loop + `exec` passthrough (GAP). Design Mode (`/docs/browser/design-mode`): toggle → hover highlights → click drops HTML + neighborhood + computed CSS + cropped screenshot + source file/line (if sourcemap) into agent chat; annotation tray multi-note Edit/Save/Cancel; loop edit → hot-reload → verify. Computer Use (`/docs/cli/computer-use`): `orca computer` over a11y treeText + screenshot-to-disk, semantic element-index preferred over coords, stdin secret flags, Accessibility (+Screen Recording macOS) perms. Agent loop is always snapshot → act → re-snapshot; refs `@eN` stale after nav/click/switch.

Extension contracts: Skills stable — any repo `skills/<name>/SKILL.md` via `npx skills add <URL> --skill <name>`; 8 shipped (orca-cli, orchestration, computer-use, orca-linear, orca-emulator, orca-emulator-android, orca-per-workspace-env); thin hybrid stub resolves `ORCA_CLI_COMMAND|orca-dev|orca-ide|orca` then `skills get <topic> [--full|--reference]`; discovery scans Claude/Codex/Agent-Skills/OMP `~/.omp/agent/skills` / `.agents/skills`; impl `src/main/skills/*` + `bundled-skill-guides.ts` + `skill-guides/` + `skill-stubs/`. Plugins EXPERIMENTAL — `orca-plugin.json` manifestVersion:1, `publisher.id` dirname, semver, `engines.orca >=x.y.z`, `pluginApi:1`, main worker, contributes panels≤64/commands≤256/events 3 (`worktree.created|worktree.removed|agent.status.changed`)/lang≤16/keybindings≤256/vmRecipes≤64/agents≤64, capabilities≤32 (`plugin-manifest.ts` verbatim). Capabilities v0 closed 7: `workspace:read, terminal:send (explicit terminalId only), notifications:show, storage (256KB/val, 5MB total, 1024 keys), secrets (64KB vault), events:subscribe, settings:own` (`plugin-capabilities.ts`). Host API v0 13 methods (`plugin-host-api.ts` verbatim): `workspace.readContext | terminal.sendText | notifications.show | storage.get|set|delete|keys | secrets.get|set|delete | settings.get|set | events.subscribe`; zod params+result, scope, mutation audit `plugin:<id>`; panels call panel:true subset over postMessage, workers all; consent fingerprint; per-plugin enable; workers local-only. Content packs: languagePack/keybinding/vmRecipe/agentProfile (`plugin-content-pack-contributions.ts`). Env recipes: `orca.yaml` worktree.sharedDirectories + environmentRecipes (PRIMARY checkout only) + lifecycle scripts + `.worktreeinclude` literal-copy + Settings Shared Paths (APFS clone macOS else symlink) + `vm recipe doctor`. MCP surface: Settings > Integrations > MCP, tools surface in MCP-capable CLIs (authoring schema GAP).

Config/state + fork entry: binary `~/.local/bin/orca` exec `/opt/Orca/resources/bin/orca-ide` (`out/cli/index.js`; dev `orca-dev.mjs`); userData `~/.config/orca/`: `orca-runtime.json` (runtimeId/pid/unix sock/websocket `ws://0.0.0.0:6768`/authToken), `orchestration.db[.wal/.shm]`, `profiles/local-default/`, `agent-hooks/endpoint.env`, `agent-sessions/`, `terminal-history/<hash>/`, `Partitions/orca-browser/`, Cookies, Local Storage/leveldb, `logs/main.trace.ndjson` + `daemon.log`, `daemon/daemon-v36.token/.pid`, devices/e2ee/session-authority/profile-index/stats/codex-home/vault/mobile-dismissals/speech/shell-wrappers/opencode-hooks/shim/Singleton/Preferences/Caches. Home `~/.orca/` hook shims + `keybindings.json`, `~/.ssh/config` (GSSAPI/FIDO2), agent stores `~/.codex/sessions`, `~/.claude`, opencode.db (Orca read-only). Repo `orca.yaml` + `.worktreeinclude` + `.claude/` + `.codex/` + CLAUDE.md/AGENTS.md. Network WS 6768, `serve --port/--pairing-address/--mobile-pairing`, `orca://pair?code=`, Tailscale 100.x preferred, never public-expose. Fork: clone, `pnpm install` (+`install:release` pre-cross-arch), `pnpm dev`, gates lint + tc + test + build (`build:desktop` = typecheck+relay+cli+electron-vite+skills+web; `build` = desktop+native). Harness lands: (1) `skills/<name>/SKILL.md` + `src/cli/specs|handlers/<domain>.ts` + regen bundled guides; (2) dashboard panel = experimental plugin (panels+commands+`workspace:read/terminal:send/events:subscribe`) under `src/main+shared/plugins`; (3) browser tools = `src/main/browser/*` + `handlers/browser-*.ts` + Design-Mode bridge; (4) env = `orca.yaml` recipes + `src/main/skills` pipeline. Live this session: `orca status` ready, `worktree ps` Shared_Worktree_Orca `orca-migration` in-progress 2 terminals (omp agents), `terminal list` 5 PTYs.

## §4 THESIS ADJUDICATION — DIRECT / ADAPTER / DROP

| Plutus capability | Orca native | Verdict | Mechanism |
|---|---|---|---|
| Headed agent runs in CLI terminal | any CLI agent in PTY + OSC/hooks + `terminal create/read/send/wait` | DIRECT | `orca terminal create --worktree path:<fork> --command "bun run plutus"`; no tmux needed |
| 7-phase orchestration driver | Run/Task/Dispatch/send/check/gates + worker verbs | DIRECT with rename | tmux capture-pane → `terminal read`; paste-buffer/send-keys → `terminal send`; 60s tick → automation cron or Run loop; STALL-3-hashes → gate + heartbeat |
| Chart render + interact (operator tested) | per-worktree Chromium + `goto/snapshot/screenshot/eval/tab` + profiles | DIRECT | TradingView URL in Orca tab; `snapshot` → refs; `screenshot` → vision; `eval` runs `_exposed_chartWidgetCollection` verbatim |
| TV input primitives click/drag/scroll/type/press | `click/fill/type/select/scroll/keypress/hover/drag/upload` on `@eN` refs | ADAPTER | TV uses pixel `{x,y}`; Orca uses refs. Adapter resolves coords→ref via `eval document.elementFromPoint(x,y)` or Design-Mode anchor, then acts. Canvas-internal drags use `exec` coordinate passthrough |
| TV drawing 6 tools + fib + settings | NO native TV drawing kinds | ADAPTER | Re-implement as `exec` sequences: `eval` openFlyout+selectTool (FLYOUT_GROUPS coords from TV extractor) + `exec` coordinate click/drag + `eval` orderedDataSources verify + `screenshot` confirm. Keep `tv-controller.ts` drawing math; replace CDP send with Orca verbs |
| Price↔Y mapping | `eval` arbitrary JS in page context | DIRECT | `tv_find_price_y / tv_find_y_price` bodies move verbatim into `orca eval --expression "mainSeries().priceScale().priceToCoordinate(...)"` |
| `tv_list_drawings/select/open_settings_by_id` | `eval` same TV internals | DIRECT | `orderedDataSources()` calls preserved; only transport changes from raw WS to `orca eval` |
| Screenshot vision path | `screenshot/full-screenshot` to file + Design Mode crop | ADAPTER | TV returns inline base64 per call (150-200KB JSON); Orca writes file. VLM `read()`s file or Design-Mode attachment instead of parsing MCP text JSON. Update `vlm-analyzer.ts` input + `findElement /tmp/tv-element-search.png` → Orca artifact path |
| Multi-tab N symbols × TFs | `tab create/switch/list/close` + `tab profile create/set/clone` per symbol | DIRECT, superset | TV single-tab global WS (GAP-4) is the thing being fixed. Orca gives real `tabId→symbol` map the manager spec wanted: one tab per DXY/EU/GU/AUD × TF, profile `plutus-trading` persistent |
| Cookies long-horizon | tab profiles isolated partitions + Chrome/Edge import | DIRECT | `tab profile create --label plutus-trading --scope isolated`; `set/clone/use-default`; replaces user-data-dir + `plutus-browser` volume + chattr installer |
| Electron DATA/AGENT/TRADE/BROWSER/MT5 tabs | plugin panels ≤64 + commands ≤256 | ADAPTER | `renderer/*.js` (app 2257L + canvas 597L + chat 477L + tracker 457L + mt5 342L + tab-manager 153L) → sandboxed panel HTML entries + worker. `main.js` 530L + `api.js` 1216L + `db.js` 1079L + `websocket.js` 173L + `cdp-*.js` 950L + `chrome-manager.js` + `weston-manager.js` DIE — Orca owns shell/compositor/Chrome |
| Express `:9430` 7 routers + `Result<T>` + Bearer 3-scope | Host API v0 has NO HTTP/fetch | ADAPTER | API collapses: trade reads → sidecar internal + orchestration Task store; control writes → `terminal.sendText` → sidecar CLI; panels call worker, worker calls sidecar over localhost (workers are NOT sandboxed panels — full node). Never expose `:9430` publicly in fork |
| SQLite Merkle `data.db` 8 tables + `merkle.js` | plugin storage 256KB/val 5MB total 1024 keys — TOO SMALL | ADAPTER | Keep SQLite in sidecar (`~/.plutus-orca/data.db`, WAL, better-sqlite3 or bun:sqlite). Plugin storage holds ONLY UI prefs (active tab, selected pair). Merkle chain preserved in sidecar `db.js` port |
| WS `:9431` NEW_TRADE/TRADE_UPDATE/POSEIDON_UPDATE | `orchestration send/check` + `events.subscribe(worktree.created|removed|agent.status.changed)` + notifications | ADAPTER | Trade push → `orchestration send --type status --payload` + panel poll worker; desktop toast → `notifications.show`. Do not run a second WS server on 9431 in fork |
| CDP bridge screencast → canvas drawImage + input forward | Orca streams its own tabs; `screenshot` + `eval` + Design Mode | DROP the bridge | Delete `cdp-bridge.js/cdp-client.js/chrome-manager.js/weston-manager.js/start-chrome-3690.sh/container-*.sh`; Orca `tab create --url <TV>` + `tab profile set` replaces all of it. `trade-canvas.js` screencast client → thin `screenshot --format jpeg` poller + `eval` overlay for zones (or Design-Mode annotate) |
| Weston `:2` + Xvfb + `--ozone-platform=x11` + second-monitor geometry | Orca manages its own Chromium (headless `serve` uses Xvfb internally) | DROP | Delete display story. Parametrize NOTHING — remove `DISPLAY`, `WINDOW_SIZE 1704,1065`, `POSITION 1920,0`, `--window-position`, `BROWSER_VOLUME/CONTAINER_NAME/IMAGE_NAME/docker run --network host` (PORT_DISCIPLINE forbids host-net in fork) |
| MT5 ZMQ `ipc:///tmp/plutus-mt5.sock` → RPyC `:2222` + Xvfb:99 Wine | Orca terminal + worktree service + secrets vault | ADAPTER | Keep `mt5-controller.ts` protocol verbatim; run bridge as Orca-managed terminal in fork worktree; creds → `secrets.set` (64KB vault) never hardcoded; socket path → worktree-scoped `$ORCA_WORKTREE/.plutus/mt5.sock`; container Wine path becomes `vmRecipe` + `environmentRecipes` |
| VLM MiMo `zen/go/v1/chat/completions` + `ZONE|VALID` | any model via agent PTY + `eval` + `screenshot` | DIRECT | Keep `vlm-analyzer.ts` prompt + `ZONE|type|top|bottom|tf|BoM/MoM|conf|evidence` parser; token source → Orca account switcher / `mimo llm-server issue` pattern from 5.0 spec (never provider key); hardcoded `sk-lkZ...` at `pipeline-handler.ts:56` ROTATED on landing |
| Filesystem bridge `PLAN-*.md` + 13-phase god loop + `.ready` | Quick Commands + `file open/diff` + `worktree create --issue` + Automations | DIRECT | `OPENCODE_BRIDGE_SPEC.md` protocol → Orca Quick Commands (Global/Project) + `orchestration task-create/dispatch/gate-*`; `.ready` sentinel → `gate-resolve`; improvement-requests dir → worktree per task |
| SvelteKit spec + `dashboard/src` EMPTY | Orca renderer React 19 + panels | DROP the spec | Keep vanilla-JS renderer as panel v1 (it works); SvelteKit reintroduce is a separate wave, never a migration blocker |
| `plutus-src` 0B (9 engine imports unresolvable) | fork worktree real files | ADAPTER | Mount `Plutus_Agent/src/{e1,e2,card,kernel,mdve}` + `specs/mpse` + `specs/fixtures` into fork (W-FORK manifest from 5.0 spec) or stub EXPLICITLY with `PLUTUS_SRC_MISSING` loud error — never silent empty |
| e2e targeting `:9333/:9444/:9222` + `:3690` | Orca runtime `6768` + unix sock | ADAPTER | Remap every e2e/verify script to `orca status --json` + `tab list` + `screenshot`; keep `test-cdp-3690.js` frozen-check logic but point at Orca tab via `eval` |
| yfinance/pandas + `TV_FETCH_SCRIPT=''` fallback | `orca.yaml` setup + sharedDirectories | ADAPTER | Pin `yfinance` in `scripts.setup`; `node_modules/.cache` in `sharedDirectories`; default fetch → yfinance, tvDatafeed fallback EXPLICIT with `TV_SOURCE` logged per run |

SoC ruling (DashExtractor §e honest defect): `DASHBOARD_SPEC.md` forbids trade execution in dashboard, but code drives (`tv/draw`, `mt5/connect`, `of/control`). The fork picks ONE contract: panels are VIEWERS + steering (Design-Mode annotate, `terminal.sendText` steering, `gate-resolve` approvals); execution lives ONLY in sidecar + orchestration workers. Any panel code path that places orders directly is DELETED, never ported.

## §5 TARGET ARCHITECTURE

```
┌──────────────────────────────────────────────┐
│ ORCA-PLUTUS FORK — desktop app               │
│ Electron shell + CLI + Run store + panels    │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ plutus plugin — panels + worker + commands   │
│ DATA · AGENT · TRADE · BROWSER · MT5         │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ sidecar — Bun :9420 loopback only            │
│ pipeline 7 routes + TV bridge + MT5 + VLM    │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ orca browser — N TV tabs, one profile        │
│ DXY · EU · GU · AUD × 4H/1H/30m/15m          │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ orchestration — Run per week, Tasks/phase    │
│ terminal PTYs run engines, gates hold stops  │
└──────────────────────────────────────────────┘
```

Process map (loopback only, no host-net, no second display): Orca main (Electron, owns Chromium + PTYs + `orchestration.db` + `~/.config/orca`) → plutus worker (node, out-of-process plugin worker, full node, calls sidecar `127.0.0.1:9420` + `orca` CLI + Host API) → sidecar Bun (serves `127.0.0.1:9420` pipeline/CDP-proxy/MT5-proxy/fang-proxy; engines in-process; SQLite `~/.plutus-orca/data.db` WAL+Mutable+merkle) → Orca Chromium tabs (TradingView, profile `plutus-trading`, one tab per symbol×TF) → MT5 bridge (python3 ZMQ `ipc://$ORCA_WORKTREE/.plutus/mt5.sock` → RPyC container) → fang `:4200` (optional, AGENT tab webview only). Deleted processes: Electron `api.js :9430`, `websocket.js :9431`, `cdp-bridge/client/chrome/weston-managers`, `start-chrome-3690.sh`, `plutus-browser-container*`, `plutus-mt5` Xvfb:99 host daemons (moved into `vmRecipe`/container with Orca-managed ports).

Port map (canonical, single declaration each): Orca runtime WS `6768` (untouched, Orca-owned) + unix sock (untouched). Plutus sidecar `127.0.0.1:9420` (kept, loopback, was `:9420` already — zero client churn in `app.js`). Dashboard API `:9430` DELETED (routes move into sidecar `/api/*` internal + orchestration Tasks). WS `:9431` DELETED (push moves to `orchestration send` + worker poll). CDP `:3690` DELETED (no raw CDP in fork; Orca owns its Chromium). TV MCP `:9333` DELETED (stdio MCP dies; logic moves into worker `exec` + `eval` sequences). MT5 RPyC `:2222` KEPT container-internal only. Fang `:4200` KEPT optional loopback (AGENT tab only; trade-chat HTTP+SSE fallback preserved). TV spec `:6930` purged everywhere (was stale description-only). e2e `:9333/:9444/:9222` remapped to runtime `6768` + tab verbs.

## §6 MIGRATION MAPPING (per subsystem)

### 6A BROWSER — TV 38 tools → Orca verbs (F1)

| TV tool | Orca verb sequence | Notes |
|---|---|---|
| `tv_navigate {url}` | `orca goto --url <TV?symbol=&interval=>` | keep TV URL regex + TIMEFRAME_BUTTONS map from TV src |
| `tv_get_state` | `orca tab current` + `orca snapshot` | url/title/viewport from snapshot, not CDP `/json` |
| `tv_screenshot` | `orca screenshot --format png` | file not inline base64; VLM reads file; 150-200KB JSON churn dies |
| `tv_click/double_click/right_click {x,y}` | `snapshot` → `eval elementFromPoint(x,y)→ref` → `click --element @eN` | adapter resolves coords→ref; stale refs re-snapshot (refs die on nav/click/switch) |
| `tv_drag {from,to}` | `drag --from @eA --to @eB` else `exec` coordinate drag | canvas drawing prefers `exec` passthrough (`agent-browser 0.27.0` catalog) for pixel-exact anchors |
| `tv_scroll/tv_zoom/tv_canvas_pan/tv_canvas_zoom` | `scroll --direction --amount` + `eval barSpacing/scrollToBar/scrollToRealtime` | keep TV timing constants (24 steps/10ms, 100 deltaY/step, probe 50px 12-grid) as `eval` args |
| `tv_set_timeframe {tf}` | `eval` TV toolbar click or `goto ?interval=` | `TIMEFRAME_BUTTONS 1m→1..1W→W` preserved |
| `tv_get_view/find_empty_area/navigate_to/find_element` | `snapshot` + `eval visibleBarsStrictRange/firstBar/lastBar/count` + `screenshot` | `FIND_EMPTY_AREA_FAILED → screenshot + omni_vision` pattern becomes `screenshot` + Design-Mode annotate |
| `tv_refine_element_coordinates` | Design Mode click → HTML+CSS+crop into chat | human-grade precision for anchors the harness cannot resolve |
| `tv_find_price_y / tv_find_y_price` | `eval "priceToCoordinate(p)" / "coordinateToPrice(y)"` | verbatim JS from TV src `:~940`; no change |
| `tv_open_flyout/select_tool/evaluate` | `eval` same DOM hooks (`[aria-label]` arrows, FLYOUT_GROUPS coords) | fragile `_exposed_*` + class-substring hooks kept + version pin logged per run |
| `tv_draw_long/short/fib/rectangle/trend/horizontal` | `eval` openFlyout+selectTool → `exec` click/drag anchors → `eval` orderedDataSources verify → `screenshot` | keep `tv-controller.ts` draw math (priceY, switchPair OANDA:, setTimeframe); replace CDP send with Orca verbs |
| `tv_open_drawing_settings(_by_id)` | `eval showChartPropertiesForSource` + Design-Mode coordinates tab | Clone-verify + React-setter lessons from FAILURE_MODES preserved |
| `tv_list_drawings/select_drawing` | `eval orderedDataSources()/getPoint/pointsCount/id/title` | direct port; transport-only change |
| `tv_browser_desktop/container` | `tab create --url --profile plutus-trading` + `tab profile create/set/clone` | single-tab global WS (GAP-4) FIXED by construction; container suffix/ports kosmetik deleted; `connectCDPToPort` dead code stays dead |
| `tv_reset/type/press_key/value_overwrite` | `reload` / `fill/type/keypress/select-all` / `exec` batched insertText | keep T_PRESS_RELEASE/HOVER/FLYOUT/TOOL/ANCHOR sleeps as `wait --timeout` + `eval` sequencing |
| `tv_get_view` pane viewport | `eval Emulation.setDeviceMetricsOverride` pane-matched | pane-matched viewport lesson from BUILD_REPORT preserved |

Tab layout (the N-tab trading engine the manager spec wanted, now native): profile `plutus-trading` (`tab profile create --label plutus-trading --scope isolated`), tabs `DXY-4H, DXY-1H, EU-4H, EU-1H, EU-30m, GU-4H, GU-1H, GU-30m, AUD-4H` minimum (`tab create --url <TV chart?symbol=OANDA:EURUSD&interval=60> --profile plutus-trading`), map `tabId→{symbol,tf}` in sidecar (replaces TV `currentTabId` never-routed GAP), restart restores exact set (`tab list` → recreate missing), cookies long-horizon via profile (validity probe = `goto` TV + `snapshot` logged-in marker, NEVER hardcoded `loggedIn:true`), GPU/memory-safe rendering via Orca (operator-verified chart render this session — no `--disable-gpu/--use-angle` flag law needed in fork; headless `serve` uses Xvfb internally per `headless-linux-server.md`).

### 6B SIDECAR — Bun `:9420` re-homed (F2)

Keep `server.ts` 570L routes verbatim except `/api/*` proxy target changes from `:9430` to orchestration store + internal SQLite; bind `127.0.0.1` only; delete `--network host`. Keep `pipeline-handler.ts` 7 steps verbatim (PAIRS, TFs, 9-pillar+4H-SD+LQZ, ShapeBrain, TVController.screenshot+VLM, VisualSetupGenerator, drawZone/drawSetup, executeTrades dryRun-true) with exactly two edits: TVController transport (CDP WS → Orca CLI `exec`/`eval` subprocess calls) and log sink (`:9430/api/v1/trades` → sidecar SQLite + `orchestration send`). Keep `tv-controller.ts` drawing math (switchPair OANDA:, setTimeframe, findPriceY, drawRectangle/Long/Short/HLine/TrendLine, screenshot, drawZone/drawSetup) with CDP `cdp()` replaced by `bun $ -- orca eval/screenshot/exec` bridge module (`orca-browser.ts` NEW, ~120L, node-builtin-only + `Bun.spawn`). Keep `mt5-controller.ts` ZMQ protocol verbatim; socket → `$ORCA_WORKTREE/.plutus/mt5.sock`; creds → Orca `secrets` vault; `DASHBOARD_API` → sidecar internal. Keep `vlm-analyzer.ts` prompt + `ZONE|VALID` parser; endpoint → Orca account switcher token (rotate hardcoded `sk-lkZ...` at `pipeline-handler.ts:56` on landing — P0 secret hygiene). Run as Orca-managed terminal: `orca terminal create --worktree path:<fork> --command "bun plutus-sidecar/server.ts"` + `terminal wait --for tui-idle` + automation restart policy. Static renderer fallback (`GET /* → ../dashboard/renderer`) kept until F3 panels land, then deleted.

### 6C PANELS — Electron → plugin (F3)

Manifest `orca-plugin.json` (per `plugin-manifest.ts` verbatim): `{manifestVersion:1, publisher:plutus, id:mission-control, name:Plutus Mission Control, version:0.1.0, engines:{orca:>=1.4.201}, pluginApi:1, main:dist/worker.js, contributes:{panels:[DATA,AGENT,TRADE,BROWSER,MT5], commands:[plutus.*], events:[{on:worktree.created},{on:agent.status.changed}]}, capabilities:[workspace:read, terminal:send, notifications:show, storage, secrets, events:subscribe, settings:own]}` — 5 panels (limit 64), ~60 commands (limit 256: 38 TV-bridged + 9 pipeline + 6 MT5 + 7 harness), 7 capabilities (limit 32). Panel entries are the existing renderer files moved verbatim first (`index.html` shell + `app.js` DATA + `trade-canvas.js`→screenshot poller + `trade-chat.js` + `trade-tracker.js` + `mt5-tab.js` + `browser-tab.js`→Orca tab link + `tab-manager.js`), then React-ified in a later wave (never a migration blocker). Worker (full node, NOT sandboxed) owns: sidecar HTTP (`127.0.0.1:9420`), `orca` CLI subprocess (terminal/orchestration/browser verbs), Host API 13 methods (workspace.readContext for branch+terminals, terminal.sendText with EXPLICIT terminalId — never active-terminal — text ≤4096, notifications.show title≤120 body≤1000, storage UI prefs only, secrets creds ≤64KB, settings own, events.subscribe 3 events). Panels call worker over postMessage bridge (panel:true subset: readContext/sendText/notifications only); worker calls everything. Consent fingerprint + per-plugin enable preserved. Delete: `main.js`, `api.js`, `db.js`, `websocket.js`, `of-integration.js` (logic moves to worker), `merkle.js` (moves to sidecar), `cdp-bridge/client/chrome/weston`, `preload.js` (replaced by bridge allowlist `PLUGIN_PANEL_ACTIONS`), `start*.sh` (replaced by `orca.yaml` recipes + automations).

### 6D HARNESS — tmux → orchestration (F4)

Orchestrator `orchestrator.ts` 563L logic preserved, transport replaced: `docker exec tmux capture-pane` → `orca terminal read --cursor --limit`; `load-buffer/paste-buffer/send-keys` → `orca terminal send --text --enter`; 60s HEARTBEAT → automation `hourly|cron` + `orchestration check --wait --timeout-ms`; STALL-3-hashes → `gate-create --question` + nudge; 10-error breaker → `gate-resolve` + `worker-stop`; container restart → `terminal create` + `worktree set --comment`. Weekly lifecycle becomes Run per week: `orchestration run-create --objective "PLUTUS WEEK 2026-07-06 P0..P7"` → `task-create --spec <phase> --task-title` ×7 (harvest/zones/shapes/verdicts/setups/draw/execute) → `dispatch --task --to <terminal> --inject` → `send --type status|dispatch|worker_done|heartbeat` → `check --ack --peek` → `gate-create --task --question "promote phase?"` → `gate-resolve` → `task-update --status completed|failed|blocked`. Plutus headed agent (opencode/omp CLI running `report-v452.ts` + `diag-reasoning-chain-golden.ts` + `bun test src/` + MPSE `compile/calibrate`) runs in the dispatched PTY natively — "runs in orca cli" thesis DIRECT. Skills: `skills/plutus-pipeline/SKILL.md` via `npx skills add <fork> --skill plutus-pipeline` (hybrid stub resolves CLI then `skills get plutus-pipeline --full`); bundled guides regen (`generate-bundled-skill-guides.mjs --write`) in fork build. Automations: `automations create --trigger cron --prompt "/plutus-pipeline <weekStart>" --workspace <fork> --provider <pinned>` for Mon ~06:00 London (replaces `start-orchestrator.sh` + `/tmp/*.pid` + `nohup`). Bridge filesystem protocol (`PLAN-*.md` + god loop + `.ready`) → Quick Commands + `file open/diff` + `worktree create --issue` + `gate-resolve` (improvement-requests dir becomes worktree per task with linked issue).

### 6E ENGINES + GATES — cross unchanged

`Plutus_Agent/src/{e1 29f,e2 28f,card 7f,kernel 21f 2962L,mdve 40f,jesl 10f}` + `specs/mpse 13f (S-1..S-7 437L + compile 270L + calibrate 711L + oracle-registry 394L + battery 46/46 fp 8acfe74f + d17 20C/26E live)` + `specs/fixtures 10f (golden-week + 9 mutants)` fork per 5.0 W-FORK manifest (F1-F5 table) into `<fork>/plutus/` (byte-identical baseline, frozen pair `91294083…/33914c89…` verified). JESL kernel `src/jesl/` 8 kinds + sha256 journal + 8 tokens + hello green stays the test machinery; 11-node card `specs/jesl/plutus-pipeline-test.json` Phase-2 target unchanged; STALE-CARD preflight (resolve by SYMBOL + ROOT + fp `bc6ce1a0584a`, never raw corbell-scope path) unchanged; golden gate `diag-reasoning-chain-golden.ts --day=2026-07-06` 5/5 ±3p + A1-A7 + OUTCOME + ×2 + frozen stays acceptance; fixture rebuild P3-3 (`/tmp/opencode/bars_raw.json` from Vibe 4H + Air 1H CSVs, 30m/15m GAP never aggregate) stays fallback. Graph `shared.db` 126MB 1940n/3647e cards 5674 preds 4611 (gens `52b6e17419ac` 2837 + `bc6ce1a0584a` 1774, pin live) mounts at `<fork>/.plutus/knowledge-graph/shared.db` readonly (`bun:sqlite`, never whole-file read); `src/graph/client.ts` 8 verbs + `query_only=ON :107` preserved. RRA: R1-R34 + D98/D101/D13/D63 + R33 3-pip + R29 zone-anchored + R11 no-weekend + D38 no-caps + frozen-pair law + checkpoints locked + quote-law — all carried verbatim; NOTHING in trading law changes in this migration (hosting-only fork).

## §7 TARGET FILE TREE (end state)

```
┌──────────────────────────────────────────────┐
│ orca-plutus/ (fork of stablyai/orca)         │
│ ├─ src/cli/specs/plutus.ts         NEW verbs │
│ ├─ src/cli/handlers/plutus*.ts     NEW impl  │
│ ├─ src/main/browser/plutus*.ts     NEW bridge│
│ ├─ skills/plutus-pipeline/         NEW skill │
│ ├─ plugins/plutus-mission-control/ NEW panel │
│ │   ├─ orca-plugin.json            NEW manifest
│ │   ├─ dist/worker.js              NEW worker│
│ │   └─ panels/{data,agent,trade,   MOVED html│
│ │       browser,mt5}/              (renderer)│
│ ├─ plutus/ (W-FORK manifest)       FORKED    │
│ │   ├─ src/e1 e2 card kernel mdve  engines   │
│ │   ├─ src/jesl                    test kern │
│ │   └─ specs/mpse + fixtures       battery   │
│ ├─ plutus-sidecar/ (re-homed)      MOVED     │
│ │   ├─ server.ts                   :9420 loop│
│ │   ├─ orca-browser.ts             NEW bridge│
│ │   └─ data.db (sidecar SQLite)    MOVED mer │
│ ├─ orca.yaml (+plutus recipes)     EXTENDED  │
│ └─ .worktreeinclude (+.env)        EXTENDED  │
└──────────────────────────────────────────────┘
```

Noise left behind (never forked): Plutus Electron `main/api/db/websocket/of-integration/merkle/cdp-*`, `start*.sh`, `container-*.sh`, `plutus-browser-container*`, TV `dist` + `install.sh` chattr path, `plutus-fang-binary` provenance-unknown (re-resolve or drop — AGENT tab falls back to any CLI agent PTY), `plutus-src` 0B, `dashboard/src` EMPTY, v4.2-v4.5 logs, stale-lineage backups, `engine/` legacy, `pipeline/` opencode chain (firewalls translated), `hooks/identity/agents/` SDK couplings, VIBE/kronos refs.

## §8 INTERFACES (contracts the implementation must honor)

New CLI verbs (`src/cli/specs/plutus.ts`, handlers `src/cli/handlers/plutus*.ts`, bundled guides regen): `plutus pipeline start|status|results --week <YYYY-MM-DD>`, `plutus harvest|zones|shapes|analyze-charts|setups|draw-zones|execute-trades --week`, `plutus tv screenshot|draw|navigate|timeframe --tab <id>`, `plutus mt5 account|positions|order|close`, `plutus gates check|resolve`. Every verb `--json`, selectors `--worktree`, exit codes 0 = PASS / 1 = verdict FAIL / 2 = refusal (malformed law, STALE-CARD, CAP-UNBOUND class) per E3 law. Plugin manifest per §6C (engines `>=1.4.201`, pluginApi 1, 5 panels, ~60 commands, 7 caps). Host API usage: worker may call all 13; panels call `workspace.readContext/terminal.sendText/notifications.show` only (`isPluginPanelAction` gate). Sidecar HTTP (`127.0.0.1:9420`): `POST /pipeline/start|/harvest|/zones|/shapes|/analyze-charts|/setups|/draw-zones|/execute-trades|/run-full`, `GET /pipeline/status|/results|/health`, `GET /cdp/screenshot|/cdp/ws-url|/cdp/list|/cdp/version` (proxied to Orca `tab` verbs internally — CDP path kept as adapter shim, never raw WS), `POST /cdp/input`, `GET /mt5/account|/positions`, `POST /mt5/market-order|/close-position`, `GET /fang/proxy*|/health`, `POST /fang/chat`, `GET /web-proxy/:url`, `GET /*` static (deleted after F3). Orchestration contract: Run per week, Tasks per phase (`pending→ready→dispatched→completed|failed|blocked`), Dispatches to PTYs with `--inject` preamble carrying law digest + frozen SHAs + battery fp, `worker_done --outcome succeeded|failed` + `--files-modified` + `--report-path`, `gate-create --task --question` before every phase promotion and every live order (dryRun-true default; live requires TWO gate resolves: phase + risk).

## §9 MECHANISM PSEUDOCODE (nontrivial blocks only)

```
┌──────────────────────────────────────────────┐
│ TV draw via orca (F1 bridge)                 │
│   snap = snapshot() → refs @eN               │
│   eval flyout coords + selectTool            │
│   exec coord click/drag anchors              │
│   eval orderedDataSources verify             │
│   screenshot → VLM ZONE|VALID confirm        │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ panel → sidecar call (F3, panels sandboxed)  │
│   panel postMessage worker {cmd,args}        │
│   worker HTTP 127.0.0.1:9420 (full node)     │
│   worker terminal.sendText explicit id       │
│   worker orchestration send status back      │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ weekly Run driver (F4 harness)               │
│   run-create week → 7 task-create phases     │
│   dispatch each → PTY runs engine route      │
│   check worker_done → gate-create promote?   │
│   gate-resolve YES → next phase inject       │
│   journal receipts seal each transition      │
└──────────────────────────────────────────────┘
```
```
┌──────────────────────────────────────────────┐
│ F0 fork verify (fail-loud per file)          │
│   clone stablyai/orca (MIT) → pnpm install   │
│   pnpm dev → orca status ready (6768)        │
│   pnpm build:desktop → 0, tc 0, CLI live     │
│   pin 1.4.201, record runtimeId + sock       │
└──────────────────────────────────────────────┘
```

## §10 FAILURE MODES (per component, fail-closed)

| Component | Failure | Behavior |
|---|---|---|
| fork baseline | `pnpm dev` no runtime / `status` unreachable | STOP, name log tail; never proceed to F1 headless |
| browser bridge | snapshot has no canvas ref | FAIL `NO_CANVAS_REF`, re-`goto` TV URL + `wait --load` + re-snapshot (3× then gate) |
| draw bridge | `orderedDataSources` count unchanged after draw | FAIL `DRAW_UNVERIFIED` with screenshot path; never claim placed |
| price mapping | `priceToCoordinate` throws (TV upgrade) | FAIL `TV_INTERNALS_DRIFT`, log TV version pin; fallback Design-Mode manual anchor + gate |
| sidecar | `:9420` refused / engine throws | FAIL loud with route + phase; orchestration task `failed`, breaker counts toward 3× OPEN |
| panel | worker unreachable / postMessage timeout | panel shows `WORKER_DOWN` + retry; never silent empty; execution paths disabled until worker live |
| storage | plugin `storage.set` quota (5MB) | FAIL `STORAGE_OVERFLOW`, spill NOTHING to storage; trade rows stay in sidecar SQLite |
| orchestration | worker_done missing / heartbeat stale | STALL → `gate-create` nudge → `worker-stop` + `worker-start` re-dispatch (max 3, then Run `blocked`) |
| MT5 | ZMQ sock missing / RPyC `:2222` refused | FAIL `MT5_UNREACHABLE`, dryRun continues; live orders require TWO gate resolves — absent = no order, never default-buy |
| VLM | MiMo 401/429 / `ZONE|` unparseable | FAIL `VLM_UNVERIFIED`, retry with reissued token once (401-expired) else gate; never fabricate zones |
| engines | golden gate <5/5 or frozen drift or battery fp drift | CRITICAL STOP all desks; fix ROOT mechanism, never tolerance (R33 stays 3); frozen file restored byte-exact, never re-frozen |
| SoC | panel code path places order directly | DELETE the path at review; execution ONLY via sidecar + gates (the §4 ruling) |
| secrets | hardcoded key found (`sk-lkZ...` class) | FAIL `SECRET_HARDCODED`, rotate + vault `secrets.set`, re-audit |

## §11 SUCCESS CRITERIA (command-verifiable)

| # | Criterion | Check |
|---|---|---|
| SC-1 | fork integrity | `pnpm build:desktop` 0 + `tsc --noEmit` 0 + `orca status --json` ready + `orca worktree ps` current; version pinned 1.4.201 |
| SC-2 | browser bridge | `orca goto` TV + `snapshot` has canvas refs + `screenshot` file + `eval priceToCoordinate` number + one `exec` draw verified by `eval orderedDataSources` count+1 |
| SC-3 | sidecar re-homed | `orca terminal create --command "bun plutus-sidecar/server.ts"` live + 7 `POST /pipeline/*` routes 200 + `GET /health` ok, loopback only |
| SC-4 | panels | plugin loads (engines gate pass) + 5 panels render from live sidecar + `workspace.readContext` branch + `terminal.sendText` steering + `notifications.show` on NEW_TRADE |
| SC-5 | harness | weekly Run drives P0..P7 via Tasks/Dispatches; every phase promotion has a `gate-resolve`; journal receipts chain-verified |
| SC-6 | engines unchanged | frozen pair SHAs `91294083…/33914c89…` + battery fp `8acfe74f…` + calibrate exit 0 (20C/26E baseline, only upward) |
| SC-7 | trading acceptance | golden gate 5/5 ±3p + A1-A7 + OUTCOME + determinism ×2 + G1-G10 8/10 (G1+G4 residuals, not regressions) |
| SC-8 | cleanup | `:9430/:9431/:3690/:9333` dead (no listener) + `--network host` absent + `DISPLAY`/`plutus-browser` volume refs absent + secrets vaulted + e2e remapped to 6768 |

## §12 TEST ANGLES (tool-result-bound tokens)

| Angle | Probe | Pass token | Fail token |
|---|---|---|---|
| STATE | tamper sidecar `data.db` row between runs | `chainVerified:false` + exit 1 | silent true |
| TOOLS | call `plutus pipeline start` pre-sidecar | structured error code | prose apology |
| BOUNDARY | float compare without tolerance in new gate | `FLOAT_EPSILON_MISSING` | accepted |
| LIFECYCLE | kill sidecar mid-week; resume Run | Task re-dispatched; replay `invoked:0` | silent recompute |
| FIREWALL | fabricate zoneId in STEP-A via panel | BLOCKED naming the id | accepted |
| BROWSER | draw long then `orderedDataSources` count | count+1 + screenshot file | claimed without verify |
| VISION | corrupt screenshot file mid-verdict | `VLM_UNVERIFIED` gate | fabricated `ZONE|` |
| PORTS | `ss -tlnp` for 9430/9431/3690/9333 | no listener | any listener |
| SECRETS | grep `sk-` in fork tree | zero hits outside vault | any hit |
| CONCURRENCY | two `pipeline/start` same week | second replays `invoked:0` | double discharge |

## §13 OPEN DECISIONS (with defaults)

| Fork | Evidence | Default |
|---|---|---|
| Sidecar Bun vs Orca-native TS service | sidecar 2343L measured working; Orca TS would be a port | Keep Bun sidecar as Orca-managed terminal (F2); native port only on fidelity gaps |
| Vanilla renderer vs React panels | renderer 2257L works; `dashboard/src` EMPTY; SvelteKit spec dead | Vanilla moved verbatim as panel v1; React-ify after converge |
| Fang `:4200` keep or drop | 52.7MB binary provenance-unknown; AGENT tab needs a chat | Keep optional loopback; fallback any CLI agent PTY via `trade-chat.js` IPC path; drop binary if provenance never resolves |
| MT5 Wine container vs host bridge | `plutus-mt5` Xvfb:99 Wine login 25854220 measured; host has no Wine | Container via `vmRecipe` + `environmentRecipes`, socket worktree-scoped; host bridge only for dryRun |
| yfinance vs tvDatafeed harvest | `tv_fetch_ohlc.py` yfinance; TV_FETCH_SCRIPT `''` → tvDatafeed fallback; tvdatafeed npm/PyPI dead + WS rate-limited (F4 BLOCKED-EXTERNAL) | yfinance pinned in `scripts.setup`; source logged per run (`TV_SOURCE`); live-bars path proved in F5 before any live order |
| SvelteKit reintroduce | spec 1074L FROZEN vs zero files | Formal DROP at F5 unless operator starts it |
| 5.0 `.mimocode/` harness vs Orca skills | 5.0 spec §1-§3 + Full Plan H1-H7 measured | SUPERSEDED: Orca skills + `specs/plutus.ts` + automations replace `.mimocode/`; law corpus (19 docs + battery + JESL) crosses unchanged |
| Shape A flat vs Shape B microprocessor MPSE embed | MPSE_Circuit ShowMe both verified; B literal microprocessor | B for whole-battery embeds on JESL card; A for single-predicate gates on tier-2 cards (unchanged from Full Plan) |

## §14 BUILD ORDER + DISPATCH

Waves dispatch after gates (disjoint trees where noted): F0 sequential → F1 (browser bridge: `src/main/browser/plutus*` + `specs/plutus.ts` + `skills/plutus-pipeline`) → F2 (sidecar: `plutus-sidecar/` + `orca-browser.ts` bridge) → {F3 panels (`plugins/plutus-mission-control/`) ∥ F4 harness (orchestration Runs + automations + skills)} disjoint (panels vs orchestration store) → F5 converge (golden + proving tests + multi-week + headless `serve` + kill-list). Red gate stops the wave, names the file. Orchestration: wave-manager `generate` + written plan (`WAVES: N`) + populated `wave-spec.json` (200c+/100c+/50c+ floors, 2-4× with REAL anchors) + DEFECT-A `cp` remedy + concurrent hedge (tracker adopts by name, proven) + stream-only liveness (`wave-read`, never `task_status`) + per-return audit (stream+intact → phantom-check disk-change → per-hunk CORRECT|FLAWED|FITTED|DOWNSTREAM-FABRICATION|ARCH-VIOLATION|SCOPE-CREEP → mechanical re-verify → adversarial two-sided → over-claim catch) + canon duty per wave (BUILD_STATE append + wave-audit + DEBUG_LOG; subagents NEVER canon).

## §15 GAPS CARRIED (from scouts, unresolved here)

TV GAP-1 naming (`trident-brain` vs `tv-browser` vs v2.0/v3.0/3.0.0) → single `plutus` publisher + `mission-control` id at F3. GAP-2 container attach broken → deleted with container path. GAP-3 port doc lie (`6930` vs `9333`) → canonical §5 port map, purge `6930`. GAP-4 no multi-tab → fixed by Orca tabs. GAP-5 no cookie tools → Orca profiles. GAP-6 screenshot split (base64 vs file) → file contract §6A. GAP-7 docs drift (7 absent + 7 unlisted) → §3B inventory is truth; README rewritten at F1. GAP-8 React editing without tool → `exec` + Design Mode. GAP-9 untested/partial/deprecated statuses → re-proved at F1 SC-2. GAP-10 no `3690`/Xvfb (3690 zero hits in TV; Xvfb zero; Weston description-only) → Orca display story, §5. GAP-11 fragile `_exposed_*`/aria/class hooks → version pin logged per run + `TV_INTERNALS_DRIFT` gate. GAP-12 chattr installer → `orca.yaml` + skills install. Dashboard GAP-1 `plutus-src` 0B → W-FORK mount or loud `PLUTUS_SRC_MISSING`. GAP-2 `dashboard/src` EMPTY → vanilla kept, SvelteKit dropped. GAP-3 `:6930` vs `:3690` + `api.js` bridge path unverified → §5 map + verify at F2. GAP-4 `app.js :9420` proxy dependency → sidecar must be up (F2 gate before F3). GAP-5 hardcoded `sk-lkZ... :56` → rotate at F2. GAP-6 TV login Wave-E never done → F1 draw path proves login via profile validity probe. GAP-7 IN-FILES-only (typing, viewport, pulse-kill, WS self-heal, GROUP-BY, 90/98fps) → re-proved at F3/F4. GAP-8 e2e `:9333/:9444/:9222` → remap §5. GAP-9 yfinance/pandas + `TV_FETCH_SCRIPT=''` → pin + log §4. GAP-10 missing `data.db/config.json`, `~/.openfang/hands`, electron/better-sqlite3 ABI, fang provenance → recreate at F0/F2 or drop with loud record. Orca GAP-1 version drift (1.4.197 vs 1.4.201) → pin 1.4.201 at F0. GAP-2 no call-graph index → targeted `read` + `grep`, never whole-tree. GAP-3 MCP authoring schema → skills + plugins path only (no custom MCP server in fork). GAP-4 dashboard sources one level down → panel port reads actual `src/renderer/src/*` at F3. GAP-5 raw CDP unresolved → `exec` passthrough only, never raw endpoint. GAP-6 advanced specs unexpanded → expand at F1/F4 task time. GAP-7 no top-level `extensions/plugins/commands/tools/dashboard/` (only `skills/`, `skill-guides/`, `skill-stubs/`, `src/`, `mobile/`, `cloud/`, `native/`, `config/`, `resources/`) → harness lands per §3C fork entry (specs+handlers+skills+plugins). GAP-8 state paths point-in-time → re-`ls ~/.config/orca` at F0. GAP-9 relay/mobile beyond README → headless `serve` proved at F5, relay deferred.

## §16 DOCTRINE QUOTES (verbatim, the law never paraphrased)

- "E3 is a natural RESULT we ARRIVE AT from E1 + 2 being done properly... 90% of the work is in E1 + E2." (MACRO:13, R1)
- "Previous engine data PROVIDES THE STRUCTURE FOR the next one. Next engine's data MUST FIT WITHIN THE CONSTRAINTS of the previous engine's data archtiecture this is absolutely non negotiable." (MACRO:19-21, R2)
- "E3 is not permitted to override pre-existing E1/E2 data architecture." (MACRO:21, R3)
- "pressure mechanics are the fundamental reality everything is built on top of." (MACRO:30, R4)
- "Liquidity is the BLOOD of the entire market." (MACRO:57, R5)
- "3 pips outside the back edge of the entry zone, or 1-2 pips inside the close edge of the next rung." (MACRO:243, R6)
- "Doctrine is QUOTED, never synthesized... Anything that can't be quoted doesn't get built." (Bible4.5:705, R19/D13)
- "golden tolerance 3 pips after EVERY change — not 30, not 10, THREE." (golden-gate.ts:18-20, R33)
- "NOTHING SHOULD BE PRICE ANCHORED EVER… ZONE ANCHORED." (DEBUG:1231, R29)
- "GET THE CORRECT FUCKING DATA OR THROW ERROR. BLACK AND WHITE, NO MIDDLE GROUND, NO FALLBACK FABRICATED BULLSHIT." (V4.5.2 BUILD_REPORT:240, honest-data)
- "GENERATE WORKS FINE. IGNORE THE PHANTOM COMPLETE. GENERATE AND READ." (D101 wave-channel)
- "EVERYTHING should now be tangible Lexicon filters + MPSE engines with 0 dumb degenerate garbage anywhere." (D63 zero-slop)
- "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE." (Bible4.5:570, B10)
- "The mirror is not per pip precision... 80%. The 20% optimized for the actual pair." (Bible4.5:381, R18)
- "In the 1H before london session starts is when i manually do all my analysis and setup my trades for the day." (D63-temporal, ANALYSIS_POINT_MS=1783317600000)

## §17 COMPACTION RECOVERY (for the next session)

Verify: `orca status --json` ready + `worktree ps` current + frozen pair SHAs + `bun test src/jesl/` green + MPSE `compile` fp + `calibrate` exit 0 + BUILD_STATE tail = this fork era. Read: this file §0→§5, then §6 by task (F1 browser / F2 sidecar / F3 panels / F4 harness), then §11 gates. Give the 5-line proof (fork remote + Orca version; browser verb count; sidecar routes; first task; frozen SHAs + battery fp) — then EXECUTE §14 waves. Subagents get §-sections or task-maps pasted — never the whole file unless full-context work. Graph: resolve by SYMBOL + ROOT + fp `bc6ce1a0584a`, never raw corbell-scope path; `shared.db` readonly `bun:sqlite` only.

## §18 VERSION HISTORY (append-only)

| Version | Date | What changed |
|---|---|---|
| v1.0 | 2026-09-15 | Initial fork spec from three read-only extractions (DashExtractor 207L/24KB + TvExtractor 39L/17KB + OrcaExtractor 123L/19.9KB) + live `orca --help/status/worktree-ps/terminal-list` + raw reads (`browser-basic.ts`, `orchestration.ts`, `plugin-manifest.ts`, `plugin-host-api.ts`, `package.json` 1.4.197) + docs (`cli/overview`, `browser/design-mode`, `model/worktrees`, repo front). Adjudicates operator thesis DIRECT/ADAPTER/DROP per subsystem, canonical port map, 5-panel plugin manifest, 6-run test angles, 13-row open decisions, F0→F5 ladder. Supersedes `.mimocode/` hosting from 5.0 spec in hosting only; preserves all trading law, engines, battery, JESL, oracles. |

## Self-check

SPINE: PLAN named · ingredients loaded via skill tool in-session (ascii-diagrams law + 3 scout extractions + 5 raw Orca sources + 3 docs + live CLI) · visuals ruler-passed: ladder/bridge boxes inner 46 (borders col 1/48), all lines ≤76, arrows terminate at borders, no plain-ASCII, no dangling junctions, no floating labels · claims anchored: every count/port/route cites path:line or observed CLI JSON (frozen SHAs sha256sum live, JESL hello 1/0 live, MPSE 46/46 fp live, graph 1940/3647 live, orca pid 445384 + WS 6768 + 1.4.201 live, worktree orca-migration + 5 PTYs live) · caps: none truncated (scout GAPs carried verbatim §15, no silent fill).
