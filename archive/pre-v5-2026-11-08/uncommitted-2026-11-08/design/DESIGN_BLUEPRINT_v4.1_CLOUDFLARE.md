# PLUTUS VISION — DESIGN BLUEPRINT v4.1 (CLOUDFLARE)
## The machine, its parts, its contracts, its failure modes, and the pseudocode of every part

**Class:** BLUEPRINT · **Substrate:** Cloudflare Workers · Durable Objects · Workflows · Workers AI
(Clef, Clairic) · Browser Run · R2 · D1 · pi-durable (two named legs only)
**Authority (highest first):** operator rulings > `Original_Canon_Data/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md`
(written by the operator before any AI touched the project; everything else derives from it) >
`Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` (E1 translated to code token for
token, R-14; E2 is preserved verbatim from it per the corrected prompt :6) + `Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md` (the E3 authority, R-16;
sha256 prefix `d3fc65e40602`) > `spec/PLUTUS_VISION_MASTER_SPEC.md` > `cards/` (163) > this document.
**Rule for conflicts:** if this document disagrees with a source above it, the source wins and the
worker stops with `SPEC_CONFLICT <section> <source:line>` in `runtime/record.json` — it never picks.
**Executes with:** `design/BUILD_WORKFLOW_v4.1_CLOUDFLARE.md` (the turn-by-turn build).
**The worker builds from THIS document.** `cf/` in the tree is a prior draft (7 type errors at
hand-off, measured). It is NOT authoritative. The worker may port a function from it only when the
port passes the parity gate named in the workflow; otherwise it writes from the pseudocode below.

---

## REVISION TABLE

| # | operator correction | what it changed here |
|---|---|---|
| 1 | nothing works; nothing is proven | §0.3 lists only measured facts; everything else is UNPROVEN |
| 2 | no LLM, no agent, no hallucination | §0.1 L-B; models return typed values only; no component writes prose |
| 3 | build and run it on Cloudflare | §2: one Worker, one Workflow, two Durable Objects, R2, D1, Browser Run, Workers AI |
| 4 | Clef and Clairic are mandatory | Clairic = every read of an image (§4.3–4.4, §8 G4). Clef = every judgement (§5.2, §5.4–5.6, §8 G3) |
| 5 | pi-durable only where Cloudflare is not best | §2.7: exactly two legs, each with the reason Cloudflare cannot do it. No leg has two executors |
| 6 | no fallbacks, ever | §5.1: two failure types (Fatal, Refusal), no third. §11 A21 detects `??` substitutes in engine code |
| 7 | the judge must SEE the computation | §5.4: the ZFP receipt is the attestation state; the judge audits the derivation |
| 8 | 60 code / 40 System One | §5.8 counted by clause |
| 9 | I am the planner, not the worker | §12 + the workflow: every turn is literal, gated, and resumable by a cold agent |
| 10 | every browser runs headed (2026-10-26) | §4.3: Browser Run session + Live View opened in a headed Chrome window on the agent display before any capture |
| 11 | Clef feeds confidence and the 7 gates; no 8th gate | §5.6: E3 is a parity port of `trident_engine3_v8.py`; Iron Law 25 (exactly 7 gates) holds |
| 12 | stop-loss reconciled by zone family | §5.6.1: outside a liquidity zone (LQZ/LSZ), may sit inside a pressure zone (S/D) |
| 13 | audit vs canon: IP zones are never entries (MECH-ZONE-FAMILIES) | §5.6 step 2: entries are Face-B zones only; IP zones are targets and context |
| 14 | audit vs canon: cap = eviction (LAW-TRADE-COUNT-CAP) · DXY cascade first (E3-CASCADE) · 1D for the 90-day LSZ scan (E1-TF-HIERARCHY) · roles top-to-bottom, no spot filter (E1-FACE-A-IP-ZONES, E1-LAW-NO-SPOT-FILTER) · six confluence dimensions (E1-CONFLUENCE-SCORE) · energy is arithmetic (E2-CONSERVATION-OF-ENERGY) | §4.1, §5.4.1, §5.4.3, §5.5, §5.6 |
| 15 | E3 authority = `TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md`; `trident_engine3_v8.py` archived; E3 untouched until E1 and E2 work (R-16, 2026-11-06) | header authority chain · §5.6 retitled DEFERRED, every v8 dependency removed · §12 P4 row deferred · row 11's "parity port of v8" is VOID |

---

# §0 · THE CONSTRAINT, AND THE SPLIT IT FORCES

## §0.1 · Three physical laws

```
┌────────────────────────────────────────────────────────────────────────────┐
│ L-A  PINE SCRIPT CANNOT FETCH, AND CANNOT PARSE JSON.                      │
│      Its only external input is input.*; its string tools are str.split,  │
│      str.tonumber, str.substring. The card must reach Pine as ONE pasted   │
│      string in a delimited format Pine can split.                          │
├────────────────────────────────────────────────────────────────────────────┤
│ L-B  A SYSTEM ONE MODEL CANNOT REASON, COUNT, COMPUTE, OR WRITE PROSE.      │
│      Clef: one forward pass -> noul (0..1) | score (level) | choice        │
│      (distribution). Clairic: typed value + p_null + confidence + span.    │
│      Neither can "figure out" anything; both can be wrong; neither may     │
│      produce a number that reaches the chart.                              │
├────────────────────────────────────────────────────────────────────────────┤
│ L-C  A WORKER HAS NO LONG-LIVED PROCESS. A WORKFLOW STEP IS REPLAYED.       │
│      Durable state lives only in a Workflow step result (<= 1 MiB, JSON),  │
│      a Durable Object, R2, or D1. Any side effect outside step.do() runs   │
│      again on replay. A Durable Object is single-threaded per name.        │
└────────────────────────────────────────────────────────────────────────────┘
```

## §0.2 · The split

```
      ┌──────────────────────────────────────────────────────────────────┐
      │ CODE — the macro shell (Worker + Workflow + DO)                  │
      │ every number · every bound · every branch · every gate · every   │
      │ write · every retry                                              │
      └───────────┬──────────────────────────────────────┬───────────────┘
                  │                                      │
    ┌─────────────▼──────────────┐       ┌───────────────▼───────────────┐
    │ CLAIRIC  (@cf/cloudflare/  │       │ CLEF  (@cf/cloudflare/clef)   │
    │ clairic) — THE READER      │       │ — THE JUDGE                   │
    │ image -> typed value       │       │ evidence -> probability over  │
    │ + p_null + span            │       │ a fixed option set            │
    └─────────────┬──────────────┘       └───────────────┬───────────────┘
                  │                                      │
      ┌───────────▼──────────────────────────────────────▼───────────────┐
      │ CODE AGAIN — invariants · weakest clause · veto · seal · emit    │
      └──────────────────────────────────────────────────────────────────┘
```

**One sentence:** code computes the world, Clairic reads what is not computable, Clef judges what is
not decidable, code decides what to draw — and every one of those runs inside a Cloudflare primitive
because L-C leaves nowhere else to run it.

## §0.3 · Measured start state (the only facts)

```
PROVEN (this host)
  cf/verify/zfp.py + zfp_verify.py   fail-closed ZFP; 24/24 mutations caught; 3 calibration controls
  cf/e2/e2_core.py                   11/11 E2 controls (state completeness, constant judge, order)
  gates/gate.sh + lib.sh             5 exit paths proven; a gate that cannot fail -> exit 4
  gates/firewall.sh                  D1..D8; tampered gate -> PIN_MISMATCH rc=1
  scripts/chart_validator.py         20 pixel checks C01..C20 (G1)
UNPROVEN
  every Cloudflare resource (no account bound in this environment)
  cf/ TypeScript draft (7 type errors at hand-off) — reference only
ABSENT
  EURUSD 4H/1H/30m bars for the golden week (fixtures are DXY 1H only: 84 weeks, 41,546 bars)
  calibration sweeps · held-out weeks · the Pine kernel · G0 G2 G3 G4 G5
```

---

# §1 · THE STACK

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ L4 VERIFY   G0 deploy · G1 pixels · G2 structure · G3 Clef-flash · G4        │
│             Clairic · G5 agreement + control · REPLAY (Workflow pv-replay)   │
├──────────────────────────────────────────────────────────────────────────────┤
│ L3 RENDER   Pine kernel: parse the pasted string · cast · draw · ABSENT token│
├──────────────────────────────────────────────────────────────────────────────┤
│ L2 CARD     JSON card (R2 + WeekSeal DO)  ->  Pine string (GET /card.pine)   │
├──────────────────────────────────────────────────────────────────────────────┤
│ L1 COMPUTE  Workflow pv-week: E1 compute · E1 attest · E2 · E3 · seal        │
├──────────────────────────────────────────────────────────────────────────────┤
│ L0 DATA     bars (R2, uploaded by pi-durable) · options + calendar (Browser  │
│             Run -> R2 -> Clairic)                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

| plane | consumes | produces | owner (file) | when its input is absent |
|---|---|---|---|---|
| L0 | R2 `bars/…`, two URLs | `BarSet`, `Walls`, `CalEvent[]` | `src/steps/*` | Fatal `W1_*`/`W2_*`/`W3_*`; run stops |
| L1 | L0 outputs | `Zone[]`, `ShapeLink[]`, `Setup[]` | `src/e1,e2,e3` | Fatal `E1_*`/`E2_*`/`E3_*`; run stops |
| L2 | L1 outputs | sealed card + Pine string | `src/do/WeekSeal.ts`, `src/card/*` | no card; `/card` returns 404 `CARD_ABSENT` |
| L3 | the Pine string | a chart | `pine/plutus-vision.pine` | draws face B only + `CARD: ABSENT` |
| L4 | frame + card + deploy | a verdict row | `gates/*` | no PASS row; the hook refuses the commit |

Dependency direction is one-way. E1 never reads E2; E2 never reads E3; L3 never calls L1.

---

# §2 · THE CLOUDFLARE MACHINE

## §2.1 · Topology

```
 HOST (pi-durable leg P-1)                       CLOUDFLARE ACCOUNT
 ┌────────────────────────┐   PUT /ingest/bars   ┌──────────────────────────────┐
 │ bar uploader           │ ───────────────────► │ Worker  plutus-vision        │
 │ bearer INGEST_TOKEN    │                      │ src/index.ts                 │
 └────────────────────────┘                      │  GET  /health                │
                                                 │  PUT  /ingest/bars           │
 OPERATOR / CRON                                 │  POST /run                   │
 ┌────────────────────────┐   POST /run          │  GET  /card  /card.pine      │
 │ Mon 05:00 UTC trigger  │ ───────────────────► │  GET  /runs  /ledger         │
 └────────────────────────┘                      │  POST /gate/judge  (staging) │
                                                 └───────┬──────────────────────┘
                                                         │ PV_WEEK.create()
                                                         ▼
                              ┌────────────────────────────────────────────────┐
                              │ Workflow pv-week (class PvWeek)                │
                              │ arm · harvest · harvest.siblings ·             │
                              │ capture.options · capture.calendar ·           │
                              │ extract.options · extract.calendar ·           │
                              │ e1.compute · e1.attest · e2.chain ·            │
                              │ e3.setups · seal                               │
                              └──┬────────┬──────────┬──────────┬──────────┬───┘
                                 ▼        ▼          ▼          ▼          ▼
                             ┌──────┐ ┌───────┐ ┌─────────┐ ┌──────┐ ┌──────────┐
                             │ R2   │ │BROWSER│ │ AI      │ │ D1   │ │ DO       │
                             │ bars │ │ Run   │ │ Clairic │ │ runs │ │ Ledger   │
                             │ caps │ │       │ │ Clef    │ │ pols │ │ WeekSeal │
                             │ cards│ │       │ │         │ │      │ │          │
                             └──────┘ └───────┘ └─────────┘ └──────┘ └──────────┘
```

## §2.2 · `wrangler.jsonc` (exact)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "plutus-vision",
  "main": "src/index.ts",
  "compatibility_date": "2026-10-25",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "vars": { "BUILD_SHA": "set-by-deploy" },
  "ai": { "binding": "AI" },
  "browser": { "binding": "BROWSER" },
  "r2_buckets": [{ "binding": "R2", "bucket_name": "plutus-vision" }],
  "d1_databases": [{ "binding": "D1", "database_name": "plutus-vision", "database_id": "<from: wrangler d1 create>" }],
  "durable_objects": { "bindings": [
    { "name": "WEEK_SEAL", "class_name": "WeekSeal" },
    { "name": "LEDGER",    "class_name": "Ledger" } ] },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["WeekSeal", "Ledger"] }],
  "workflows": [
    { "name": "pv-week",      "binding": "PV_WEEK",      "class_name": "PvWeek" },
    { "name": "pv-replay",    "binding": "PV_REPLAY",    "class_name": "PvReplay" },
    { "name": "pv-calibrate", "binding": "PV_CALIBRATE", "class_name": "PvCalibrate" } ],
  "triggers": { "crons": ["0 5 * * MON"] },
  "env": { "staging": { "name": "plutus-vision-staging" } }
}
```

Secrets (never in the file): `INGEST_TOKEN` (`wrangler secret put INGEST_TOKEN`). `BUILD_SHA` is
injected at deploy: `wrangler deploy --var BUILD_SHA:$(git rev-parse HEAD)`.

## §2.3 · The bindings, their jobs, their failures

| binding | primitive | job | failure → code |
|---|---|---|---|
| `PV_WEEK` | Workflow | the weekly run, 12 durable steps | a step throws → instance `errored`; D1 row `failed` + code |
| `PV_REPLAY` | Workflow | runs N frozen weeks, scores against labels | any week errors → replay `FAIL` |
| `PV_CALIBRATE` | Workflow | sweeps act/flag per question set, writes `policies` | infeasible → `CALIBRATION_INFEASIBLE` |
| `WEEK_SEAL` | DO (SQLite) | one card per `pair:week`; second write returns first sha | — (cannot fail open) |
| `LEDGER` | DO (SQLite) | one row per model call, keyed by run | incomplete row → `LEDGER_ROW_INCOMPLETE` |
| `AI` | Workers AI | Clairic + Clef + Clef-flash | `CLAIRIC_UNAVAILABLE` / `CLEF_UNAVAILABLE` (Refusal) |
| `BROWSER` | Browser Run | page → element PNG | `BROWSER_UNAVAILABLE` (Refusal), `W2_CAPTURE_*` (Fatal) |
| `R2` | R2 | bars · captures · cards · labels | `W1_BARS_ABSENT`, `W2_CAPTURE_MISSING` |
| `D1` | D1 | `runs`, `policies`, `labels` | `D1_*` (Fatal) |

## §2.4 · R2 key layout (content is immutable per key)

```
bars/<PAIR>/<YYYY-MM-DD>.json          {"1D":Bars,"4H":Bars,"1H":Bars,"30m":Bars}   written by P-1
captures/<week>/<PAIR>/options.png     element screenshot                written by capture.options
captures/<week>/calendar.png           element screenshot                written by capture.calendar
cards/<week>/<PAIR>.json               the sealed JSON card              written by seal
cards/<week>/<PAIR>.pine.txt           the Pine string                   written by seal
labels/golden/<week>/<PAIR>.json       operator-signed setups            uploaded by operator
labels/heldout/<week>/<PAIR>.json      operator-drawn after freeze       uploaded by operator
frames/<week>/<PAIR>/<sha>.png         rendered chart frames             written by P-2
```

## §2.5 · D1 schema (`migrations/0001_init.sql`)

```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY, pair TEXT NOT NULL, week TEXT NOT NULL, anchor_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('armed','sealed','failed')),
  card_sha TEXT, error_code TEXT, build_sha TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX runs_pair_week ON runs(pair, week);

CREATE TABLE policies (
  surface TEXT PRIMARY KEY,                 -- e1 | e2 | e3 | g3 | g4
  act REAL NOT NULL, flag REAL NOT NULL, per_question TEXT NOT NULL,   -- JSON
  source TEXT NOT NULL, rows INTEGER NOT NULL CHECK (rows > 0),
  false_allow REAL NOT NULL, recall REAL NOT NULL, model TEXT NOT NULL, swept_at TEXT NOT NULL);

CREATE TABLE labels (
  id TEXT PRIMARY KEY, set_name TEXT NOT NULL CHECK (set_name IN ('golden','heldout','g4')),
  week TEXT NOT NULL, pair TEXT NOT NULL, r2_key TEXT NOT NULL, sha TEXT NOT NULL,
  drawn_after_freeze INTEGER NOT NULL);
```

## §2.6 · Why each primitive (and why not the alternative)

| need | chosen | rejected | deciding requirement |
|---|---|---|---|
| multi-step run with retries that must not repeat side effects | Workflows | Queues | durable step results + resume at the failed step |
| exactly one card per pair·week under concurrency | Durable Object | D1 unique key | the DO serialises writers; a D1 race returns an error, the DO returns the first sha |
| per-run ordered decision log | Durable Object (SQLite) | D1 | one writer per run, ordered, co-located with the run name |
| queryable history across runs | D1 | DO | SQL across all pairs and weeks |
| bytes (bars, PNGs, cards) | R2 | KV | objects > 25 MiB headroom, immutable keys |
| render a web page | Browser Run | fetch() | the options page is JS-rendered |
| read an image | Clairic | Clef | Clairic returns values with p_null and span; Clef returns judgements |
| judge evidence | Clef (runtime), Clef-flash (gates) | an LLM | no prose, calibrated probabilities, ≤64 questions per call |

## §2.7 · pi-durable — the two legs, and why Cloudflare cannot do them

| leg | why not Cloudflare | contract |
|---|---|---|
| **P-1 bar uploader** | the bar feed lives on the operator host; a Worker cannot reach a local feed | reads the host feed, writes `PUT /ingest/bars` with `INGEST_TOKEN`; the Worker validates and stores; a rejected upload is a Fatal printed by the uploader |
| **P-2 Pine rig driver** | TradingView/Pine IDE is a desktop app on the host; the frame must be the real render | pastes `GET /card.pine`, captures the frame, uploads to `frames/…`; the GATE (not P-2) writes the verdict |

**No leg has two executors.** There is no "if Browser Run fails, use pi-durable" path; that would be a
fallback, and a fallback is banned (rev. 6). Browser Run failing is `BROWSER_UNAVAILABLE`, loud.

---

# §3 · THE PROCESS IT PRESERVES

```
v1 (manual)                        v4 (this machine)
① a prompt to an agent             ① POST /run -> Workflow pv-week, 12 typed steps
② a PDF read by eye                ② a JSON card sealed once by a Durable Object
③ hand-transcription into Pine     ③ GET /card.pine pasted into ONE input field
```

What the PDF had to get right is now a card field checked by schema (G2), by pixels (G1), by a read
of the rendered labels (G4), and by a judge reading a card about the claim (G3).

---

# §4 · L0 — DATA

## §4.1 · Bars — the ingest contract (pi-durable P-1 → Worker)

```ts
// PUT /ingest/bars?pair=EURUSD&week=2026-07-06     Authorization: Bearer <INGEST_TOKEN>
// body: {"1D":Bars,"4H":Bars,"1H":Bars,"30m":Bars}   Bars = {ts:number[] (unix s), open,high,low,close:number[]}
async function ingestBars(req, env): Response {
  if (req.headers.get("authorization") !== `Bearer ${env.INGEST_TOKEN}`) return 401 {error:"INGEST_UNAUTHORIZED"}
  const {pair, week} = query(req);  requirePair(pair);  requireMonday(week)        // W0_*
  const set = await req.json();
  const w = weekWindow(week);
  for (tf of ["1D","4H","1H","30m"]) validateBars(must(set[tf], "W1_TF_ABSENT", {tf}), tf, w.anchor)
  if (set["1D"].close.length < 90)  throw Fatal("W1_1D_SHORT")       // the 90-day LSZ scan
  if (set["4H"].close.length < 200) throw Fatal("W1_4H_SHORT")
  if (set["1H"].close.length < 300) throw Fatal("W1_1H_SHORT")
  const key = `bars/${pair}/${week}.json`
  if (await env.R2.head(key)) {                       // immutable: re-upload must be byte-identical
    if (sha(existing) !== sha(body)) throw Fatal("W1_BARS_CONFLICT", {key})
    return 200 {key, sha, created:false}
  }
  await env.R2.put(key, body); return 201 {key, sha, created:true}
}

function validateBars(b, tf, anchorMs) {
  n = b.ts.length; if (n == 0) Fatal("W1_BARS_ABSENT")
  every field has length n                              else Fatal("W1_BARS_RAGGED")
  ts strictly increasing                                else Fatal("W1_BARS_UNORDERED")
  all OHLC finite                                       else Fatal("W1_BARS_INVALID")
  high >= max(open,close) && low <= min(open,close)     else Fatal("W1_BARS_OHLC")
  b.ts[n-1]*1000 <= anchorMs                            else Fatal("W1_LOOKAHEAD")
}
```

## §4.2 · The week window (one definition, used everywhere)

```ts
function weekWindow(week /* YYYY-MM-DD */) {
  monday = Date.parse(week+"T00:00:00Z");  getUTCDay(monday) == 1 else Fatal("W0_WEEK_NOT_MONDAY")
  return { open:   monday - 2h,              // Sunday 22:00 UTC, first bar of the trading week
           anchor: monday + 8h,              // Monday 09:00 London (BST); the last bar E1 may read
           end:    monday + 4d + 21h }       // Friday 21:00 UTC
}
```
DST: the anchor is 09:00 London; in GMT weeks it is `monday + 9h`. `weekWindow` reads the UK offset
from a fixed table of DST start/end dates (`src/time/uk-dst.ts`, two dates per year). No library.

## §4.3 · Capture — Browser Run, watched headed through Live View (operator ruling #10)

Every capture happens in a Browser Run session whose Live View is open in a **headed Chrome window on
the agent display** (pi-durable P-2) before the page is read. Five Workflow steps, in this order:

```ts
step "capture.session.open":                        // returns ids only, never bytes
  browser   = await puppeteer.launch(env.BROWSER, {keep_alive: 600_000})
                catch -> Refusal("BROWSER_UNAVAILABLE", "check the BROWSER binding and Browser Run quota")
  sessionId = browser.sessionId()
  liveUrl   = <the Live View URL for sessionId — the source is recorded at P1.T2 in
               cf/src/steps/selectors.ts as LIVE_VIEW_SOURCE from
               developers.cloudflare.com/browser-run/features/live-view/>
  await env.R2.put(`liveview/${run}.json`, {sessionId, liveUrl})
  return {sessionId, liveUrl}
step.waitForEvent("liveview.opened", {timeout:"5 minutes"})
  // P-2 opens liveUrl in a headed Chrome window, captures one frame of that window to
  // frames/<run>/liveview.png, then sends the event {sessionId, frameSha}
  timeout -> Fatal("W2_LIVEVIEW_NOT_OPENED")
step "capture.options":  capturePage(sessionId, OPTIONS_URL, `captures/<week>/<PAIR>/options.png`, SEL.options)
step "capture.calendar": capturePage(sessionId, CALENDAR_URL, `captures/<week>/calendar.png`, SEL.calendar)
step "capture.session.close": (await puppeteer.connect(env.BROWSER, sessionId)).close()

async function capturePage(sessionId, url, key, selector): Capture {
  URL https and host ∈ ALLOWED_HOSTS                  else Fatal("W2_URL_REJECTED")
  browser = await puppeteer.connect(env.BROWSER, sessionId)
  page = await browser.newPage(); await page.setViewport({width:1600,height:1200,deviceScaleFactor:2})
  res = await page.goto(url, {waitUntil:"networkidle0", timeout:45_000})
  res && res.ok()                                     else Fatal("W2_CAPTURE_HTTP", {status})
  el = await page.waitForSelector(selector, {timeout:20_000})   else Fatal("W2_CAPTURE_SELECTOR")
  png = await el.screenshot({type:"png"})             // the ELEMENT (the embedded ladder image)
  0 < bytes <= 4 MiB · sha ∉ knownBad                 else Fatal("W2_CAPTURE_*")
  await env.R2.put(key, png); return {key, sha, bytes}   // a step result is <= 1 MiB: never the bytes
}
```
If Live View cannot provide a URL for a session, P1.T2 records `LIVE_VIEW_URL_UNAVAILABLE` as a named
block and the build stops there. There is no capture path without the headed window.

## §4.4 · Clairic — the options ladder

```ts
const OPTIONS_FIELDS = {
  pair:            {type:"text"},
  expiry_date:     {type:"date",     instructions:"the expiry this ladder belongs to"},
  cut_time:        {type:"time",     instructions:"the NY cut time printed on the page"},
  strikes:         {type:"list", items:"number", decimals:4, instructions:"every strike printed, ascending"},
  notionals_b:     {type:"list", items:"number", decimals:2, instructions:"notional in BILLIONS, same order as strikes"},
  open_interest:   {type:"list", items:"number", integer:true, instructions:"OI per strike if printed, else null"},
  printed_total_b: {type:"estimate", min:0, max:500, step:0.1, instructions:"the printed weekly total, if present"},
}
async function extractOptions(env, png, pair, w): Walls {
  raw = await env.AI.run("@cf/cloudflare/clairic", {state:`FX options expiry ladder for ${pair}…`,
                                                    images:[base64(png)], fields:OPTIONS_FIELDS})
         catch -> Refusal("CLAIRIC_UNAVAILABLE", remedy)
  raw.truncated != true                                  else Fatal("W2_EXTRACT_TRUNCATED")
  for f in fields: a = raw.answers[f]                     else Fatal("W2_FIELD_ABSENT", {f})
                   a.p_null is number                     else Fatal("W2_NO_PNULL", {f})
                   a.p_null <= 0.50                       else Fatal("W2_INCONCLUSIVE", {f, p_null})
  strikes   = list("strikes").map(num | Fatal W2_FIELD_INVALID)
  notionals = list("notionals_b").map(num | Fatal)
  oi        = list("open_interest").map(v => v===null ? null : num | Fatal)
  I1 len(strikes)==len(notionals)==len(oi)               else Fatal("W2_I1_ALIGNMENT")
  I2 every 0 < n < 500                                   else Fatal("W2_I2_UNITS")      // already billions
  I3 every |s - median(strikes)| <= 0.15*median          else Fatal("W2_I3_DOMAIN")
  I4 w.open <= Date.parse(expiry_date) <= w.end          else Fatal("W2_I4_WINDOW")
  I5 printed_total == null || |total - Σn| <= 0.02*Σn    else Fatal("W2_I5_TOTAL")
  return {pair, expiry, cut, strikes, notionals_b:notionals, oi}
}
```
`answers[f].guess` is never read. A Clairic `null` is a result, never a zero.

## §4.5 · Clairic — the calendar

```ts
const CALENDAR_FIELDS = {
  events:      {type:"list", items:"text",     instructions:"each event title, in date order"},
  event_dates: {type:"list", items:"datetime", instructions:"each release time, same order"},
  impact:      {type:"list", items:"text",     instructions:"high / medium / low as printed"},
  currency:    {type:"list", items:"text",     instructions:"three-letter code, same order"},
}
extractCalendar: same envelope as §4.4, then
  I1 equal lengths             else Fatal("W3_I1_ALIGNMENT")
  I2 every date parses         else Fatal("W3_I2_DATE")
  I3 every ts in [w.open,w.end] else Fatal("W3_I3_WINDOW")
  I4 impact in {high,medium,low} else Fatal("W3_I4_IMPACT")
  I5 currency matches /^[A-Z]{3}$/ else Fatal("W3_I5_CURRENCY")
```

---
# §5 · L1 — COMPUTE

## §5.1 · Failure types (`src/steps/errors.ts`) — exactly two

```ts
class Fatal   extends Error { code; detail }          // the input violated an invariant
class Refusal extends Error { code; remedy; detail }  // a dependency cannot be obtained
function must<T>(v: T|undefined, code, detail): T { if (v===undefined) throw Fatal(code, detail); return v }
```
**Banned in `src/e1 src/e2 src/e3 src/steps src/workflow`:** `?? <literal>`, `|| <literal>` on a
value, `catch {}` that returns, an empty-answer return from the judge door. A missing value is
`must(...)`; a missing judge is `Refusal`. Detector: §11 A21.

A Workflow step that throws a `Fatal` fails without retry (`NonRetryableError` wrapper in
`src/workflow/step.ts`); a `Refusal` is retried per the step's `retries` config, then fails.

## §5.2 · The Clef door (`src/steps/clef.ts`) — the only path to the judge

Schema (developers.cloudflare.com/workers-ai/models/clef/schema-input.json, schema-output.json):
request `{model:"clef", state, questions:{<id>:{type, instructions, criteria}}}`, response
`{answers:{<id>:{type, noul | score | choice, probabilities, confidence}}}`. ≤ 64 questions.

```ts
async function ask(env, run, stage, version, state, questions: Question[], policy): Record<id, Answer> {
  // 1 state gate — evidence in state; every path a question reads must resolve (ALL array items)
  for q of questions, p of q.requires: resolvePath(state, p)   else Fatal("E_STATE_INCOMPLETE",{q,p})
  tokens(state) <= 48_000                                      else Fatal("E_STATE_OVER_CAP")
  // 2 schema gate — the model's limits, checked before the call
  1 <= questions.length <= 64                                  else Fatal("E_QUESTION_COUNT")
  choice: 2..255 options · score: 2..10 levels · text <= 60 words  else Fatal("E_CHOICE_OPTIONS"|…)
  // 3 the call
  payload = {model:"clef", state, questions: map(q => [q.id,{type,instructions,criteria}])}
  fp = sha256(model ⊕ stage@version ⊕ canonical(payload))
  raw = await env.AI.run("@cf/cloudflare/clef", payload)
        catch -> LEDGER.append(refused row); throw Refusal("CLEF_UNAVAILABLE", remedy)
  // 4 answer gate — malformed is a provider failure, never a judgement
  answers = parseAnswers(raw, questions)   // type matches · noul in [0,1] · score in 0..levels-1 ·
                                           // choice probabilities sum to 1±1e-3 · every id present
  // 5 constant-judge control
  if (n >= 10 && distinct(round(values,3)) == 1) Fatal("E_JUDGE_CONSTANT")
  // 6 ledger — written here, never by the caller
  await env.LEDGER.getByName(run).append({ts, run, stage, stage_version:version, model, fingerprint:fp,
                                          answers, policy, route:"answered", route_reason:`min=…`, latency_ms})
  return answers
}
function answer(answers, id): number { return must(answers[id], "E_ANSWER_MISSING", {id}).value }
function perItem(templates, items, subject): Question[]     // one question per (item, template):
  // id = `${item.id}.${t.id}`, instructions = {question: t.instructions, subject: subject(item)}
function decide(clauses, policy) {                           // THE WEAKEST CLAUSE
  overall = min(clauses); failing = clauses below perQuestion[id] ?? policy.act   // a bar lookup, not a value substitute
  failing empty -> ALLOW ; overall >= policy.flag -> ESCALATE ; else DENY
}
```
`perItem` exists because a Clef question is answered once; a per-zone judgement needs one question
per zone, each carrying the zone id in its `instructions.subject`. 8 items × 4 templates = 32 ≤ 64.

## §5.3 · Policy (`src/gate/policy.ts`) — read from D1, never a literal

```ts
async function policyFor(env, surface): Policy {
  row = await env.D1.prepare("SELECT * FROM policies WHERE surface=?").bind(surface).first()
  row                                       else Refusal("E_UNCALIBRATED", "run Workflow pv-calibrate for "+surface)
  row.rows > 0 && row.false_allow == 0      else Fatal("E_POLICY_INVALID", {surface})
  return {act, flag, perQuestion: JSON.parse(per_question), source, rows}
}
```

## §5.4 · E1 — zones (code) and their attestation (Clef)

### §5.4.1 · Levels, clusters, confluence, degree (canon §3)

```ts
levels(bD,b4,b1,b30): Level[] // LSZ from the 1D/90-day scan (E1-TF-HIERARCHY, E1-LSZ-GRAMMAR); per tf: confirmed 2-bar fractal swings ("weekly_swing"),
                              // EMA200 ("ema200"), order blocks ("ob_4h"), round grid ("round"),
                              // prior-day H/L ("prior_day"). Every level carries {price,type,tf}.
                              // empty -> Fatal("E1_NO_LEVELS")
cluster(levels, tol = spot*RULING.clusterTolFrac): Cluster[]   // sorted sweep, mid = mean of members
confluence(c) = the 0-14 score over the SIX dimensions of cards/E1-CONFLUENCE-SCORE.md, copied verbatim
                into cf/src/e1/confluence.ts with the card line cited above each term (no invented weights)
                0 <= s <= 14 else Fatal("E1_CONFLUENCE_OUT_OF_RANGE")
degree = DEGREE[floor(s)]     // 12-14 EXTREME · 10-11 HEAVY · 8-9 MOD-HEAVY · 6-7 MODERATE · 4-5 LIGHT · 0-3 MINIMAL
```

### §5.4.2 · The ZFP (`src/e1/zfp.ts`, port of the verified `cf/verify/zfp.py`)

```ts
classifyTier(z, notional, expiryTs, w):           // B.1 conjunctions, exhaustive, no default
  every pillar type in PILLARS                     else Fatal("ZFP_PILLAR_UNKNOWN")
  expiry < w.open && z.structuralMemory            -> POST_EXPIRY_GHOST
  notional >= 1.5 && pillars >= 3 && confluent     -> HARD_WALL
  notional >= 0.85 && pillars >= 2                 -> STANDARD_WALL
  notional < 0.85 && pillars <= 1                  -> ONE_TOUCH
  notional < 0.85 && pillars <= 2                  -> SOFT_WALL
  notional >= 0.85 && pillars < 2                  -> SOFT_WALL
  else                                             Fatal("ZFP_TIER_UNCLASSIFIED")
base = point(TIER_BAND[tier], RULING.zfpPoint)     // D1 ruling: midpoint recommended
mods = six BOOLEAN gates at fixed points (B.2):    each = {name, fired, value: fired ? POINT : 0, gate: "<evidence>"}
  spring_release +25  expiry ∈ [w.open,w.end] && |mid-spot| <= spot*RULING.strikeRangePct
  macro_catalyst +20  ∃ event: impact=high && currency ∈ LEGS[pair] && ts ∈ [w.open,w.end]
                      (the release side is unknowable at the anchor; reading it = lookahead)
  momentum       +15  |ROC5| > RULING.momentumK*ATR20 && ROC5*toward > 0   (toward = sign(mid-spot))
  cross_pair     +20  >=2 siblings hold a zone with |pos_sibling - pos_zone| <= RULING.crossPairTolPct
                      (pos = position in the week's 1H range, inverted for USD-quote siblings)
  cascade        +25  ∃ same-direction zone closed through in [w.open, w.anchor] with pass-1 zfp > 45
  regime_change  +20  1H close crossed EMA200 inside [w.open, w.anchor]
raw = base + Σ value ; 0 <= raw <= 185 else Fatal("ZFP_OUT_OF_RANGE")
zfp = half_up(clamp(raw, RULING.zfpClamp))         // D3 ruling: [0,99] recommended
receipt = {tier, band, base, modifiers[6], raw, clamped, was_clamped, zfp, pillar9_bucket,
           cross_check, tier_inputs, formula_version}
validate(receipt)   // re-derives every field; 13 named mismatch codes
```

**Two passes, because `cascade` reads other zones' ZFP.** Pass 1 computes every zone with
`priorFailures=[]`; the zones closed through before the anchor contribute their pass-1 ZFP; pass 2
computes the receipts that ship. Definition, recorded in the cascade gate string: *a cascade cannot be
triggered by a cascade.*

**Parity gate:** the TS ZFP must reproduce the Python reference on the same 24 mutations + the tier
cases (`test/zfp-parity.ts` vs `cf/verify/zfp_verify.py`). A divergence is `ZFP_IMPL_DIVERGENCE`.

### §5.4.3 · Roles and invariants

```ts
assignRoles(zones):          rank the IP zones TOP-TO-BOTTOM by price; the top is CEILING, then
                            UPPER RESISTANCE, EQUILIBRIUM, MID-RANGE SUPPORT, KEY SUPPORT BAND per
                            cards/E1-FACE-A-IP-ZONES.md. Spot is NOT an input (E1-LAW-NO-SPOT-FILTER):
                            a zone is never dropped or reassigned because of where price is now.
                            5 distinct ids else Fatal("E1_ROLE_COUNT")
INV  every zone carries a receipt that validates          E1_NO_RECEIPT
INV  stdev(zfp) >= 1.0 over >= 3 zones                    E1_ZFP_FLAT
INV  width x0.5 / x1.5 does not move any zfp              E1_ZFP_GEOMETRY
INV  |rank(zfp) - rank(degree)| <= 1 else recorded         ZFP_CROSSCHECK_CONFLICT (finding, printed)
```

### §5.4.4 · E1 attestation — Clef reads the RECEIPT

State: `{zones:[{id, pillars, levels_in_band, receipt}], canon:{b1, b2, pillar_definitions}}`.
`perItem(Q_E1A, zones)` → 4 × ≤16 zones ≤ 64.

| id | type | instructions (verbatim) | criteria |
|---|---|---|---|
| Z1 | noul | "For every entry in zone.pillars, does the evidence contain at least one level of that type inside the zone band?" | true: every claimed pillar is backed in-range · false: at least one is not |
| Z2 | noul | "For every modifier with fired true, does its gate string state evidence that satisfies that modifier's rule in canon.b2?" | true: every fired gate is satisfied · false: at least one is not |
| Z3 | noul | "For every modifier with fired false, does its gate string name a condition that is absent from the zone and the bars summary?" | true: every declined gate names a real absence · false: a declined condition was present |
| Z4 | noul | "Does zone.receipt.tier satisfy every conjunct of its canon definition on the tier inputs shown?" | true: every conjunct holds · false: at least one does not |

```ts
v = decide({Z1..Z4}, policy.e1); ALLOW keeps · ESCALATE/DENY refuses (ledger + card.refusals)
kept/total >= 0.8   else Fatal("E1_ATTESTATION_DRIFT")     // a broken detector, not a bad zone
kept >= 5           else Fatal("E1_TOO_FEW_ZONES")
CONTROL: a planted zone (fabricated ob_4h outside the band + cross_pair fired on "no pair matched")
         rides every request as item "__plant__"; if decide() ALLOWs it -> Fatal("E1_CONTROL_VOID")
```

## §5.5 · E2 — the chain (code builds, Clef subtracts)

```ts
candidatesFrom(b1, zones, w):                      // prior-week 1H bars only (ts < w.open)
  spans = cut where a close crosses a ladder rung (zone mid) — structure, not a fit
  per span: anatomy {candles, bodyFrac, rangeRatio, wickUp, wickDown, colour, spanCloses}
            target = nearest zone to the span's last close ; licensed = LICENSED(anatomy, band(target.zfp))
            licensed empty -> span skipped (not a candidate; counted in the ledger)
  keep = sort by (|licensed|, target.zfp, start) take 8        // 8 × 4 = 32 questions
  empty -> Fatal("E2_NO_CANDIDATES")
STAGE A  perItem(Q_E2A, keep)   A1 anatomy satisfies a licensed shape · A2 direction vs target role ·
                                A3 contiguous, non-repeating · A4 closes stay inside the span (>=80%)
STAGE B  perItem(Q_E2B, keep)   state += answers_A ; B1 previous origin held (new structure)
         + choice B2 ONLY when |licensed| >= 2 : options = licensed shapes + "NONE"
verdict  per candidate: p = min(A1..A4, B1) ; vetoed = decide(...) != ALLOW
walk     seed = earliest survivor ; next = first later survivor whose shape ==
         TRANSITION[cur.shape | band(next.target_zfp)] ; stop at 5 links, at a CEILING with zfp<20,
         or when min(p) < 0.25 ; verify strictly increasing start, no repeats   (E2_CHAIN_ORDER/CYCLE)
ENERGY   code, not Clef: the conservation-of-energy check of cards/E2-CONSERVATION-OF-ENERGY.md over
         the walked chain (arithmetic on the legs' ranges vs the weekly budget) ; a failing last leg is
         dropped ; empty -> Fatal("E2_ENERGY_VETO") ; the trimmed min(p) may not rise
         -> else Fatal("E2_CONFIDENCE_INVERSION")
STAGE C  C2 noul "the alternative's decision zone is the hinge of the week" ;
         C2 < policy.act -> Fatal("E2_HINGE_UNCONFIRMED")
days     DAY_BUDGET[shape] × dayKinds(calendar): a day with a high-impact print for a pair leg is
         "new_shape", else "continuation" ; no day fits -> Fatal("E2_DAY_ASSIGNMENT_FAILED")
alt      re-walk the FULL survivor set with the hinge zone's zfp flipped across 45 ;
         identical (shape,start) sequence -> Fatal("E2_ALTERNATIVE_INVALID")
```
**The model's whole power over the chain is subtraction**: it can veto a candidate, end a leg with
`NONE`, or refuse the hinge. It cannot add a candidate, reorder, or name a shape outside `licensed`.

## §5.6 · E3 — DEFERRED until E1 and E2 pass; authority = the corrected E3 prompt (R-16)

**Authority (operator ruling R-16, 2026-11-06):** `Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md`
(1,685 lines, sha256 `d3fc65e40602…`, dated 2026-09-24). It does not exist as code yet and is NOT touched
until E1 and E2 are working. `Original_Canon_Data/Engines/trident_engine3_v8.py` (June era) is ARCHIVED:
historical reference only, never ported, never a parity target. Iron Law 2 ("the Python is the
reference") is SUPERSEDED. Where a line below and the corrected E3 prompt disagree, the prompt wins and
the worker records `SPEC_CONFLICT` with both lines. The steps below record operator corrections 11-14;
they are not a build order until the operator opens E3.

```
1 CASCADE     DXY runs first. Each DXY setup is mirrored onto every USD pair (EURUSD, GBPUSD, AUDUSD:
              DXY LONG -> pair SHORT), per cards/E3-CASCADE.md. A pair setup
              with no DXY parent is still evaluated and carries cascade:"independent".
2 ENTRY ZONES Face-B zones only — LQZ, S/D, LSZ on 1H/30m/15m (cards/MECH-ZONE-FAMILIES.md).
              An IP zone (Face A) is NEVER an entry: it is the target and the context.
              an entry on an IP zone -> Fatal("E3_IP_ZONE_AS_ENTRY")  (a code defect, not a refusal)
3 GEOMETRY    entry per cards/E3-ENTRY-RULE.md · tp = nearest opposing zone on the E2 path per
              cards/E3-TP-RULE.md · sl per §5.6.1 · rrr = |tp-entry| / |entry-sl|   (all code)
4 THE 7 GATES as the corrected E3 prompt defines them, listed with their prompt line numbers in
              design/E3_GATES.md when E3 opens. The count is 7 (Iron Law 25);
              any other count -> Fatal("E3_GATE_COUNT"). The SL hard max is the prompt's D17
              (36 pips, corrected E3 prompt :309) — not v8's validate_proximity or 150/180 table.
5 FRESHNESS · DIRECTION · REFINE   cards/E3-FRESHNESS-GATE.md, E3-DIRECTION-VALIDATION.md (the six
              checks), E3-REFINE-LOOP.md — implemented where the corrected E3 prompt places them;
              a card rule the prompt lacks becomes a CONFIDENCE term, never an 8th gate.
6 RRR         < 2.5 refused inside the RRR gate · 2.5–2.99 emitted only at HIGH confidence ·
              3.0 is the gauge (cards/E3-RRR-RULING.md, which supersedes E3-RRR-FLOOR.md)
7 CONFIDENCE  the operator composite (0-100: base, option, shape, red-folder, ZFP, BoM/MoM) is code
              and unchanged. Clef never edits its formula.
8 CLEF        D1..D7 asked per setup (perItem). D2 "the SL survives the creating structure" is the
              semantic half of the SL gate; D3 "the TP is on the E2 path" is the semantic half
              of the target gate: the gate refuses when the code check fails OR p < act_e3.
              D1, D4, D5, D6, D7 are recorded on the setup and order the eviction (step 9).
              Clef adds no gate.
9 COUNT       8 per week, 1-3 per day, is EVICTION (cards/LAW-TRADE-COUNT-CAP.md): a stronger setup
              replaces the weakest; strength = composite, then D5, then D1. The cap never refuses a
              stronger newcomer and is never reported as a rejection.
10 LABELS     every emitted setup carries the blind-execution labels of cards/E3-TIMING.md (SESSION,
              the anchor-hit window, …), copied verbatim into design/E3_GATES.md at P4.T1.
```

### §5.6.1 · Stop-loss (operator ruling #12, cards/LAW-RULING-SL-INSIDE-VS-OUTSIDE.md, E3-SL-RULE.md)

```
the stop sits OUTSIDE a liquidity zone (LQZ, LSZ) and MAY sit inside a pressure zone (S/D):
  (a) 3 pips outside the far edge of the entry step's zone, or
  (b) 1-2 pips inside the close edge of the next step, when that step is a pressure zone
  sl distance > 36 pips (D17, corrected E3 prompt :309) -> the SL gate refuses
```

## §5.7 · Fail polarity

Every judge surface here is critical: E1 attest, E2, E3, G3, G4. A judge that cannot be reached is a
`Refusal`; the run stops; the week is not traded. There is no advisory surface in the runtime.

## §5.8 · The 60/40 count (by content-determining clause)

```
CODE 34   E1 15 · E2 8 (spans, licensed, walk, order, energy, days, alt, trim)
          · E3 9 (cascade, entry, sl, tp, rrr, 7 gates, composite, eviction, labels) · verify 2
MODEL 21  Clairic 4 (ladder, expiry, calendar, frame labels) · Clef E1 4 · Clef E2 6 · Clef E3 7
TOTAL 55  · 61.8% / 38.2%  (inside the 60±2 band) · registry src/clauses.json · gate fails outside 60±2/40±2
```

---

# §6 · L2 — THE CARD

```jsonc
{ "schema":"trident-workflow-v2",
  "meta":{"week","pair","anchor_ms","build_sha","sources":{"options":"<sha>","calendar":"<sha>","bars":"<key>"},"engine":"e1@4/e2@4/e3@4"},
  "zones":[{"id","top","bottom","mid","confluence","degree","role","pillars","zfp","receipt":{…},"attest":{"vector","verdict"}}],
  "chain":[{"id","shape","target","target_zfp","direction","start_ts","end_ts","confidence","day"}],
  "alternative":{"decision_zone","flip_at":45,"chain":["…"]},
  "setups":[{"id","direction","entry","sl","tp","rrr","confidence","tier","anchor_zone","day","category","clauses"}],
  "refusals":[{"id","code","detail"}],
  "count":{"emitted","ceiling":8} }
```
**Invariants (G2 checks each):** every zone receipt validates · every number in `setups` derives from
`zones` (entry ∈ {z.top,z.bottom}) · no `provenance` key carries a shape/span/setup · `tokens ≤ 3,500`.

**WeekSeal DO (`src/do/WeekSeal.ts`):**
```ts
writeOnce(card): {sha, created}
  row = sql("SELECT sha FROM seal WHERE k='card'")
  row ? return {sha:row.sha, created:false}          // the second writer gets the first sha
      : sql("INSERT INTO seal(k,sha,body,at) VALUES('card',?,?,?)") ; return {sha, created:true}
read(): {sha, card} | null
```
DO name: `${pair}:${week}`. The DO serialises writers; two concurrent Workflow instances cannot both
write.

**The Pine string (`src/card/pine.ts`)** — L-A forbids JSON in Pine:
```
V4|<card_sha12>|<pair>|<week>|<n_zones>|<n_links>|<n_setups>
Z|<id>|<top>|<bottom>|<role_code>|<zfp>|<tier_code>          one line per zone
L|<id>|<shape>|<target_id>|<start_ms>|<end_ms>|<day>          one line per chain link
S|<id>|<L/S>|<entry>|<sl>|<tp>|<rrr>|<tier_code>|<zone_id>    one line per setup
E|<fnv1a32 of all preceding lines>
```
Lines joined by `;`. The checksum line lets Pine refuse a truncated paste. The maximum
`input.string` length TradingView accepts is UNMEASURED; P0.T7 measures it, and `GET /card.pine`
returns 413 `PINE_PAYLOAD_TOO_LONG` above the measured limit.

---

# §7 · L3 — THE PINE KERNEL (`pine/plutus-vision.pine`)

```pine
//@version=6
indicator("PLUTUS VISION", overlay=true, max_boxes_count=500, max_lines_count=500, max_labels_count=500)
raw = input.string("", "Week Card")

parse(raw) =>                                   // returns arrays or na
    parts = str.split(raw, ";")
    head  = str.split(array.get(parts, 0), "|")
    if array.get(head, 0) != "V4"               // version gate
        na
    // verify E line: recompute fnv1a32 over parts[0 .. n-2]; mismatch -> na
    // fill zone/link/setup arrays from Z/L/S lines; counts must equal header counts

if barstate.islast
    card = parse(raw)
    if na(card)
        drawFaceB()                              // OB / FVG / BOS / LQZ from bars only
        label.new(bar_index, high, "CARD: ABSENT — FACE A OMITTED")
    else
        for z in zones   -> box.new(left=anchorBar-weekBars, right=anchorBar, top=z.top, bottom=z.bottom)
                            label: role + " ZFP " + str.tostring(z.zfp)
        for l in links   -> box per link, rung to rung ; one polyline through link corners
        for s in setups  -> red SL box [entry,sl], green TP box [entry,tp], table row
```
**Draw laws:** `right = anchorBar` (no forward extension, A20) · every price comes from the parsed
string (no literal price, A10) · a setup whose `zone_id` is not in the parsed zones is not drawn and
is printed in the table as `UNRESOLVED`.

---

# §8 · L4 — VERIFY

| gate | subject | predicate | runs on |
|---|---|---|---|
| G0 DEPLOY | the deployed Worker | `GET /health` → `build_sha == git HEAD` ∧ the 9 bindings answer | host, `curl` |
| G1 PIXELS | the frame PNG | `scripts/chart_validator.py` C01–C20 | host |
| G2 STRUCTURE | card JSON + Pine string | receipts validate · setups derive from zones · Pine string round-trips · checksum | Worker `POST /gate/g2` |
| G3 CLAIM | the vcard | Clef-flash: `mandate_met ≥ act` ∧ `claim_contradicted < act` | Worker `POST /gate/judge` |
| G4 LABELS | the frame PNG | Clairic reads `zfp_labels[] tier_labels[] zone_count line_count`; code compares to the card | Worker `POST /gate/g4` |
| G5 AGREE | G1..G4 verdicts | all agree ∧ the slab control is REFUSED by G1 and G4 | host |

```
EXIT  0 PASS · 1 FAIL · 2 INCONCLUSIVE · 3 VOID / STALE / TAMPERED · 4 GATE_DEFECT
ALGEBRA  any G1/G2 critical -> FAIL · claim_contradicted >= act -> FAIL · mandate_met < act -> FAIL
         G1..G4 disagree -> INCONCLUSIVE · control passes -> VOID · all agree above act -> PASS
```
**Why G3 uses Clef-flash:** 24,576-token context, 38.8 ms median; a vcard is ≤ 3,500 tokens. The
vcard is the only thing the judge sees (workflow §1).

---

# §9 · DELIVERY

| option | mechanism | rank | the impossible variant |
|---|---|---|---|
| A paste | `GET /card.pine` → one Pine input | ships first | Pine fetching the card — L-A |
| B tab | Plutus dashboard reads `GET /card` | phase 2 | a second engine — one card, one truth |

Parity: the tab renders from the JSON card; the paste from the Pine string; `G2` proves the Pine string
is a lossless projection of the JSON card (round-trip equality of every drawn number).

---

# §10 · THE LEARN LOOP — Workflow `pv-calibrate`

```ts
// payload {surface: "e1"|"e2"|"e3"|"g3"|"g4"}
step "load.labels"  : labels from D1 (set by surface) ; < 20 rows -> Fatal("CAL_TOO_FEW_LABELS")
step "score.<i>"    : one step per label batch — run the surface's questions, collect probabilities
step "sweep"        : act in {0.50,0.60,0.70,0.80,0.90} ; per point: precision, recall, false_allow
                      max(p) < 0.5 over positives -> Fatal("CAL_QUESTION_BROKEN")
                      spread < 0.25                -> Fatal("CAL_NO_DISCRIMINATION")
                      positive control >= 0.85 ∧ negative control <= 0.15 else Fatal("CAL_CONTROL")
step "choose"       : the act with false_allow == 0 and max recall ; none -> Fatal("CALIBRATION_INFEASIBLE")
                      flag = act - 0.15
step "write"        : INSERT OR REPLACE INTO policies(...) ; R2 calibration/<surface>/<ts>.json (the table)
```
A question is never re-thresholded to rescue it; a broken question is rewritten and its version bumped.

---

# §11 · ANTI-PATTERNS — EACH WITH A DETECTOR THAT EXITS NONZERO

| # | defect | detector |
|---|---|---|
| A1 | a model produces a chart number | G2: every drawn number ∈ computed set |
| A2 | compound question | lint `src/**/questions.ts`: one `?`, ≤ 60 words, no "and/or" joining judgements |
| A3 | a question reads another answer | `requires` may not name `answers_*` in the same stage |
| A4 | threshold by taste | `policyFor` Refusal without a D1 row; `grep -n "act:" src/` must be 0 |
| A5 | baked payload | G2: no shape/span/setup under `provenance` |
| A6 | unprovenanced Clairic value | `p_null` required in parser |
| A7 | units drift | I2 |
| A8 | silent absence | `firewall.sh` D9: `catch\s*\([^)]*\)\s*\{\s*(return|\})` in engine dirs |
| A9 | count inflation | eviction keeps <= 8/week, <= 3/day; G2 counts emitted setups |
| A10 | literal price in Pine | `firewall.sh` D4 over `pine/` |
| A11 | 15m classification | `grep -n "15m" src/e1 src/e2` must be 0 |
| A12 | non-canon vocabulary | `grep -niE "choch|premium|discount" src pine` must be 0 |
| A13 | stub | `firewall.sh` D5 |
| A14 | na/0 price to a draw | Pine: `if na(p) or p <= 0` → skip + table row |
| A15 | self-graded verdict | only `gates/gate.sh` writes `vcards/*.verdict.json` |
| A16 | card overflow | `assertCardBudget` |
| A17 | ship without replay | the hook refuses a `release/*` tag without a `pv-replay` PASS row |
| A18 | LLM reintroduced | `grep -rniE "openai|anthropic|gemini|llama|@cf/meta" src` must be 0 |
| A19 | agent loop | no `AI.run` result is used as a step name, URL, or code path |
| A20 | forward extension | Pine: `right = anchorBar` ; G1 C-check on boxes right of anchor |
| A21 | substitute value | `firewall.sh` D10: `\?\?\s*(0|""|\[\]|false|null|NaN)` and `\|\|\s*(0|"")` in `src/e1 src/e2 src/e3 src/steps src/workflow` must be 0 |
| A22 | side effect outside a step | lint: no `env.R2.put|env.D1|LEDGER|WEEK_SEAL` outside a `step.do` callback in `src/workflow` |
| A23 | byte payload in a step result | lint: no step callback returns `Uint8Array|ArrayBuffer` |
| A24 | an IP zone used as an entry | `E3_IP_ZONE_AS_ENTRY` Fatal + G2 check on every setup's zone family |
| A25 | an 8th gate | `design/E3_GATES.md` has exactly 7 rows; `E3_GATE_COUNT` |
| A26 | the count cap reported as a rejection | G2: no refusal row carries a cap code |
| A27 | a browser without a display | `gates/headed_only.sh` on every doc and source file |
| A28 | zones filtered or reassigned by spot | G2: role order equals price order; `grep -n "spot" cf/src/e1/build.ts` only in ZFP context |

---

# §12 · BUILD SEQUENCE (each exit can fail)

| phase | exit | blocked by |
|---|---|---|
| P0 INSTRUMENT | account resources exist · `/health` G0 PASS on staging · gates G0–G5 each refuse their bad fixture · firewall rc=0 · `verify-plutus` ran once · Pine `input.string` limit measured | Cloudflare account, `INGEST_TOKEN` |
| P1 L0 | 3 real weeks: bars ingested, captures + extracts PASS; planted `/1000` ladder → `W2_I2_UNITS`; planted null → null | the options URL format; EURUSD bars |
| P2 E1 | golden week: 5 roles, every receipt validates, parity 24/24, plant refused | operator rulings D1–D4, D11–D13 |
| P3 E2 | golden chain is one of the 12 observed sequences; swapped pair → `E2_CHAIN_ORDER` | E2 policy row |
| P4 E3 | DEFERRED (R-16): built from TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md only after P2 E1 and P3 E2 pass; the gate is written when the operator opens E3 | — |
| P5 REPLAY | `pv-replay` ≥ 90% golden ∧ ≥ 90% held-out on the frozen `BUILD_SHA` | 10 operator-drawn held-out weeks |
| P6 VERIFY | slab → VOID; corrupted card → G2 FAIL naming the field | — |
| P7 DELIVERY | same card → same frame via paste and tab | — |

---

# §13 · INHERITS / REPLACES

```
INHERITS  the 10 laws · 9-pillar harvest · 0-14 confluence · Pillar-9 degree · Appendix B ZFP with
          receipt · 10-shape taxonomy · 12 observed chains · E3 owns 4 numbers · anchor doctrine ·
          temporal boundary · 8 trades/week · 2.5 floor / 3.0 gauge · GATE A + GATE B
REPLACES  PDF -> card · agent sidecar -> Workflow · LLM judgement -> Clef clauses + code ·
          LLM reading options -> Clairic + invariants · 15m -> 4H/1H/30m · width ZFP -> Appendix B ·
          code-only E3 rejection -> geometry in code + Clef validity · transcription -> Pine string
```

---

# §14 · FILE LAYOUT (the worker creates exactly these)

```
cf/wrangler.jsonc                     §2.2
cf/package.json                       wrangler, typescript, @cloudflare/puppeteer, @cloudflare/workers-types
cf/migrations/0001_init.sql           §2.5
cf/src/index.ts                       routes: /health /ingest/bars /run /card /card.pine /runs /ledger /gate/*
cf/src/time/uk-dst.ts                 UK DST table
cf/src/steps/errors.ts                §5.1
cf/src/steps/guards.ts                isRec num str arr at
cf/src/steps/clef.ts                  §5.2
cf/src/steps/clairic.ts               §4.4 §4.5
cf/src/steps/capture.ts               §4.3
cf/src/steps/selectors.ts             recorded at P1.T1
cf/src/gate/policy.ts                 §5.3
cf/src/gate/rulings.ts                §16
cf/src/gate/g2.ts g4.ts judge.ts      §8 Worker-side gates
cf/src/e1/build.ts context.ts zfp.ts questions.ts      §5.4
cf/src/e2/candidates.ts chain.ts questions.ts          §5.5
cf/src/e3/setups.ts questions.ts                       §5.6
cf/src/card/schema.ts pine.ts                          §6
cf/src/do/WeekSeal.ts Ledger.ts                        §6, §5.2
cf/src/workflow/pv-week.ts pv-replay.ts pv-calibrate.ts step.ts
cf/src/clauses.json                                    §5.8
cf/test/zfp-parity.ts e2-controls.ts e3-kills.ts pine-roundtrip.ts
pine/plutus-vision.pine                                §7
host/uploader.ts                                       P-1
host/rig-driver.ts                                     P-2
gates/G0.sh G1.sh G2.sh G3.sh G4.sh G5.sh firewall.sh gate.sh lib.sh pins/ fixtures/
```

---

# §15 · RISK REGISTER

| sev | risk | mitigation | falsifier |
|---|---|---|---|
| CRIT | Clairic misreads a strike | I1–I5 + p_null + planted-null control (P1.T3) | planted null returns a number |
| CRIT | judge answers blind | state gate + constant control + planted-bad zone | the plant is ALLOWED |
| CRIT | hardcoded to the golden week | held-out replay on frozen BUILD_SHA | held-out < 90% with golden ≥ 90% |
| CRIT | a fallback hides a failure | two error types only; A21/A8 detectors | `firewall.sh` D10 hit |
| HIGH | Workflow replay repeats a write | all writes inside steps; R2 keys immutable; seal DO | a replayed instance writes a second card sha |
| HIGH | step result > 1 MiB | bytes in R2, keys in results; A23 | a step returns a buffer |
| HIGH | the options page layout changes | element selector + W2_CAPTURE_SELECTOR | a capture passes with the wrong element |
| HIGH | unruled constant in production | `requireRulings()` Refusal at `arm` | a run arms with a fork unruled |
| HIGH | Pine paste truncated | checksum line + measured length limit | a truncated string draws |
| MED | stale deploy judged | G0 build_sha equality | `/health` sha ≠ HEAD passes G0 |
| MED | Clef 64-question cap | `perItem` batches ≤ 16 items × 4 | a stage builds 65 questions |

---

# §16 · OPERATOR FORKS — refused until ruled (`src/gate/rulings.ts`)

| id | fork | recommended | source of the fork |
|---|---|---|---|
| D1 | ZFP point within the B.1 band | midpoint | spec 4.3 gives ranges |
| D2 | momentum k in `|ROC5| > k·ATR20` | 0.5 | unsourced constant |
| D3 | ZFP clamp | [0, 99] | modifiers sum to +125 |
| D4 | calibration tolerance per bucket | ±15 pp, n ≥ 8 | must precede the run |
| D11 | spring-release striking range | 2% of spot | B.2 range width unruled |
| D12 | cross-pair range-position tolerance | 0.05 | "structurally equivalent" unruled |
| D13 | cluster tolerance fraction | 4e-5 of spot | spec 3.2 gives 0.004 at DXY≈100 |
| D14 | SL placement | RULED 2026-10-26: §5.6.1 | was open in LAW-RULING-SL-INSIDE-VS-OUTSIDE |
| D15 | golden-week render pair | EURUSD | feedback is EU; fixtures are DXY |

A run with any fork unruled stops at `arm` with `Refusal RULING_PENDING` listing the open ids.

---

# SUMMARY

Bars uploaded from the host, and two pages rendered by Browser Run, are the only inputs. Clairic reads
the options ladder and the calendar out of element screenshots into typed values that five invariants
and a `p_null` rule must admit. A Cloudflare Workflow then computes, in code, the E1 zone map — nine
pillars, clusters, 0–14 confluence, degree, and a two-pass ZFP whose base and six boolean modifiers are
recorded in a receipt — and asks Clef, per zone, whether that receipt is faithful to the canon, with a
planted bad zone in the same request. E2 cuts the prior week into licensed candidates and lets Clef only
veto them; code walks the transition table, assigns days from the calendar, and builds an alternative
that must differ. E3 is built from the corrected E3 prompt (TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md) and is deferred until E1 and E2 pass; the June-era Python engine is archived. When it opens: DXY first, pairs mirror, entries on Face-B zones only,
exactly seven gates, and Clef answers that feed confidence and the semantic half of two gates. A Durable Object seals one card per pair-week, a second Durable Object holds the ordered decision
ledger, D1 indexes runs and stores the derived thresholds that `pv-calibrate` writes, and the card
reaches Pine as one checksummed string. Every failure is a named Fatal or Refusal; there is no third
outcome, no fallback, and no number that a model produced.
