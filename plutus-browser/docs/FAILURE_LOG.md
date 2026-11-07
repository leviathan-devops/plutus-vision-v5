# FAILURE_LOG — plutus-browser

### F-1 — THE CLOUDFLARE TUNNEL CREATION API RETURNED 403 (2026-11-06)

- **What happened:** `POST /accounts/{id}/cfd_tunnel` returned `403 Authentication error` — the API token lacks the tunnel permission.
- **Found:** when creating the named tunnel via the Cloudflare API.
- **Root cause:** the "OMP" API token has 149 permissions but not one of: `teams-connectors.write`, `teams-connector-cloudflared.write`, or `argotunnel.write`.
- **Impact:** the named tunnel could not be created from this session. The quick tunnel was used instead and PROVED the path works.
- **Disposition:** OPEN — the operator needs to add one permission to the "OMP" token in the dashboard (the same edit that added Browser Run : Edit).

### F-2 — THE SYSTEM DNS RESOLVER CANNOT RESOLVE trycloudflare.com (2026-11-06)

- **What happened:** `curl` to the quick-tunnel URL failed with `Could not resolve host` even though the tunnel was registered.
- **Found:** when testing the E2E chain from this host.
- **Root cause:** systemd-resolved (`127.0.0.53`) does not resolve the `trycloudflare.com` zone. Direct DNS to `1.1.1.1` works.
- **Impact:** the E2E test needed a `--resolve` workaround; any tool using the system resolver would fail against a quick-tunnel URL.
- **Disposition:** FIXED (workaround) — `--resolve` bypasses the resolver. The production named tunnel uses a different zone, so this becomes a non-issue.

### F-3 — THE CLOUDFLARE API DEPLOYMENT OF THE PROBE WORKER REQUIRED THREE ATTEMPTS (2026-11-06)

- **What happened:** the probe Worker's deployment failed twice before succeeding.
- **Found:** during the E2E test.
- **Root cause:** the API rejected `Content-Type: application/javascript` (405), then `multipart/form-data` without the right Blob type (400), then `text/javascript` instead of `application/javascript+module` (400). The fourth attempt with `application/javascript+module` succeeded.
- **Impact:** wasted time, but no data loss — the Worker was eventually deployed, tested, and deleted.
- **Disposition:** NOT-A-BUG — the Cloudflare Workers API's module-upload format is specific about content types, and this was a learning curve, not a plutus-browser defect.

### F-4 — THE PROBE WORKER'S SUBDOMAIN WAS DISABLED BY DEFAULT (2026-11-06)

- **What happened:** the probe Worker deployed successfully but returned nothing — its `workers.dev` subdomain was disabled.
- **Found:** when the curl to the Worker's URL returned an empty response.
- **Root cause:** the Workers API creates the script with `enabled: false` on the subdomain by default; it needs an explicit POST to enable.
- **Impact:** one extra round trip; no data loss.
- **Disposition:** NOT-A-BUG — expected Cloudflare behaviour; documented here so the next deployment doesn't trip on it.

### F-5 — THE CLOUDFLARED PROCESS SURVIVED THE KILL SIGNAL (2026-11-06)

- **What happened:** after `pkill -f "cloudflared.*9470"`, the process was still listed in `pgrep`.
- **Found:** during cleanup after the E2E test.
- **Root cause:** the process was started with `setsid -f`, which detaches it from the session; `pkill -f` matched the pattern but the process ignored SIGTERM (or had already reaped).
- **Impact:** the tunnel stayed up for a few extra seconds. No functional impact.
- **Disposition:** FIXED — a direct `kill <pid>` terminated it.

## The failure taxonomy for this build

| Class | Count | Status |
|---|---|---|
| Permission failures (Cloudflare API) | 2 | Both OPEN (operator dashboard edits) |
| Content-type failures (Worker deployment) | 3 | All resolved (learning curve) |
| DNS resolution (host configuration) | 1 | Resolved with --resolve |
| Process management (setsid survival) | 1 | Resolved with explicit kill |
| **Total** | **7** | **5 resolved, 2 open (both are operator dashboard edits)** |

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

### F-6 — `eval` OF A THROWING EXPRESSION RETURNS THE GENERIC SURFACE_ERROR (2026-11-07)
- **What happened:** `eval --js 'nope.nope'` → exit 1, `SURFACE_ERROR — Script failed to execute…` (the page's exception text is lost).
- **Root cause:** `executeJavaScript` rejects with a generic message; main.js passes it through.
- **Disposition:** OPEN, minor. A fix was written and reverted untested because it was not requested; the shipped main.js is the tested one.

### F-7 — gi-lsp `unwired` WARNINGS KEEP ARRIVING ON EVERY JS/TS EDIT (2026-11-07)
- **Root cause:** this omp process started Nov 4 15:03:54; gi-lsp was removed from `~/.omp/agent/lsp.json` at Nov 4 17:31:01 (0 hits now). The running omp holds the old config in memory and spawns `Graph_Intelligence/scripts/gi-lsp.ts` on the first edit of a .ts/.js file; killing it holds only until the next such edit.
- **Disposition:** OPEN until that omp session restarts (config is already clean; a new session will not load it). See managed skill omp-disable-live-extension-or-lsp.
