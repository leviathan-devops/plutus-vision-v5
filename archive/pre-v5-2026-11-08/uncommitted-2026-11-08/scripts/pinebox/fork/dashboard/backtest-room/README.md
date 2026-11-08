# THE BACKTESTING ROOM — `dashboard/backtest-room/`  (SHELL_ANCHOR §5.2 · W-S3)

An exact clone of the TradeZella backtesting room: **manual bar-by-bar replay** (play/pause · one bar
forward/back · speed · jump-to-date · timeline · risk-based sizing · SL/TP by price/ticks/%/R · trailing
stop · auto-breakeven · partial closes · live balance/P&L/win-rate/profit-factor/avg-R/drawdown · a
journal rail that auto-logs every fill) **and supervised agent sessions** — the SAME room, driven by an
agent through a local verb surface, visible live to the operator.

The engine is the ONE state authority. The tab is a client. An agent is a client. They cannot diverge.

```
 ┌─────────────────────────── THE ELECTRON SHELL (:9430) ───────────────────────────────┐
 │  renderer/tabs/backtest.{js,css,html}   ← the room (self-contained tab module)        │
 └───────────────┬──────────────────────────────────────────────────────────────────────┘
                 │  HTTP + SSE (discover :9443 → :9444 → :9445)
 ┌───────────────▼───────────────────────────────┐   ┌──────────────────────────────────┐
 │  control.mjs  (127.0.0.1:9443)  THE VERBS     │──▶│  replay.mjs  THE REPLAY ENGINE   │
 │  create · step · jump · play · place ·        │   │  pure · deterministic · rewinds  │
 │  modify · close · cancel · note · finish      │   │  snapshot-per-bar · fill model   │
 └───────────────┬───────────────────────────────┘   └──────────────────────────────────┘
                 │  persist (canon route, or the NAMED fallback)
      ┌──────────▼───────────┐        ┌───────────────────────┐      ┌────────────────────┐
      │ store.mjs node:sqlite│        │ canon.mjs the CANON    │      │ stats.mjs the CANON │
      │ ~/.plutus-dashboard/ │        │ path: POST/PATCH       │      │ envelope (N + Wilson│
      │ data.db (WAL, shared)│        │ /api/v1/backtest-      │      │ 95% CI, N<10 no     │
      │ backtest_sessions +  │        │ sessions, PIP_SIZES    │      │ estimate, N<30 warn)│
      │ backtest_trades +    │        │ READ from the canon    │      │ §11 summary shape   │
      │ backtest_events      │        │ hand, never re-derived │      │                     │
      └──────────────────────┘        └───────────────────────┘      └────────────────────┘
```

## Files

| File | What it is |
|---|---|
| `replay.mjs` | THE ENGINE. A pure bar-by-bar state machine — no node builtins, no DOM, no clock. `load/step/play/jump/now` + the order book (`place/modify/closePartial/cancel/note`). Snapshot-per-bar makes a rewind exact and a re-jump identical. |
| `stats.mjs` | THE CANON ENVELOPE. Wilson 95% CI, the N guards (no estimate below 10, a warning below 30), the fixed disclaimer, and the canon §11 summary shape. No code path emits a percentage without its N. |
| `canon.mjs` | THE CANON BRIDGE. Reads `PIP_SIZES` + `PIP_VALUE_USD_PER_LOT` from `plutus-backtest.hand/*.js` (path + sha recorded); writes the canon session columns through the canon routes with the canon's own token. |
| `store.mjs` | Persistence on `node:sqlite` (NOT better-sqlite3 — that native build is compiled for the Electron ABI). WAL + busy_timeout against the dashboard's live DB. CLI: `--init`, `--sessions`, `--events <uid>`. |
| `bars.mjs` | THE BAR SOURCE. The running shell's own rail (`:9430/api/v1/chart/bars`) first, the fixture file second, a named `BARS_UNAVAILABLE`/`CELL_ABSENT` third. Never the network, never TradingView. |
| `schema.sql` | The room's own tables (`backtest_trades` = the fill ledger, `backtest_events` = the audit trail) + the declared extension columns on the shipped `backtest_sessions`. |
| `control.mjs` | THE VERB SURFACE on `127.0.0.1:9443`. Every mutating verb: require session → engine → persist → audit → respond. A refusal carries its engine CODE. Also serves `/room`, `/tabs/*`, `/tokens.css` and the `/stream` SSE feed. |
| `lifecycle.mjs` | `start()/stop()` for the integrator. Idempotent; writes `~/.plutus-dashboard/backtest-room.json`; stop() SIGTERMs then kills whatever still holds the port. |
| `room.html` | THE STANDALONE ROOM (`http://127.0.0.1:9443/room`) — the same module, outside Electron. |
| `test/adversarial.mjs` | ADV-a…d + a level/refusal probe + the happy path, against the live surface. 32 assertions. |
| `test/fragment-hooks.test.mjs` | The fragment ↔ module hook contract (a renamed hook is a SILENT dead control), the `data-tab-key` ownership token, the no-inline-markup law, and the tokens-by-name CSS law. |
| `evidence/lifecycle-proof.mjs` | Idempotence · start · stop · no orphan · a bindable port, with a safety law that can never touch the live instance's port. |
| `evidence/cdp-shot.mjs` | Injects the integration into the RUNNING Electron renderer over CDP and screenshots it (readiness observed, never assumed). |

## The verbs (an agent drives the room with these)

`GET /verbs` prints this list. Port from `~/.plutus-dashboard/backtest-room.json` (or the 9443→9444→9445
probe). Bind 127.0.0.1 only.

| Verb | Body | Notes |
|---|---|---|
| `GET /health` | — | port, db, the canon provenance (+ its sha), the bar cells, the disclaimer |
| `GET /cells` | — | `[{pair, timeframe, bars, first, last}]` |
| `POST /create` | `{name, symbol, timeframe, startDate, endDate, startingBalance, symbols[]?, strategy?, playbook?, actor?}` | the canon session row goes through the CANON ROUTE; `canon_path` reports `ROUTE` or `FALLBACK_DIRECT` |
| `GET /sessions` | — | the persisted rows (canon columns + the room's extension columns) |
| `GET /status?session=` | — | cursor, `visibleBars` (= cursor+1), `futureHidden`, balance/equity, positions, orders, the stats ENVELOPE |
| `POST /step` | `{session, delta:+1\|-1}` | exactly one bar; out of range → `BAR_RANGE_EXHAUSTED` |
| `POST /play` / `POST /pause` | `{session, rate?}` | 0 < rate ≤ 100 bars/s; stops itself at the last bar |
| `POST /jump` | `{session, ms\|time\|barIndex\|bars}` | a forward jump REPLAYS every bar in between; a backward jump restores the snapshot |
| `POST /place` | `{session, side:buy\|sell, type:market\|limit\|stop, qty\|riskPct, sl, tp, trailing, be, price?, note?, tag?}` | sl/tp: a price, or `{mode:price\|ticks\|pct\|r, value}`; trailing/be: a distance (bare = price units) |
| `POST /modify` | `{session, id, sl?, tp?, trailing?, be?, qty?}` | a working order or a live position (qty may only REDUCE; scale in with a new order) |
| `POST /close` | `{session, pct:1..100, positionId?, reason?}` | at the CURRENT bar's close; every close is its own ledger row |
| `POST /cancel` | `{session, id}` | a working order |
| `POST /note` | `{session, text, tags?[] , tradeId?}` | per-trade or the session note (the journal rail) |
| `POST /finish` | `{session, outcome?:COMPLETE\|ABORTED}` | closes the canon row + returns the canon §11 summary |
| `GET /summary?session=` | — | the canon §11 OUTPUT CONTRACT |
| `GET /bars?session=&lookback=200` | — | the VISIBLE window only — the future is never returned |
| `GET /fills?session=` / `GET /events?session=` | — | the ledger / the audit trail |
| `GET /stream?session=` | — | SSE: every state change (the operator watches an agent session live) |
| `GET /room` | — | the standalone room page |

### Refusals (each a NAME; no third state)

`SESSION_REQUIRED` · `SESSION_NOT_FOUND` · `NO_BARS` · `BAD_DATE` · `START_DATE_OUT_OF_RANGE` ·
`BAR_RANGE_EXHAUSTED` · `BAD_SIDE` · `BAD_TYPE` · `BAD_PRICE` · `BAD_QTY` · `RISK_SIZING_NO_SL` ·
`BAD_LEVEL` · `BAD_PCT` · `BAD_RATE` · `BAD_DELTA` · `ORDER_NOT_FOUND` · `POSITION_NOT_FOUND` ·
`UNSUPPORTED` (hedging) · `CELL_ABSENT` · `BARS_UNAVAILABLE` · `CANON_HAND_ABSENT`

## The fill model (deterministic, documented)

```
 market ......... the NEXT bar's open
 limit .......... the level, once touched (buy: low<=level · sell: high>=level)
 stop ........... the level, once crossed (buy: high>=level · sell: low<=level)
 SL / TP ........ the level; if the bar OPENED beyond it (a gap) the OPEN is used — never a
                  better-than-market fill
 one bar, SL+TP . SL wins (the conservative branch)
 partial / manual the CURRENT visible bar's close
 sizing ......... qty units, or riskPct → qty = (balance × riskPct/100) / |entry − sl|
 levels ......... price | ticks (×tickSize) | % (of the entry ref) | R (×|entry − sl|);
                  ticks/%/R are SIDE-AWARE (a buy's SL goes BELOW, its TP ABOVE)
 no hedging ..... one direction per symbol at a time, enforced over positions AND live orders
 rewind ......... a snapshot per bar: step(-1) restores it, a backward jump truncates the rest
```

## CANON COMPLIANCE (operator ruling 2026-09-29 — read, never re-derived)

* **The stats envelope** is the canon's (`10-THE-TRADING-TOOLKIT.md` §4, EDGE-STATS): the point estimate
  with N and a Wilson 95% CI, a warning below 30, **no estimate below 10**, and the fixed disclaimer.
  The details strip therefore prints `no estimate (n=0 < 10)` instead of a percentage, and every
  percentage carries its N and CI.
* **`win_rate` is sent to the canon as a FRACTION** (`0.619`, per `system-prompt.md` §11 and the
  dashboard's funded gate `winRate >= 0.55`) — the UI shows the percent twin, the canon gets 0..1.
* **The canon session columns are written through the canon routes** (`POST`/`PATCH
  /api/v1/backtest-sessions`, `api.js:299/309`) with the canon's own token resolution. Only the room's
  ADDITIVE extension columns are written by direct SQLite. If the canon route is unavailable the room
  writes the same columns directly **and records the named event `CANON_API_UNAVAILABLE`** — a fill is
  never lost, and the fallback is never silent.
* **The instrument constants are READ from the canon** (`plutus-backtest.hand/log-trade.js` +
  `close-trade.js`): `PIP_SIZES`, `PIP_VALUE_USD_PER_LOT`, with the source path + sha256 in
  `spec.specSource` and in `GET /health`. A drift between the canon's own two copies is reported.
* **`pnl_pips` and `r_multiple` use the canon's formulas** (`close-trade.js computeTradeResult`).
  The room's currency P&L uses the room's own unit basis (units × price distance); the canon script's
  USD formula is lot-based (`pnlPips × lots × 10 × 100`) and does not apply to a units-sized room —
  **this one deviation is named here rather than papered over**.
* **The §11 OUTPUT CONTRACT** is the `GET /summary` shape (session_id, outcome, pairs_traded,
  trades_total, wins, losses, breakeven, win_rate, total_pips, total_pnl_usd, best_pair, worst_pair,
  guardrail_rejections, duration_seconds) — the field names come from the canon document.

## Run it

```bash
node dashboard/backtest-room/control.mjs                       # the verb surface (:9443 → 9444 → 9445)
node dashboard/backtest-room/store.mjs --init                  # apply the schema, print the census
node dashboard/backtest-room/test/adversarial.mjs              # ADV-a…d + the happy path (32 asserts)
node dashboard/backtest-room/test/fragment-hooks.test.mjs       # the fragment ↔ module contract
PLUTUS_BACKTEST_PORT=9445 node dashboard/backtest-room/evidence/lifecycle-proof.mjs   # the process law
curl -s 127.0.0.1:9443/verbs
```

## The integrator lines (verbatim)

```html
<!-- dashboard/renderer/index.html, inside <nav class="sidebar-nav"> : 1 line -->
<button class="nav-btn" data-page="backtest-room"><span class="nav-label">BACKTEST</span></button>

<!-- dashboard/renderer/index.html, before </body>, beside the other tab scripts : 2 lines
     (_shell.js FIRST — registerTab must exist before the tab module registers) -->
<script src="tabs/_shell.js"></script>
<script src="tabs/backtest.js"></script>
```

No line is needed in `app.js`: `PlutusShell.registerTab` claims the nav click in the CAPTURE phase
(stops propagation, so the sibling nav handler never renders into `#main-content`), sets `.active`, and
mounts into `#main-content`. The stylesheet and the body fragment self-load
(`tabs/backtest.css` + `tabs/backtest.html`, read from the dashboard's static root on :9430 — or from
the room's own surface when standalone).

```js
// dashboard/electron/main.js — the child lifecycle (3 statements + 2 declarations)
const { pathToFileURL } = require('url');            // top of file
var backtestRoom = null;                             // top of file
// where the other children start:
try { backtestRoom = await import(pathToFileURL(path.join(__dirname, '..', '..', 'backtest-room', 'lifecycle.mjs')).href); } catch (e) { console.error('[MAIN] backtest-room lifespan load failed', e.message); }
if (backtestRoom) backtestRoom.start().then(r => console.log('[MAIN] backtest-room:', JSON.stringify(r))).catch(e => console.error('[MAIN] backtest-room start failed', e.message));
// in the quit handler, beside the other child shutdowns:
try { if (backtestRoom) await backtestRoom.stop(); } catch (e) { console.error('[MAIN] backtest-room stop failed', e.message); }
```

## The honest remainder

* **The chart is a purpose-built canvas2d renderer**, not a Vela instance. It gives exact control of the
  future-hiding law, the replay cursor and the level/entry overlays, it cannot drift with the sibling's
  `chart/**` (which this desk must not edit), and it has no AGPL contact. The chart region is isolated
  behind `renderChart()`, so a Vela-backed implementation can replace it without touching the engine,
  the verbs or the layout. The AGPL isolation law is respected: nothing AGPL is bundled; the bars cross
  as JSON from the shell's own rail.
* **A session's symbols beyond its first are declared, not replayed.** The create form takes a primary
  symbol (single-series replay, exactly as TradeZella's replay window is one chart); `symbols[]` is sent
  to the canon `pairs_traded` field. Multi-symbol replay = N rooms.
* **Scale-in is a second order**, not a modify: `modify({qty})` may only reduce (a named
  `UNSUPPORTED` refusal otherwise).
* **The standalone `/room` page needs :9430 only for `tokens.css`** (the shared `_shell.js` links it from
  the shell's own static root). The room itself works when the app is down; the palette falls back to
  the browser default for the few variables the stylesheet does not restate.
* **`:9443` was free** at bind time and is this surface's port (SHELL_ANCHOR §3 had reserved it for the
  progress feed; the operator reassigned it: the loops feed is a FILE, `~/.plutus-dashboard/progress.json`).
  `PLUTUS_BACKTEST_PORT` overrides; the chain is 9443 → 9444 → 9445 and the bound port is published.
* **The replay driver runs in the control process**, so a `play()` loop keeps running when the tab is
  closed — the room state is server-side by design.
