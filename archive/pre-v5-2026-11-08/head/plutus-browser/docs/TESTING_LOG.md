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

## TEST PLAN ENTRY — 2026-11-07 — the installed CLI, refusals first, then a real instance

### HOST
- **What:** the installed `plutus-browser` refuses every malformed, foreign or unavailable call by name, and drives a real headed instance end to end.
- **PASS:** a malformed call prints `REFUSED <TOKEN>` and exits 1 with nothing left running; a live call returns the page's own data.
- **FAIL:** exit 0 on a bad call, an unnamed error, an instance left running after a refusal, another session reaching an instance.
- **Instrument:** /tmp/pbr-battery.sh (23 cases), /tmp/pbr-live.sh (18 steps), /tmp/pbr-race.sh, /tmp/pbr-ship.sh section 4.

## TEST RESULT — 2026-11-07 — the installed CLI

### HOST
- **Refusal battery (23 cases):** BAD_VERB; BAD_ID for 5, 100, 07 and missing; BAD_ARGS for unknown flag, no url, no js, bad kind, non-integer click, bad regex, non-http url; NO_SESSION for up/list/status; NOT_OWNED for status/down on the operator's id 10; SESSION_FOREIGN for `up --id 10`; NOT_UP; RUNTIME_DIR_UNAVAILABLE; TOKEN_UNAVAILABLE at mode 644; `PORT_TAKEN:30050` with `teardown: ok` (no instance left). The operator's pinebox id 0 and computer id 10 stayed claimed and running afterwards.
- **Live path:** `up` (core allocated id 13, display :3, investinglive title returned); `up` again and `up --id 13` → INSTANCE_LIVE; `text --match` returned 15 expiry rows plus the explanatory line (count 16: EUR/USD 1.1250 EUR 624.89 mn … NZD/USD 0.5640 NZD 913.65 mn); file:// → URL_SCHEME_REFUSED; `not a url` → URL_INVALID; `shot` → 136440 B PNG 1400x900, opened and read (investinglive header, article title, cookie banner visible); second instance id 60 on display :5 with its own profile; another session's `status --id 60` → NOT_OWNED; `down --id 60` killed it while 13 stayed up.
- **Race (EN-5):** before the fix two concurrent navigates both exited 1 (ERR_ABORTED / SURFACE_ERROR -3); after it both exit 0, and back + navigate 0.1 s apart both exit 0.
- **Package smoke:** the package's own DEPLOY.sh installed files whose SHAs equal the packaged ones; then up → text → shot (231780 B PNG) → down, session left with zero instances.
- **Verdict: PASS for the CLI.** **UNTESTED:** `plutus_browser` through the omp tool surface (binds at the next session start); `eval` of a throwing expression returns the generic SURFACE_ERROR (FAILURE_LOG F-6).
- **Artifacts:** /run/user/1000/plutus-browser/shots/13-1794041787160336137.png and 13-1794042034774344675.png.

## TEST RESULT — 2026-11-07 (later) — Worker -> Workers VPC binding -> named tunnel -> local browser

### HOST
- **Setup (no operator steps):** `wrangler vpc service create plutus-browser --type http --tunnel-id 972a42d8-fad2-44c9-8abb-cb39b9d823c3 --hostname localhost --http-port 30020` → VPC service `01a1b53f-a0b8-7de2-a193-78f0b6d5f835`. The service has one fixed port, so the Worker-facing browser is instance id 20: `plutus-browser up --id 20`.
- **The run:** instance 20 up (pid 1315211); a throwaway Worker `plutus-vpc-probe` with binding `vpc_services:[{binding:"BROWSER", service_id}]` called `env.BROWSER.fetch(new Request("http://localhost:30020/health"))` and `/status`.
- **Raw output:** `/health` → 200 `{"success":true,"data":{"up":true,"pid":1315211}}` (the pid equals the instance's); `/status` without a token → 401 `AUTH_REQUIRED`.
- **Cleanup:** the Worker deleted (`Successfully deleted plutus-vpc-probe`), instance 20 down, `list` empty.
- **Verdict: PASS.** Supersedes the "named tunnel not routable" notes of 2026-11-07 (earlier) and the quick-tunnel-only proof of 2026-11-06.
- **Open:** cloudflared runs under setsid, not as a service, so a host reboot stops it; a production Worker still needs the bearer token as a Worker secret for every route except /health.
