# THE SECOND OPERATOR — a zero-context agent given ONLY the docs

## THE PROTOCOL
A subagent (`SecondOperator`, 6m32s) was given EXACTLY two documents — `reports/lqz_runtime_forensic.md`
and `RECEIPT.md` — and told to bring the rig up, compile a deliverable, capture a frame, open it,
and report every point where the docs were insufficient. It was forbidden to edit files or fix anything.
**Purpose: verify the DOCS, not the agent.** A failure would be a finding about the documentation.

## WHAT IT FOUND THAT I DID NOT — THE HALF-ALIVE STATION

**This is the session's most valuable third-party finding.** It probed the ports and got:

```
=== port 9741 ===  http_code=000  curl exit 28        ← LISTENING but NOT ANSWERING
=== port 9754 ===  http_code=404  (healthy — no / route)
=== port 9851 ===  http_code=200
=== port 9222 ===  http_code=200
```
```
LISTEN 1  511  127.0.0.1:9741  users:(("MainThread",pid=841398,fd=23))
```

Then it isolated the routes on `:9741`:
```
/          code=000 time=4.002099   TIMEOUT
/health    code=000 time=4.002346   TIMEOUT
/catalog   code=200 time=1.723019
/canon     code=503 time=0.000655
/cells     code=200 time=0.009307
/bars      code=200 time=0.007992
/nope      code=500 time=0.000422
OPTIONS /  code=204 (instant)
POST /run  WORKED
```

**THE STATION WAS HALF-ALIVE: some routes answered instantly, `GET /` and `GET /health` HUNG for
the full client timeout, and `POST /run` worked normally.** The VIL rail agreed with the broken
half — its health read `"station":{"up":false,"code":"PINE_STATION_DOWN","error":"TypeError: fetch failed"}`,
exactly the signature my runtime ledger records in OP-9.

**~20 minutes later the SAME probes returned `200` in under 1 ms and the rail reported `up:true`.**
The state was TRANSIENT.

### WHY THIS MATTERS — it explains my own OP-9 finding
1. **The launcher's health check is `up http://127.0.0.1:9741/ || STATION_DOWN` — the GET-`/` route.
   That is the route that hangs.** So `pv-ide.sh` reports `STATION_DOWN` for a station that compiles
   fine. A rig can be declared dead while it works.
2. **My own probes only ever hit `POST /run`** — the route that keeps working. That is why my crash
   test found the station healthy, and why my OP-9 diagnosis ("the station died silently") was only
   half right: it did not die, it went PARTIALLY deaf, and the deafness coincided with the route my
   health checks and the launcher use.
3. **A route-level health check is the correct detector.** `GET /` returning 000 while `/cells`
   returns 200 in 9 ms is a state no port-level check can see.

**CLASSIFICATION: a real defect in the RIG (the launcher's health predicate), not in the
deliverables.** Recorded, with the mechanism, for the next session.

## WHAT IT CONFIRMED INDEPENDENTLY (the docs were right)

| claim | its finding | my record | verdict |
|---|---|---|---|
| the deliverable sha | `b6dda2dae4416ec8` | `b6dda2dae4416ec8` (H1) | **MATCH** |
| the D1 panel at 1H | `{"ok":true,"title":"LQZ LuxAlgo","tries":1,"bars":400,"cleared":153,"boxes":117,"lines":36,"labels":0}` | forensic H2 op-1: `117 boxes / 36 lines / 0 labels, cleared 153` | **EXACT MATCH — independently reproduced** |
| the station's full-window count | `boxes 481 / lines 182` at limit 1603 | the measured matrix: `b481/l182` at 1H | **MATCH** |
| display :3 | `xdotool` sees `PLUTUS-CHART` and `Plutus Vision — Pine IDE` | :3, window 14680067 | **MATCH** |

**A zero-context agent reproduced my runtime ledger's op-1 line digit for digit.** That is the
strongest possible check on a ledger — an independent operator reaching the same numbers from the
docs alone.

## ITS CAPTURE AND ITS LOOK

- frame: `/tmp/pv-secondop-luxalgo.png`, sha256[:16] **`ea195c103b1969d1`**
- it built its own capture script (`/tmp/pv-secondop-capture.mjs`) because the documented tool
  hard-codes `reports/panel-grid-<TF>.png` and the brief forbade edits — **a correct reading of
  the constraint, not a doc gap**
- **it opened the frame and described it:** dark background (RGB 21,22,25), the legend reading
  `LQZ LuxAlgo`, the header `EU EURUSD · FIXTURE · 1h` with a live OHLC readout, candlesticks
  visible across the full width (teal-green RGB 8,153,129 and red 242,54,69) tracing ~1.1355
  up to ~1.1470 with a sharp spike around Jul 2-4
- **HONEST NOTE IT VOLUNTEERED:** its first capture produced a STALE frame (`6f58ca0de55fd756`
  — showing D3) while the page was wedged, and the same command produced the correct D1 frame in
  `tries: 1` after the station recovered. **It caught its own stale-frame defect and reported it.**

## THE DOC GAPS IT NAMED

| # | gap | severity |
|---|---|---|
| 1 | **No probe COMMAND is given** — the docs state ports and their meaning but not the commands to check them | low |
| 2 | **The compile command is not in the docs** — it recovered `POST :9741/run` with its body shape from `pine-ide/pine-station/server.mjs:16-22` and `scripts/lqz_ship.test.ts:31-41` | **MEDIUM — the docs assume the reader knows the station's API** |
| 3 | Neither doc names the launcher's health route, so it could not know `GET /` is the unreliable one | medium |
| 4 | The capture path required reading `scripts/lqz-panel.mjs` to replicate | low (acceptable — the tool exists) |

## THE VERDICT

**INSUFFICIENT AS WRITTEN, SUFFICIENT IN PRACTICE.** Every step was completable, and it reproduced
my numbers exactly — but it had to read SOURCE to learn the compile API, which a true zero-context
operator could not do. **The single highest-value fix: put the three commands (rig check, compile,
capture) verbatim into an OPERATING MANUAL section of the runtime ledger.** The knowledge exists in
this project; it is simply scattered across source and test files instead of stated once where an
operator starts.

**AND THE BIGGER RESULT: the check paid for itself.** A zero-context operator found a rig defect
(the launcher's health predicate reads a route that can hang while the station compiles) that the
author, running 15 adversarial cases and 12 named tests, never caught — because the author's probes
only ever used the route that works.
