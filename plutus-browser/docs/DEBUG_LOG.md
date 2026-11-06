# DEBUG_LOG — plutus-browser

## EN-1 — THE ELECTRON 31 NAVIGATIONHISTORY CRASH IN THE DASHBOARD'S STANDALONE MODE (2026-11-06, inherited)

- **THE FINDING:** the dashboard's own `surface.js:356-357` used `webContents.navigationHistory.back()` / `.forward()`, an Electron 31 API. The dashboard pins Electron 28.3.3, where this API does not exist, so back/forward threw.
- **THE ROOT CAUSE:** the API was added in Electron 31; the dashboard's `package.json` pins `28.3.3`. The standalone mode was written against a newer API than the runtime provides.
- **THE FIX (in the fork):** use `webContents.canGoBack()` + `webContents.goBack()` (the Electron 28 API), which is what the dashboard's LIVE handler `view-surfaces.js:139-140` already used. The fork ported the LIVE handler, not the broken standalone.
- **THE VERIFICATION:** `curl /back` → `{"url":"https://www.forexfactory.com/calendar","canGoBack":true}` and `curl /forward` → the investinglive URL. Both work.
- **THE LESSON:** when forking from a codebase with two implementations of the same behavior (a LIVE path and a standalone path), port the LIVE one — the standalone is where unmaintained API drift accumulates.

## EN-2 — THE DNS RESOLVER CANNOT RESOLVE trycloudflare.com (2026-11-06)

- **THE FINDING:** `curl https://chem-chat-controlled-avon.trycloudflare.com/health` failed with `Could not resolve host`, even though the tunnel was up and the cloudflared log showed a registered connection.
- **THE ROOT CAUSE:** the host's `/etc/resolv.conf` points to `127.0.0.53` (systemd-resolved), which does not resolve the `trycloudflare.com` zone. A direct DNS query to `1.1.1.1` resolves it correctly (`104.16.231.132`).
- **THE FIX (the workaround):** `curl --resolve <host>:443:<IP>` to bypass the system resolver. The edge IP was resolved via a direct UDP DNS query to `1.1.1.1`.
- **THE VERIFICATION:** with `--resolve`, the full chain works: Worker → tunnel → browser = 200.
- **THE LESSON:** the host resolver is a single point of failure for any Cloudflare tunnel testing on this machine. The named tunnel avoids the `trycloudflare.com` zone entirely (it uses a hostname on a zone you control), making this a non-issue in production.

## EN-3 — THE SYSTEMD-RESOLVED DNS LIMITATION ON THIS HOST (2026-11-06)

- **THE FINDING:** the quick tunnel was registered and serving, but `curl` could not resolve the `trycloudflare.com` hostname.
- **THE ROOT CAUSE:** `/etc/resolv.conf` nameserver is `127.0.0.53` (systemd-resolved), which does not resolve the `trycloudflare.com` zone. A direct DNS query to `1.1.1.1` resolves it to `104.16.231.132`.
- **THE FIX:** `curl --resolve <host>:443:<IP>` bypasses the system resolver entirely.
- **THE VERIFICATION:** with `--resolve`, the full Worker → tunnel → browser chain returned 200.
- **THE LESSON:** any test that depends on the system resolver will fail for `trycloudflare.com` hostnames on this machine. Either use `--resolve` or use a named tunnel on a zone that the resolver can reach.

## EN-4 — THE THREE-ATTEMPT WORKER DEPLOYMENT (2026-11-06)

- **THE FINDING:** deploying a probe Worker via the Cloudflare REST API took four attempts (three failures, one success).
- **THE ROOT CAUSE:** the Workers script upload API is strict about content types:
  - Attempt 1: `Content-Type: application/javascript` → HTTP 405 (wrong method for that content type)
  - Attempt 2: raw multipart → HTTP 400 "No such module: worker.js" (the part name didn't match the metadata)
  - Attempt 3: `text/javascript` → HTTP 400 "Unexpected token 'export'" (wrong module type for ES modules)
  - Attempt 4: `application/javascript+module` → HTTP 200 deployed
- **THE FIX:** use `FormData` with `new Blob([...], { type: 'application/javascript+module' })` for the module part and `new Blob([JSON.stringify({main_module: 'worker.js', compatibility_date: '2024-09-01'})], { type: 'application/json' })` for the metadata.
- **THE VERIFICATION:** the Worker deployed, served the probe request, and was deleted cleanly.
- **THE LESSON:** the Workers upload API has two content types for a reason: `text/javascript` is for Service Worker syntax (no `export`), `application/javascript+module` is for ES modules (with `export default`). Getting this wrong wastes three round trips.

## Regression watch

- If Electron is upgraded past 31, `navigationHistory` becomes available and the `canGoBack/goBack` path may be simplified — but the current code works on 28 and is the safer port.
- If investinglive changes their page structure (the images move from `/cms/media/`), the `/images` route still returns all `<img>` elements — the extraction would need updating, not the runtime.
- If Cloudflare changes the quick-tunnel URL format, the `--resolve` workaround's IP extraction would need updating.

## Iron laws

1. ONE input, ONE source, ONE error. Never a default, never a fallback.
2. `http:` and `https:` only. `file:` is always refused.
3. The token is 64 hex chars, mode 600, from exactly one file. Anything else is a refusal.
4. Back/forward use the Electron API that matches the pinned Electron version, not the newest API.
5. The dashboard's LIVE handlers are the port source, never its standalone mode.

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

## OPERATIONAL REFERENCE

The runtime commands (from docs/FULL_BUILD_CONTEXT.md, the operational-knowledge section):

Start: DISPLAY=:N ./node_modules/.bin/electron . --port=9470
Verify: curl http://127.0.0.1:9470/health
Navigate: curl -H "Authorization: Bearer $(cat ~/.plutus-browser/token)" "http://127.0.0.1:9470/navigate?url=https://investinglive.com/Orders/"
Extract: curl -H "$AUTH" -G --data-urlencode "js=document.body.innerText" http://127.0.0.1:9470/eval
Capture: curl -H "$AUTH" http://127.0.0.1:9470/capture
Stop: kill the process

These commands are the operator's interface to the runtime from outside the package.
The DEPLOY.sh script in the package root automates the first four steps.

## OPERATIONAL REFERENCE

The runtime interface (from DEPLOY.sh and docs/FULL_BUILD_CONTEXT.md):
- Start: `DISPLAY=:N ./node_modules/.bin/electron . --port=9470`
- Verify: `curl http://127.0.0.1:9470/health` → `{"success":true,"data":{"up":true,"pid":...}}`
- Navigate: `curl -H "Authorization: Bearer $(cat ~/.plutus-browser/token)" "http://127.0.0.1:9470/navigate?url=..."`
- Extract data: `curl -H "$AUTH" -G --data-urlencode "js=document.body.innerText" http://127.0.0.1:9470/eval`
- Capture: `curl -H "$AUTH" http://127.0.0.1:9470/capture | python3 -c '...'`
- List images: `curl -H "$AUTH" http://127.0.0.1:9470/images`
- Stop: kill the Electron process

The auth token lives in `~/.plutus-browser/token` (mode 600, 64 hex chars).
The runtime requires a headed X display (DISPLAY must be set).
These commands are the contract between the Cloudflare workflow and the local browser.

## OPERATIONAL REFERENCE

The runtime interface (from DEPLOY.sh and docs/FULL_BUILD_CONTEXT.md):
- Start: `DISPLAY=:N ./node_modules/.bin/electron . --port=9470`
- Verify: `curl http://127.0.0.1:9470/health` → `{"success":true,"data":{"up":true,"pid":...}}`
- Navigate: `curl -H "Authorization: Bearer $(cat ~/.plutus-browser/token)" "http://127.0.0.1:9470/navigate?url=..."`
- Extract data: `curl -H "$AUTH" -G --data-urlencode "js=document.body.innerText" http://127.0.0.1:9470/eval`
- Capture: `curl -H "$AUTH" http://127.0.0.1:9470/capture | python3 -c '...'`
- List images: `curl -H "$AUTH" http://127.0.0.1:9470/images`
- Stop: kill the Electron process

The auth token lives in `~/.plutus-browser/token` (mode 600, 64 hex chars).
The runtime requires a headed X display (DISPLAY must be set).
These commands are the contract between the Cloudflare workflow and the local browser.
