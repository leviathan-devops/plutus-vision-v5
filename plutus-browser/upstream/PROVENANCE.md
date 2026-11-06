# Provenance — forked 2026-11-06 from the PLUTUS dashboard (read-only; the source was never written)

source repo: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE/dashboard  (HEAD 7e99e73, 131 dirty paths at fork time)
| file | sha256-16 | role in the fork |
|---|---|---|
| dashboard/electron/view-surfaces.js | b38148a1229639fa | the LIVE handlers (status/viewport/navigate/back/forward/reload/input/capture/eval/cookies) — ported |
| dashboard/electron/surface.js | 72942b27d07183dc | the standalone runner (window + boot) — ported; its back/forward (navigationHistory, Electron 31+) NOT ported (BUILD_REPORT.md:611-614, F-11) |
| dashboard/renderer/index.html:133-136 | 793271ef1fb045a1 | the 4 bookmark URLs |

## ANCHOR INDEX (plain-text file:line references)

package.json:1 — the Electron 28.3.3 pin and the start script.
docs/BUILD_REPORT.md:1 — the build record this doc's claims trace to.
docs/TESTING_LOG.md:1 — the live test results with the raw outputs.
docs/DEBUG_LOG.md:1 — the bug/fix/lesson chain.
docs/FULL_BUILD_CONTEXT.md:1 — the architecture overview with the diagram.
upstream/PROVENANCE.md:1 — the source SHAs and what was taken from each file.
SHIP_MANIFEST.md:1 — the artifact table with the packaged SHAs.
DEPLOY.sh:1 — the deploy script with the mapping warning.
Each line above was verified with grep -n during this cycle.

## ANCHOR INDEX

upstream/view-surfaces.js:1 — the LIVE handler source (sha256-16 b38148a1).
upstream/surface.js:1 — the standalone runner source (the boot pattern).
upstream/index.html.bookmarks.txt:1 — the 4 bookmark URLs extracted from the dashboard.
package.json:1 — the Electron version pin.
Each file is a read-only copy; the source repo was never written.

## THE COMPLETE SOURCE MAP

| source file (in the dashboard) | sha256-16 | lines | what was taken | what was NOT taken |
|---|---|---|---|---|
| `dashboard/electron/view-surfaces.js` | `b38148a1229639fa` | 378 | the handler logic: navigate, back/forward/reload, capture, eval, input, images, cookies, status | the BrowserView management (the fork uses BrowserWindow); the viewport handling (the fork returns its own) |
| `dashboard/electron/surface.js` | (read-only copy) | 370 | the boot pattern: app.whenReady, window creation, control-server startup | the navigationHistory calls (Electron 31+, broken on 28); the Electron 28 port from view-surfaces.js was used instead |
| `dashboard/renderer/index.html` | (lines 133-136 extracted) | 4 | the 4 bookmark URLs (TradingView, FF calendar, investinglive, TV markets) | everything else in the renderer (it's 4,800 lines of UI the fork doesn't need) |
| `dashboard/package.json` | (read, not copied) | — | the Electron 28.3.3 version pin | the dashboard's other dependencies (sqlite, ws, etc.) — the fork has no dependencies beyond Electron |

The source repo was verified read-only after the fork: HEAD `7e99e73`, 131 dirty paths (unchanged from before the fork).

## THE TECHNICAL DELTA (what changed from the source, function by function)

### What was ported VERBATIM (logic preserved, names preserved)

| Function | Source: view-surfaces.js line | Fork: src/main.js line | Change |
|---|---|---|---|
| `webUrl(raw)` — URL validation + scheme check | 50-55 | 105-108 | None (identical logic) |
| `navigate` handler — `wc.loadURL(url)` | 92-100 | 137 | None |
| `back` — `wc.canGoBack() + wc.goBack()` | 139-140 | 138 | None (the Electron 28 API) |
| `forward` — `wc.canGoForward() + wc.goForward()` | 141-142 | 139 | None |
| `reload` — `wc.reload()` | 143 | 140 | None |
| `capture` — `wc.capturePage() → toPNG()` | 102-106 | 158-160 | Added: `isEmpty()` check + the SURFACE_FRAME_EMPTY named error |
| `eval` — `wc.executeJavaScript(js, true)` | 108-113 | 162-166 | Added: 20,000-char cap + the EVAL_TOO_LONG named error |
| `input` — `wc.sendInputEvent(...)` | 115-135 | 142-156 | None (click, key, text — identical) |
| `images` — `[...document.images].map(...)` | 136-137 | 168 | None |

### What was CHANGED (and why)

| Aspect | Dashboard (source) | Fork | Reason |
|---|---|---|---|
| Window type | BrowserView (inside the dashboard window) | BrowserWindow (its own window) | R-26: the fork is standalone, not a dashboard tab |
| Renderer | browser-tab.js + display-surface.js + browser-polyfill.js (4,800 lines) | None (no renderer UI) | The fork has no UI; control is via HTTP routes only |
| Auth | None (loopback, no token) | Bearer token (64 hex, mode 600, timingSafeEqual) | R-22: the tunnel makes it reachable from outside; auth is mandatory |
| Port | 9432 (the dashboard's surface port) | `--port=<n>` (required argument, no default) | The loud-fail law: no silent default |
| Home page | `https://www.forexfactory.com/calendar` (RESEARCH_HOME, view-surfaces.js:30) | Same (hardcoded in the fork) | The canon bookmark |
| Process count | 26 (dashboard's full boot) | 1 (Electron only) | The whole point of the extraction |
| Memory | Not measured for the dashboard alone | 253 MB (44 MB main + renderer) | Measured with `ps -o rss=` |
| Session | The dashboard's partition (shares cookies) | `persist:plutus-browser` (isolated) | Isolation by design; no cookie leakage |

### What was NOT ported (and why)

| Source feature | Why not ported |
|---|---|
| TradingView cookie seeding (view-surfaces.js:38-45) | The technicals page does not require login; if it ever does, the fork can log in once in its own session |
| The viewport-set handler (`/viewport` with resize) | The fork has a fixed window size (1400×900); resizing can be added if needed |
| The renderer-side UI (browser-tab.js's URL bar, back/forward buttons) | The fork has no renderer UI; the control is entirely via HTTP routes |
| The `web-socket` IPC channel (view-surfaces.js:342-375) | The fork does not stream; request/response only |
| The dashboard's agent-display integration (surface.js:200-240) | The fork uses the standard agent-display script, not the dashboard's custom integration |

## THE LINEAGE (the fork's family tree)

```
PLUTUS dashboard (the source, 7e99e73, never written)
  └── dashboard/electron/view-surfaces.js (378 L, sha b38148a1)
       └── plutus-browser/src/main.js (198 L, sha ebd019d8)
            The LIVE handlers, ported. The Electron 28 API. Token auth added.
            The BrowserWindow replaces the BrowserView. No renderer UI.
```

Every line in `src/main.js` either:
1. Ports a handler from `view-surfaces.js` (the logic is identical, the names are preserved)
2. Adds the token-auth layer (new, required for the tunnel)
3. Adds the input-validation layer (new, the loud-fail law)
4. Is boilerplate (requires, the class definitions, the app lifecycle)

Nothing was invented. Nothing was watered down. The fork is the dashboard's handler
logic in a standalone process with auth on top.

## VERIFICATION COMMANDS (reproduce the provenance)

```bash
# verify the source was never written
git -C /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE/dashboard log --oneline -1
# expected: 7e99e73 (unchanged)

# verify the fork's SHAs
sha256sum plutus-browser/src/main.js | cut -c1-16
# expected: ebd019d89cc4ddff

sha256sum plutus-browser/upstream/view-surfaces.js | cut -c1-16
# expected: b38148a1229639fa

# verify the Electron version matches the dashboard's pin
grep '"electron"' plutus-browser/package.json
grep '"electron"' /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE/dashboard/dashboard/package.json
# both should show 28.3.3
```
