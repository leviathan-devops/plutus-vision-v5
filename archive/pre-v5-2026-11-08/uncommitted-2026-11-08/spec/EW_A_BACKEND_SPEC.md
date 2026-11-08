# EW-A — BACKEND AETHER AGENT · SPEC + EXECUTION WORKFLOW

**Subject:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION`
**Files this workflow may write:** `src/**` · `sidecar/**` · `scripts/pine_emit.py` · `scripts/lqz_vision_v2_build.py`
**May read (never write):** `plutus-vision-lqz/*.pine` — for the contract grep only
**Parent authority:** `spec/PLUTUS_VISION_DYNAMIC_INDICATOR_DPL1_SPEC.md` (855 L, approved 21/21), §B.1 / §B.2 / §D / §12
**Runs parallel to EW-B1** — disjoint files, no shared writes.

---

## §1 · THE LAW OF THIS DOCUMENT

```
one turn = one commit = one gate
bash gates/ewa/gates/gate_A<n>.sh  exits 0 → commit → next turn may open
                                 exits ≠0 → §DEBUG LOOP, never proceed
line numbers are re-derived immediately before every edit, never carried between turns
no regex on the source — a literal string only
no gate stated in prose — a gate is a file with an exit code
no verdict from a PNG not opened in the same turn
```

**THE FIVE FORBIDDEN THINGS**
```
✗ advance on a red gate                ✗ weaken or lower a gate to pass it
✗ reuse evidence produced before a fix ✗ describe a render you did not open
✗ substitute a different artifact for a failed primary path
```

---

## §2 · THE SUBJECT, AS MEASURED

Every line below was produced by a command this session; the command and its output are in §10.

```
sidecar/   ABSENT   → NEW   (parent §B.1)
src/       ABSENT   → NEW   (parent §B.2 states the live build source is at ROOT, not src/ —
                             src/ exists only INSIDE checkpoints. So src/ here is genuinely new
                             code, not a resurrection of a checkpoint tree)

the boilerplate this builds on:
  agent_plugin_boilerplates/aether_agent_backend_v2/    package.json present · src/ · packages/
                                                        + ship docs + RED_TEAM rounds
  agent_plugin_boilerplates/Aether_Machine_Boilerplate/
  Aether_Shell_Scripting/
  PLUTUS/agent/src/aether/

must SIT BESIDE — never replace:
  scripts/e1_fetch.py      scripts/e1_extract.py     scripts/e1_sources.py
  scripts/e1_category.py   ALREADY FIXED 2026-10-08 (REF_RANGE deleted, zfp_label: None)
                           → do NOT re-fix. Parent §B.2 says so explicitly.
  scripts/e1_zfp.py        12,321 B, Oct 8 — the ONE ZFP: base + modifiers (canon)
  scripts/pine_emit.py     line 108: L.append(f"    e1_injected_top.push({float(z['top'])})")
                           ← BAKES LITERALS. This is the defect EW-A removes.
  scripts/lqz_vision_v2_build.py
```

**What the built dist carries today** — measured:

```pine
e1_injected_anchor_ms = 1791144000000
e1_injected_week_tag = "2026-W41"
if bar_index == 0
    e1_injected_top.push(1.12853)
    e1_injected_top.push(1.12665)
    …
```

Literal numbers baked into the artifact. **The indicator cannot be dynamic while its payload is
a constant.** That is the defect this workflow exists to remove.

---

## §3 · THE CONTRACT — 28 VARIABLES

```bash
grep -ohE 'e1_injected_[a-z_]+' plutus-vision-lqz/e1-render.pine | sort -u   # → 21
grep -ohE 'e2_injected_[a-z_]+' plutus-vision-lqz/e2-render.pine | sort -u   # →  7
```

```
ENGINE 1 (21)  top bottom confluence cat zfp degree id alt days chain anchor_ms week_tag
               lsz_top lsz_bottom lsz_pri opt_pr opt_vol tbl_pair tbl_week tbl_row trade_row
ENGINE  2 ( 7) x y shape conf ghost_x ghost_y refusal
```

**Why this matters more than it looks.** A missing key fails **silently** in Pine: the array
simply stays empty, the layer renders nothing, and that reads as *"the zone was not there"* rather
than *"the variable never arrived."* A payload that is *almost* right renders *almost* correctly
and nobody asks which key never showed up. `gate_A5` is this workflow's most important gate for
exactly that reason.

---

## §4 · MODULE INTERFACES (parent §B.1, instantiated)

| module | signature | invariant |
|---|---|---|
| `src/week_scope.ts` | `deriveWeek(lastBarMs, tz)` → `{tsL, tsR, weekLabel}` | `tsL` = Mon 09:00 London · `tsR` = Fri NY close · left extension `= tsL − 7d` · **no forward** |
| `src/e1_pressure.ts` | `zonesFromReport(payload)` → `Zone[]` | **ZFP copied from payload only**; absent → `null` → renders `ZFP n/a` |
| `src/e1_merged.ts` | `mergeFaces(pressure, sdLiQ)` → `Zone[]` | both faces on one anchor; **no face dropped** |
| `src/e2_chain.ts` | `deriveChain(zones)` → `Vertex[]` | transitions from `(pressure, ZFP)` per §5; **never free-written** |
| `src/emit_pine.ts` | `emit(state)` → Pine source | emits `box.new`/`line.new`/`label.new` with the one-week-left window |
| `sidecar/server.ts` | `GET /week?pair&start` → `{bars, cutoff}` | **`bars[].time < weekStart`** for a replay · loud `NO_BARS` on miss |

```
DATA FLOW
lastBar → week_scope → sidecar (pre-week bars) → e1_pressure + e1_sd_liq
        → e1_merged → e2_chain → emit_pine → render → (replay) → score
```

---

## §5 · THE NON-NEGOTIABLE: ZFP IS TRANSCRIBED, NEVER DERIVED

Enforced on **both** sides. This is the single most important law in the three-workflow build.

```
rendered label:   <name> | <pressure degree> | ZFP n%

pressure ladder (FROM CONFLUENCE)          ZFP (TRANSCRIBED, NEVER DERIVED)
──────────────────────────────────         ────────────────────────────────
  12-14 /14  EXTREME                       the report's OWN value
  10-11       HEAVY                        Apr20-24: 15 25 20 30 12
   8-9        MODERATE-HEAVY               no report value  ──►  "ZFP n/a"
   6-7        MODERATE
   4-5        LIGHT         ◄──►           ✗  width / refRange * 100
   <4         MINIMAL                      THE FABRICATION (killed)
```

Historical sites, parent §10.2: `trident_v8.pine calcZFP` · `src/e1_category.py` ·
`lqz/e1-render:153,226` · `e1_extract:711,796` · `payload.zfp_label` · `spec ST-19f`.

**EW-A's obligation:** every zone the emitter writes carries a `provenance` field. A zone whose
source states no ZFP carries `provenance.zfp = null` **and** emits `zfp = null`. A populated
`zfp` with `provenance.zfp = null` is the fabrication wearing a different hat, and `gate_A3`
rejects it.

---

## §6 · THE E2 DERIVATION RULE TABLE (parent §B.4, verbatim)

| zone pressure | zone ZFP | expected shape out of that zone |
|---|---|---|
| HIGH (HEAVY / EXTREME) | LOW | sharp reaction → `BS` or `WL`; zone **holds** |
| LOW (LIGHT / MINIMAL) | HIGH | zone **pierced** → continue to next |
| MODERATE | LOW–MED | sideways → `SS` (swing scalp) |
| chain order | — | `SS → BS → R → WL` primary · `SS → WLS → BS` alternative |

Shape vocabulary, operator verbatim, now canon cards:
```
BS    = WL that BREAKS market structure      1-3 fat candles (or 6-12 alternating)
WL    = follow-up impulse AFTER a BS         weaker, shorter, "out of nowhere"
RWL   = reverses off prev candle, 0 recovery 1-2 aggressive (or 4-6 tapering)
chain = SS/BS/R/WL is primary; zones fail on the THIRD mitigation
```

---

## §7 · SUCCESS CRITERIA

| # | criterion | verification | bar |
|---|---|---|---|
| S6 | week derivation correct | `deriveWeek` over 10 fixtures incl. Fri 23:59 · Mon 00:01 · DST boundary | **10/10** |
| S8 | pre-Monday cutoff honoured | replay requests only bars `< weekStart` | byte-exact in the sidecar log |
| S9 | sidecar self-contained UX | open chart → render with **zero** manual steps | screenshot, no human action |
| S13 | build emits its own symbols | `grep -c "<symbol added>" <deployed>` | **≥1** |
| `st_week_scope` | boundary correctness | `tsL` == expected Mon-09:00 epoch · left `== tsL−7d` · right−left `== 5d` | all |
| `st_replay_cutoff` | the leak is caught | straddling bars ⇒ **exit 1** + `REPLAY_DATA_LEAK` written to the result file | observed |
| `gate_A5` | the contract holds | emitted keys == the 28 vars | **zero missing, zero extra** |

**Both halves, always.** The adversarial fixture (bars straddling `weekStart`, a truncated zone
array, a malformed timestamp, an empty zone set, a post-Monday leak) must fire its **named**
token. The legitimate fixture (the authoritative payload, a normal week, a clean replay) must
pass with **zero misfire**.

---

## §8 · FILE MEMBERSHIP

```
EW-A OWNS       src/** · sidecar/** · scripts/pine_emit.py · scripts/lqz_vision_v2_build.py
EW-A MAY READ   plutus-vision-lqz/*.pine      (contract grep only)
EW-B OWNS       plutus-vision-lqz/*.pine · plutus-vision-v2.pine · pine-ide/ide/renderer/*
NEVER TOUCHED   plutus-vision-v1.pine (sealed 0d20e831) · Checkpoints/** ·
                Original_Canon_Data/** · the five append-only ship docs ·
                cards/ type/ CHARTER.md KNOWLEDGE_GRAPH_* MASTER_CONTEXT_*
```

**The boundary is the point.** EW-A proves its emitter **in isolation** — it emits to a file, not
to a dist. Wiring that emission into `plutus-vision-v2.pine` is a separate integration step, so
neither workflow ever writes the other's files.

---

## §9 · OPEN DECISIONS

| # | fork | evidence | recommended default |
|---|---|---|---|
| D1 | transport: push into the dashboard chart feed, vs Pine-over-websocket | **Pine has no network access at all**; the dashboard and backtest tab are LuxAlgo-based and reachable | push into the dashboard/backtest feed; keep the sidecar protocol transport-agnostic |
| D2 | does the chart supply bars, or must the sidecar harvest them? | V2 ships `src/MakeFile:11 WEEK auto` + `e1_extract.py` "chart_week harvest merge" | **sidecar harvests** for a replay (proves the pre-Monday cutoff); chart-supplied for live |
| D6 | sidecar language | operator: *"maybe node backend, maybe server… you tell me"* | **TypeScript/Node** — one language across emitter, sidecar and Toolset types |

D1 is not a preference. **Pine cannot make a network call.** Any design assuming the indicator
fetches its own data is dead on arrival.

---

# §10 · THE EXECUTION WORKFLOW

## A0 · BASELINE + DISCOVERY

**Purpose:** freeze state, read prior analysis, and measure the paths this workflow will touch.
A spec that invents a URL or a directory is the defect parent §B.2 records — where `src/
e1_category.py` was written as if it existed at root, and would have failed the builder on day one.

### A0.1 — baseline
```bash
# tool: bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
mkdir -p /tmp/ewa gates/ewa/gates gates/ewa/negatives gates/ewa/proofs
git status --porcelain > /tmp/ewa/BASELINE_DIRTY.txt
git status --porcelain | grep '^??' | sort > /tmp/ewa/BASELINE_UNTRACKED.txt
wc -l < /tmp/ewa/BASELINE_DIRTY.txt
wc -l < /tmp/ewa/BASELINE_UNTRACKED.txt
```
**EXPECTED:** two counts. `BASELINE_UNTRACKED.txt` exists because the debris check must compare a
**delta**, never an absolute — the repo carries ~40 pre-existing untracked paths.
**FAIL — either `0`:** the redirect failed. Stop.

### A0.2 — measure everything this workflow will touch
```bash
# tool: bash
sha256sum scripts/pine_emit.py scripts/lqz_vision_v2_build.py > /tmp/ewa/A0.sha
cat /tmp/ewa/A0.sha

B=/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/agent_plugin_boilerplates/aether_agent_backend_v2
find "$B" -maxdepth 2 \( -name package.json -o -type d -name src \) | tee /tmp/ewa/A0.paths
ls -la "$B/package.json" 2>&1 | tee /tmp/ewa/A0.manifest

echo "=== the emitter's current surface ==="
grep -n 'export\|^def \|^class ' scripts/pine_emit.py | head -40 | tee /tmp/ewa/A0.emitter
echo "=== the emitter's literal generation sites ==="
grep -n 'e1_injected_\|e2_injected_' scripts/pine_emit.py | tee /tmp/ewa/A0.emit_sites
```
**EXPECTED:** `A0.paths` names `package.json` and `src/`; `A0.emitter` lists the functions.
**FAIL — `A0.paths` empty → `BACKEND_ABSENT`. HALT, print the search. Never invent a location.**

### A0.3 — capture the contract from the consumers
```bash
# tool: bash
grep -ohE 'e1_injected_[a-z_]+' plutus-vision-lqz/e1-render.pine | sort -u > /tmp/ewa/A0.need_e1
grep -ohE 'e2_injected_[a-z_]+' plutus-vision-lqz/e2-render.pine | sort -u > /tmp/ewa/A0.need_e2
cat /tmp/ewa/A0.need_e1 /tmp/ewa/A0.need_e2 | sort -u > /tmp/ewa/need
wc -l < /tmp/ewa/A0.need_e1      # expect 21
wc -l < /tmp/ewa/A0.need_e2      # expect  7
wc -l < /tmp/ewa/need            # expect 28
```
**EXPECTED:** `21`, `7`, `28`.
**FAIL — any count differs:** the consumers changed under us. **HALT, re-derive.** The whole of
`gate_A5` compares against these three numbers.

### A0.4 — GATE + COMMIT
```bash
bash gates/ewa/gates/gate_A0.sh || { echo "TURN A0 BLOCKED"; exit 1; }
git add gates/ewa/proofs gates/ewa/gates
git commit -q -m "ewa(A0): baseline + measured paths + the 28-var contract captured

gate: gate_A0.sh exit 0
evidence: A0.sha A0.paths A0.manifest A0.emitter A0.emit_sites need A0.need_e1 A0.need_e2"
git rev-parse HEAD > gates/ewa/proofs/sha.A0
```

---

## A1 · THE AUTH PROBE  *(mandatory first — the #1 false green)*

**Purpose:** prove a model-backed call actually succeeds. A status label, a set environment
variable, or a running process proves **nothing** — the silent-auth-failure green is the single
most common false pass in this class of build.

```bash
# tool: bash
# run the BOILERPLATE's own completion call with a trivial prompt.
# the call is whatever A0.2 surfaced in $B/src — use its entry point, do not hand-roll one.
cd "$B" && <run the boilerplate's completion entry point with a trivial prompt> \
  2>&1 | tee /tmp/ewa/A1.probe.txt
```
**EXPECTED:** a **non-empty** completion string in `A1.probe.txt`, pasted verbatim into the
record, plus the model id it reports.
```
gate_A1: A1.probe.txt non-empty AND its trimmed length > 0
```
**FAIL → `MODEL_DEAD` / `NO_COMPLETION`:** HALT with the verbatim error pasted. Never proceed on
a probe that returned nothing — every later "it reached the source" claim would inherit the lie.

```bash
bash gates/ewa/gates/gate_A1.sh || { echo "TURN A1 BLOCKED"; exit 1; }
git add gates/ewa/proofs && git commit -q -m "ewa(A1): auth probe — model answers live, non-empty, pasted verbatim

gate: gate_A1.sh exit 0"
git rev-parse HEAD > gates/ewa/proofs/sha.A1
```

---

## A2 · REACH THE SOURCE

**Purpose:** open the data source for a **named pair + week** and confirm reach **off the pixels**.
A non-error HTTP return is not reach — a 200 on an error page looks identical to a 200 on data.

```bash
# tool: bash
DISPLAY=:3 xdotool getdisplaygeometry 2>&1 || echo "DISPLAY_DOWN"
curl -s --max-time 3 http://127.0.0.1:9234/json/version | head -c 300; echo
```
**FAIL → `RENDER_RIG_DOWN:<which>`. HALT.** Do not substitute a description of what it would
have shown.

```js
// tool: browser
// SOURCE_URL is whatever A0.2 recorded. The pair + week are FIXED for this turn:
//   pair = EURUSD, week = 2026-07-06  (the golden week from parent §6 S11)
await page.goto(SOURCE_URL_FROM_A0);
await new Promise(r=>setTimeout(r,5000));
await page.screenshot({ path: '/tmp/ewa/A2.png' });
console.log(JSON.stringify({ url: page.url(), title: await page.title() }));
```
```python
# tool: read — SAME TURN, no verdict without it
read(path="/tmp/ewa/A2.png")
```
**Off the pixels, write these three, each as a fact read from the image:**
1. the instrument is visible (its name appears)
2. the date range is visible and contains 2026-07-06
3. the page is neither loading, erroring, nor blank

```bash
cat > /tmp/ewa/A2.observed.json <<'JSON'
{"png":"/tmp/ewa/A2.png","read_in_turn":true,
 "instrument_visible": true, "date_range_visible": true, "page_state": "loaded"}
JSON
grep -c '<' /tmp/ewa/A2.observed.json || echo 0
```
**FAIL → `SOURCE_UNREACHED`** if any of the three is false. HALT with the URL and the verbatim
error.

```bash
bash gates/ewa/gates/gate_A2.sh || { echo "TURN A2 BLOCKED"; exit 1; }
git add gates/ewa/proofs && git commit -q -m "ewa(A2): source reached for EURUSD 2026-07-06 — capture opened, read off pixels

gate: gate_A2.sh exit 0"
git rev-parse HEAD > gates/ewa/proofs/sha.A2
```

---

## A3 · EXTRACTION WITH PROVENANCE

**Purpose:** produce the 21 Engine-1 variables with a per-field provenance trail, so that no
geometry-derived number can reach a ZFP label.

```js
// tool: browser — extract into §3's exact shape
const payload = await page.evaluate(() => ({
  week: { anchor_ms: <ms>, week_tag: "<YYYY-Wnn>", days: <int> },
  zones: [{ id, top, bottom, confluence, cat, zfp, degree, alt,
            provenance: { zone: "<source field>", zfp: "<source field or null>" } }],
  lsz:   [{ top, bottom, pri }],
  opts:  [{ pr, vol }],
  tbl:   { pair, week, row, trade_row },
}));
```
```bash
# tool: bash
cat > /tmp/ewa/A3.payload.json <<JSON
$PAYLOAD
JSON
python3 -c "import json;json.load(open('/tmp/ewa/A3.payload.json'));print('JSON_OK')"
python3 - <<'PY'
import json
p=json.load(open('/tmp/ewa/A3.payload.json'))
bad=[z for z in p["zones"] if z.get("zfp") not in (None,"") and not z.get("provenance",{}).get("zfp")]
print("DERIVED_ZFP_ZONES:", len(bad))
missing=[z for z in p["zones"] if "provenance" not in z]
print("ZONES_WITHOUT_PROVENANCE:", len(missing))
PY
```
**EXPECTED:** `JSON_OK` · `DERIVED_ZFP_ZONES: 0` · `ZONES_WITHOUT_PROVENANCE: 0`.
**FAIL → `GEOMETRY_DERIVED_ZFP`:** a populated `zfp` whose `provenance.zfp` is `null`. HALT —
this is the fabrication arriving from the producer side instead of the consumer side.

```bash
bash gates/ewa/gates/gate_A3.sh || { echo "TURN A3 BLOCKED"; exit 1; }
git add gates/ewa/proofs && git commit -q -m "ewa(A3): 9-pillar extraction — per-field provenance, zero derived ZFP

gate: gate_A3.sh exit 0"
git rev-parse HEAD > gates/ewa/proofs/sha.A3
```

---

## A4 · DERIVE THE CHAIN

**Purpose:** produce the 7 Engine-2 variables, each vertex carrying the reason it exists.
**A copied chain is not a derivation** — parent §B.4 is why.

```js
// tool: browser
const chain = zones.map((z,i) => ({
  x: i, y: <price>, shape: <derived per §6's rule table>, conf: <number>,
  ghost_x: <pre>, ghost_y: <pre>,
  reason: { zone: z.id, pressure: z.confluence, zfp: z.zfp },
}));
const refusal = "";     // non-empty = the derivation did not run
```
```bash
# tool: bash
cat > /tmp/ewa/A4.chain.json <<JSON
{"chain": $CHAIN, "refusal": ""}
JSON
python3 - <<'PY'
import json
c=json.load(open('/tmp/ewa/A4.chain.json'))
print("VERTICES:", len(c["chain"]))
print("UNREASONED:", sum(1 for v in c["chain"] if not v.get("reason")))
print("REFUSAL:", repr(c["refusal"]))
PY
```
**EXPECTED:** `UNREASONED: 0` · `REFUSAL: ''` · all seven keys present per vertex.
**FAIL → `CHAIN_UNREASONED`:** a vertex with no `reason`.
**FAIL → `CHAIN_BLOCKED`:** `refusal` non-empty. HALT with the refusal text — **never substitute a
transcribed chain.**

```bash
bash gates/ewa/gates/gate_A4.sh || { echo "TURN A4 BLOCKED"; exit 1; }
git add gates/ewa/proofs && git commit -q -m "ewa(A4): E2 chain derived from the zone table — every vertex reasoned

gate: gate_A4.sh exit 0"
git rev-parse HEAD > gates/ewa/proofs/sha.A4
```

---

## A5 · ★ THE CONTRACT GATE — the load-bearing one

**Purpose:** prove the emitter's output is **exactly** what the indicator reads — no more, no
fewer. This is where the two workflows meet.

```bash
# tool: bash
cat /tmp/ewa/A0.need_e1 /tmp/ewa/A0.need_e2 | sort -u > /tmp/ewa/need

python3 - <<'PY' > /tmp/ewa/have
import json
p = json.load(open('/tmp/ewa/A3.payload.json'))
c = json.load(open('/tmp/ewa/A4.chain.json'))
rows = []
rows += ["e1_injected_" + k for k in (
    "top","bottom","confluence","cat","zfp","degree","id","alt","days","chain",
    "anchor_ms","week_tag","lsz_top","lsz_bottom","lsz_pri","opt_pr","opt_vol",
    "tbl_pair","tbl_week","tbl_row","trade_row")]
rows += ["e2_injected_" + k for k in ("x","y","shape","conf","ghost_x","ghost_y","refusal")]
print("\n".join(sorted(set(rows))))
PY

echo "=== MISSING (indicator wants, backend did not produce) ==="
comm -23 /tmp/ewa/need /tmp/ewa/have | tee /tmp/ewa/A5.missing
echo "=== EXTRA (backend produced, indicator ignores) ==="
comm -13 /tmp/ewa/need /tmp/ewa/have | tee /tmp/ewa/A5.extra
echo "MISSING=$(wc -l < /tmp/ewa/A5.missing)  EXTRA=$(wc -l < /tmp/ewa/A5.extra)"
```
**GATE 5 — `MISSING == 0` AND `EXTRA == 0`.** Both must hold.

**FAIL → `CONTRACT_GAP`:** a key the indicator reads that the backend did not produce. Paste the
list. **This is the class that renders as "the zone was not there."**
**FAIL → `CONTRACT_CREEP`:** a key the backend produced that the indicator ignores. Paste the list.
Dead fields are how a payload rots.

```bash
bash gates/ewa/gates/gate_A5.sh || { echo "TURN A5 BLOCKED"; exit 1; }
git add gates/ewa/proofs && git commit -q -m "ewa(A5): contract proven — 28 vars, zero missing, zero extra

gate: gate_A5.sh exit 0"
git rev-parse HEAD > gates/ewa/proofs/sha.A5
```

---

## A6 · EMIT FROM DATA, NOT LITERALS

**Purpose:** replace the literal generation in `scripts/pine_emit.py` with emission from the
A3+A4 payload — **in isolation**, to a file, never to a dist.

```bash
# tool: bash
cp scripts/pine_emit.py /tmp/ewa/pine_emit.py.pre
grep -n 'push(' scripts/pine_emit.py | tee /tmp/ewa/A6.before.txt
```
```bash
# tool: edit — scripts/pine_emit.py
#   old_string copied from a fresh `sed -n` print, never remembered
#   replace the literal .push(<number>) generation with emission from the payload
#   keep the SAME function signature and the SAME emitted variable names (the §3 contract)
```
```bash
# tool: bash
python3 scripts/pine_emit.py --week 2026-07-06 --pair EURUSD \
  --out /tmp/ewa/A6.emitted.pine 2>&1 | tee /tmp/ewa/A6.log
echo "EXIT=${PIPESTATUS[0]}" >> /tmp/ewa/A6.log

echo "=== vars present ==="
grep -c 'e1_injected_\|e2_injected_' /tmp/ewa/A6.emitted.pine
echo "=== literal zone pushes remaining ==="
grep -c 'push(1\.[0-9]*)' /tmp/ewa/A6.emitted.pine || echo 0
echo "=== the emitted week tag ==="
grep -o 'e1_injected_week_tag = "[^"]*"' /tmp/ewa/A6.emitted.pine
```
**EXPECTED:** `EXIT=0` · all 28 var families present · **zero** literal `push(<number>)` ·
the week tag equals the requested week.
**FAIL → `STILL_HARDCODED`:** literals remain — the emitter is still a template.

```bash
bash gates/ewa/gates/gate_A6.sh || { echo "TURN A6 BLOCKED"; exit 1; }
git add -- scripts/pine_emit.py gates/ewa && git commit -q -m "ewa(A6): emitter produces the payload from data, not literals

gate: gate_A6.sh exit 0 | 28 var families | zero literal zone pushes"
git rev-parse HEAD > gates/ewa/proofs/sha.A6
```

---

## A7 · THE LIVE WEEK — the real one

**Purpose:** prove the pipeline works on the **current** date, not on a fixture.

```bash
# tool: bash
date +%G-W%V | tee /tmp/ewa/A7.week
python3 scripts/pine_emit.py --week "$(date +%G-W%V)" --out /tmp/ewa/A7.emitted.pine \
  2>&1 | tee /tmp/ewa/A7.log
echo "EXIT=${PIPESTATUS[0]}" >> /tmp/ewa/A7.log

echo "=== the derived week ==="
grep -o 'e1_injected_week_tag = "[^"]*"' /tmp/ewa/A7.emitted.pine | tee /tmp/ewa/A7.derived
echo "=== the requested week ==="
cat /tmp/ewa/A7.week
```
**EXPECTED:** the derived `week_tag` equals `date +%G-W%V`, printed beside the most recent bar
time it was derived from.
**FAIL → `FIXTURE_SUBSTITUTE`:** a fixture week stood in for live data. HALT.

```bash
bash gates/ewa/gates/gate_A7.sh || { echo "TURN A7 BLOCKED"; exit 1; }
git add gates/ewa/proofs && git commit -q -m "ewa(A7): live-week derivation — derived week == date +%G-W%V, no fixture

gate: gate_A7.sh exit 0"
git rev-parse HEAD > gates/ewa/proofs/sha.A7
```

---

## A8 · THE PRE-MONDAY CUTOFF  *(closes parent S8 / st_replay_cutoff)*

**Purpose:** prove the sidecar never hands a replay any bar at or after `weekStart`. This is the
check that keeps a replay honest — bars from the future are an oracle, and an oracle makes a
backtest meaningless.

```bash
# tool: bash
# a fixture whose bars STRADDLE weekStart — the adversarial half
python3 scripts/run-st.ts --only st_replay_cutoff 2>&1 | tee /tmp/ewa/A8.straddle.txt
echo "STRADDLE_EXIT=${PIPESTATUS[0]}" >> /tmp/ewa/A8.straddle.txt
grep -c 'REPLAY_DATA_LEAK' /tmp/ewa/A8.straddle.txt | tee /tmp/ewa/A8.leakcount

# the legitimate half — all bars strictly before weekStart
python3 scripts/run-st.ts --only st_replay_cutoff --legit 2>&1 | tee /tmp/ewa/A8.clean.txt
echo "CLEAN_EXIT=${PIPESTATUS[0]}" >> /tmp/ewa/A8.clean.txt
```
**EXPECTED (adversarial):** `STRADDLE_EXIT` nonzero **and** `REPLAY_DATA_LEAK` written to the
result file — the count must be ≥ 1.
**EXPECTED (legitimate):** `CLEAN_EXIT=0`, zero misfire.
**FAIL → `LEAK_ACCEPTED`:** a straddling fixture passed. HALT — a replay that can see the future
is not a replay.
**FAIL → `FALSE_POSITIVE`:** the clean fixture was rejected. HALT — a gate that fires on
legitimate work gets disabled, and a disabled gate is documentation.

```bash
bash gates/ewa/gates/gate_A8.sh || { echo "TURN A8 BLOCKED"; exit 1; }
git add gates/ewa/proofs && git commit -q -m "ewa(A8): pre-Monday cutoff — REPLAY_DATA_LEAK fires on straddle, clean passes

gate: gate_A8.sh exit 0 | both halves | zero misfire"
git rev-parse HEAD > gates/ewa/proofs/sha.A8
```

---

## A9 · EW-A CLOSE

```bash
# tool: bash
for n in 0 1 2 3 4 5 6 7 8; do
  printf 'A%s: %s\n' "$n" "$(cat gates/ewa/proofs/sha.A$n 2>/dev/null || echo MISSING)"
done | tee /tmp/ewa/A9.shas
grep -c MISSING /tmp/ewa/A9.shas
```
**EXPECTED:** `0`.

**EW-A ships when every one of these holds, each with its gate:**
```
A1  the auth probe returned a non-empty completion, pasted verbatim
A2  the source was reached and the capture was OPENED, read off the pixels
A3  every zone carries provenance; zero zones with a derived ZFP
A4  every chain vertex carries a reason; refusal empty
A5  the contract is 28/28 — zero missing, zero extra
A6  the emitter emits from data; zero literal zone pushes
A7  the live week == date +%G-W%V
A8  the pre-Monday cutoff fires on a straddle and stays silent on a clean replay
```

**What EW-A does NOT claim:** that the indicator renders any of it. Wiring the emission into
`plutus-vision-v2.pine` is a separate integration step belonging to neither workflow alone.

---

## §11 · DEBUG LOOP

```
gate_A<n>.sh != 0  →  classify exactly one:
  GATE_DEFECT   the gate's expectation is wrong  → fix the gate, re-run the gate only
  INPUT_DEFECT  my literal or args were wrong    → correct, redo the action
  SOURCE_DEFECT the emitted payload is wrong      → restore from the pre-turn copy, redo
  CONCURRENCY   A0 baseline sha changed          → HALT, name the other writer
  ENV           rig down / provider down         → HALT, paste the verbatim error

3 attempts, counted in gates/ewa/proofs/attempt.A<n>.
3rd failure → hard stop with the gate name and all three verbatim errors.
Evidence produced before a fix is never reused for after it.
```

The `ENV` class matters most here: `A1` depends on a live provider and `A2` on a browser rig.
Both halt rather than substituting.

---

## §12 · GATE INVENTORY — BUILT, NOT YET PROVEN

```
gates/ewa/gates/   gate_A0.sh … gate_A8.sh     ← MUST BE BUILT BEFORE A0 RUNS
gates/ewa/negatives/prove.sh                   ← the discrimination harness
```

**Honest state, measured:**
```bash
$ ls gates/ewa/gates/ 2>&1 | head -2
ls: cannot access 'gates/ewa/gates/': No such file or directory
```

**There are no EW-A gate scripts on disk.** Before `A0` runs, this workflow needs its gate set
built and proven with a negative harness exactly as EW-B1's were
(`gates/e1/proofs/gateproof.txt` — 15/15 DISCRIMINATES, harness exit 0). A gate that has never
been watched fail is a sentence, not a gate.

**Actively unknown, deliberately not guessed:** `SOURCE_URL`. `A0.2` discovers it. Parent §B.2
records the cost of guessing a path — `src/e1_category.py` was written as if it existed at root,
and would have failed the builder on day one.

**Next action:** build the nine gate scripts + their negative fixtures, prove them 9/9, then run
`A0`. `A0` is unblocked and independent of EW-B1.
