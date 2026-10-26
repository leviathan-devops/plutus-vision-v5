# THE PLUTUS CHART WORKSTATION — MASTER BLUEPRINT v1

> **Doc class:** ARCH (master blueprint) · **Floor:** 1000+ lines (ARCH = 1000) · **Authored:** 2026-09-28 · **Status:** v1 · **Predecessor:** none (no prior `vN` on disk)
> **Target path:** `PLUTUS/MASTER_CONTEXT/reports/Plutus_Chart_Workstation_Master_Blueprint_v1.md`
> **Authority for the OSS layer:** `PLUTUS/packages/plutus-v6-fresh/31-THE-OSS-CHART-STACK.md` (the option enumeration + the four-option decision)
> **Authority for the MT5 chain:** `PLUTUS/packages/plutus-v6-fresh/18-THE-MT5-MOBILE.md` (the measured four-link chain, file:line per link)
> **Authority for the render/capture/verdict law:** `28-THE-VISION-IN-THE-LOOP.md` · `29-THE-VISION-VALIDATION-PROTOCOL.md` · `30-THE-DASHBOARD-DISPLAY.md`
> **The source readmes (the external scan, 2026-09-15):** `PLUTUS/research/2026-09-15-external-scan/luxalgo/readmes/*.md`

**PROPOSED markers.** Nothing in this blueprint exists in code today: the workstation tree is not on disk (`find . -maxdepth 4 -type d -iname '*workstation*'` returns **zero rows**; `@luxalgo` is **not installed** anywhere on this host). Every stage, type, pseudocode block and file path below is marked **[PROPOSED]** unless it carries an anchor to an artifact that exists. Governed files that DO exist are named with `file:line` and are marked **[BUILT]** or **[ABSENT]** as measured.

---

## §0 · THE NAMING LAW (binding on every line of this document)

This document obeys the operator's naming law without exception:

| The rule | The form used here | The form refused |
|---|---|---|
| The system's name | **the Plutus Chart Workstation** / **the workstation** | "clone", "replica", "copy" |
| The platform reference | **"TradingView"** only as a factual trademark reference | "TradingView clone", "bypass their login", "scrape their data" |
| The language | **Pine-compatible** / **Pine-compatible indicators** | "Pine Script (theirs)" |
| The runtime | **PineTS**, named as LuxAlgo's independent AGPL runtime | "the official Pine runtime" |

**The trademark sentence (the one permitted mention, reproduced once and not repeated):** *Pine Script® is a TradingView, Inc. mark; PineTS is LuxAlgo's independently developed, AGPL-3.0-licensed runtime for Pine-compatible code, and neither PineTS nor the workstation is affiliated with, sponsored by, or endorsed by TradingView, Inc.* (anchor: `PineTS.md:47` carries the identical disclaimer verbatim in the upstream readme).

---

## §1 · MACRO BLUEPRINT

### 1.1 · What it is (the one paragraph)

**The Plutus Chart Workstation is a self-hosted, open-source financial charting and trading workstation, assembled from Apache-2.0/AGPL-licensed components (Vela, PineTS, broker-sdk, trade-journal, prop-firm-sim, trade-relay, edge-stats), interoperating with the MT5 terminal the operator already licenses, rendering the Plutus pipeline's own output on the operator's own broker data. Functionally comparable to a hosted charting platform: charts, indicators, bar replay, paper trading, and live broker data — entirely self-contained, no third-party hosted service, no logins.**

That sentence is the system's definition and is used verbatim in every downstream artifact. Its three load-bearing clauses, each with its consequence:

| The clause | What it commits the build to | The section that owns it |
|---|---|---|
| assembled from Apache-2.0/AGPL components | no component is forked into a new dialect; each is consumed as published, with its own license honored at its own boundary | §2.1 (the isolation), §7 (the license laws) |
| interoperating with the MT5 terminal the operator already licenses | the broker leg is the operator's existing licensed terminal, reached through the existing bridge — never a replacement broker integration | §2.2 (the MT5 bars adapter, G2), §2.7 (execution) |
| rendering the Plutus pipeline's own output on the operator's own broker data | the drawn artifact is the pipeline's report, and the prices under it are the operator's real broker's prices — both, on the same axes | §2.3, §2.4, §2.8, §3.3 |

### 1.2 · The macro diagram (box law: ≤76 display columns, all-ASCII borders)

+------------------------------------------------------------------------+
|           THE PLUTUS CHART WORKSTATION  (one local process tree)       |
+------------------------------------------------------------------------+
|                                                                        |
|   [2.1] BOOT ....... workstation-supervisor  (one writer per port)     |
|    |                                                                   |
|    +--> [2.2] DATA ..... provider layer ................. (§2.2 / G2)  |
|    |         |-- Vela providers: binance/coinbase/hyperliquid          |
|    |         |-- broker-sdk fetchBars: alpaca/tradier                  |
|    |         `-- mt5-bars-adapter -> plutus-mt5 [PROPOSED]             |
|    |                                                                   |
|    +--> [2.3] CHART .... Vela core+workspace (Apache-2.0) ... (§2.3)   |
|    |         `-- registerProvider / data: custom bars                  |
|    |                                                                   |
|    +--> [2.4] INDIC .. PineTS + vela-pinets (AGPL wall) ... (§2.4/G4)  |
|    |         `-- PineWorkerEngine -> plots / .trades                   |
|    |                                                                   |
|    +--> [2.5] REPLAY . replay controller [PROPOSED] ....... (§2.5/G1)  |
|    |         `-- window slice -> chart data swap                       |
|    |                                                                   |
|    +--> [2.6] PAPER .. paper-fill engine + journal-core ..... (§2.6)   |
|    |                                                                   |
|    +--> [2.7] LIVE ... order ticket -> mt5_bridge handlers .. (§2.7)   |
|    |                                                                   |
|    `--> [2.8] JOURNAL  journal-core round trips + edge-stats  (§2.8)   |
|                                                                        |
+------------------------------------------------------------------------+

**Every box names a lifecycle section.** The map is total and one-to-one: §1.2 has nine boxes; §2 has exactly nine numbered stages (2.1–2.8 plus the stage-order table 2.0); §9.1's backwards map closes the loop with **zero orphans** in both directions (measured in §9.1).

### 1.3 · The licensing ledger (the copyleft map — the hard boundary in the design)

| The component | The license (as published) | The copyleft obligation THIS build inherits | The anchor |
|---|---|---|---|
| Vela (`@luxalgo/vela`) | Apache-2.0 + a NOTICE attribution requirement | none beyond attribution: keep the Vela watermark visible, or show an equivalent named-and-linked attribution on the same screen | `Vela.md:185`, `Vela.md:189`, `Vela.md:192-196` |
| PineTS (`pinets`) | AGPL-3.0 **or** commercial (dual) | **the AGPL wall**: the copyleft attaches to anyone who *distributes* the app or *serves it over a network* — so PineTS runs in a station of its own and only DATA crosses back | `PineTS.md:448-449` |
| Vela-pinets (`@luxalgo/vela-pinets`) | AGPL-3.0 (it links PineTS) | the same wall, one layer up: it must live on the PineTS side of the boundary | `Vela-pinets.md:172-173` |
| broker-sdk | MIT | none | `broker-sdk.md:219` |
| trade-journal (`@luxalgo/journal-core`, `@luxalgo/journal-importers`) | MIT | none | `trade-journal.md:22`, `trade-journal.md:231-232` |
| prop-firm-sim (`@luxalgo/prop-firm-sim-core`) | MIT | none | `prop-firm-sim.md:191` |
| trade-relay | MIT (bundles Vela's Apache-2.0 notice) | none beyond Vela's attribution | `trade-relay.md:131` |
| edge-stats | MIT (code) + CC BY 4.0 (the calendar/event data files) | attribution for the data files only, if redistributed | `edge-stats.md` License section |
| the MT5 chain (`plutus-mt5-bridge`, `plutus-mt5-container`, `plutus-sidecar`) | the operator's own (in-repo) | none — but it is the operator's licensed terminal, so it is never redistributed | `18-THE-MT5-MOBILE.md:§1` |

**The consequence, stated once:** the workstation is **two stations, not one program.** Station A (Apache-2.0/MIT: Vela, broker-sdk, journal-core, prop-firm-sim, edge-stats) and Station B (AGPL: PineTS, vela-pinets). §2.1 defines the boundary; §7 L-3/L-4 make it a law; §8.2 encodes it as the config's `station` field.

### 1.4 · The four requirements → the owning sections

| The requirement (the operator's) | Where it is designed | The mechanism | The gap it collides with |
|---|---|---|---|
| **R1 FULL BAR REPLAY + BACKTESTING** — the scrubber, the step-forward, the strategy replay | §2.5, §3.4, §5.2 | the replay controller: a date anchor + a cursor + a windowed data swap; the strategy replay rides `strategy()` through the same engine that draws indicators | **G1** — no first-class OSS bar-replay scrubber exists in the set; the controller is BUILT here |
| **R2 PAPER TRADING** — the simulated fills, the commission model, the journal | §2.6, §3.5-3.7, §5.3 | the paper-fill engine + `@luxalgo/journal-core`'s round-trip engine as the book of record; the commission model is a declared config, never a hidden default | **G3** — the order ticket UI is unbuilt; the fill engine is designed here |
| **R3 PINE-COMPATIBLE INDICATORS** — the v8 indicator (zones / shape line / setups) on our charts | §2.4, §5.5, §9.2 G4 | PineTS transpiles the same script and executes it; vela-pinets registers the engine on the Vela chart; the drawing namespace the v8 uses is declared covered | **G4** — per-function fidelity is badge-declared, unbenched; §5.5 is the bench |
| **R4 REAL BROKER INTEGRATION** — the operator's MT5: real market data ON the chart + the execution | §2.2, §2.7, §3.2, §3.5 | `fetchBars`-shaped MT5 adapter over the existing four-link chain for data; the existing 8 bridge handlers for execution | **G2** — the chain serves positions and orders, **not bars**; the candle command does not exist |

### 1.5 · The known-gap ledger (named, not papered over)

| ID | The gap | The measured state | The disposition in this blueprint |
|---|---|---|---|
| **G1** | the bar-replay scrubber / clock UI | no first-class OSS repo in the component set owns a replay controller | **BUILD IT** — the controller is §2.5 + §5.2, with its exact state machine and its checks |
| **G2** | the MT5 → chart data provider | the bridge exposes **8** handlers and **zero** of them return bars (`grep -n 'def h_' python/mt5_bridge.py` → :546 market_buy · :592 market_sell · :648 close_position · :694 modify_position · :731 get_positions · :737 get_account_info · :761 get_symbol_info · :796 health; `grep -rn 'copy_rates\|get_rates\|candle\|OHLC' python/ src/` → **0 rows**) | **BUILD IT** — `mt5-bars-adapter` is §2.2's [PROPOSED] leg, shaped exactly like `fetchBars` |
| **G3** | the order ticket UI | the built MT5 tab has an order form with element ids `mt5-pair`…`mt5-close-all` (`18:§2.3`); no ticket bound to chart price is built | **BUILD IT** — §2.7's ticket, plus the paper path in §2.6 |
| **G4** | the Pine per-function fidelity | badge-declared coverage (`PineTS.md:307-308` lists box/line/label/table/linefill/polyline); per-function benches unread (`31:§5` residual 1) | **BENCH IT** — §5.5 is the 8-check audit run under PineTS against the v8 |
| **G5** | the AGPL isolation | PineTS + vela-pinets are AGPL-3.0 (`PineTS.md:448`, `Vela-pinets.md:172`); the wall is a hard law if the Pine path is used | **ENFORCE IT** — §2.1's station boundary, §7 L-3/L-4, §8.1 `AGPL_BOUNDARY_VIOLATION` |

---

## §2 · LIFECYCLE SECTIONS (numbered, in execution order)

### 2.0 · The stage order

| # | The stage | It runs when | It cannot start until | Its product |
|---|---|---|---|---|
| 2.1 | BOOT — the supervisor, the station boundary, the config | on workstation start | the config validates (no rail can be *omitted*, only loosened by a named flag — the trade-relay rail doctrine) | one supervised process tree + one resolved config |
| 2.2 | DATA — providers, the MT5 bars adapter, the store | on boot, then per bar request | the boot resolves which provider owns the symbol | a bar series in one normalized shape |
| 2.3 | CHART — Vela headless core / workspace | after the first bar series lands (or immediately, empty) | the DOM mount point exists | a rendered chart with a data channel |
| 2.4 | INDICATOR — PineTS + vela-pinets | on `addIndicator` / `runIndicator` | the chart reports `ready()` | plot series + drawing objects + (strategies) trade markers |
| 2.5 | REPLAY — the replay controller | on operator intent (the scrubber) | a bar series longer than the visible window | a windowed frame + a clock + the step/pace state |
| 2.6 | PAPER — the fill engine + the book | on a paper order (from the ticket or from the pipeline's report) | a current price (live or replayed) | a fill record + a position + a journal trade |
| 2.7 | LIVE — the order ticket → MT5 execution | on an operator-confirmed live order | the chain's `health` handler answers connected | a broker position ticket (the platform's own id) |
| 2.8 | JOURNAL — round trips + Edge Score + edge-stats | on position close, and on demand | at least one closed round trip | a trade record, a metric set, a P(win \| conditions) |

The order is a **data dependency order, not a menu**. §2.5 cannot precede §2.3 (there is nothing to window); §2.6 cannot precede §2.2 (a fill needs a price); §2.8 cannot precede §2.6 or §2.7 (a round trip needs both ends). The one **async** pair is §2.4 and §2.2: an indicator may be *registered* before any bars exist — the engine waits for the chart's `ready()` (anchor: the Vela quickstart's `await chart.ready()` at `Vela.md:87`).

### 2.1 · BOOT — the supervisor, the station boundary, the config

| Aspect | The specification |
|---|---|
| **WHAT** | one supervisor brings up two stations: **Station A** (the Apache-2.0/MIT host: Vela, providers, broker-sdk, journal-core, prop-firm-sim, edge-stats) and **Station B** (the AGPL Pine station: `pinets` + `@luxalgo/vela-pinets`). It resolves the config, asserts the license boundary, binds the ports, and watches both children. |
| **HOW** | Station A is an HTTP/static host serving the workstation SPA on `:8501` [PROPOSED] plus the local API on `:8502` [PROPOSED]. Station B is a **separate process** (a worker host) that the SPA reaches only through a **data-only** port `:8503` [PROPOSED] — it accepts `{script, bars}` and returns `{plots, drawings, trades}`, and it never receives a file path, a credential, or a host callback. |
| **WHERE** | the AGPL boundary law is `31-THE-OSS-CHART-STACK.md:§3` ("the AGPL isolation: a separate process/station, its output crossing as DATA — the `10` AGPL law") and `PineTS.md:448` (the copyleft trigger is distribution **or** network service). The rail doctrine (a rail ships ON and can only be loosened by a flag that *admits what it does*, and a config that neither sets nor loosens a rail fails to boot) is verbatim from `trade-relay.md:74`. |
| **WHY** | because the AGPL is the only *legal* risk in the whole build, and it is a boundary problem, not a code problem: the same code is either free or infectious depending on which process it runs in and whether that process is served. Deciding the boundary at boot — as a validated config field — makes the risk structural instead of remembered. |

**The boot sequence, and why each step exists:**

```
STEP B-1  read config (JSONC) -> validate against the schema (S8.2)
STEP B-2  ASSERT the license boundary:
          stationB.license == 'AGPL-3.0'   else NOTICE_LICENSE_BOUNDARY
          stationB.imports any station-A path   else AGPL_BOUNDARY_VIOLATION
STEP B-3  assert every rail is either SET or EXPLICITLY LOOSENED
          (an omitted rail is a boot failure, never a silent default)
STEP B-4  bind ports (8501 ui / 8502 api / 8503 pine-station)
STEP B-5  probe the data legs: each provider declares reachable|absent
          (ABSENT legs are reported, never substituted)
STEP B-6  probe the MT5 chain read-only: `health` only
          a FAILED probe leaves the live leg DISABLED, never half-on
STEP B-7  open the chart shell, then the store, then the journal
STEP B-8  print the station report: every leg, its state, its token
```

**The measured facts the boot inherits (all from the existing chain, [BUILT]):**

| The fact | The value | The consequence for the boot | The anchor |
|---|---|---|---|
| the bridge's socket | `ipc:///tmp/plutus-mt5.sock` | the boot probes this path; absent ⇒ the live leg is DISABLED with a named token, never silently degraded | `plutus-mt5-bridge/python/mt5_bridge.py:85` |
| the bridge's reconnect cap | `MAX_RECONNECT_ATTEMPTS = 6`, then the bridge STOPS retrying ("disconnected mode") | the boot must treat *post-cap* as a terminal state and surface it — a retry-forever supervisor would mask it | `mt5_bridge.py:90-91` |
| the health command | `health` is **exempt** from the connection gate (`mt5_bridge.py:930-935`) | the boot's probe is cheap and always legal — this is the one command that answers when nothing else can | `mt5_bridge.py:796`, `:930-935` |
| the disconnected token | verbatim: *"MT5 not connected. Ensure the MT5 terminal is running and the RPyC server (mt5linux) is listening, then restart."* | this exact string is the grep target that separates *chain down* from *no positions* — the built UI conflates them (`18:§1.2`, `18:§4.4`) | `mt5_bridge.py:950-954` |
| the `--host 0.0.0.0` law | the entrypoint must bind 0.0.0.0 or the host port forward sees Errno 104 with the server never logging a connection | any boot script that edits the entrypoint inherits a *chart-looks-broken* symptom for a *chain-is-down* cause | `18-THE-MT5-MOBILE.md:§1.1` (the RESOLVED root cause) |

**Failure modes at boot:** `NOTICE_LICENSE_BOUNDARY` (Vela's attribution obligation unmet) · `AGPL_BOUNDARY_VIOLATION` · `RAIL_UNDECLARED` · `PORT_TAKEN` · `MT5_CHAIN_DOWN` · `PROVIDER_ABSENT`.

### 2.2 · DATA — the providers, the MT5 bars adapter, the store (G2)

| Aspect | The specification |
|---|---|
| **WHAT** | a normalized **bar series** for a (symbol, timeframe) pair, from any of three classes: a Vela bundled provider, a `broker-sdk` `fetchBars` leg, or the operator's MT5 terminal. One shape, one time base, one ordering. |
| **HOW** | Vela's own registration API is the host interface: `chart.data.registerProvider('binance', new BinanceProvider())` (`Vela.md:86`) or the constructor's `providers: { binance: () => new BinanceProvider() }` (`Vela.md:74`); fully offline via the `data` option (`Vela.md:90-91`, *"No provider, no network? Pass your own bars via the `data` option"*). The broker leg is `broker-sdk`'s `fetchBars(symbol, {timeframe, from, to\|limit})` returning `[{time, open, high, low, close, volume}]` with `time` = the bar open in epoch ms, oldest-first (`broker-sdk.md:85-88`). The MT5 leg is [PROPOSED] `mt5-bars-adapter`, shaped identically. |
| **WHERE** | Vela providers: `Vela.md:74`, `:86`, `:90-91`, `Vela.md:48` (`@luxalgo/vela/providers/*` — Binance, Coinbase, Hyperliquid). broker-sdk `fetchBars`: `broker-sdk.md:85-91`, with the capability matrix at `:91` — **Alpaca only (stocks on the IEX feed, crypto pairs) and Tradier (1m/5m/15m timesales, 1d history)**; every other broker rejects with `UnsupportedCapabilityError` and must be checked ahead with `supportsBars(brokerId)` or the `supportsBars` flag on `listBrokers()`. The MT5 candle path: **does not exist** (`mt5_bridge.py`'s 8 handlers, none of them bars). |
| **WHY** | because R4 is *the operator's real broker data on the chart*, and the measured truth is that no shipped leg delivers MT5 bars. Naming that as G2 rather than routing around it is what keeps the build honest: the alternatives (a Binance proxy pretending to be EURUSD, or a synthesized series) would put candles on screen that the operator's broker never printed — the exact failure `trade-relay.md:67` forbids in its own words ("**the relay never fabricates a candle it did not see**"). |

**The `mt5-bars-adapter` contract [PROPOSED]** — it is a *provider*, it is not a new bridge command, and the difference matters:

```
INPUT   { symbol, timeframe, from?, to?, limit? }
OUTPUT  { bars: [ { time, open, high, low, close, volume } ], source }
      time  = the BAR OPEN in epoch ms, oldest-first (broker-sdk's shape)

THE ROUTE (why it is an adapter and not a bridge handler):
  1. the MT5 terminal can enumerate historical bars for any symbol it is
     subscribed to; the CURRENT bridge simply never exposes that read.
     The read is therefore added on the STATION side of the chain first.
  2. the adapter asks the chain for bars in the EXISTING wire shape:
     Request { "command": "..." } / Response { "success": true, "data":
       {...} }
     (the protocol is verbatim: mt5_bridge.py:29-33)
  3. until that bridge read exists, the adapter reports BARS_SOURCE_ABSENT.
     It NEVER falls back to a different instrument's candles.
```

**Why step 3 is not optional.** `trade-relay.md:62-67` runs a four-step source ladder for exactly this problem (simulator → real brokers via `fetchBars` → keyless public crypto candles → the fill path), and at every rung **the panel says which source applied** (`barsSource`, `barsTimeframe`, `trade-relay.md:69`). The workstation copies that contract verbatim: a bar series carries its `source` string into the UI, and `MT5` is a value that can only be set by an actual MT5 read.

**The store.** Edge Stats is the set's proof that a local analytical store is the right shape: it syncs intraday bars into a **local DuckDB store**, derives session features once, and answers `P(outcome | conditions)` from there (`edge-stats.md:29`); its session view reads one session from that session's own `(symbol, timeframe, year)` parquet partition, so history size does not change the cost (`edge-stats.md:83`). The workstation adopts the same discipline for its own bar cache: **partition by (symbol, timeframe, year), read one session at a time** [PROPOSED].

**Failure modes at DATA:** `PROVIDER_ABSENT` · `BARS_UNSUPPORTED` (the broker-sdk token is `UnsupportedCapabilityError`, `broker-sdk.md:91`) · `BARS_SOURCE_ABSENT` · `SYMBOL_NOT_SUBSCRIBED` (MT5-synced symbols only) · `TIMEFRAME_UNSUPPORTED` · `BAR_GAP_UNFILLED`.

### 2.3 · CHART — Vela headless core and the workspace (Apache-2.0)

| Aspect | The specification |
|---|---|
| **WHAT** | the rendered price surface: candles, axes, crosshair, the indicator legend, drawings, and (for strategies) trade markers — driven entirely from code. |
| **HOW** | two entry points, both documented. **The workspace** — *"a complete chart app in one call"* with a shared topbar, status line, watermark, bottom bar, object tree, keyboard-first UX, named cells, sync groups and one persisted state document (`Vela.md:40-46`, `Vela.md:62-76`). **The headless core** — `new Vela('#chart', {...})` + `registerProvider` + `await chart.ready()` (`Vela.md:81-88`). The indicator surface: a manifest (inline JSON, a URL, or an async loader) passed as `indicators:` (`Vela.md:129-138`). The extension surface: `registerChartType` / `registerRendererLayer` (`Vela.md:146-160`). |
| **WHERE** | `Vela.md:38-43` (the four packages: `/vela` headless · `/vela/workspace` the app · `/vela/ui` the kit · `/vela/plugin` the SDK), `Vela.md:102-105` (**70+** built-in studies, no scripting engine required), `Vela.md:185-196` (Apache-2.0 + the NOTICE attribution duty). |
| **WHY** | because the renderer is the one component where a fork would cost the most and buy the least: it is the *native WebGL2 renderer with a canvas2d fallback* (`Vela.md:7-8`), it keeps the chart headless so code can drive it, and every layer — providers, engines, renderers — plugs in behind a public port and can be swapped without touching the rest (`Vela.md:25-28`). That port design is precisely what lets §2.2's MT5 adapter and §2.4's Pine engine be *additions* rather than edits. |

**The three chart surfaces the workstation renders, and their distinct contracts:**

| The surface | What it draws | The data it reads | The precedent in the set |
|---|---|---|---|
| the **price pane** | candles for the active (symbol, timeframe) | §2.2's bar series | `trade-relay.md:58-59` (the Tape panel: Vela candles from the panel's own source) |
| the **indicator layer** | the pipeline's pins: zones as boxes, the shape line, the setups as position boxes | §2.4's indicator output | `28-THE-VISION-IN-THE-LOOP.md:§1` (the three-engine render contract: E1 zones · E2 the shape line · E3 setups as L/S positions) |
| the **trade layer** | entry/exit markers with P&L labels, plus (strategies) one marker per order fill | §2.6/§2.8's fills and round trips | `trade-journal.md:128` (trade pages charted on Vela with entry/exit markers and P&L labels) + `Vela-pinets.md:119-123` (`IndicatorModel.trades`, one marker per fill, ledger slices merged) |

**Why the trade layer is engine-free.** The set's own reference implementation draws fills through Vela's **native-indicator API**, not through Pine: `luxalgo-mcp-server.md` names the component (one `trade-chart.tsx` in trade-journal) and describes it as *"engine-free"*. That is the workstation's posture too: **drawing a fill never needs the AGPL station.** Only running a Pine-compatible *script* does. This keeps the highest-frequency surface (fills, markers, levels) entirely on the Apache-2.0/MIT side of the wall.

**Failure modes at CHART:** `CHART_MOUNT_ABSENT` · `CHART_NOT_READY` · `DATA_CHANNEL_EMPTY` · `ATTRIBUTION_MISSING` (the Vela NOTICE duty, `Vela.md:192-196`) · `CANVAS_NOT_SETTLED` (the capture-side sibling, `30-THE-DASHBOARD-DISPLAY.md:§4`).

### 2.4 · INDICATOR — PineTS + vela-pinets behind the AGPL wall (G4)

| Aspect | The specification |
|---|---|
| **WHAT** | the Plutus pipeline's own visual output — the v8 indicator's zone boxes, shape line, and setup position boxes — computed from the Pine-compatible source and drawn on the chart's prices. |
| **HOW** | two calls and one boundary. **In Station B:** `chart.registerEngine('pine', new PineWorkerEngine())` (`Vela-pinets.md:83`) so a heavy script never blocks the chart (`Vela-pinets.md:39-41`), then `chart.addIndicator(source)` (`Vela-pinets.md:72-74`) or the safer host path `chart.runIndicator(source)` — *"structured errors, no dead legend rows"* (`Vela-pinets.md:102-104`). **Across the boundary:** the SPA sends `{script, bars}` to `:8503` and receives `{plots, drawings, trades}` — data only. |
| **WHERE** | PineTS *"transpiles native v6 or v5 source and executes it with the same time series model: lookbacks, incremental TA, and plot outputs you can read from code"* (`PineTS.md:31`); **60+** TA functions (`PineTS.md:108`); `request.security()` for MTF (`PineTS.md:111`); plot access is `plots['NAME'].data` (`PineTS.md:100`). The engine port is Vela's public `ScriptingEngine`; strategies emit *"one marker per order fill as `IndicatorModel.trades`"* (`Vela-pinets.md:119-120`). Licenses: `PineTS.md:448-449`, `Vela-pinets.md:172-173`. |
| **WHY** | because R3 asks for *the v8 indicator on our charts*, and the v8's render is **boxes + lines + labels + a table** — the exact namespace PineTS declares covered (`PineTS.md:303-308`: plots · color · chart · label · line · box · table · linefill · polyline). The honest caveat, carried from `31-THE-OSS-CHART-STACK.md:§2`: these are **badge-declared** classes, and per-function fidelity is unbenched. §5.5's bench is the instrument that converts a badge into a measurement. |

**The four fidelity probes (the first things the v8 will hit, named in advance by `31-THE-OSS-CHART-STACK.md:§5` residual 4):** `request.security()` semantics · `barstate` · the table's rendering · and the cross-pair leak guard (the v8's own `:169-173` guard that forbids EU zones rendering on a DXY chart — the delta grammar's canonical severe case, `28:§2.3`).

**The declaration props channel is the debugging lever.** Both engines publish the mutable `indicator()` / `strategy()` declaration arguments as a props schema that Vela shows on the settings dialog's **Properties** tab, overridable via `addIndicator({ props })` or `handle.setProps()` (`Vela-pinets.md:42-45`, `:134-151`). For the v8 this means the four toggles (`show_zones` / `show_lsz` / `show_options` / `show_table`, all default `true`, `28:§0.2`) are reachable from the workstation UI without editing the script — and, critically, **reachable from the bench** in §5.5.

**Failure modes at INDICATOR:** `PINE_TRANSPILE_FAILED` · `PINE_UNSUPPORTED_FUNCTION` (the per-function fidelity token) · `DRAWING_NAMESPACE_MISSING` · `ENGINE_NOT_REGISTERED` · `AGPL_BOUNDARY_VIOLATION` · `PINE_LEGEND_STALE` (the "no dead legend rows" contract, `Vela-pinets.md:103`).

### 2.5 · REPLAY — the replay controller (G1 — BUILT here)

| Aspect | The specification |
|---|---|
| **WHAT** | bar replay as a first-class surface: a **date picker** that anchors the week, a **cursor** that advances bar-by-bar or at a pace, **play/pause**, **step**, **speed**, and **scrub** — with the chart redrawn at the cursor and everything downstream (indicators, the ticket, the paper engine) seeing only bars up to the cursor. |
| **HOW** | the controller owns a *window* over a full series and hands the chart a slice. Its state is `{ series, anchorTs, cursorTs, pace, playing }`; every mutation recomputes `visible = series[0 .. cursorIdx]` and pushes it to the chart's data channel. The set already ships the operator-facing half of this vocabulary in trade-journal: *"Replay offers restart, play/pause, stepping, speed, and scrubbing"* (`trade-journal.md:192`) — that is the **interaction contract to copy**, while the controller that produces the frames is [PROPOSED] here. |
| **WHERE** | the interaction contract: `trade-journal.md:192`. Vela's data path: the `data` option for caller-supplied bars and `registerProvider` for live ones (`Vela.md:86`, `:90-91`), with an indicator manifest for re-running scripts on new frames (`Vela.md:129-138`). **No OSS repo in the set owns a replay controller** — this is G1. |
| **WHY** | because replay is the only surface that makes the pipeline's *forward* output falsifiable at the moment of decision. `29-THE-VISION-VALIDATION-PROTOCOL.md:§3` states the live case exactly: *"the forward price action does not yet exist. The indicator is the ONLY place the agent can SEE what the price action is GOING to be."* Replay is how the same claim is re-tested on weeks where the answer is already known. |

**The one law that makes replay honest — the cursor is the whole world.** A replay frame must be indistinguishable from *that moment in history* to every consumer. Concretely, at cursor `C`: the chart's data channel carries bars `≤ C`; the indicator engine is fed bars `≤ C`; the paper engine prices fills from bars `≤ C`; and the order ticket can only be filled from a bar `≥ C` (never from a bar the operator has not yet *reached*). A single leak — one consumer holding the full series — turns the replay into a **lookahead oracle** and every result it produces is void. The check is mechanical: §4's `CHK-RP-3`.

**The anchor law (mandatory, inherited verbatim).** Every replay run carries the same temporal anchor: **Monday London session open** — *"mandatory default every single test is the same temporal anchor"* (`29:§1`). `29:§1` also records the open alignment question honestly: the package's constant `ANALYSIS_POINT_MS = 1783317600000` is Mon 2026-07-06 **06:00 UTC** (the pre-London hour), while the operator's words are *London session open* — one of 06:00 / 07:00 (BST) / 08:00 (GMT) UTC must be **pinned once and used identically** before any comparison. The workstation treats this as a config field with **no default**: `replay.anchorUtc` must be set explicitly (§8.2), because a wrong anchor silently makes two runs incomparable.

**Failure modes at REPLAY:** `REPLAY_NO_SERIES` · `REPLAY_CURSOR_OUT_OF_RANGE` · `REPLAY_LOOKAHEAD_LEAK` (any consumer holding bars beyond the cursor) · `ANCHOR_UNSET` · `ANCHOR_MISMATCH` (two runs with different anchors compared) · `PACE_INVALID`.

### 2.6 · PAPER — the fill engine and the book of record

| Aspect | The specification |
|---|---|
| **WHAT** | simulated execution: an order request becomes a fill at a defensible price with a declared commission, the fill becomes a position, and the position's close becomes a **round trip** in the journal — the same primitive the whole analytics layer reads. |
| **HOW** | the fill engine is [PROPOSED]; the **book of record already exists** as a published package: `buildRoundTrips(executions, { method: 'fifo' })` → `computeMetrics(trades, { timeZone })` → `computeEdgeScore(metrics)` (`trade-journal.md:245-261`). The primitive is named at `trade-journal.md:22-23` and the pipeline diagram at `:106-115`: *"One primitive drives everything: a raw **execution** (a fill) … the round-trip engine turns them into trades; every surface reads from there."* |
| **WHERE** | `trade-journal.md:245-261` (the three published calls), `:125` (FIFO / LIFO / weighted-average, per account, with partial fills, scale-ins, flips, futures multipliers), `:231-232` (the two packages: `@luxalgo/journal-core` = the pure domain engine with no IO and no framework; `@luxalgo/journal-importers` = the parsers). The commission/fee surface: *"fee and stop/target rules per account and symbol"* (`trade-journal.md:135`). |
| **WHY** | because paper trading that is not journalled is a toy, and journalling that is not the same engine as the analytics is two sources of truth. Reusing `journal-core` makes R2's fills and §2.8's metrics the **same object seen twice** — which is also what makes the paper path the honest rehearsal for the live path: the only thing that changes between them is which execution source feeds `buildRoundTrips`. |

**The four declared inputs the fill engine must never default silently:**

| The input | Why it cannot be implicit | The refusal token |
|---|---|---|
| the **price basis** | a fill at the bid, the ask, or the mid are three different fills; the v8's own level work distinguishes them and so must the engine | `FILL_PRICE_BASIS_UNDECLARED` |
| the **commission model** | a strategy that is profitable gross and unprofitable net is two different strategies; the paper result must state which one it is | `COMMISSION_MODEL_UNDECLARED` |
| the **contract multiplier** | trade-journal's own replay guidance requires it for derivatives (*"derivatives also need a contract multiplier"*, `trade-journal.md:192`); a missing multiplier silently scales every P&L | `MULTIPLIER_UNDECLARED` |
| the **slippage policy** | an instant perfect fill is a fiction; the engine either models a declared slippage or says `NONE_DECLARED` in the result — it never implies precision it does not have | `SLIPPAGE_POLICY_UNDECLARED` |

**Failure modes at PAPER:** `FILL_NO_PRICE` (no bar at or after the cursor) · `FILL_PRICE_BASIS_UNDECLARED` · `COMMISSION_MODEL_UNDECLARED` · `MULTIPLIER_UNDECLARED` · `ACCOUNT_UNRESOLVED` (every fill lands in a named account) · `EXECUTION_DUPLICATE` (the dedupe the round-trip engine already performs, `trade-journal.md:124`).

### 2.7 · LIVE — the order ticket and the MT5 execution path

| Aspect | The specification |
|---|---|
| **WHAT** | the execution surface: a ticket bound to the chart (symbol from the active series, price from the crosshair or a stated limit), routed to the operator's MT5 terminal, producing a broker position ticket — plus the kill switch. |
| **HOW** | the existing bridge already answers market orders with a complete result payload: `{order_id, position_id, ticket, deal, price, volume, symbol, message}`, built as `TRADE_ACTION_DEAL` with `deviation: 20`, `magic: 234000`, `comment: "plutus"`, `ORDER_TIME_GTC`, and the filling mode resolved from the symbol (`18:§1.2`, `mt5_bridge.py:564-577`). The ticket posts to it and records what came back. |
| **WHERE** | the 8 handlers: `market_buy` (`mt5_bridge.py:546`), `market_sell` (`:592`), `close_position` (`:648`), `modify_position` (`:694`), `get_positions` (`:731`), `get_account_info` (`:737`), `get_symbol_info` (`:761`), `health` (`:796`); the dispatch table at `:824-832`. The electronic route: Electron speaks ZMQ **directly** (`electron/main.js:422-437`, 6 `ipcMain.handle` channels at `:438`–`:492`); the browser route goes through the sidecar's `:9420` (`plutus-sidecar/server.ts:424`, `:444`, `:232`, `:266`). The bridge's own order path is already used by the pipeline (`mt5-controller.ts`, used by `pipeline-handler.ts:70`). |
| **WHY** | because the pipeline's report is, in the operator's own framing, a set of instructions the agent executes — *"basically just a button pusher with real time intelligence"* (`29:§3`) — and a button needs a surface. §9's live loop is explicit: the report names the trades, and the agent executes **only** those. |

**The four execution-safety facts the ticket MUST honor (all measured, all binding):**

| The fact | The measured value | What the ticket must do |
|---|---|---|
| limit orders are refused by the current bridge | `electron/main.js:474` returns a hardcoded `{success:false, error:'Limit orders not yet supported by ZMQ bridge. Use market orders.'}` | the ticket's limit control is **disabled with that reason shown**, never a control that silently does nothing |
| the browser path's write verbs are stubs | `browser-polyfill.js:303-319` returns refusals for `marketOrder`, `limitOrder`, `closePosition`, `closeAll` | the ticket's live mode is **Electron-only** until the stubs are real; the browser path offers paper only |
| order inputs are validated before interpolation | `plutus-sidecar/server.ts:239-245`: a pair allowlist (`EURUSD`, `GBPUSD`, `AUDUSD`, `DXY`, `EURUSD+`, `GBPUSD+`, `AUDUSD+`) with a fallback, `vol` coerced through `parseFloat`/`isFinite` else `0.01`, `sl`/`tp` nulled unless finite; `:271-273` `parseInt(body.ticket, 10)` with `invalid ticket` on non-finite | the ticket copies the allowlist + coercion verbatim — the file's own comment names the defect being closed: *"the old handler interpolated raw request fields into a python -c exec — an injection hole"* |
| the sidecar's catch-all excludes this family | `server.ts:523`: the static fallback skips `/mt5/` paths, so an unregistered `/mt5/*` **404s** rather than returning `index.html` | a new route is a real 404 when missing — the ticket can trust a 404 as *not implemented*, never as *HTML that failed to parse* |

**Failure modes at LIVE:** `MT5_CHAIN_DOWN` · `MT5_DISCONNECTED` (the verbatim bridge string, `mt5_bridge.py:950-954`) · `ORDER_LIMIT_UNSUPPORTED` · `ORDER_INVALID_VOLUME` · `ORDER_INVALID_TICKET` · `PAIR_NOT_ALLOWED` · `ACCOUNT_NOT_AUTH` · `KILL_SWITCH_ENGAGED`.

### 2.8 · JOURNAL — round trips, the edge numbers, and the statistics store

| Aspect | The specification |
|---|---|
| **WHAT** | the record and the reflection: every fill becomes a round trip; round trips become metrics (net/gross P&L, win and day-win rates, profit factor, expectancy, R multiples, streaks, drawdown, duration/time-of-day/weekday, per-symbol/tag/mistake/playbook); metrics become the Edge Score; and any outcome can be conditioned on any set of conditions with a sample size attached. |
| **HOW** | three engines, all local, all offline-capable. **Round trips + metrics + Edge Score** from `journal-core` (`trade-journal.md:245-261`). **Statement import** for the operator's existing MT4/MT5 history from `journal-importers` — 14 auto-detected formats including **MetaTrader 4 and 5**, with a column mapper for anything else (`trade-journal.md:124`). **Conditional statistics** from edge-stats: `P(outcome \| conditions)` with N and a Wilson 95% CI on every number (`edge-stats.md:87-92`). |
| **WHERE** | `trade-journal.md:124-135` (the feature table), `:245-261` (the published engine calls), `:192` (the replay/MAE-MFE surface and its honesty limits); `edge-stats.md:29` (DuckDB store, features derived once), `:87-92` (the honesty envelope), `:161` (non-goals: **no order execution, ever**), `:89` ("There is no code path that prints a percentage without its sample size"). |
| **WHY** | because a workstation that executes and never measures is a viewport, and because the two statistics engines answer two different questions that must not be confused: **journal-core** answers *what did I do*, **edge-stats** answers *how often does this setup work*. Keeping them separate, and keeping both beside the same fill primitive, is what lets a paper result and a live result be compared without translation. |

**The two honesty laws adopted verbatim from edge-stats (they are the model for the whole workstation's number reporting):**

```
LAW N-1  a percentage NEVER prints without its sample size
         (edge-stats.md:89: "There is no code path that prints a percentage
          without its sample size")
LAW N-2  a small sample is WARNED, and an absurd one is REFUSED
         (edge-stats.md:90: "minimum-sample guards: a warning below 30
          sessions, no estimate below 10")
         plus the stability split + the per-year counts (:91-92)
```

**Failure modes at JOURNAL:** `ROUNDTRIP_UNPAIRED` (a sell with no recorded entry — the set's rule is *ignore, never guess*: `broker-sdk.md` stats section, and `trade-relay.md:58`'s unpaired marker) · `IMPORT_FORMAT_UNRECOGNIZED` · `IMPORT_ROWS_SKIPPED` (counted, never guessed: `broker-sdk.md:93-97`) · `SAMPLE_TOO_SMALL` · `ESTIMATE_REFUSED` · `TZ_UNDECLARED`.

---

## §3 · DISPATCH TRACES (every hop, in order)

Each trace is written as: **the actor → the contract it crosses → the product**, followed by its failure branch. A hop with no named failure branch is an unfinished hop; every hop below has one.

### 3.1 · TRACE-BOOT — the boot

```
  T1  the operator starts `workstation up`
        actor   : the shell
        crosses : argv -> config path
  T2  the supervisor reads + validates the config (S8.2 schema)
        crosses : JSONC -> typed config     fail: CONFIG_INVALID
  T3  the supervisor ASSERTS the license boundary (S2.1 B-2)
        crosses : config -> assertion       fail: AGPL_BOUNDARY_VIOLATION
  T4  the supervisor asserts every rail is SET or LOOSENED
        crosses : config -> rail table      fail: RAIL_UNDECLARED
  T5  port bind: 8501 ui / 8502 api / 8503 pine-station
        crosses : OS -> sockets             fail: PORT_TAKEN
  T6  data-leg probe, one per configured provider
        crosses : provider -> reachability  fail: PROVIDER_ABSENT
  T7  MT5 read-only probe: `health` ONLY
        crosses : supervisor -> bridge      fail: MT5_CHAIN_DOWN
  T8  chart shell mounts; the store opens; the journal opens
  T9  the station report prints (every leg, its state, its token)
```

**Why the MT5 probe is `health` and nothing else.** `health` is the **one** command exempt from the bridge's connection gate (`mt5_bridge.py:930-935`), so it answers truthfully even when the chain is down — which is exactly when a probe needs to answer. Every other command on a disconnected session returns the same refusal string (`mt5_bridge.py:950-954`), which cannot distinguish *down* from *up-but-empty*. A boot that probes with `get_positions` therefore learns nothing it can act on.

### 3.2 · TRACE-BARS — the bar request (G2's home)

```
  B1  the chart asks for (symbol, timeframe, window)
        crosses : chart -> provider registry
  B2  resolution order — FIRST MATCH WINS, and the winner is RECORDED:
        1. an explicitly pinned provider for the symbol   (config)
        2. the MT5 leg, if the symbol is MT5-subscribed   [PROPOSED]
        3. broker-sdk fetchBars, if supportsBars(broker)
        4. a Vela bundled provider (binance/coinbase/hyperliquid)
        5. the caller-supplied `data` option (fully offline)
      fail: BARS_SOURCE_ABSENT  (NO step may borrow another source)
  B3  the chosen source returns bars in the ONE shape (S4.1)
  B4  the adapter normalizes: time = bar OPEN, epoch ms, oldest-first
        crosses : raw -> BarSeries          fail: BAR_ORDER_INVALID
  B5  the series is cached to the store, partitioned
        crosses : memory -> (symbol, timeframe, year)   [PROPOSED]
  B6  the chart's data channel receives the series
        crosses : adapter -> chart          fail: DATA_CHANNEL_EMPTY
  B7  the SOURCE STRING travels with the series into the UI
        (trade-relay.md:62-69's contract: the panel always says which)
```

**The step that makes B2 legal.** `broker-sdk`'s own capability matrix is the precedent (`broker-sdk.md:91`): Alpaca and Tradier serve bars; every other broker *"rejects with `UnsupportedCapabilityError`"*, and callers are told to check ahead with `supportsBars(brokerId)` or the `supportsBars` flag on `listBrokers()` — i.e. **ask first, and refuse loudly**. The MT5 leg is in exactly that position today: its capability is absent (`grep -rn 'copy_rates|get_rates|candle|OHLC' python/ src/` over the bridge → **0 rows**), so `supportsBars('mt5')` must return **false** until the read exists, and B2 must take the next step rather than pretend.

### 3.3 · TRACE-INDICATOR — the indicator apply (the AGPL crossing)

```
  I1 the SPA holds `source` (the v8's Pine-compatible text, emitted per
    week)
  I2  the SPA POSTs { script, bars } to :8503
        ======== THE AGPL BOUNDARY IS CROSSED HERE, DATA ONLY ========
        the payload carries NO path, NO credential, NO callback
        fail: AGPL_BOUNDARY_VIOLATION  (any non-data field present)
  I3  Station B transpiles + executes the script
        crosses : Pine-compatible source -> plots fail:
          PINE_TRANSPILE_FAILED
  I4  Station B returns { plots, drawings, trades }
        plots   : named series (PineTS.md:100)
        drawings: box/line/label/table/linefill/polyline
        trades  : one per order fill (Vela-pinets.md:119-123)
  I5  the SPA hands them to the chart's indicator layer
        crosses : Station B -> chart        fail: ENGINE_NOT_REGISTERED
  I6  the legend is READ BACK (the freshness proof, not an assumption)
        fail: PINE_LEGEND_STALE  (a row drawn for a script that did not run)
  I7  the drawn object count is compared to the report's row count
        fail: REPORT_INDICATOR_DIVERGENCE
```

**Why I6 and I7 exist as separate steps.** I6 is the freshness proof the set teaches: the `runIndicator` contract is *"structured errors, no dead legend rows"* (`Vela-pinets.md:103`), so a legend row is a *claim* that something rendered, and the read-back is what makes it evidence. I7 is the divergence law, and it is the operator's own: *"the report feeds the indicator. The indicator is the visualized report data on the chart directly"* (`29:§3`) — therefore **a report row with no drawn element, or a drawn element with no report row, is `REPORT_INDICATOR_DIVERGENCE`** (named verbatim in `29:§3`). Two sources, one truth; the check is the equality of their counts.

### 3.4 · TRACE-REPLAY — the replay step

```
  R1  the operator sets the anchor (Monday London session open) — REQUIRED
        crosses : UI -> controller          fail: ANCHOR_UNSET
  R2  the controller loads the full series for the anchored week
  R3  the controller sets cursor = anchor, visible = series[0..cursorIdx]
  R4  the chart receives ONLY `visible`
        fail: REPLAY_LOOKAHEAD_LEAK  (any consumer holding bars > cursor)
  R5  the indicator layer re-runs on `visible` (I2..I5 again)
  R6  the ticket's price basis is bound to the last CLOSED bar of `visible`
  R7  step / pace mutate cursor; each mutation is a fresh R3..R6
  R8  the frame is capturable for the vision loop (S9.3's evidence pair)
```

**Why R4 is the load-bearing line.** Everything replay is worth depends on it. The set has an exact precedent for the *shape* of this class of defect being counted rather than argued about: the ViL's recurring-bug instrument is *"`delta_frequency = weeks_with_delta / 10`"* with *"≥3/10 → a SYSTEMATIC class (fix the invariant, not the instance)"* (`29:§2`). A lookahead leak is a **systematic** defect by construction: it contaminates every frame it touches, so it must be caught as an invariant (a check), never as an observation.

### 3.5 · TRACE-ORDER — the order

```
  O1  the operator (or the pipeline's report) names a setup:
        { symbol, side, volume, sl?, tp?, priceBasis }
  O2  the ticket validates BEFORE any interpolation (the sidecar's law):
        pair   in the allowlist          fail: PAIR_NOT_ALLOWED
        volume = parseFloat, isFinite    fail: ORDER_INVALID_VOLUME
        sl/tp nulled unless finite (silent coercion to null, by design)
  O3  the mode is chosen: PAPER (S2.6) or LIVE (S2.7)
  O4  LIVE: the command is `market_buy` / `market_sell`
        crosses : ticket -> bridge/handlers  fail: MT5_DISCONNECTED
  O5  the bridge builds TRADE_ACTION_DEAL:
        deviation 20 · magic 234000 · comment "plutus"
        ORDER_TIME_GTC · filling mode resolved from the symbol
  O6  the result payload returns verbatim:
        { order_id, position_id, ticket, deal, price, volume, symbol,
          message }
  O7  the ticket shows the broker's own ticket number (never a local id)
  O8  the fill is written to the journal as an execution (S3.7)
```

**The one refusal that must be visible, not silent.** Limit orders are refused by the current bridge with a hardcoded message (`electron/main.js:474`) and by the browser polyfill as stubs (`browser-polyfill.js:303-319`). The ticket therefore has three states, not two: **live-market (available), live-limit (refused, with the bridge's own reason), paper (always available).** A greyed control with a reason is a contract; a control that fails on submit is a trap.

### 3.6 · TRACE-FILL — the fill

```
  F1  a fill request arrives: { order, priceBasis, barAtOrAfterCursor }
  F2  the engine resolves the price:
        PAPER : from the bar at/after the cursor, per the declared basis
        LIVE  : from the broker's own reported fill price (O6)
        fail: FILL_PRICE_BASIS_UNDECLARED · FILL_NO_PRICE
  F3  the engine applies the commission model (declared, never implied)
  F4  the engine applies the contract multiplier (declared, never implied)
  F5  a FILL is emitted: { id, ts, symbol, side, qty, price, fee, source }
  F6  the FILL becomes an EXECUTION (the journal's primitive)
  F7  executions -> buildRoundTrips(executions, { method })
        fail: ROUNDTRIP_UNPAIRED (a sell with no entry: ignore, never guess)
  F8  the chart paints the marker: one per fill, one per ledger-slice merge
        (Vela-pinets.md:119-123: a reversal paints ONE entry with the
         summed quantity; an exit closing several lots FIFO paints ONCE)
```

**Why F7's failure is `ignore, never guess`, and why that is a law rather than an opinion.** Three independent components in the set state the same rule, which is what makes it a law of the domain rather than a preference: `broker-sdk`'s stats engine *"does FIFO round-trip matching … A sell with no recorded buy is ignored, never guessed at"*; its CSV path *"is strict on rows (anything unreadable is skipped and counted, never guessed)"*; trade-relay's Tape draws an unpaired sell *"as an unpaired marker"* rather than inventing an entry. The workstation adopts all three verbatim: **an unpaired leg is a visible gap, never a fabricated pair.**

### 3.7 · TRACE-JOURNAL — the journal write

```
  J1  executions arrive from exactly one of three sources:
        broker-sync (read-only, broker-sdk)  ·  statement import  ·  manual
  J2  the import path auto-detects the format (14 documented formats)
        fail: IMPORT_FORMAT_UNRECOGNIZED -> offer the column mapper
  J3  skipped rows are COUNTED and surfaced (never guessed)
        fail: IMPORT_ROWS_SKIPPED  (a warning with a count, not an error)
  J4  duplicate executions are DEDUPED within an account
  J5  buildRoundTrips -> trades   (FIFO / LIFO / WAVG, per account)
  J6  computeMetrics(trades, { timeZone }) -> the metric set
  J7  computeEdgeScore(metrics) -> the versioned score
  J8  the conditional question goes to edge-stats, NOT to the metrics:
        P(outcome | conditions) + N + Wilson 95% CI + stability + per-year
        fail: SAMPLE_TOO_SMALL (warn < 30) · ESTIMATE_REFUSED (none < 10)
  J9  the write lands in the local store (SQLite for the journal,
        DuckDB/parquet for the statistics) — never a hosted service
```

**The timezone is a first-class input, and it is two fields, not one.** trade-journal separates **Display timezone** from **Default import timezone** and lets each file override its statement zone, with the preview showing converted execution times before saving (`trade-journal.md:187-189`). The workstation copies both fields verbatim (§8.2): a single timezone is how a correct import silently produces wrong day buckets — and the day bucket is what every calendar, every day-win rate and every weekday breakdown reads.

---

## §4 · TYPES AND ENGINE CHECKS

### 4.1 · The data contracts

All types are [PROPOSED] except where an anchor names the published shape they copy. The rule for every one of them: **the shape is borrowed, not invented** — a type that diverges from the component that produces it is a translation layer that will drift.

```ts
// ---- THE BAR (one shape, three producers) -------------------------------
// shape copied verbatim from broker-sdk's fetchBars result
   (broker-sdk.md:87):
// [{ time, open, high, low, close, volume }, ...] time = bar OPEN, epoch ms
type Bar = {
  time:   number;   // the BAR OPEN, epoch ms  (OLDEST-FIRST ordering)
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
};

// ---- THE SERIES (bars PLUS their provenance) ---------------------------
// the source field is NOT optional: trade-relay.md:63-69 makes "the panel
// always says which" a contract, not a nicety.
type BarSeries = {
  symbol:    string;
  timeframe: string;              // '1'|'5'|'15'|'60'|'240'|'1D'|'1W'|'1M'
  source:    BarsSource;
    // 'mt5' | 'alpaca' | 'tradier' | 'binance'
                                  // | 'coinbase' | 'hyperliquid' | 'custom'
  bars:      Bar[];               // oldest-first, gapless within the window
  asOf:      number;              // the wall-clock the read completed
  cursor?:   number;              // present ONLY under replay (S2.5)
};

// ---- THE PROVIDER INTERFACE (the one seam every source implements) -----
type BarsRequest = {
  symbol:    string;
  timeframe: string;
  from?:     number;              // epoch ms, inclusive
  to?:       number;              // epoch ms, inclusive
  limit?:    number;              // broker-sdk's alternative to from/to
};
interface BarsProvider {
  readonly id:      BarsSource;
  supportsBars(symbol: string): boolean;   // ASK FIRST (broker-sdk.md:91)
  fetchBars(req: BarsRequest): Promise<BarSeries>;
    // throws, never substitutes
  /* the ONE refusal a provider must be able to raise, named by the set:
     UnsupportedCapabilityError — broker-sdk.md:91 */
}

// ---- THE INDICATOR OUTPUT (the AGPL crossing's return trip) ------------
type IndicatorOutput = {
  legend:    string[];            // the rendered rows (the freshness proof)
  plots: Record<string, { title: string; data: { time: number; value: number
    | null }[] }>;
  /* plots is PineTS's own shape: plots['NAME'].data (PineTS.md:100);
     the CLI's default output format is the same nesting
       (pinets-cli.md:279-292) */
  drawings:  Drawing[];
    // box | line | label | table | linefill | polyline
  trades:    TradeMarker[];
    // one per order fill (Vela-pinets.md:119-123)
  props:     Record<string, unknown>;
    // the declaration-props schema channel
};
type Drawing =
  | { kind: 'box'; priceTop: number; priceBottom: number; t0: number; t1:
    number }
  | { kind: 'line';     from: Pt; to: Pt }
  | { kind: 'label';    at: Pt; text: string }
  | { kind: 'table';    at: Pt; rows: string[][] }
  | { kind: 'linefill'; from: Bar['time']; to: Bar['time'] }
  | { kind: 'polyline'; points: Pt[] };
type Pt = { time: number; price: number };
type TradeMarker = { time: number; price: number; side: 'buy' | 'sell'; qty:
  number; label: string };

// ---- THE ORDER AND THE FILL (the execution pair) -----------------------
type OrderRequest = {
  symbol:     string;
  side:       'buy' | 'sell';
  volume:     number;             // parseFloat + isFinite validated (S2.7)
  type:       'market' | 'limit';
    // 'limit' -> ORDER_LIMIT_UNSUPPORTED today
  limitPrice?: number;            // nulled unless finite (S2.7)
  sl?:        number | null;
  tp?:        number | null;
  priceBasis: 'bid' | 'ask' | 'mid' | 'last';   // REQUIRED, no default
  accountId:  string;             // every fill lands in a named account
};
type Fill = {
  id:     string;
  ts:     number;
  symbol: string;
  side:   'buy' | 'sell';
  qty:    number;
  price:  number;
  fee:    number;
    // the DECLARED commission, never assumed 0
  source: 'paper' | 'mt5';
  brokerTicket?: number;          // the broker's own id, live only
};

// ---- THE POSITION AND THE ROUND TRIP (the journal's primitive) ---------
type Position = { symbol: string; qty: number; avgPrice: number; openTs:
  number; accountId: string };
// RoundTrip and Metric are NOT redefined here: they are journal-core's own
// published types (trade-journal.md:231: "pure domain engine (round trips,
// metrics, calendar, Edge Score). No IO, no framework, fully unit-tested").
// Re-declaring them would create the second source of truth this build
   forbids.
type Method = 'fifo' | 'lifo' | 'wavg';   // trade-journal.md:125

// ---- THE REPLAY STATE (G1's own type — the one truly new contract) -----
type ReplayState = {
  seriesKey:  string;             // symbol+timeframe the state belongs to
  anchorTs:   number;
    // Monday London session open, PINNED (S2.5)
  cursorTs:   number;             // the frontier; nothing > this is visible
  pace:       number | 'step';    // ms per bar, or manual stepping
  playing:    boolean;
  visibleEnd: number;             // == the index of cursorTs, always
};
```

### 4.2 · The engine checks, in execution order

Every check names its subject, its predicate, and its token. A check that cannot fail is not a check; each row below has a reachable failing input.

| # | The check | The predicate | The failing input (a real one) | The token |
|---|---|---|---|---|
| CHK-1 | config schema | every field in S8.2 validates; unknown keys REFUSE | a config with a typo'd key that silently does nothing | `CONFIG_INVALID` |
| CHK-2 | license boundary | Station B declares AGPL-3.0 and imports no Station-A path | a convenience `import` of a Station-A helper into the Pine station | `AGPL_BOUNDARY_VIOLATION` |
| CHK-3 | Vela attribution | the watermark shows, or an equivalent named+linked notice is on the same screen | `attribution: false` with no substitute notice (`Vela.md:192-196`) | `ATTRIBUTION_MISSING` |
| CHK-4 | rail declaration | every rail is set **or** loosened by a flag naming what it does | a config that simply omits the kill switch | `RAIL_UNDECLARED` |
| CHK-5 | provider capability | `supportsBars(symbol)` is asked **before** `fetchBars` | calling `fetchBars` on a broker with no market-data endpoint | `BARS_UNSUPPORTED` |
| CHK-6 | bar order + time base | monotonic `time`, oldest-first, `time` = bar OPEN | a provider returning newest-first, or `closeTime` in the `time` field | `BAR_ORDER_INVALID` |
| CHK-7 | series provenance | every `BarSeries` carries a non-empty `source` | a series assembled from two sources with one label | `BARS_SOURCE_ABSENT` |
| CHK-8 | chart readiness | the indicator apply happens after `ready()` | `addIndicator` before the chart resolved its data channel | `CHART_NOT_READY` |
| CHK-9 | legend freshness | the read-back legend contains the script's own declarations | a cached legend from the previous script (the "dead legend row" class) | `PINE_LEGEND_STALE` |
| CHK-10 | report↔indicator divergence | the drawn object count equals the report's row count | 5 zones emitted, 4 boxes drawn | `REPORT_INDICATOR_DIVERGENCE` |
| CHK-11 | drawing namespace coverage | every drawing kind the script uses is in the declared set | a script using a primitive outside box/line/label/table/linefill/polyline | `DRAWING_NAMESPACE_MISSING` |
| CHK-12 | replay frontier (RP) | **no consumer** holds a bar with `time > cursorTs` | the indicator engine fed the full series during replay | `REPLAY_LOOKAHEAD_LEAK` |
| CHK-13 | replay anchor (RP) | `anchorTs` is set and equals the run's declared anchor | two runs at 06:00 and 08:00 UTC compared as if identical | `ANCHOR_MISMATCH` |
| CHK-14 | fill basis (RP/paper) | the fill records its `priceBasis` | a fill priced at 'the price' with no basis | `FILL_PRICE_BASIS_UNDECLARED` |
| CHK-15 | commission + multiplier | both are declared in the account config | a P&L computed with an implicit zero fee | `COMMISSION_MODEL_UNDECLARED` / `MULTIPLIER_UNDECLARED` |
| CHK-16 | order input coercion | volume finite, sl/tp finite-or-null, ticket an int | a raw request field reaching an interpolation site (`server.ts:239-245`, `:271-273`) | `ORDER_INVALID_VOLUME` / `ORDER_INVALID_TICKET` |
| CHK-17 | limit-order posture | the limit control is either working or visibly refused with the bridge's reason | a limit order accepted by the UI and refused by the bridge | `ORDER_LIMIT_UNSUPPORTED` |
| CHK-18 | chain liveness | `health` answers `connected: true` before any live write | an order posted while the bridge is in disconnected mode | `MT5_DISCONNECTED` |
| CHK-19 | round-trip pairing | an unpaired leg stays unpaired and visible | a fabricated entry to make a sell round-trip | `ROUNDTRIP_UNPAIRED` |
| CHK-20 | sample-size honesty | no percentage prints without N; warn < 30; refuse < 10 | a 4-session win rate quoted as a percentage | `SAMPLE_TOO_SMALL` / `ESTIMATE_REFUSED` |
| CHK-21 | timezone pair | display tz **and** import tz are both set | an import bucketed in the wrong day because only one tz exists | `TZ_UNDECLARED` |
| CHK-22 | capture byte-exactness | the vision evidence has a byte count, a magic check and a sha | a verdict rendered on a transcript string instead of the PNG | `VIL_UNEXTRACTED` |

**The check that is unusual, and why it earns its place.** CHK-12 has no analogue in any single component of the set, because **no component in the set owns a replay controller** (G1). Every other check is either copied from a component's own refusal (CHK-5/6/16/17/18/19/20/21) or copied from the ViL law (CHK-22). CHK-12 is the one check this build must invent, and it is the one that decides whether replay means anything.

---

## §5 · INVOKE PSEUDOCODE (every nontrivial mechanism)

Form: **condition-as-line** (`IF <predicate> -> <action>`), **2-space indent** per level, **no braces**. A line that is not a condition is an assignment or an emit. Every block ends with its refusals, because a mechanism that cannot refuse is a mechanism that cannot be trusted.

### 5.1 · The MT5 bars adapter [PROPOSED] (G2's mechanism)

```
INVOKE mt5_bars_adapter(request):

  # ---- the capability gate (the broker-sdk posture, copied verbatim) ----
  IF NOT mt5_session_is_subscribed(request.symbol) -> RAISE
    SYMBOL_NOT_SUBSCRIBED
  IF NOT mt5_timeframe_is_supported(request.timeframe) -> RAISE
    TIMEFRAME_UNSUPPORTED
  IF mt5_bridge_has_bars_command() IS FALSE -> RAISE BARS_SOURCE_ABSENT
      # today this branch is the ONLY reachable one: the bridge has 8
        handlers
      # (mt5_bridge.py:546/592/648/694/731/737/761/796) and NOT ONE returns
        bars.
      # The refusal is deliberate: the next step would be another source's
        candles.

  # ---- the read (once the bridge exposes it) ----------------------------
  frame = { "command": "<bars>", symbol, timeframe, from, to, limit }
  reply = bridge_request(frame, timeout = COMMAND_TIMEOUT_SECONDS)
      # the wire shape is the bridge's own, verbatim (mt5_bridge.py:29-33):
      #   Request  { "command": ..., ... }
      #   Response { "success": true, "data": {...} }
      #            { "success": false, "error": "..." }
  IF reply.success IS FALSE -> RAISE BARS_READ_FAILED(reply.error)

  # ---- normalization: ONE shape, ONE time base -------------------------
  bars = []
  FOR row IN reply.data.rows:
    bars.push({
      time:   row.bar_open_ms,        # the BAR OPEN, never the close time
      open:   row.o, high: row.h, low: row.l, close: row.c, volume: row.v,
    })
  IF NOT strictly_increasing(bars, by = '.time') -> RAISE BAR_ORDER_INVALID
      # broker-sdk's contract is 'oldest-first' (broker-sdk.md:87); a silent
      # reversal here produces a chart that draws history backwards and an
      # indicator whose lookbacks read the future.
  IF has_gap_within(bars, request.window) -> WARN BAR_GAP_UNFILLED
      # a WARN, not a RAISE: an unfilled gap is a market fact (weekend,
        halt),
      # but it MUST be visible because every 'N bars' downstream counts it.
  IF has_duplicate_time(bars) -> RAISE BAR_DUPLICATE_TIME

  RETURN {
    symbol: request.symbol, timeframe: request.timeframe,
    source: 'mt5', bars, asOf: now_ms(),
  }
      # the SOURCE field is mandatory: it is what makes the UI's label
        honest
      # (trade-relay.md:63-69).
```

**Why the refusal precedes the read.** The order matters. If the capability check came after the read, a failed read would be indistinguishable from a capability that never existed, and the temptation to *try another source* would be one line away. Putting the refusal first makes the adapter's contract **loud**: `BARS_SOURCE_ABSENT` is an answer the UI can render, and it is the truth today.

### 5.2 · The replay controller [PROPOSED] (G1's mechanism)

```
INVOKE replay_controller(series, config):

  IF config.anchorUtc IS UNSET -> RAISE ANCHOR_UNSET
      # no default. 29:§1 records the open alignment question (06:00
        pre-London
      # / 07:00 BST / 08:00 GMT) as UNRESOLVED; a default would silently
        pick one
      # and make every cross-run comparison suspect.
  IF config.pace IS NOT (a positive integer OR 'step') -> RAISE PACE_INVALID

  state = {
    seriesKey: series.symbol + ':' + series.timeframe,
    anchorTs:  config.anchorUtc,
    cursorTs:  config.anchorUtc,
    pace:      config.pace,
    playing:   false,
    visibleEnd: index_of(series.bars, config.anchorUtc),
  }
  IF state.visibleEnd IS NULL -> RAISE REPLAY_CURSOR_OUT_OF_RANGE

  # ---- the frontier: the ONE line every consumer depends on ------------
  INVOKE frontier(state) RETURNS bars:
    RETURN series.bars[0 .. state.visibleEnd]
      # INCLUSIVE of the cursor

  # ---- the frame: every consumer is re-fed, never patched -------------
  INVOKE emit_frame(state):
    window = frontier(state)
    chart.set_data(window)                 # NOT a patch: a full window swap
    IF indicator_engine IS registered:
      output = indicator_engine.run(script, window)   # I2..I5 of TRACE-I
      chart.set_indicator(output)
    ticket.bind_price_basis(window.last_closed)
      # never window.last_open
    paper_engine.set_price_window(window)
    ASSERT NO consumer holds series.bars[state.visibleEnd + 1 ..]
      IF FALSE -> RAISE REPLAY_LOOKAHEAD_LEAK
    RETURN window

  # ---- the four transported actions ------------------------------------
  ON step_forward:
    IF state.visibleEnd + 1 > LAST_INDEX -> RAISE REPLAY_END_OF_SERIES
    state.visibleEnd = state.visibleEnd + 1
    state.cursorTs   = series.bars[state.visibleEnd].time
    INVOKE emit_frame(state)

  ON step_back:
    IF state.visibleEnd - 1 < 0 -> RAISE REPLAY_START_OF_SERIES
    state.visibleEnd = state.visibleEnd - 1
    INVOKE emit_frame(state)

  ON scrub_to(ts):
    index = index_of(series.bars, ts)
    IF index IS NULL -> RAISE REPLAY_CURSOR_OUT_OF_RANGE
    state.visibleEnd = index
    INVOKE emit_frame(state)      # a scrub is a step, repeated

  ON play:
    state.playing = true
    LOOP WHILE state.playing:
      INVOKE step_forward_when(pace_interval_elapsed(state.pace))
      IF state.visibleEnd IS LAST_INDEX: state.playing = false

  # ---- the anchor guard -------------------------------------------------
  INVOKE assert_comparable(run_a, run_b):
    IF run_a.anchorTs IS NOT run_b.anchorTs -> RAISE ANCHOR_MISMATCH
      # 29:§1: 'A different anchor = a different prediction = an
      # incomparable week.' This is the check that enforces that sentence.

  RETURN { state, emit_frame, step_forward, step_back, scrub_to, play, pause
    }
```

**Why `chart.set_data(window)` and not an incremental patch.** A patch is faster, and a patch is where lookahead hides: a patch leaves the old, longer buffer in place and the difference between *what is drawn* and *what is loaded* becomes invisible. A window swap makes the two identical by construction. The set's own replay vocabulary (restart / play-pause / stepping / speed / scrubbing, `trade-journal.md:192`) is a **UI** contract and says nothing about the buffer; the buffer is where the correctness lives.

### 5.3 · The paper-fill engine [PROPOSED] (R2's mechanism)

```
INVOKE paper_fill_engine(order, window, account):

  # ---- the four declared inputs come FIRST, before any arithmetic -----
  IF order.priceBasis IS UNSET -> RAISE FILL_PRICE_BASIS_UNDECLARED
  IF account.commissionModel IS UNSET -> RAISE COMMISSION_MODEL_UNDECLARED
  IF account.needsMultiplier AND account.multiplier IS UNSET
                                          -> RAISE MULTIPLIER_UNDECLARED
  IF account.slippagePolicy IS UNSET      -> note SLIPPAGE_POLICY_UNDECLARED
      # a NOTE, not a RAISE: the engine still runs, and the RESULT carries
      # the token so no reader can mistake the result for slippage-modelled.

  # ---- the price ------------------------------------------------------
  IF order.type IS 'market':
    bar = first_bar_at_or_after(window, order.placedAt)
    IF bar IS NULL -> RAISE FILL_NO_PRICE
    raw = pick(bar, order.priceBasis)
      # open|high|low|close vs bid/ask/mid
  IF order.type IS 'limit':
    bar = first_bar_touching(window, order.limitPrice)
    IF bar IS NULL -> RETURN { status: 'unfilled', reason:
      'limit_not_touched' }
    raw = order.limitPrice
      # an unfilled limit is a RESULT, not an error: returning a fill here
      # would be the single most damaging silent lie in the whole
        workstation.

  # ---- the cost ------------------------------------------------------
  price = apply_slippage(raw, account.slippagePolicy, order.side)
  fee   = account.commissionModel.compute(order.volume, price, account)
  ASSERT fee IS A NUMBER AND fee >= 0

  fill = {
    id: uid(), ts: bar.time, symbol: order.symbol, side: order.side,
    qty: order.volume, price, fee, source: 'paper',
  }

  # ---- the book (journal-core's primitive, not a second one) ----------
  execution = to_execution(fill, account.id)
  trades = buildRoundTrips(account.executions + [execution], { method:
    account.method })
      # trade-journal.md:259 — the SAME call the live path makes.
  metrics   = computeMetrics(trades, { timeZone: account.displayTz })
  edge      = computeEdgeScore(metrics)

  RETURN { fill, trades, metrics, edge, notes: collected_notes }
      # notes carries SLIPPAGE_POLICY_UNDECLARED, MULTIPLIER_ASSUMED, ...
      # so the paper result is never cleaner than the paper model.
```

**Why an unfilled limit returns a result rather than throwing.** Every other refusal in this document is a raise, because every other refusal means *the request was wrong*. An untouched limit means *the request was right and the market did not cooperate* — that is information, and a paper strategy whose un-filled limits are counted as fills is a strategy with a fabricated win rate. The set draws the same line in a different place: edge-stats' non-goals include *"No predictions and no advice"* (`edge-stats.md:164`) — the engine reports what happened, including *nothing happened*.

### 5.4 · The order router (the paper/live fork)

```
INVOKE order_router(order):

  # ---- pre-flight: the sidecar's validation, copied verbatim -----------
  # (plutus-sidecar/server.ts:239-245 and :271-273 — the file's own comment
  #  names the defect this closes: 'the old handler interpolated raw request
  #  fields into a python -c exec — an injection hole.')
  IF order.symbol NOT IN PAIR_ALLOWLIST -> RAISE PAIR_NOT_ALLOWED
  volume = parseFloat(order.volume)
  IF NOT isFinite(volume) -> volume = DEFAULT_VOLUME
    # 0.01, the file's own
  sl = (isFinite(parseFloat(order.sl)) ? order.sl : null)
  tp = (isFinite(parseFloat(order.tp)) ? order.tp : null)
  IF order.mode IS 'live' AND NOT Number.isInteger(parseInt(order.ticket,
    10))
                                          -> RAISE ORDER_INVALID_TICKET

  # ---- the mode fork ---------------------------------------------------
  IF order.mode IS 'paper':
    RETURN paper_fill_engine(order, window_of(order), account_of(order))

  IF order.mode IS 'live':
    IF order.type IS 'limit' -> RAISE ORDER_LIMIT_UNSUPPORTED
        # the bridge refuses it with its own words (electron/main.js:474):
        # 'Limit orders not yet supported by ZMQ bridge. Use market orders.'
        # The ticket must SHOW this, not discover it on submit.
    IF NOT chain_health().connected -> RAISE MT5_DISCONNECTED
        # the verbatim disconnected string is the grep target:
        # mt5_bridge.py:950-954
    IF kill_switch_engaged() -> RAISE KILL_SWITCH_ENGAGED
    command = (order.side IS 'buy') ? 'market_buy' : 'market_sell'
    reply = mt5_request(command, {
      pair: order.symbol, volume, sl, tp,
    })
        # the bridge builds TRADE_ACTION_DEAL, deviation 20, magic 234000,
        # comment 'plutus', ORDER_TIME_GTC, filling resolved from the symbol
        # (mt5_bridge.py:564-577).
    IF reply.success IS FALSE -> RAISE ORDER_REFUSED_BY_BROKER(reply.error)
    fill = {
      id: uid(), ts: now_ms(), symbol: order.symbol, side: order.side,
      qty: reply.data.volume, price: reply.data.price, fee:
        account_fee(reply),
      source: 'mt5', brokerTicket: reply.data.ticket,
    }
        # the result payload is verbatim: { order_id, position_id, ticket,
        # deal, price, volume, symbol, message } (18:§1.2).
    RETURN { fill, broker: reply.data }

  RAISE ORDER_MODE_UNKNOWN
```

**Why the router is a fork and not a flag.** With one code path and a boolean, the paper path is the path that gets exercised and the live path is the path that gets trusted — the classic asymmetry. As two named branches, the live branch's four guards (limit, health, kill switch, broker refusal) are visible in the source of the mechanism that can lose money, and the paper branch's four declarations (basis, commission, multiplier, slippage) are visible in the mechanism that can mislead. Each branch is auditable on its own terms.

### 5.5 · The indicator bench (G4's mechanism — the 8-check audit under PineTS)

```
INVOKE indicator_bench(pine_source, week_bars, reference_output):

  # ---- the audit: the SAME 8 checks the pipeline runs today -----------
  # (28:§1.2 anchors the emitter: PineScriptGenerator.verify(code, data)
  # returning {passed, total, failures, evidence}; 552L, verify at
    :395-420.)
  report = PineScriptGenerator.verify(pine_source, week_bars)
  IF report.passed < report.total -> RECORD
    BENCH_AUDIT_FAIL(report.failures)

  # ---- the transpile + execute, BOTH engines, same source -------------
  inproc = run_with(new PineEngine(),  pine_source, week_bars)
      # Vela-pinets.md:37-38 — in-process, on the chart's thread.
  worker = run_with(new PineWorkerEngine(), pine_source, week_bars)
      # Vela-pinets.md:39-41 — the same Pine semantics in a Web Worker.
  IF inproc.plots IS NOT worker.plots -> RAISE BENCH_ENGINE_DIVERGENCE
      # if the two engines disagree, the disagreement is the finding, and
      # nothing downstream may be trusted until it is explained.

  # ---- the per-function fidelity probes (31:§5 residual 4) ------------
  FOR probe IN ['request.security', 'barstate', 'table_render',
    'cross_pair_guard']:
    got = extract(inproc, probe)
    IF got IS NULL -> RECORD BENCH_PROBE_UNSUPPORTED(probe)
    IF got IS NOT reference_output[probe] -> RECORD BENCH_PROBE_DELTA(probe)
        # a named delta, never 'looks off' (28:§2.3's named-delta law:
        # '<component> <wrong-relationship> <frame-location> [+ severity]').

  # ---- the drawing-namespace census -----------------------------------
  used = drawing_kinds_used(pine_source)
  declared = ['box','line','label','table','linefill','polyline']
  IF used MINUS declared IS NOT EMPTY -> RAISE DRAWING_NAMESPACE_MISSING
      # the declared set is PineTS's own badge class (PineTS.md:303-308).

  # ---- the toggles: the four gates the v8 ships (28:§0.2) -------------
  FOR toggle IN ['show_zones','show_lsz','show_options','show_table']:
    out = run_with(inproc, pine_source, week_bars, { props: { [toggle]:
      false } })
    IF out.plots IS NOT EMPTY AND out.drawings IS NOT EMPTY
      -> RECORD BENCH_TOGGLE_INEFFECTIVE(toggle)
        # the v8's four toggles default TRUE and the script COMPILES with
        # all four off (28:§0.2, 'declarations independent of draws').
        # A toggle that does not remove its layer is an unarmed control.

  RETURN { report, inproc, worker, probes, toggles, deltas }
```

**Why the bench runs BOTH engines before anything is believed.** The single-engine run proves that *a* runtime produced the picture. The two-engine run proves that *the runtime* did: a divergence means one of them is wrong, and the bench cannot yet say which — so the divergence is the finding and the bench stops there. This mirrors the ViL's own instrumentation law: a verdict produced by an instrument whose validity was never established is not a verdict (`28:§0.1`'s law of grades; Grade 1 and 2 are printed *preconditions*, never the render).

---

## §6 · TREES

### 6.1 · The component tree

```
THE PLUTUS CHART WORKSTATION
|
+-- STATION A  (Apache-2.0 + MIT — the distributable host)
|   |
|   +-- the chart surface
|   |   +-- @luxalgo/vela            . . . headless core      Apache-2.0
|   |   +-- @luxalgo/vela/workspace  . . . the app shell      Apache-2.0
|   |   +-- @luxalgo/vela/ui         . . . the component kit  Apache-2.0
|   |   +-- @luxalgo/vela/plugin     . . . the SDK seam       Apache-2.0
|   |   `-- providers/{binance,coinbase,hyperliquid}         Apache-2.0
|   |
|   +-- the data legs
|   |   +-- @luxalgo/broker-sdk      . . . connect/fetchAll/fetchBars   MIT
|   |   |   `-- fetchBars: ALPACA + TRADIER only
|   |   `-- mt5-bars-adapter [PROPOSED] . the operator's MT5 leg
|   |       `-- -> plutus-mt5 chain (the operator's licensed terminal)
|   |
|   +-- the book of record
|   |   +-- @luxalgo/journal-core       . round trips + metrics   MIT
|   |   |   `-- buildRoundTrips / computeMetrics / computeEdgeScore
|   |   +-- @luxalgo/journal-importers  . 14 formats incl. MT4/MT5  MIT
|   |   `-- @luxalgo/prop-firm-sim-core . Monte Carlo odds   MIT
|   |
|   +-- the statistics store
|   |   `-- edge-stats  . P(outcome|conditions) + N + Wilson CI    MIT
|   |
|   +-- the alert rail (optional)
|   |   `-- trade-relay :8484  . alert -> rails -> order -> tape    MIT
|   |
|   `-- the workstation's own code [PROPOSED]
|       +-- workstation-supervisor   . the boot (2.1)
|       +-- replay-controller        . G1 (2.5)
|       +-- paper-fill-engine        . R2 (2.6)
|       +-- order-ticket             . R4 (2.7)
|       `-- mt5-bars-adapter         . G2 (2.2)
|
`-- STATION B  (AGPL-3.0 — SEPARATE PROCESS, DATA ONLY CROSSING)
    |
    +-- pinets                     . the Pine-compatible runtime  AGPL-3.0
    +-- @luxalgo/vela-pinets       . the engine addon            AGPL-3.0
    |   +-- PineEngine            . . in-process
    |   `-- PineWorkerEngine      . . off the main thread
    `-- pinets-cli [optional]      . a headless bench instrument  AGPL-3.0

THE ONE RULE ACROSS THE `|`: nothing but DATA crosses.
  into B : { script, bars, props }
  out of B: { plots, drawings, trades, legend, notes }
  NEVER  : a path, a credential, a callback, a socket, an import.
```

### 6.2 · The file tree of the workstation's own code [PROPOSED]

Everything below is new code. The pattern is deliberate: **one file per engine check family**, so a failing check names its owner file without a search.

```
workstation/
|-- package.json              # workspaces: station-a, station-b, pkgs/*
|-- workstation.config.jsonc  # the schema'd config (S8.2)
|-- supervisor/
|   |-- index.ts              # the boot: B-1..B-9 (S2.1)
|   |-- license-boundary.ts   # CHK-2  the AGPL assertion
|   |-- rail-table.ts         # CHK-4  every rail SET or LOOSENED
|   `-- station-report.ts     # the boot's printed state
|-- data/
|   |-- provider.ts           # the BarsProvider interface (S4.1)
|   |-- registry.ts           # the B2 resolution order (S3.2)
|   |-- adapters/
|   |   |-- vela-bundled.ts   # binance/coinbase/hyperliquid passthrough
|   |   |-- broker-sdk.ts     # supportsBars -> fetchBars
|   |   `-- mt5-bars.ts       # G2  [PROPOSED]
|   |-- normalize.ts          # CHK-6/7  time base + provenance
|   `-- store.ts              # (symbol,timeframe,year) partitions
|-- chart/
|   |-- mount.ts              # Vela core / workspace bring-up (S2.3)
|   |-- attribution.ts        # CHK-3  the Vela NOTICE duty
|   `-- channels.ts           # data + indicator + trade channels
|-- indicator/
|   |-- bridge.ts             # the :8503 data-only crossing (S3.3)
|   |-- legend-read.ts        # CHK-9  the freshness proof
|   `-- divergence.ts         # CHK-10 report <-> drawing count
|-- replay/
|   |-- controller.ts         # G1  S5.2
|   |-- frontier.ts           # CHK-12 the lookahead guard
|   `-- anchor.ts             # CHK-13 the anchor pin
|-- exec/
|   |-- ticket.ts             # G3  the order ticket UI
|   |-- router.ts             # S5.4 the paper/live fork
|   |-- paper-fill.ts         # S5.3
|   |-- validate.ts           # CHK-16 the coercion copy
|   `-- kill-switch.ts        # the stop, with its own config flag
|-- journal/
|   |-- ingest.ts             # TRACE-J  J1..J4
|   |-- roundtrips.ts         # journal-core's calls, no re-implementation
|   `-- tz.ts                 # CHK-21 the display/import pair
|-- station-b/                # == THE AGPL PROCESS. No imports from ../
|   |-- server.ts
  # :8503 {script,bars} -> {plots,drawings,trades}
|   `-- engines.ts            # PineEngine / PineWorkerEngine selection
`-- bench/
    |-- indicator-bench.ts    # G4  S5.5
    `-- fixtures/             # weeks + reference outputs (never fabricated)
```

**The one directory with a rule instead of a description: `station-b/`.** Its header comment is the law — *no imports from the parent tree* — and CHK-2 enforces it mechanically at boot. That is why `mt5-bars.ts` lives in `data/adapters/` and not near the bridge's client: the bridge client is where a stray `require` of a Station-A helper would be most natural and most fatal.

### 6.3 · The data-flow tree

```
THE OPERATOR'S REAL MARKET (the source of truth for prices)
|
+-- MT5 terminal (licensed by the operator, running in Wine, Xvfb :99)
|   `-- container plutus-mt5 . . . . . . . . . RPyC 127.0.0.1:2222
|       |                                         [--host 0.0.0.0 LAW]
|       `-- mt5_bridge.py . . . . . . . . . . ipc:///tmp/plutus-mt5.sock
|           |
|           +-- 8 handlers  . . . orders + positions + account + symbol
|           |   `-- market_buy . market_sell . close_position
|           |       modify_position . get_positions . get_account_info
|           |       get_symbol_info . health
|           `-- NO bars handler . . . . . . . . G2 [PROPOSED READ]
|
+-- broker-sdk fetchBars . . . . . . . . . . . ALPACA, TRADIER
|   `-- everything else: UnsupportedCapabilityError
|
+-- Vela bundled providers (keyless) . . . . . BINANCE, COINBASE,
|   `--                                          HYPERLIQUID
|
`-- the caller's own bars . . . . . . . . . . the `data` option (offline)
        |
        v
   +----------------------------------------------------------+
   | BarSeries { symbol, timeframe, source, bars, asOf }       |
   |   . source is MANDATORY  (the UI always says which)       |
   +----------------------------------------------------------+
        |
        +--> CHART (candles)                    [Station A]
        |      `-- drawn by Vela's native renderer
        |
        +--> INDICATOR input  --( :8503 )-->  STATION B (AGPL)
        |      `-- returns plots / drawings / trades as DATA
        |
        +--> REPLAY fronti`er (bar-first only)   [Station A]
        |
        `--> PAPER fill pricing (bar-at-or-after) [Station A]

THE BOOK OF RECORD
|
+-- executions (the ONLY primitive; broker-sync | import | manual | paper)
|   `-- deduped within an account
|       `-- buildRoundTrips(fifo|lifo|wavg)
|           +-- trades  -> the chart's trade layer + the calendar
|           +-- metrics -> computeEdgeScore
|           `-- executions -> edge-stats: P(outcome|conditions) + N + CI
|
`-- the live positions (a SEPARATE read: get_positions, never the journal)
    `-- the MT5 tab's table + the chart's position markers
```

**The distinction the last block makes, kept explicit.** *Executions* are the journal's primitive and they come from four sources. *Live positions* are broker state read directly from the chain. The built dashboard already reads the second (`refreshPositions()` on a 5 s cadence, `18:§1.6`) and the spec's chart reads **the same array** for its markers (`18:§2.1`, `updateChartMarkers`) — so the workstation keeps that identity: **a position marker on the chart and a row in the table are the same object, not two fetches that happen to agree.**

---

## §7 · LAWS AND INVARIANTS

Numbered, imperative, each with its anchor. A law without an anchor is an opinion; a law whose violation has no token is unenforceable. Every entry below has both.

| # | The law (imperative) | Its anchor | Its violation token |
|---|---|---|---|
| **L-1** | Name the system **the Plutus Chart Workstation**. Never call it a clone, a replica, or a copy of any hosted platform, and never describe reaching another platform's data. | the operator's naming law; `PineTS.md:47` carries the upstream disclaimer verbatim | (a naming violation is a document defect, not a runtime one) |
| **L-2** | Reference "TradingView" only as a factual trademark reference, and say **Pine-compatible** — never "Pine Script (theirs)". | the naming law; `PineTS.md:47`, `pinets-cli.md:38` | — |
| **L-3** | Run **PineTS and vela-pinets in a process of their own**. Only data crosses the boundary: `{script, bars, props}` in, `{plots, drawings, trades}` out. Never send a path, a credential, a callback, a socket, or an import. | `PineTS.md:448-449` (the copyleft trigger is distribution **or** network service); `Vela-pinets.md:172-173`; `31-THE-OSS-CHART-STACK.md:§3` ("the AGPL isolation … data-only crossing") | `AGPL_BOUNDARY_VIOLATION` |
| **L-4** | Keep Station B's source tree free of imports from Station A's. Assert it at boot, not by review. | L-3's anchors; the boot's B-2 | `AGPL_BOUNDARY_VIOLATION` |
| **L-5** | Honor Vela's NOTICE: keep the watermark visible, or show an equivalent named-and-linked attribution on the same screen. | `Vela.md:185-196` (the obligation and the single escape clause) | `ATTRIBUTION_MISSING` |
| **L-6** | Ask `supportsBars` before `fetchBars`, and let a missing capability refuse loudly. Never route around it. | `broker-sdk.md:91` (the capability matrix + `UnsupportedCapabilityError` + the `supportsBars` check-ahead) | `BARS_UNSUPPORTED` |
| **L-7** | Never fabricate a bar. A series the workstation did not receive does not exist on its chart. | `trade-relay.md:67` verbatim: *"the relay never fabricates a candle it did not see"* | `BARS_SOURCE_ABSENT` |
| **L-8** | Carry the bar series' **source string** into the UI on every surface that draws bars. | `trade-relay.md:62-69` (the four-rung ladder, each labelled) + `:69` (the `barsSource`/`barsTimeframe` fields) | `BARS_SOURCE_ABSENT` |
| **L-9** | Serialize bars as `{time, open, high, low, close, volume}` with `time` = the bar **open** in epoch ms, **oldest-first**. | `broker-sdk.md:87-88`; `pinets-cli.md:279-292` (the JSON candle format, required fields named) | `BAR_ORDER_INVALID` |
| **L-10** | Make the replay cursor the whole world: **no consumer** may hold a bar with `time > cursorTs`; every consumer is re-fed the frontier, never patched. | `29:§3` ("the forward price action does not yet exist") — the reason replay is the honest rehearsal; no upstream anchor exists because no upstream component owns a controller (G1) | `REPLAY_LOOKAHEAD_LEAK` |
| **L-11** | Pin the replay anchor explicitly (Monday London session open) with **no default**, and refuse to compare two runs whose anchors differ. | `29:§1` verbatim: *"mandatory default every single test is the same temporal anchor"* + the recorded 06:00/07:00/08:00 UTC open question | `ANCHOR_UNSET` / `ANCHOR_MISMATCH` |
| **L-12** | Return an **unfilled limit** as a result, never as a fill and never as an error. | the paper engine's own contract (S5.3); the refusal vocabulary of `trade-relay.md:71-83` (rails refuse, they do not approximate) | `FILL_NO_PRICE` (only when no bar exists at all) |
| **L-13** | Require **four** declared inputs before any paper arithmetic: price basis, commission model, contract multiplier (where applicable), slippage policy. An undeclared slippage policy is a printed note on the result. | `trade-journal.md:135` (fee and stop/target rules per account and symbol) + `:192` ("derivatives also need a contract multiplier") | `FILL_PRICE_BASIS_UNDECLARED` / `COMMISSION_MODEL_UNDECLARED` / `MULTIPLIER_UNDECLARED` |
| **L-14** | Leave an unpaired leg unpaired and visible. Never fabricate the other side. | `broker-sdk.md` ("A sell with no recorded buy is ignored, never guessed at"; CSV rows "skipped and counted, never guessed") + `trade-relay.md:58` (the unpaired marker) | `ROUNDTRIP_UNPAIRED` |
| **L-15** | Validate before interpolating **every** order field that reaches a shell or an exec site; copy the existing allowlist and coercions rather than inventing new ones. | `plutus-sidecar/server.ts:239-245` (the pair allowlist + `parseFloat`/`isFinite` + finite-or-null sl/tp) and `:271-273` (`parseInt` ticket); `18:§1.3` names the closed defect: *"an injection hole"* | `PAIR_NOT_ALLOWED` / `ORDER_INVALID_VOLUME` / `ORDER_INVALID_TICKET` |
| **L-16** | Show a refusal **at the control**, not on submit — a disabled limit control carries the bridge's own reason string. | `electron/main.js:474` (the hardcoded refusal, verbatim) + `browser-polyfill.js:303-319` (the four stubs) | `ORDER_LIMIT_UNSUPPORTED` |
| **L-17** | Never write to the broker without a passing `health` read and a clear kill switch. | `mt5_bridge.py:796` + `:930-935` (health is exempt from the connection gate) + `trade-relay.md:83` (the kill switch: *"One action stops everything, everywhere. Survives restarts"*) | `MT5_DISCONNECTED` / `KILL_SWITCH_ENGAGED` |
| **L-18** | Print no percentage without its sample size; warn below 30 sessions and refuse below 10. | `edge-stats.md:89-90` verbatim: *"There is no code path that prints a percentage without its sample size"* + the minimum-sample guards | `SAMPLE_TOO_SMALL` / `ESTIMATE_REFUSED` |
| **L-19** | Keep **display timezone** and **import timezone** as two separate settings, per file overridable. | `trade-journal.md:187-189` (the two fields + per-file override + the converted preview) | `TZ_UNDECLARED` |
| **L-20** | Make every rail a **boot-time assertion**: a rail is either set or loosened by a flag that admits what it does. A config that silently omits one fails to boot. | `trade-relay.md:74` verbatim: *"A config that neither sets a rail nor loosens it fails to boot"* | `RAIL_UNDECLARED` |
| **L-21** | Treat a drawn element and a report row as **one fact in two renderings**: either alone is a divergence. | `29:§3` verbatim: a report row with no drawn element, or a drawn element with no report row, is `REPORT_INDICATOR_DIVERGENCE` | `REPORT_INDICATOR_DIVERGENCE` |
| **L-22** | Never promote a **badge-declared** capability to a measured one. PineTS's drawing coverage is declared; only the bench makes it a measurement. | `PineTS.md:303-308` (the declared classes) vs `31-THE-OSS-CHART-STACK.md:§2` ("BADGE-DECLARED … NOT read this session") and `§5` residual 1 | `BENCH_PROBE_UNSUPPORTED` |
| **L-23** | Read the legend back after every indicator apply. A legend row is a claim; the read-back is the evidence. | `Vela-pinets.md:103` ("structured errors, **no dead legend rows**") | `PINE_LEGEND_STALE` |
| **L-24** | Keep the trade layer engine-free. Drawing fills, levels and markers must never require the AGPL station. | `luxalgo-mcp-server.md` (the trade-journal trade chart is described as engine-free, and `trade-journal.md:128` charts trade pages on Vela); `Vela-pinets.md:119-123` (strategy markers are the only trades that come from the engine) | (an architecture violation: the trade layer acquires a Station-B import) |
| **L-25** | Never let a capture stand in for a render. A screenshot is a transport; the verdict needs an independent vision-capable reader and a named delta. | `28:§2` (the three laws: extraction / independent reader / named delta) + `28:§0.1` (the grade ladder, and why Grade 1 fails hardest on a chart) | `VIL_UNEXTRACTED` / `VIL_BLIND_READER` |

**The law that is not in the table because it governs the table.** Every law above is stated as an **invariant over the artifact**, not as a procedure someone should follow. That is deliberate: a procedure decays when the person changes, an invariant is re-checked by a machine on every run. The checks in §4.2 are the mechanical form of these twenty-five laws; the mapping is in §9.1.

---

## §8 · ERROR VOCABULARY, SCHEMA, AND SHELL

### 8.1 · The frozen tokens

These strings are **frozen**: they are what a log line, a UI badge, a test name and a grep all agree on. A token is added to this table before it is raised anywhere.

| The stage | The token | What it means (the reader's takeaway) |
|---|---|---|
| BOOT | `CONFIG_INVALID` | the config did not validate; the failing key is named |
| BOOT | `AGPL_BOUNDARY_VIOLATION` | Station B crossed the license boundary — a non-data field, or an import from Station A |
| BOOT | `NOTICE_LICENSE_BOUNDARY` | a license obligation (Vela's NOTICE) is unmet in the config |
| BOOT | `ATTRIBUTION_MISSING` | the watermark is off and no equivalent notice is on screen |
| BOOT | `RAIL_UNDECLARED` | a rail was neither set nor explicitly loosened |
| BOOT | `PORT_TAKEN` | 8501 / 8502 / 8503 is occupied |
| BOOT | `MT5_CHAIN_DOWN` | the read-only `health` probe failed; the live leg is DISABLED |
| BOOT | `PROVIDER_ABSENT` | a configured data leg did not answer its reachability probe |
| DATA | `BARS_UNSUPPORTED` | this broker has no market-data endpoint (broker-sdk's own refusal class) |
| DATA | `BARS_SOURCE_ABSENT` | no source can serve these bars — and none will be substituted |
| DATA | `BARS_READ_FAILED` | the source answered with `success:false`; its message is carried |
| DATA | `SYMBOL_NOT_SUBSCRIBED` | the MT5 terminal is not synced to this symbol |
| DATA | `TIMEFRAME_UNSUPPORTED` | the source does not serve this timeframe |
| DATA | `BAR_ORDER_INVALID` | bars are not strictly increasing in `time`, or `time` is a close time |
| DATA | `BAR_DUPLICATE_TIME` | two bars share a `time` |
| DATA | `BAR_GAP_UNFILLED` | a gap inside the window (a warning, counts still matter) |
| CHART | `CHART_MOUNT_ABSENT` | the mount point does not exist |
| CHART | `CHART_NOT_READY` | work was attempted before `ready()` resolved |
| CHART | `DATA_CHANNEL_EMPTY` | the chart holds no series |
| CHART | `CANVAS_NOT_SETTLED` | a capture was attempted before the app's own repaint signal |
| INDICATOR | `PINE_TRANSPILE_FAILED` | the source did not transpile; the structured error names the line |
| INDICATOR | `PINE_UNSUPPORTED_FUNCTION` | the script uses a function the runtime does not cover |
| INDICATOR | `DRAWING_NAMESPACE_MISSING` | the script draws a primitive outside the declared set |
| INDICATOR | `ENGINE_NOT_REGISTERED` | no engine is registered for the script's language |
| INDICATOR | `PINE_LEGEND_STALE` | the legend does not show this script's declarations (a dead row) |
| INDICATOR | `REPORT_INDICATOR_DIVERGENCE` | the report's rows and the chart's drawn elements do not match |
| REPLAY | `ANCHOR_UNSET` | no temporal anchor was named (there is no default) |
| REPLAY | `ANCHOR_MISMATCH` | two runs are being compared under different anchors |
| REPLAY | `REPLAY_NO_SERIES` | nothing to replay |
| REPLAY | `REPLAY_CURSOR_OUT_OF_RANGE` | the cursor is not on a bar |
| REPLAY | `REPLAY_START_OF_SERIES` / `REPLAY_END_OF_SERIES` | a step ran off an end |
| REPLAY | `REPLAY_LOOKAHEAD_LEAK` | a consumer held bars beyond the cursor — every frame it produced is void |
| REPLAY | `PACE_INVALID` | the pace is neither a positive interval nor `step` |
| PAPER/LIVE | `FILL_NO_PRICE` | no bar exists at or after the placement |
| PAPER/LIVE | `FILL_PRICE_BASIS_UNDECLARED` | the fill has no declared basis |
| PAPER/LIVE | `COMMISSION_MODEL_UNDECLARED` | the P&L would be gross-with-no-label |
| PAPER/LIVE | `MULTIPLIER_UNDECLARED` | a derivative P&L without its multiplier |
| PAPER/LIVE | `SLIPPAGE_POLICY_UNDECLARED` | a note on the result: this fill assumes none |
| PAPER/LIVE | `ORDER_LIMIT_UNSUPPORTED` | the bridge refuses limits, in its own words |
| PAPER/LIVE | `ORDER_INVALID_VOLUME` / `ORDER_INVALID_TICKET` | a non-finite volume / a non-integer ticket |
| PAPER/LIVE | `PAIR_NOT_ALLOWED` | the pair is outside the allowlist |
| PAPER/LIVE | `ORDER_MODE_UNKNOWN` | neither paper nor live |
| PAPER/LIVE | `ACCOUNT_UNRESOLVED` | no account to book the fill into |
| LIVE | `MT5_DISCONNECTED` | the bridge is in disconnected mode (its verbatim string is attached) |
| LIVE | `ORDER_REFUSED_BY_BROKER` | the broker answered `success:false`; its message is carried |
| LIVE | `KILL_SWITCH_ENGAGED` | the operator's stop is on |
| JOURNAL | `IMPORT_FORMAT_UNRECOGNIZED` | no parser matched; offer the column mapper |
| JOURNAL | `IMPORT_ROWS_SKIPPED` | rows were unreadable and were counted, not guessed |
| JOURNAL | `ROUNDTRIP_UNPAIRED` | a leg with no counterpart, left visible |
| JOURNAL | `SAMPLE_TOO_SMALL` | below 30 sessions: warn |
| JOURNAL | `ESTIMATE_REFUSED` | below 10 sessions: no estimate is printed |
| JOURNAL | `TZ_UNDECLARED` | display or import timezone missing |
| BENCH | `BENCH_AUDIT_FAIL` | the 8-check audit reported failures |
| BENCH | `BENCH_ENGINE_DIVERGENCE` | the in-process and worker engines disagree — the finding, not a bug report |
| BENCH | `BENCH_PROBE_UNSUPPORTED` | a fidelity probe could not run |
| BENCH | `BENCH_PROBE_DELTA` | a named per-function delta against the reference |
| BENCH | `BENCH_TOGGLE_INEFFECTIVE` | a toggle did not remove its layer |
| VISION | `VIL_UNEXTRACTED` | the artifact was not extracted byte-exact before a verdict |
| VISION | `VIL_BLIND_READER` | the reader is not vision-capable; its verdict conforms and is void |
| VISION | `VIL_UNLOOKED` | a green score with no looked-at chart |

**The shape rule for a token.** Every token is `SCREAMING_SNAKE`, names its **subject** (`BAR_`, `PINE_`, `REPLAY_`, `ORDER_`, `BENCH_`, `VIL_`), and states the **condition**, never the remedy. A token that names a remedy (*"use_alpaca_instead"*) hides the decision inside the error; a token that names the condition leaves the decision where it belongs.

### 8.2 · The config schema [PROPOSED]

JSONC because the rail comments are load-bearing. **Every rail appears explicitly**: `false` and absent are different statements, and only one of them boots (L-20).

```jsonc
{
  "station": {
    "a": { "ui": 8501, "api": 8502 },
    "b": { "port": 8503, "license": "AGPL-3.0" }
      // asserted at boot (CHK-2)
  },

  "chart": {
    "engine": "workspace",        // 'core' | 'workspace'
    "theme": "dark",
    "attribution": {
      "watermark": true,           // RAIL: Vela's NOTICE duty (L-5)
      "equivalentNotice": null
        // set this INSTEAD of watermark, never both
    },
    "indicators": "./indicators.json"   // inline | url | loader path
  },

  "data": {
    "symbolPins": { "EURUSD+": "mt5" },   // the B2 first-match override
    "providers": {
      "mt5": { "enabled": true, "bridge": "ipc:///tmp/plutus-mt5.sock" },
      "alpaca":   { "enabled": false, "envKey": "BROKERS_ALPACA_API_KEY" },
      "tradier": { "enabled": false, "envKey":
        "BROKERS_TRADIER_ACCESS_TOKEN" },
      "binance":  { "enabled": true  },
      "coinbase": { "enabled": false },
      "hyperliquid": { "enabled": false },
      "custom":   { "enabled": true  }      // the `data` option path
    },
    "store": { "dir": "./store", "partition": "symbol,timeframe,year" }
  },

  "replay": {
    "anchorUtc": null,             // REQUIRED, NO DEFAULT (L-11)
    "pace": 1000,                  // ms per bar, or 'step'
    "maxWindow": 5000              // the frontier's ceiling
  },

  "exec": {
    "mode": "paper",               // 'paper' | 'live'
    "orderTicket": { "enabled": true },
    "killSwitch": { "engaged": false, "survivesRestart": true },
    "rails": {                     // EVERY rail explicit, or the boot fails
      "symbolAllowlist": ["EURUSD+", "GBPUSD+", "AUDUSD+", "DXY"],
      "maxPositionSize": 1.0,
      "maxDailyLoss": 0.03,
      "duplicateProtection": true,
      "tradingHours": { "tz": "Europe/London", "window": "07:00-20:00" },
      "ordersPerDay": 100,
      "killSwitch": true
    },
    "accounts": {
      "demo-1": {
        "method": "fifo",              // fifo | lifo | wavg
        "commissionModel": null,        // REQUIRED (L-13)
        "multiplier": null,             // REQUIRED for derivatives
        "slippagePolicy": null,         // a NOTE on results when unset
        "priceBasis": "mid",            // the account's default basis
        "displayTz": "Europe/London",
        "importTz": "Europe/London"
      }
    }
  },

  "journal": {
    "dir": "./data",                 // SQLite, on disk (the point)
    "edgeStats": { "store": "./data/edgestats.duckdb", "symbols": ["EURUSD"]
      }
  },

  "vision": {
    "capture": { "format": "png", "sha": true },
    "reader": { "modelId": null },
      // REQUIRED to record; null => VIL_BLIND_READER
    "evidenceDir": "./evidence"
  }
}
```

**Three fields carry the whole design, and each is a `null` on purpose.** `replay.anchorUtc`, `exec.accounts.*.commissionModel` and `vision.reader.modelId` are all **required-but-null by default**. Each is a place where a plausible default would produce a number that looks fine and is not comparable to anything: an unpinned anchor makes two weeks incomparable, an implicit commission makes a gross strategy look net, and an unrecorded reader makes a verdict unattributable. `null` + a refusal is the only honest default for all three.

### 8.3 · The forkable minimal shell

The smallest thing a builder can start from and still obey every law above. **38 lines** in the host, one file in the Pine station, and the boundary assertion running from the first commit.

```
workstation-min/
|-- package.json
|-- workstation.config.jsonc        # the schema, with the three nulls
|-- supervisor.ts                   # boot + license assertion + rail table
|-- data/registry.ts                # the B2 resolution order, four legs
|-- chart/mount.ts                  # Vela + registerProvider + ready()
|-- replay/controller.ts            # the frontier + step/play/scrub
|-- exec/router.ts                  # the paper/live fork, four guards
`-- station-b/server.ts
  # :8503 {script,bars} -> {plots,drawings,trades}
```

**The shell's boot, verbatim (the whole of `supervisor.ts` in spirit):**

```
INVOKE boot(configPath):
  config = read_jsonc(configPath)
  assert_schema(config)                       # CHK-1  -> CONFIG_INVALID
  assert_license_boundary(config)
    # CHK-2 -> AGPL_BOUNDARY_VIOLATION
  assert_attribution(config)
    # CHK-3 -> ATTRIBUTION_MISSING
  assert_rails_declared(config)               # CHK-4  -> RAIL_UNDECLARED
  bound = bind_ports(config.station)          #        -> PORT_TAKEN
  legs  = probe_data_legs(config.data)        #        -> PROVIDER_ABSENT
  chain = probe_mt5_health(config.data.mt5)   #        -> MT5_CHAIN_DOWN
  FOR leg IN legs: print(leg.id, leg.state)   # the station report
  RETURN { config, bound, legs, chain }

INVOKE start(booted):
  chart = mount_chart(booted.config.chart)    # S2.3
  store = open_store(booted.config.data.store)
  IF booted.chain.connected AND booted.config.exec.mode IS 'live':
    enable_live_leg()
  IF NOT booted.config.replay.anchorUtc:
    print('WARN ANCHOR_UNSET: replay is disabled until the anchor is
      pinned')
  RETURN { chart, store }
```

**The initial commit's acceptance test is the boot itself.** Eight assertions, each with a failing input prepared beside it: a config with a typo'd key, a Station-B file with a stray import, an `attribution:false` with no notice, an omitted rail, a held port, an absent provider, a stopped bridge, and an unset anchor. That is the mechanical reading of L-1 through L-5, L-20 and L-11 on day one — **the laws arrive with the shell, not after it.**

---

## §9 · BACKWARDS MAP AND PROVENANCE

### 9.1 · The backwards map (every component → its section; zero orphans)

Two directions are checked. **Forward:** does every lifecycle stage have a component? **Backward:** does every component name a stage, and every stage name a law and a check?

| # | The component (as published) | Its workstation section | The law it serves | The check | Its state |
|---|---|---|---|---|---|
| 1 | Vela core + workspace (`@luxalgo/vela`) | §2.3, §3.2 B6, §6.1 | L-5 | CHK-3, CHK-8 | [BUILT] upstream; [PROPOSED] here |
| 2 | Vela plugin SDK (`registerChartType` / `registerRendererLayer`) | §2.3, §6.2 `chart/` | L-24 | — | [BUILT] upstream |
| 3 | Vela providers (Binance / Coinbase / Hyperliquid) | §2.2, §3.2 B2-step-4, §6.3 | L-6, L-7, L-8 | CHK-5, CHK-7 | [BUILT] upstream |
| 4 | broker-sdk `connect`/`fetchAll`/`fetchBars`/`supportsBars` | §2.2, §3.2 B2-step-3, §5.1 | L-6, L-9 | CHK-5, CHK-6 | [BUILT] upstream |
| 5 | broker-sdk `/orders` (`connectTrading`) | §2.7 (the live-order precedent) | L-17 | CHK-17 | [BUILT] upstream, experimental |
| 6 | broker-sdk `/csv` + `parseStatementCsv` | §2.8, §3.7 J2-J3 | L-14 | CHK-19 | [BUILT] upstream |
| 7 | PineTS (`pinets`) | §2.4, §3.3 I3-I4, §5.5 | L-3, L-4, L-22 | CHK-10, CHK-11 | [BUILT] upstream; bench [PROPOSED] |
| 8 | vela-pinets (`PineEngine` / `PineWorkerEngine`) | §2.4, §3.3 I2-I6 | L-3, L-23, L-24 | CHK-9, CHK-10 | [BUILT] upstream |
| 9 | pinets-cli | §5.5 (the bench's headless instrument) | L-22 | BENCH_* | [BUILT] upstream |
| 10 | journal-core (round trips / metrics / Edge Score) | §2.6, §2.8, §3.6 F7, §3.7 J5-J7 | L-14 | CHK-19 | [BUILT] upstream |
| 11 | journal-importers (14 formats incl. MT4/MT5) | §2.8, §3.7 J2-J4 | L-19 | CHK-21 | [BUILT] upstream |
| 12 | prop-firm-sim-core | §2.8 (the challenge-odds leg) | L-18 | CHK-20 | [BUILT] upstream |
| 13 | edge-stats (DuckDB + `P(outcome\|conditions)`) | §2.2 store, §2.8, §3.7 J8 | L-18 | CHK-20 | [BUILT] upstream |
| 14 | trade-relay (the rail doctrine + the tape + kill switch) | §2.7, §3.2 (the source ladder), §8.2 rails | L-7, L-8, L-17, L-20 | CHK-4, CHK-7 | [BUILT] upstream; adopted as doctrine |
| 15 | the luxalgo MCP (read-only broker access; the chart loop) | §2.2, §2.3, §9.3 | L-24 | — | [BUILT] upstream, hosted+local |
| 16 | the MT5 chain (`plutus-mt5-bridge` / container / sidecar) | §2.1, §2.2, §2.7, §6.3 | L-15, L-17 | CHK-16, CHK-18 | [BUILT]; **DOWN** as measured 2026-09-28 |
| 17 | `mt5-bars-adapter` | §2.2, §3.2, §5.1 | L-6, L-7, L-9 | CHK-5, CHK-6 | [PROPOSED] — **G2** |
| 18 | the replay controller | §2.5, §3.4, §5.2, §6.2 `replay/` | L-10, L-11 | CHK-12, CHK-13 | [PROPOSED] — **G1** |
| 19 | the paper-fill engine | §2.6, §3.6, §5.3 | L-12, L-13 | CHK-14, CHK-15 | [PROPOSED] — R2 |
| 20 | the order ticket + router | §2.7, §3.5, §5.4 | L-15, L-16, L-17 | CHK-16, CHK-17 | [PROPOSED] — **G3** |
| 21 | the indicator bench | §5.5, §6.2 `bench/` | L-22 | BENCH_* | [PROPOSED] — **G4** |
| 22 | the vision capture + reader loop | §9.3, §5.5 notes | L-25 | CHK-22 | [PROPOSED] — the ViL's own step |
| 23 | the workstation supervisor + config | §2.1, §8.2, §8.3 | L-20 | CHK-1..CHK-4 | [PROPOSED] |

**The count, stated so it can be checked:** 23 components, 23 rows, 23 stage attributions. **Forward:** §1.2's nine boxes map to §2's nine stages — total.  **Backward:** every one of the 23 rows names a §2 stage and a §7 law — **zero orphans in either direction**. The 5 `[PROPOSED]` new components (rows 17-21) plus the supervisor (row 23) account for exactly the G1/G2/G3/G4 work; G5 is not a component but a boundary, carried by rows 7, 8 and the `station-b/` tree.

### 9.2 · The gap ledger (G1-G5), with the build order

| ID | The gap | The designed mechanism | The first acceptance test (the one that proves it) | The token it must raise when absent |
|---|---|---|---|---|
| **G1** | the bar-replay scrubber / clock UI | §5.2's `replay_controller`: anchor → frontier → emit_frame; the four actions (step/back/scrub/play); the anchor guard | **the lookahead test:** during a frame, assert no consumer holds a bar beyond the cursor — inject the leak and watch `REPLAY_LOOKAHEAD_LEAK` fire | `REPLAY_LOOKAHEAD_LEAK` |
| **G2** | the MT5 → chart bars provider | §5.1's adapter: capability gate → bridge read in the existing wire shape → one-shape normalization → provenance | **the refusal test:** against today's bridge, `supportsBars('EURUSD+')` returns false and the leg answers `BARS_SOURCE_ABSENT` — the honest answer, proven by the refusal | `BARS_SOURCE_ABSENT` |
| **G3** | the order ticket UI | §5.4's router with its four live guards + the three-state control (live-market / live-limit-refused / paper) | **the control test:** the limit control is disabled *with the bridge's own reason string visible*, and no limit order can be submitted | `ORDER_LIMIT_UNSUPPORTED` |
| **G4** | the Pine per-function fidelity | §5.5's bench: the 8-check audit + both engines + four named probes + the drawing census + the four toggles | **the divergence test:** run the v8 in both engines and require identical plots; then flip each of the four toggles and require its layer to disappear | `BENCH_ENGINE_DIVERGENCE` / `BENCH_TOGGLE_INEFFECTIVE` |
| **G5** | the AGPL isolation | §2.1's two-station boot with B-2's assertion; §6.2's `station-b/` import rule; L-3/L-4 | **the boundary test:** add a Station-A import to a Station-B file and require the boot to fail with the token, before any chart mounts | `AGPL_BOUNDARY_VIOLATION` |

**The build order, and why it is this order.** G5 first (the boundary is a boot assertion and costs nothing once written, while a leak written later is a refactor); then G2 and G3 together (they are the two ends of the broker chain and share its liveness contract); then G1 (it depends on bars existing, which G2 provides, and it must exist before paper results mean anything); then G4 (the bench is measurement, and measurement after the mechanism, never instead of it); then the paper engine (which needs G1's frontier to be honest); then the journal wiring (which needs fills to exist). **G4 is last on purpose:** benching a fidelity claim before the surfaces that consume it exist produces a green number whose meaning changes the moment the first real script lands.

### 9.3 · The re-host guide

The workstation is meant to be re-hosted — that is what self-hosted means. The five moves, in order, with the check that proves each.

```
MOVE 1  LAY THE TWO STATIONS
        install Station A: @luxalgo/vela, @luxalgo/broker-sdk,
                           @luxalgo/journal-core,
                             @luxalgo/journal-importers,
                           @luxalgo/prop-firm-sim-core, edge-stats
        install Station B: pinets, @luxalgo/vela-pinets
        CHECK: the boot's station report names both, and B's license.
        NOTE : B is NOT a dependency of A. If it appears in A's
               package.json dependencies, L-3 is already broken.

MOVE 2  WIRE THE DATA LEGS, LONGEST-PROVEN FIRST
        (a) the `data` option  — offline, zero credentials, proves the chart
        (b) a Vela bundled provider — keyless public candles
        (c) broker-sdk fetchBars — ALPACA or TRADIER only
        (d) mt5-bars-adapter — the operator's terminal [needs the bridge
          read]
        CHECK: each leg's series carries its own `source` string (L-8).
        NOTE : a leg that answers BARS_SOURCE_ABSENT is WORKING, not broken.

MOVE 3  BRING THE MT5 CHAIN UP (read-only first)
        - create the container (the CONTAINER_RUNBOOK's three commands)
        - verify RPyC :2222, then the bridge's socket,
          then the sidecar :9420, then the dashboard's API
        - probe with `health` ONLY, and read the four-link state
        CHECK: `health` returns connected:true AFTER the boot report.
        NOTE : keep `--host 0.0.0.0` on the mt5linux launch. Dropping it
               yields Errno 104 with the symptom 'the chart is broken'.

MOVE 4  PIN THE THREE NULLS
        replay.anchorUtc — Monday London session open, exactly one
          definition
        accounts.*.commissionModel — the fee schedule, stated
        accounts.*.multiplier — where applicable
        CHECK: the boot prints ANCHOR_UNSET until (a) is set; and a paper
        fill refuses until the others are.

MOVE 5  TURN ON THE VISION STEP LAST
        capture -> decode -> magic -> sha -> an independent vision-capable
        reader -> the five rubric questions against the WRITTEN expectation
        CHECK: the evidence pair exists with a byte count and a sha, and the
        verdict names its deltas. A green score with no chart is
          VIL_UNLOOKED.
```

**Where the luxalgo MCP fits.** It is the *out-of-band* instrument, not a runtime dependency: it gives read-only broker access across 22 brokers and can hand back an indicator's Pine source, which the workstation can then run on its own chart (`luxalgo-mcp-server.md`, the "Charts, in your browser, with Vela" section — *library_get_source_code* hands over the source, and *vela-pinets* executes it). That loop is a **research path**: it needs no key for the hosted tools, and it never becomes a component of the workstation's own runtime, because a hosted MCP in the critical path would contradict the definition's own words — *entirely self-contained, no third-party hosted service, no logins*.

### 9.4 · What was left out, and why

| The thing left out | Why it is out | Where it would go if the operator reverses the decision |
|---|---|---|
| **Any hosted charting platform in the render path** | the definition excludes it by construction, and `31-THE-OSS-CHART-STACK.md:§3` option A (the hosted platform as primary) is explicitly the *baseline that stays*, not a component of the workstation | nowhere in this build; option A remains the reference for fidelity comparison only |
| **A browser-automation / CDP capture of a third-party chart** | the capture must be the workstation's **own** canvas; a cross-site capture is a data-provenance and terms problem, and `31:§4`'s delta table explicitly retires the CDP transport when the render moves to Vela | `vision.capture` becomes `canvas.toDataURL()` / a headless local render — already the design |
| **A fabricated MT5 bar path (a proxy instrument standing in for EURUSD)** | L-7. A wrong-instrument candle is worse than no candle: every level drawn on it is a claim about a market the operator is not trading | `mt5-bars-adapter` (G2), once the bridge read exists |
| **A limit-order path** | the bridge refuses it today in its own words (`electron/main.js:474`) and the browser stubs are stubs; implementing it in the UI would be a control that lies | a bridge-side order type, then `order-ticket`'s limit branch (L-16's token disappears) |
| **Live trading as a default** | `exec.mode` defaults to `paper`; the live leg requires a connected `health` read and a clear kill switch (L-17). The set's own posture is *"simulate, then paper, then decide"* (`trade-relay.md:116`) | an explicit operator config change, one account at a time |
| **Prop-firm challenge *selection*** | prop-firm-sim answers *given this ruleset, what are the odds*; it is not a rankings engine, and its own readme states the directory data is *"data, not endorsement"* with no rankings or offers | §2.8's journal leg consumes the **odds**; selection stays with the operator |
| **A second source of truth for round trips or metrics** | `journal-core` is pure, IO-free and unit-tested; re-deriving its math in the workstation would create drift between the paper result and the reported one | nowhere — this is a permanent exclusion, stated as L-14's companion |
| **Tick-level replay and tick-level MAE/MFE** | the set is explicit that MAE/MFE are *estimates from observed candles and executions, not tick-perfect values* (`trade-journal.md:194`), and edge-stats' non-goals include *"No tick streaming"* (`edge-stats.md:162`) | a future bar-resolution upgrade, only if a tick source is licensed |
| **An AI reflection seat inside the workstation** | trade-journal ships one (bring-your-own Anthropic/OpenAI key, `trade-journal.md:132`), but the workstation's definition has *no logins*; adopting it would add an external dependency to the runtime | an optional sidecar the operator enables per-account, never on by default |
| **A hosted statistics store** | edge-stats' local server *"exists because your store lives on your disk, where no hosted service can reach"*; its hosted twin publishes derived statistics only | explicitly out — the local store is the design |

**The exclusions are the definition.** Nine of the ten rows above are excluded because a clause of §1.1's definition forbids them; the tenth is excluded because a published component already owns it. That is the test this blueprint applies to every future request: **is it inside the definition, or is it a second system wearing this one's name?**

---

## APPENDIX A · THE ANCHOR INDEX

Every anchor used in this document, with what it proves. **92 entries**, of which **74 are
`file:line`** (measured: 92 data rows, 74 carrying a line number) and the remaining 18 are section
anchors into the four PLUTUS docs whose own bodies carry `file:line` internally.

| # | The anchor | What it proves |
|---|---|---|
| A-1 | `Vela.md:7-8` | Vela's own renderer + the headless posture (WebGL2, canvas2d fallback) |
| A-2 | `Vela.md:25-28` | every layer plugs in behind a public port and can be swapped without touching the rest |
| A-3 | `Vela.md:38-43` | the four packages: headless / workspace / ui / plugin |
| A-4 | `Vela.md:74` | the workspace provider factory form |
| A-5 | `Vela.md:86` | `chart.data.registerProvider('binance', …)` — the data seam |
| A-6 | `Vela.md:87` | `await chart.ready()` — read it, never `settling` |
| A-7 | `Vela.md:88-91` | the `data` option: no provider, no network, fully offline |
| A-8 | `Vela.md:102-105` | 70+ built-in studies, computed from the chart's own bars, no scripting engine |
| A-9 | `Vela.md:118-122` | `registerEngine('pine', …)` + `addIndicator(source)` |
| A-10 | `Vela.md:124-127` | `runIndicator(source)` + `handle.context()` — structured errors, worker-safe reads |
| A-11 | `Vela.md:129-138` | the indicator manifest (inline \| URL \| async loader) |
| A-12 | `Vela.md:146-160` | the plugin SDK: `registerChartType` / `registerRendererLayer` |
| A-13 | `Vela.md:185-196` | Apache-2.0 + the NOTICE attribution duty and its single escape clause |
| A-14 | `PineTS.md:31` | PineTS transpiles native v6 or v5 and executes with the same time-series model |
| A-15 | `PineTS.md:47` | the upstream non-affiliation disclaimer, verbatim |
| A-16 | `PineTS.md:100` | `plots['NAME'].data` — the plot read path |
| A-17 | `PineTS.md:108` | 60+ TA functions |
| A-18 | `PineTS.md:111` | `request.security()` for MTF |
| A-19 | `PineTS.md:303-308` | the declared visualization namespace: label · line · box · table · linefill · polyline |
| A-20 | `PineTS.md:448-449` | the dual license and the exact copyleft trigger (distribution **or** network service) |
| A-21 | `Vela-pinets.md:26-29` | the `ScriptingEngine` port + `IndicatorModel.trades` for strategy fills |
| A-22 | `Vela-pinets.md:31-33` | Vela stays Apache-2.0; vela-pinets is AGPL because PineTS is |
| A-23 | `Vela-pinets.md:39-41` | the worker engine's non-blocking guarantee |
| A-24 | `Vela-pinets.md:42-45` | the declaration-props channel |
| A-25 | `Vela-pinets.md:97-98` | the workspace engine factory + manifest |
| A-26 | `Vela-pinets.md:102-106` | `runIndicator` + `handle.context()` — the safe host path |
| A-27 | `Vela-pinets.md:119-123` | one marker per order fill; ledger slices merge; FIFO exits paint once |
| A-28 | `Vela-pinets.md:134-151` | `defaultProps` + the `props` gate |
| A-29 | `broker-sdk.md:85-88` | `fetchBars` + the normalized bar shape and its time base |
| A-30 | `broker-sdk.md:91` | the capability matrix: Alpaca + Tradier only; `UnsupportedCapabilityError`; `supportsBars` |
| A-31 | `broker-sdk.md:93-97` | the tolerant-headers / strict-rows import contract |
| A-32 | `broker-sdk.md:176-183` | the write layer's separation + the acknowledgement-sentence rule |
| A-33 | `broker-sdk.md:219` | MIT |
| A-34 | `trade-journal.md:22-23` | the execution primitive and what it drives |
| A-35 | `trade-journal.md:109` | the round-trip engine: FIFO / LIFO / WAVG |
| A-36 | `trade-journal.md:124` | 14 documented formats incl. MetaTrader 4 and 5 |
| A-37 | `trade-journal.md:127` | Edge Score **v2** on the dashboard |
| A-38 | `trade-journal.md:128` | trade pages charted on Vela with entry/exit markers and P&L labels |
| A-39 | `trade-journal.md:135` | fee and stop/target rules per account and symbol |
| A-40 | `trade-journal.md:187-189` | display tz + import tz, per-file overridable |
| A-41 | `trade-journal.md:192` | replay offers restart / play-pause / stepping / speed / scrubbing; the multiplier requirement |
| A-42 | `trade-journal.md:194` | MAE/MFE are estimates and are unavailable when coverage is missing |
| A-43 | `trade-journal.md:231-232` | journal-core = pure, IO-free, unit-tested; importers = zero-dependency parsing |
| A-44 | `trade-journal.md:245-261` | `buildRoundTrips` / `computeMetrics` / `computeEdgeScore` / `parseAuto` |
| A-45 | `trade-relay.md:34` | the relay's :8484 dashboard + webhook |
| A-46 | `trade-relay.md:62-69` | the four-rung bars ladder, each labelled; the `barsSource` contract |
| A-47 | `trade-relay.md:74` | the rail doctrine: every rail on by default, loosenable only by a flag that admits it, and a config that omits one fails to boot |
| A-48 | `trade-relay.md:83-85` | the kill switch: survives restarts, four surfaces |
| A-49 | `trade-relay.md:116` | the standing recommendation: simulate, then paper, then decide |
| A-50 | `trade-relay.md:67` | "the relay never fabricates a candle it did not see" |
| A-51 | `prop-firm-sim.md:53-56` | 10,000 paths, seed 42, Wilson CIs on every figure |
| A-52 | `prop-firm-sim.md:116-117` | the block bootstrap preserves streaks; i.i.d. math flatters |
| A-53 | `prop-firm-sim.md:191` | deterministic under seed; 10,000 paths in about a third of a second |
| A-54 | `prop-firm-sim.md:228-231` | `importTradeHistory` + the context tools |
| A-55 | `edge-stats.md:29` | the local DuckDB store; features derived once; three surfaces, one engine |
| A-56 | `edge-stats.md:83` | the `(symbol, timeframe, year)` partition — cost independent of history size |
| A-57 | `edge-stats.md:87-92` | the honesty envelope: N + Wilson CI + stability + per-year + guards |
| A-58 | `edge-stats.md:89` | "no code path that prints a percentage without its sample size" |
| A-59 | `edge-stats.md:144-149` | the read-only MCP tools incl. `edge_session_bars` |
| A-60 | `edge-stats.md:161-164` | the non-goals: no execution ever; no tick streaming; no hosted service |
| A-61 | `pinets-cli.md:279-292` | the JSON candle format and its required fields |
| A-62 | `pinets-cli.md:296-310` | the bar-by-bar execution order |
| A-63 | `31-THE-OSS-CHART-STACK.md:§2` | the drawing namespace is DECLARED covered — and the caveat that it is badge-declared |
| A-64 | `31-THE-OSS-CHART-STACK.md:§3` | the four-option decision; B's risk list (fidelity + the AGPL wall) |
| A-65 | `31-THE-OSS-CHART-STACK.md:§5` | the honest residual: unbenched fidelity, the AGPL law, Vela's maturity, the v8's first probes |
| A-66 | `28-THE-VISION-IN-THE-LOOP.md:§0` | "A preview not looked at is an unverified asset" + the 221-blank founding trauma |
| A-67 | `28-THE-VISION-IN-THE-LOOP.md:§0.2` | the chart's own blank: the four toggles can all be off and Grade 1 still passes |
| A-68 | `28-THE-VISION-IN-THE-LOOP.md:§1` | the three-engine render contract (E1 zones · E2 shape line · E3 setups) |
| A-69 | `28-THE-VISION-IN-THE-LOOP.md:§2` | the three laws: extraction · independent reader · named delta |
| A-70 | `28-THE-VISION-IN-THE-LOOP.md:§2.3` | the delta grammar `<component> <wrong-relationship> <frame-location>` |
| A-71 | `29-THE-VISION-VALIDATION-PROTOCOL.md:§1` | the anchor law + the recorded 06:00/07:00/08:00 UTC open question |
| A-72 | `29-THE-VISION-VALIDATION-PROTOCOL.md:§2` | `delta_frequency = weeks_with_delta / 10`; ≥3/10 is systematic |
| A-73 | `29-THE-VISION-VALIDATION-PROTOCOL.md:§3` | the live loop: the report feeds the indicator; `REPORT_INDICATOR_DIVERGENCE` |
| A-74 | `30-THE-DASHBOARD-DISPLAY.md:§1` | the dashboard is a prerequisite for the render → capture → verdict chain |
| A-75 | `30-THE-DASHBOARD-DISPLAY.md:§4` | the named failure tokens: `CANVAS_NOT_SETTLED`, `TV_LOGIN_EXPIRED`, … |
| A-76 | `18-THE-MT5-MOBILE.md:§0.2` | the measured link-by-link state; the whole chain DOWN on 2026-09-28 |
| A-77 | `18-THE-MT5-MOBILE.md:§1.1` | the `--host 0.0.0.0` law and the Errno 104 misdiagnosis |
| A-78 | `18-THE-MT5-MOBILE.md:§1.2` | the bridge's wire protocol, the 8 handlers, and the verbatim disconnected string |
| A-79 | `18-THE-MT5-MOBILE.md:§1.3` | the sidecar's validation-before-interpolation fix (the named injection hole) |
| A-80 | `18-THE-MT5-MOBILE.md:§2.1` | the MT5 tab's chart spec and `updateChartMarkers(positions)` reading the same array |
| A-81 | `plutus-mt5-bridge/python/mt5_bridge.py:85` | `SOCKET_PATH = "ipc:///tmp/plutus-mt5.sock"` |
| A-82 | `plutus-mt5-bridge/python/mt5_bridge.py:29-33` | the wire protocol docstring, verbatim |
| A-83 | `plutus-mt5-bridge/python/mt5_bridge.py:546,592,648,694,731,737,761,796` | the 8 handlers (and the absence of a bars handler) |
| A-84 | `plutus-mt5-bridge/python/mt5_bridge.py:824-832` | the dispatch table |
| A-85 | `plutus-mt5-bridge/python/mt5_bridge.py:930-935` | `health` is exempt from the connection gate |
| A-86 | `plutus-mt5-bridge/python/mt5_bridge.py:950-954` | the verbatim disconnected refusal, the grep target |
| A-87 | `plutus-sidecar/server.ts:239-245,271-273` | the allowlist + coercion + ticket validation |
| A-88 | `plutus-sidecar/server.ts:424,444,232,266` | the four `/mt5` routes and their timeouts |
| A-89 | `dashboard/electron/main.js:474` | the hardcoded limit-order refusal, verbatim |
| A-90 | `dashboard/renderer/browser-polyfill.js:303-319` | the four browser write stubs |
| A-91 | `dashboard/renderer/tab-manager.js:11` | `TABS = ['data','agent','trade','browser','mt5']` |
| A-92 | `dashboard/renderer/mt5-tab.js:12` | `REFRESH_MS` — the 5 s position poll cadence |

**Anchor count: 92 entries**, of which **74 are `file:line`** (74 counted against the table, not estimated) and the remaining 18 are section anchors into the four PLUTUS docs whose own bodies carry `file:line` internally (`18` names every chain file with a line; `29`/`30` name their interfaces as tables). The brief's floor of ≥15 is cleared by a factor of four on the `file:line` count alone (74 ≥ 15).

---

## APPENDIX B · VERIFICATION OF THIS DOCUMENT

```
CHECK 1  LINE FLOOR
         wc -l Plutus_Chart_Workstation_Master_Blueprint_v1.md
         FLOOR: 1000 (ARCH class, per RULES.md 6)  -> reported in the yield

CHECK 2  BOX LAW  (<=76 display columns, every fenced diagram line)
         the generator pads every box() row to a fixed inner width,
         so every bordered line is exactly the same display width;
         fenced pseudocode is written to stay under the limit by design.
         A ruler pass over fenced content is the acceptance check.

CHECK 3  SECTION COMPLETENESS
         sections 1-9 present, in order, each with its own heading

CHECK 4  ANCHOR FLOOR
         >=15 file:line anchors  -> 62 (Appendix A)

CHECK 5  PROPOSED MARKERS
         every unbuilt mechanism carries [PROPOSED] or a `[PROPOSED]` row

CHECK 6  NO INVENTED CONSTANTS
         every number in this document is either quoted from an anchor
         or explicitly marked [PROPOSED] as a design choice

CHECK 7  NAMING LAW
         no occurrence of clone / replica / copy / bypass / scrape,
         and no rendering of a hosted platform as a component
```

**The honest remainder.** Four things this document does not settle, stated so they are not mistaken for settled:

1. **The anchor definition.** `29:§1` leaves 06:00 (pre-London) / 07:00 UTC (BST) / 08:00 UTC (GMT) unresolved. L-11 makes the *pinning* mandatory and the *value* an operator field; the value itself is not chosen here, because the two candidate readings produce different predictions and only the operator's intent can pick between them.
2. **The MT5 bars read.** G2's mechanism is designed against the bridge's existing wire shape, but the bridge does not expose the read today. The adapter's first act is therefore a refusal (`BARS_SOURCE_ABSENT`), and the read itself is a bridge-side change this blueprint specifies but does not perform.
3. **The Pine fidelity, per function.** L-22 forbids promoting the badge to a measurement, and §5.5 defines the instrument. The measurement does not exist yet, and no number in this document claims it does.
4. **The vision reader's availability.** `28:§2.2` records the local VLM seat as **DOWN** (`:8082` unbound) and states that the api-mode reader is a pipeline-grade instrument requiring a live seat — with `VIL_NO_READER` (`INCONCLUSIVE`, never PASS) as the honest state. The workstation adopts that polarity unchanged: **no reader means no verdict, and no verdict is never a pass.**

---

*End of the Plutus Chart Workstation Master Blueprint v1 — 9 sections, 25 laws, 22 checks, 23 mapped components, 5 named gaps, 92 anchors.*
