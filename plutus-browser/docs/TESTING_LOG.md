# TESTING_LOG — plutus-browser

## TEST PLAN ENTRY — 2026-11-06 — the fork's control surface

### HOST
- **What:** every route on the control server works correctly, including the adversarial cases.
- **How:** curl against `127.0.0.1:9470` on display :6.
- **PASS criteria:** named responses with the correct HTTP codes.
- **FAIL criteria:** any route returning an unnamed error, a 200 for an adversarial request, or a silent failure.
- **Status:** PASSED

## TEST RESULT — 2026-11-06 — the control surface

### HOST
- **The run:** 12 curl requests against the live runtime.
- **The raw output:**
```
/health (no token)  -> 200 {"success":true,"data":{"up":true,"pid":4054917}}
/status no token    -> 401 AUTH_REQUIRED
/status with token  -> 200 {"url":"https://www.forexfactory.com/calendar","title":"forexfactory.com/calendar","loading":true}
/bookmarks          -> 200 4 bookmarks (TradingView, FF calendar, investinglive, TV markets)
/navigate investinglive -> 200 {"title":"investingLive: Daily FX Option Expiries & Orders"}
/navigate file://   -> 400 URL_SCHEME_REFUSED: file: - http/https only
/back               -> 200 {"url":"...","canGoBack":true}
/forward            -> 200
/eval empty         -> 400 EVAL_EMPTY
/nothing            -> 404 ROUTE_UNKNOWN
bad token /status   -> 401 AUTH_REQUIRED
```
- **The verdict: PASS** — every route returns a named response with the correct code.
- **The artifacts:** the responses above, pasted from the live run.

## TEST PLAN ENTRY — 2026-11-06 — investinglive loads headed (the page that 403s headless)

### HOST
- **What:** the exact page that returns 403 from Cloudflare Browser Run (headless) loads in the headed fork.
- **How:** navigate to `https://investinglive.com/Orders/`, read the title, extract the expiry data.
- **PASS criteria:** the page title contains "investingLive" and the expiry data is text-extractable.
- **FAIL criteria:** a 403, a CloudFront block, or an empty page.
- **Status:** PASSED

## TEST RESULT — 2026-11-06 — investinglive headed

### HOST
- **The run:** navigate + eval + images + capture.
- **The raw output:**
```
title: "investingLive: Daily FX Option Expiries & Orders"
body text: "FX option expiries for 6 November 10am New York cut"
expiry data (via eval):
  EUR/USD 1.1250 (EUR 624.89 mn), 1.1150 (EUR 960.00 mn)
  USD/JPY 159.00 (US$ 1.65 bn), 158.00 (US$ 4.24 bn), 157.00 (US$ 1.72 bn)
  GBP/USD 1.3475 (GBP 446.81 mn), 1.3315 (GBP 425.75 mn), 1.3200 (GBP 591.51 mn)
  USD/CHF 0.8175 (US$ 136.16 mn), 0.8100 (US$ 175.00 mn)
  USD/CAD 1.4000 (US$ 1.30 bn), 1.3950 (US$ 1.01 bn)
  AUD/USD 0.6900 (AUD 792.20 mn), 0.6950 (AUD 640.23 mn)
  NZD/USD 0.5640 (NZD 913.65 mn)
capture: PNG 1400x900, 186105 B
```
- **The verdict: PASS** — the page loads, the data is real and extractable, the capture is a real frame.
- **The artifacts:** `~/.local/state/plutus-browser/iv-capture.png` (186 KB).

## TEST PLAN ENTRY — 2026-11-06 — Worker → tunnel → local browser (the E2E chain)

### HOST
- **What:** a Cloudflare Worker can reach the local browser through a tunnel.
- **How:** deploy a probe Worker that fetches the quick-tunnel /health, then delete it.
- **PASS criteria:** the Worker receives a 200 with the browser's PID.
- **FAIL criteria:** a timeout, a DNS failure, or any non-200.
- **Status:** PASSED

## TEST RESULT — 2026-11-06 — the E2E chain

### HOST
- **The run:** quick tunnel started, probe Worker deployed, fetched, deleted.
- **The raw output:**
```
quick tunnel URL: https://chem-chat-controlled-avon.trycloudflare.com (up after 6s)
probe Worker deployed to: https://plutus-probe.cryptoforex36963.workers.dev
curl https://plutus-probe.cryptoforex36963.workers.dev/
  -> 200 | {"success":true,"data":{"up":true,"pid":4054917}}
probe Worker deleted: {"deleted":true}
```
- **The verdict: PASS** — the full chain works: Cloudflare edge → tunnel → local headed browser.
- **The artifacts:** the response above; the probe Worker's deploy + delete API calls.

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
