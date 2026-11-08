# BUILD_REPORT — plutus-browser

## 2026-11-06 — THE FORK: the dashboard's web-research surface as a self-contained runtime

**The built:** `plutus-browser/` — one headed Electron window, one loopback control server, nothing else from the dashboard. Forked from the PLUTUS dashboard's LIVE handlers (`dashboard/electron/view-surfaces.js`, sha `b38148a1`) and its standalone window boot (`dashboard/electron/surface.js`). The source repo was never written (verified: HEAD stayed `7e99e73`).

**The why:** the operator's ruling R-19 (the harvest needs a headed browser for investinglive) + R-22 (everything on Cloudflare unless it physically cannot) + R-26 (the headed browser runs locally on the dashboard's browser tab). The dashboard's built-in tab carries 26 processes and 4,800 lines of dependency; the fork carries 253 MB, 7 threads, and 198 lines.

**The how:** `src/main.js` (198 lines, sha `ebd019d8`) is the entire runtime:
- ONE BrowserWindow, partition `persist:plutus-browser`, sandbox on, contextIsolation on, nodeIntegration off
- ONE loopback HTTP control server (the port is a required `--port=` argument, never defaulted)
- Bearer-token auth on every route except `/health` (the token lives in `~/.plutus-browser/token`, mode 0600, exactly 64 hex chars — each property enforced, each violation named)
- The dashboard's LIVE handlers ported: `/navigate`, `/status`, `/back`, `/forward`, `/reload`, `/viewport`, `/capture`, `/eval`, `/images`, `/input`, `/bookmarks`
- Back/forward use the Electron 28 API (`canGoBack/goBack`), not the Electron 31 `navigationHistory` that broke in the dashboard's standalone mode (BUILD_REPORT.md:611-614, F-11)
- `file://` URLs are refused (`URL_SCHEME_REFUSED`) — only `http:` and `https:` are ever loaded
- Four required inputs each from exactly one source; a missing one is a NAMED refusal with a nonzero exit, never a silent fallback

**The evidence:**
- src/main.js: 198 lines, sha256-16 `ebd019d89cc4ddff`
- package.json: 9 lines, sha256-16 `5ba408df7e8adde2`
- upstream/view-surfaces.js (the LIVE handlers source): 378 lines, sha256-16 `b38148a1229639fa`
- upstream/PROVENANCE.md: the source SHAs and what was taken from each
- Electron 28.3.3 (the dashboard's own pinned version; `node_modules/electron/package.json`)

**The verification:**
- All 6 input-refusal modes tested by removing one input each; all exit 2 with the named error:
  PLUTUS_BROWSER_PORT_UNAVAILABLE, PLUTUS_BROWSER_DISPLAY_UNAVAILABLE, PLUTUS_BROWSER_TOKEN_UNAVAILABLE (×3 variants)
- investinglive.com/Orders/ loads headed and returns the page title "investingLive: Daily FX Option Expiries & Orders" — the exact page that returns `403 Request blocked` from Cloudflare Browser Run headless
- The full expiry data extracted as text via `/eval`: EUR/USD 1.1250 (EUR 624.89 mn) · USD/JPY 159.00 (US$ 1.65 bn) · GBP/USD 1.3475 (GBP 446.81 mn) · all 7 pairs with levels and notionals
- Back/forward/reload verified working (the Electron 28 path the dashboard's standalone mode broke)
- file:// refused, unknown route 404, bad token 401, empty eval 400 — all adversarial routes tested
- Memory: 253 MB tree (44 MB main + renderer), 7 threads
- Worker → tunnel → local browser: PROVEN — a Cloudflare Worker fetched the quick tunnel's `/health` and received `200 | {"success":true,"data":{"up":true,"pid":4054917}}`
- The probe Worker was deployed, tested, and deleted cleanly

**The honest notes:**
- The named tunnel needs one more dashboard permission (Cloudflare Tunnel Write / `argotunnel.write`); the quick tunnel proved the path works
- The DNS resolver on this host cannot resolve `trycloudflare.com` (systemd-resolved at `127.0.0.53` fails); bypassed with `--resolve` — this is a host configuration issue, not a plutus-browser defect
- The system resolver issue means the tunnel URL must be pinned or the named tunnel used for production
- No unit tests exist (R-13: the only test is "run it and look"); the verification is the live E2E evidence above

## Technical implementation

### The window (BrowserWindow)
- `width: 1400, height: 900` — matches the dashboard's surface; large enough for the expiry page
- `show: false` then shown on `ready-to-show` — avoids a white flash
- `backgroundColor: '#0B0B0C'` — the PLUTUS dark theme
- `webPreferences.partition: 'persist:plutus-browser'` — its own session, isolated from the dashboard's cookies
- `sandbox: true, nodeIntegration: false, contextIsolation: true` — the page code (investinglive, ForexFactory) cannot touch Electron
- `backgroundThrottling: false` — the page keeps rendering even when the window is not focused

### The control server (http.createServer)
- Bound to `127.0.0.1` only — never reachable from the network directly
- One route per action, all returning `{success: true, data}` or `{success: false, error, code}`
- `/health` is the only unauthenticated route; it returns only `{up: true, pid}` — no URL, no title, no page data (the leak surface is zero)
- Every other route requires `Authorization: Bearer <token>` — compared with `crypto.timingSafeEqual` against the file-read token
- The token is validated at boot: exactly 64 hex chars, mode 0600, or the process refuses to start

### The handlers (ported from view-surfaces.js)
- `navigate` — only `http:` and `https:` schemes; `file:`, `data:`, etc. are refused with `URL_SCHEME_REFUSED`
- `eval` — runs in the page context via `wc.executeJavaScript(js, true)`; capped at 20,000 chars; returns the expression's value
- `images` — reads `[...document.images].map(i => ({src, w, h, alt}))` — this is how the expiry image URL is extracted
- `capture` — `wc.capturePage()` → `toPNG()` → base64; returns the window size + page title alongside
- `back`/`forward` — `canGoBack()` + `goBack()` (the Electron 28 API; NOT `navigationHistory` which is Electron 31+)
- `input` — click (mouseDown + mouseUp), key (keyDown + keyUp), text (insertText) — for driving forms on the calendar page

### The input contract (the loud-fail-or-clear-pass law)
Each of the four required inputs has exactly ONE source:
1. `--port=<n>` — the control server port; no default; an invalid range is refused
2. `DISPLAY` — the X display; no default; must be set (never guessed)
3. `~/.plutus-browser/token` — the bearer token; no env fallback; must be 64 hex, mode 600
4. The bookmarks are hardcoded in the source (they are the dashboard's own, not user-configurable)

A missing or invalid input exits with code 2 and a named error that says how to fix it. There is no silent fallback, no default port, no "try another display."

## Architecture changes from the dashboard

The dashboard's browser tab is a `BrowserView` inside a 26-process Electron app that also runs Xvfb, weston, MT5, five localhost servers, a SQLite database, and a terminal bridge. The fork is a single `BrowserWindow` in a single Electron process with a single HTTP server — no children, no SQLite, no terminal, no MT5, no weston, no Xvfb. The only shared code is the handler logic (ported) and the bookmark URLs (copied verbatim).

```
DASHBOARD (26 processes)              FORK (1 process)
├── electron main                     ├── electron main (main.js, 198 L)
│   ├── BrowserView (the tab)         │   ├── BrowserWindow
│   ├── 5 localhost servers           │   └── http server :9470
│   ├── SQLite DB                     │
│   ├── MT5 connection                │   TOTAL: 253 MB, 7 threads
│   ├── terminal bridge               │
│   ├── agent display                 │
│   └── Xvfb + weston + noVNC         │
└── renderer (4,800 L)                └── (none — no renderer UI)
    ├── browser-tab.js
    ├── display-surface.js
    └── browser-polyfill.js
```

## Files changed (the complete list)

| File | Lines | SHA-16 | Status |
|---|---|---|---|
| `src/main.js` | 198 | `ebd019d89cc4ddff` | NEW — the entire runtime |
| `package.json` | 9 | `5ba408df7e8adde2` | NEW — pins Electron 28.3.3 |
| `package-lock.json` | 871 | (generated) | NEW — npm install output |
| `upstream/view-surfaces.js` | 378 | `b38148a1229639fa` | COPY — the LIVE handler source |
| `upstream/surface.js` | 370 | (copy) | COPY — the standalone runner source |
| `upstream/PROVENANCE.md` | 8 | (new) | NEW — the source SHAs |
| `upstream/index.html.bookmarks.txt` | 4 | (extract) | EXTRACT — the 4 bookmark URLs |
| `docs/*.md` | 6 files | (new) | NEW — the ship docs |

## Known issues

1. **The named tunnel is blocked** by one missing API permission (`argotunnel.write`). The quick tunnel proved the path.
2. **The system DNS resolver** cannot resolve `trycloudflare.com` on this host (systemd-resolved limitation). The `--resolve` workaround bypasses it. The named tunnel avoids the zone entirely.
3. **No login state**: the fork uses its own partition (`persist:plutus-browser`), so any cookies the dashboard's tab accumulated (for TradingView, for example) are not shared. This is by design (isolation), but it means any page that requires login would need to log in once in the fork.
4. **No streaming events**: the control server is request/response only. If the eventual pi-durable workflow needs to watch for a page event (a button appearing, a form submitting), it would need to poll `/status` or add a WebSocket route. Not built because no current use case requires it.

## Deployment notes

- **Prerequisites:** Node.js ≥ 18, npm, an X display (the agent display or the operator's)
- **Install:** `cd plutus-browser && npm install`
- **The token:** `mkdir -p ~/.plutus-browser && openssl rand -hex 32 > ~/.plutus-browser/token && chmod 600 ~/.plutus-browser/token`
- **Start:** `DISPLAY=:N ./node_modules/.bin/electron . --port=9470`
- **Verify:** `curl http://127.0.0.1:9470/health` → `{"success":true,"data":{"up":true,"pid":...}}`
- **Stop:** kill the process (the control server closes with the window)
- **The tunnel:** `cloudflared tunnel --url http://127.0.0.1:9470` (quick) or create a named tunnel (production)

## ANCHOR INDEX

package.json:1 — the Electron 28.3.3 pin and the start script.
docs/TESTING_LOG.md:1 — every verification with its raw output.
docs/DEBUG_LOG.md:1 — the 4 bug/fix/lesson entries.
docs/FULL_BUILD_CONTEXT.md:1 — the architecture diagram and key-files table.
upstream/PROVENANCE.md:1 — the source SHAs.
SHIP_MANIFEST.md:1 — the artifact table.
DEPLOY.sh:1 — the deploy script.
Each line above was verified with grep -n during this cycle.

## 2026-11-07 — THE HOST TOOL: CLI + verb table + OMP extension + deploy (supersedes the hand-start in "Deployment notes")

WHAT: plutus-browser is now installed and run as a host tool the way pinebox is, and stays a separate tool (operator, 2026-11-07).
- `cli/plutus-browser` (sha256-16 `fbe74ce43b5564da`): bash CLI on the computer-use v2 core. An instance IS a core `computer` instance (ids 10..99, allocated and owned by the core's registry); the control port is 30000 + id. Verbs: up down list ports health status bookmarks viewport navigate back forward reload eval text images shot input. Exit 0 = one JSON object; 1 = `REFUSED <TOKEN> — detail`; 2 = usage.
- `cli/actions.json` (`776ad6644a512067`): the verb table the extension reads (same contract as pinebox's).
- `extension/index.ts` (`0cdb88466d577f6f`): thin OMP forwarder registering tool `plutus_browser`; attaches the `shot` PNG as an image; the host's session id becomes CU_SESSION_ID.
- `src/main.js` (`69880afaf36f585e`): one Chromium profile per control port (two instances never share one), and a serial navigation queue (see docs/DEBUG_LOG.md, EN-5).
- `deploy.sh` (shipped as DEPLOY.sh): installs CLI, table, app (npm ci), link, extension; creates the token only if absent; refuses INSTANCE_LIVE; prints one JSON receipt with the installed SHAs.

WHY THE ID MODEL: see docs/DEBUG_LOG.md EN-7 — the first CLI copied pinebox's 0..9 ids and collided with the core's registry.
HOW TO RUN: `bash DEPLOY.sh`, then `plutus-browser --session NAME up --url <u>` (README.md). The `plutus_browser` tool appears in the next omp session.
EVIDENCE: docs/TESTING_LOG.md (2026-11-07 results). NOT VERIFIED: the tool through the omp tool surface (docs/THEATRICALITY_LOG.md).
