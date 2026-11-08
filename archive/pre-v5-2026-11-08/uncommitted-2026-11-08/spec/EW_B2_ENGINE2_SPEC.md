# EW-B2 — ENGINE 2 · SPEC + EXECUTION WORKFLOW

**Subject:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION`
**Files this workflow may write (`$MY`):** `plutus-vision-lqz/e2-render.pine` · `plutus-vision-v2.pine` · `pine-ide/ide/renderer/plutus-vision-v2.pine`
**Must never write:** `plutus-vision-lqz/e1-render.pine` (EW-B1 owns it) · `plutus-vision-v1.pine` (sealed `0d20e831`) · `Checkpoints/**` · `Original_Canon_Data/**` · the five append-only ship docs · `cards/ type/ CHARTER.md KNOWLEDGE_GRAPH_* MASTER_CONTEXT_*`
**Parent authority:** `spec/PLUTUS_VISION_DYNAMIC_INDICATOR_DPL1_SPEC.md` (855 L, approved 21/21), §B.4 (derivation rule table) and §B.3 (wave W3).
**Predecessor:** `spec/EW_B1_ENGINE1_SPEC.md` — **hard-blocked until it closes.**

---

## §1 · WHY THIS IS BLOCKED, MECHANICALLY

Engine 2 is not an independent surface. It draws **on top of** a zone table Engine 1 produces.
The parent spec states the ordering outright:

> *"Gates between waves are blocking — W3 must not start until W1's `grep -c` returns 0, because
> E2 reads the ZFP that W1 fixes."*

And the historical failure it encodes: the fabrication W1 kills sits in the very ZFP that E2
consumes — **exactly the causal chain that got E2 disabled last time.**

So `E0` is not a courtesy check. It is the reason this workflow starts where it starts.

```
E0 gate:  bash gates/e1/gates/gate_12.sh   must exit 0
          otherwise → "EW-B2 BLOCKED: Engine 1 not closed"
```

---

## §2 · THE SUBJECT, AS MEASURED

```
plutus-vision-lqz/e2-render.pine                       EDITABLE
  consumes 7 injected variables (grep -oE 'e2_injected_[a-z_]+'):
    e2_injected_x      e2_injected_y        e2_injected_shape
    e2_injected_conf   e2_injected_ghost_x  e2_injected_ghost_y
    e2_injected_refusal
  carries: e1_injected_week_tag / e1_injected_anchor_ms referenced for anchoring
  the OFF switch, by inspection: e2_injected_refusal = ""
  today filled by scripts/pine_emit.py as LITERALS — the same defect EW-A removes on its side

plutus-vision-lqz/e1-render.pine        READ-ONLY here (EW-B1 owns it)
plutus-vision-v1.pine                   SEALED 0d20e831
plutus-vision-v2.pine                   BUILT  = v1 verbatim + e1 + e2
pine-ide/ide/renderer/plutus-vision-v2.pine   SERVED
scripts/lqz_vision_v2_build.py                the generator
```

**Produced by:** `src/e2_chain.ts → deriveChain(zones)` once EW-A ships. Until then the only
legitimate source of these seven values is a derivation **inside the indicator** — which is what
this workflow builds.

---

## §3 · THE DERIVATION CONTRACT (parent §B.4, verbatim)

The chain is a **derived line, not a written opinion.** Transcribing a chain from a report is the
single most important thing this workflow refuses.

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

## §4 · SUCCESS CRITERIA

| # | criterion | verification | bar |
|---|---|---|---|
| S5 | E2 line present | **opened screenshot**: chain polyline + shape labels | visible |
| S4 | both faces still on one chart | **opened screenshot** | E1 not regressed |
| S12 | deployed == built | `sha256sum <built>` == `sha256sum <deployed>` | equal |
| S13 | build emits its own symbols | `grep -c <symbol added> <deployed>` | **≥1** |
| `st_e2_derive` | the derivation is real | HIGH+LOW ⇒ `zoneHeld:true` · LOW+HIGH ⇒ `pierced:true` · MOD+LM ⇒ `SS` · truncated array ⇒ exit tag `ZONE_ARRAY_LEN_MISMATCH` | all four |
| `st_e2_no_literal` | not transcribed | emitted source contains **0** literal `SS -> BS -> R -> WL` | **0** |
| `st_week_window` | window still correct | `box.new` left `== tsL`, right `== tsR`, right−left `== 5d` | all |

**Evidence law:** S5 requires an **opened screenshot read in the same turn**. A compile line, a
drawing count, or a source read is not evidence of a rendered line.

**Both halves, always:** the adversarial fixture (truncated zone array, empty zone set,
malformed timestamp) must fire its **named** token; the legitimate fixtures (three real zone
tables, a normal week) must pass with **zero misfire**.

---

## §5 · FILE MEMBERSHIP

```
EW-B2 OWNS       plutus-vision-lqz/e2-render.pine · plutus-vision-v2.pine ·
                 pine-ide/ide/renderer/plutus-vision-v2.pine
READ-ONLY HERE   plutus-vision-lqz/e1-render.pine   (EW-B1 owns it)
NEVER TOUCHED    plutus-vision-v1.pine · Checkpoints/** · Original_Canon_Data/** ·
                 the five append-only ship docs · cards/ type/ CHARTER.md
                 KNOWLEDGE_GRAPH_* MASTER_CONTEXT_*
```

**If E2 needs an E1 change, it REPORTS the need — it does not edit across the boundary.** Two
writers on one file is the merge-chaos class, and the parent spec's whole file-manifest section
exists because the paths were once guessed and would have failed on day one.

**Concurrency:** `DEEPSEEK_AGENT/`, `MIMO_AGENT/`, `STEP_AGENT/` hold parallel copies. Every turn
begins with a path-lock on the sha of the files it may write.

---

## §6 · THE GATE INVENTORY — BUILT, NOT YET PROVEN

```
gates/ewe/gates/   gate_E0.sh … gate_E12.sh    ← MUST BE BUILT BEFORE E1 RUNS
gates/ewe/negatives/prove.sh                   ← the discrimination harness
```

**Honest state:** these do not exist yet. EW-B1's 15 gates are on disk and proven
(`gates/e1/proofs/gateproof.txt` — 15/15 DISCRIMINATES, harness exit 0). EW-B2's are not.
Before `E1` runs, this workflow needs its gate set built and proven with a negative harness the
same way. **A gate that has never been watched fail is a sentence, not a gate.**

The gate set this workflow owes, with what each must assert:

| gate | asserts |
|---|---|
| `gate_E0` | `gate_12.sh` exit 0 (EW-B1 closed) · baseline sha · draw count recorded · untracked baseline recorded |
| `gate_E1` | `READ == TOTAL` · draw sites == `E0.drawcount` · all 7 `e2_injected_` names present in the source |
| `gate_E2` | `e2_injected_refusal = ""` · before/after state files both exist and differ |
| `gate_E3` | a computation site exists whose inputs are zone/conf values · **no literal chain string** |
| `gate_E4` | polyline present · label count == vertex count |
| `gate_E5` | `BUILD_EXIT=0` · `CONSUMED=YES` · v1 still `0d20e831` |
| `gate_E6` | root sha == served sha |
| `gate_E7` | screenshot is a real PNG · **chart-region** control ≥5% · `bars_in_week > 0` · no label echoed from source · JSON parses with no `<` placeholders |
| `gate_E8` | rows carry `{element, class, owner, anchor:"file:line"}` · `expected_week` computed |
| `gate_E10 <i>` | per-row backup exists · after-PNG opened · `delta_gone` · `regression:false` |
| `gate_E9` | three PNGs opened in one turn · every delta `closed` or `accepted_name` · both faces against their own references |
| `gate_E12` | served bundle contains the E2 path · chain not literal · `V1=0d20e831` · scope-creep 0 · debris delta 0 · gate shas unchanged |

---

## §7 · THE TURN CONTRACT

Identical to EW-B1 §6:

```
P0  ENTRY     previous turn's gate exited 0
P1  PATH-LOCK sha256 of every file this turn may write == recorded at the previous turn
A   ACTION    exact tool calls; LITERAL STRINGS ONLY — line numbers re-derived by grep
              immediately before every edit, never carried between turns
E   EVIDENCE  every command's output written to gates/ewe/proofs/eE*
J   JUDGE     a command decides wherever a command can decide
R   REASONING three lines: what changed · what the evidence shows · why it is safe to advance
G   GATE      bash gates/ewe/gates/gate_E<n>.sh → exit 0, or halt with the gate name
C   COMMIT    git commit → a sha that can be diffed
```

---

# §8 · THE EXECUTION WORKFLOW

## E0 · DEPENDENCY GATE + BASELINE

**Purpose:** prove the predecessor closed before a single line is read.

```bash
# tool: bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
bash gates/e1/gates/gate_12.sh || { echo "EW-B2 BLOCKED: Engine 1 not closed"; exit 1; }
echo "PREDECESSOR_CLOSED"
```
**EXPECTED:** `GATE 12 PASS` then `PREDECESSOR_CLOSED`.
**FAIL → `EW-B1-NOT-CLOSED`. HALT.** Never start against an absent zone table.

```bash
# tool: bash
mkdir -p /tmp/ewe gates/ewe/gates gates/ewe/negatives gates/ewe/proofs
git status --porcelain > /tmp/ewe/BASELINE_DIRTY.txt
git status --porcelain | grep '^??' | sort > /tmp/ewe/BASELINE_UNTRACKED.txt
sha256sum plutus-vision-lqz/e2-render.pine plutus-vision-v2.pine \
  pine-ide/ide/renderer/plutus-vision-v2.pine > /tmp/ewe/E0.sha
cat /tmp/ewe/E0.sha
grep -cE 'box\.new|line\.new|label\.new' plutus-vision-lqz/e2-render.pine > /tmp/ewe/E0.drawcount
echo "DRAWSITES=$(cat /tmp/ewe/E0.drawcount)"
grep -oE 'e2_injected_[a-z_]+' plutus-vision-lqz/e2-render.pine | sort -u > /tmp/ewe/E0.contract
wc -l < /tmp/ewe/E0.contract          # expect 7
```
**EXPECTED:** three sha lines · a draw count · `7`.
**FAIL — contract count ≠ 7:** the consumer changed. **HALT, re-derive.** Everything downstream
compares against this number.

```bash
bash gates/ewe/gates/gate_E0.sh || { echo "TURN E0 BLOCKED"; exit 1; }
git add gates/ewe/proofs && git commit -q -m "ewe(E0): predecessor closed + baseline + 7-var contract captured

gate: gate_E0.sh exit 0 | gate_12 exit 0 | contract == 7"
git rev-parse HEAD > gates/ewe/proofs/sha.E0
```

---

## E1 · READ WITH FULL COVERAGE

```bash
# tool: bash
P=plutus-vision-lqz/e2-render.pine
TOTAL=$(wc -l < $P); echo "TOTAL=$TOTAL"
for r in "1 90" "91 180" "181 $TOTAL"; do
  set -- $r; sed -n "${1},${2}p" $P > /tmp/ewe/p_$1.txt
done
cat /tmp/ewe/p_*.txt | wc -l > /tmp/ewe/E1.readcount
echo "READ=$(cat /tmp/ewe/E1.readcount)"

grep -nE 'box\.new|line\.new|label\.new' $P | tee /tmp/ewe/E1.sites.txt
grep -n 'e2_injected_' $P | tee /tmp/ewe/E1.contract_sites.txt
grep -nE '^[A-Za-z_][A-Za-z0-9_]*\(.*\)\s*=>' $P | tee /tmp/ewe/E1.fns.txt
```
**EXPECTED:** `READ == TOTAL`; the draw-site list is non-empty if `E0.drawcount > 0`; every one of
the seven `e2_injected_` names appears at least once.
**FAIL → `COVERAGE-GAP`:** fix the `sed` ranges, re-run. A gap hides a draw call.
**FAIL → `CONTRACT-SITE-MISSING`:** a variable consumed but never referenced. HALT.

### REASONING
```
what changed   : nothing (read-only)
what evidence  : READ==TOTAL, contract sites == 7, draw sites recorded
why advance    : coverage proven; the derivation sites are located
```

```bash
bash gates/ewe/gates/gate_E1.sh || { echo "TURN E1 BLOCKED"; exit 1; }
git add gates/ewe/proofs && git commit -q -m "ewe(E1): full-coverage read + 7-var contract sites located

gate: gate_E1.sh exit 0"
git rev-parse HEAD > gates/ewe/proofs/sha.E1
```

---

## E2 · TURN IT ON — LOUDLY

**Purpose:** if `e2_injected_refusal` is hardcoded non-empty, the render path exists but is
switched off. Enabling it silently is how a layer turns on and nobody notices until it misrenders.

```bash
# tool: bash
P=plutus-vision-lqz/e2-render.pine
cp $P /tmp/ewe/E2.pre
grep -n 'e2_injected_refusal' $P | tee /tmp/ewe/E2.before.txt
sed -n "$(grep -n 'e2_injected_refusal' $P | head -1 | cut -d: -f1)p" $P
```
**EXPECTED:** the exact line, printed.

```bash
# tool: edit  — path plutus-vision-lqz/e2-render.pine
#   old_string = the exact line copied from the print above (NEVER a remembered line number)
#   new_string = e2_injected_refusal = ""
```

```bash
# tool: bash
grep -n 'e2_injected_refusal' plutus-vision-lqz/e2-render.pine | tee /tmp/ewe/E2.after.txt
diff /tmp/ewe/E2.pre plutus-vision-lqz/e2-render.pine > /tmp/ewe/E2.diff
grep -c '^[<>]' /tmp/ewe/E2.diff
grep '^<' /tmp/ewe/E2.diff | grep -cE 'line\.new|label\.new' || echo 0
```
**EXPECTED:** `E2.before.txt` and `E2.after.txt` **differ**; a small diff; **zero** draw calls
removed.
**FAIL → `NO_STATE_CHANGE`:** before == after, the edit did not land. HALT.
**FAIL → `DRAW-LOST`:** a draw call was removed. `cp /tmp/ewe/E2.pre $P`, redo with a tighter
literal.

```bash
bash gates/ewe/gates/gate_E2.sh || { echo "TURN E2 BLOCKED"; exit 1; }
git add -- $MY gates/ewe && git commit -q -m "ewe(E2): turn Engine 2 on — refusal cleared, state change recorded

gate: gate_E2.sh exit 0 | before != after | zero draw calls lost"
git rev-parse HEAD > gates/ewe/proofs/sha.E2
```

---

## E3 · THE DERIVATION MUST BE A DERIVATION

**Purpose:** prove the shape is **computed** from zone values, not transcribed. This is §3 made
mechanical.

```bash
# tool: bash
P=plutus-vision-lqz/e2-render.pine
grep -n 'shape\s*=\|calcShape\|derive\|ss_or\|higher_of' $P | tee /tmp/ewe/E3.calc.txt
echo "=== any literal chain string anywhere in the file? ==="
grep -n 'SS *-> *BS *-> *R *-> *WL\|SS→BS' $P | tee /tmp/ewe/E3.literal.txt
echo "LITERAL_CHAIN=$(wc -l < /tmp/ewe/E3.literal.txt)"
```
**EXPECTED:** `E3.calc.txt` non-empty (a computation site exists) · `LITERAL_CHAIN=0`.
**FAIL → `NO_DERIVATION`:** no computation site. HALT — there is nothing to verify against §3.
**FAIL → `TRANSCRIBED_CHAIN`:** a literal chain string exists. HALT — a copied chain is not a
derivation, and this refusal is the whole reason EW-B2 exists as a separate workflow.

```bash
# tool: bash — prove the inputs are zone values, not constants
python3 - <<'PY' | tee /tmp/ewe/E3.inputs.txt
import re, pathlib
s = pathlib.Path("plutus-vision-lqz/e2-render.pine").read_text()
for tok in ("e2_injected_conf","e2_injected_shape","e1_injected_confluence","e1_injected_zfp"):
    print(f"{tok}: {s.count(tok)}")
PY
```
**EXPECTED:** at least one of the pressure/ZFP inputs is referenced **≥1** time inside the
derivation region.
**FAIL → `CONSTANT_INPUT`:** the derivation reads no zone value. HALT — a function with no inputs
is a hardcoded string wearing a function's clothes.

```bash
bash gates/ewe/gates/gate_E3.sh || { echo "TURN E3 BLOCKED"; exit 1; }
git add gates/ewe/proofs && git commit -q -m "ewe(E3): derivation site proven — zone inputs, zero literal chains

gate: gate_E3.sh exit 0 | LITERAL_CHAIN=0 | constant inputs not read"
git rev-parse HEAD > gates/ewe/proofs/sha.E3
```

---

## E4 · DRAW THE POLYLINE

```bash
# tool: bash
P=plutus-vision-lqz/e2-render.pine
cp $P /tmp/ewe/E4.pre
grep -nE 'line\.new|label\.new' $P | tee /tmp/ewe/E4.sites.txt
BEFORE=$(grep -cE 'line\.new|label\.new' $P); echo "BEFORE=$BEFORE"
```
**EXPECTED:** the existing sites with their line numbers, and a printed `BEFORE`.

```bash
# tool: edit — add one polyline across the focus week, plus one label per vertex
#   old_string copied from a fresh `sed -n` print at the site being extended
#   new_string adds the polyline + the per-vertex shape label
```
**Rules for the edit:**
- the polyline uses `_lx`/`_rx` or the anchor pair — **never a literal window**
- one label per vertex, carrying the shape token from §3
- label text must be **built from variables**, never a string literal containing a shape sequence

```bash
# tool: bash
P=plutus-vision-lqz/e2-render.pine
AFTER=$(grep -cE 'line\.new|label\.new' $P); echo "AFTER=$AFTER"
grep -nE 'line\.new|label\.new' $P | tee /tmp/ewe/E4.after.txt
diff /tmp/ewe/E4.pre $P > /tmp/ewe/E4.diff; grep -c '^[<>]' /tmp/ewe/E4.diff
grep -c '2 \* 604800000\|3 \* 604800000' $P || echo 0
```
**EXPECTED:** `AFTER > BEFORE` · a diff exists · **zero** stale window literals introduced.
**FAIL → `NO_DRAW_ADDED`:** `AFTER == BEFORE`. HALT.
**FAIL → `WINDOW_REGRESSION`:** a literal window was reintroduced. HALT — that is EW-B1's fix
being undone from the other side.

```bash
bash gates/ewe/gates/gate_E4.sh || { echo "TURN E4 BLOCKED"; exit 1; }
git add -- $MY gates/ewe && git commit -q -m "ewe(E4): polyline + per-vertex shape labels drawn, no window regression

gate: gate_E4.sh exit 0 | AFTER > BEFORE | stale literals == 0"
git rev-parse HEAD > gates/ewe/proofs/sha.E4
```

---

## E5 · BUILD + DEPLOY

```bash
# tool: bash
python3 scripts/lqz_vision_v2_build.py 2>&1 | tee /tmp/ewe/E5.build.txt
echo "BUILD_EXIT=${PIPESTATUS[0]}" >> /tmp/ewe/E5.build.txt

OLD=$(awk '$2=="plutus-vision-v2.pine"{print $1}' /tmp/ewe/E0.sha)
NEW=$(sha256sum plutus-vision-v2.pine | cut -d' ' -f1)
echo "OLD_DIST=$OLD" >> /tmp/ewe/E5.build.txt
echo "NEW_DIST=$NEW" >> /tmp/ewe/E5.build.txt
[ "$OLD" != "$NEW" ] && echo "CONSUMED=YES" >> /tmp/ewe/E5.build.txt \
                     || echo "CONSUMED=NO"  >> /tmp/ewe/E5.build.txt

DST=pine-ide/ide/renderer/plutus-vision-v2.pine
[ -f "$DST" ] || { echo "SERVED_FILE_MISSING"; exit 1; }
if [ "$NEW" != "$(sha256sum $DST | cut -d' ' -f1)" ]; then
  cp plutus-vision-v2.pine "$DST" && echo "DEPLOYED"
else echo "ALREADY_MATCH"; fi

a=$(sha256sum plutus-vision-v2.pine | cut -d' ' -f1)
b=$(sha256sum "$DST" | cut -d' ' -f1)
echo "SRC=$a"; echo "DST=$b"; [ "$a" = "$b" ] && echo "GATE_E6=PASS" || echo "GATE_E6=FAIL"
tail -8 /tmp/ewe/E5.build.txt
```
**EXPECTED:** `BUILD_EXIT=0` · `CONSUMED=YES` · `DEPLOYED` or `ALREADY_MATCH` · `GATE_E6=PASS`.
**FAIL → `BUILD_EXIT≠0`:** `tail -20`, paste verbatim, **HALT — no deploy.**
**FAIL → `CONSUMED=NO`:** the generator ignored the source edit. Deploying would ship the old
build under a new claim — the F-95 class. **HALT.**
**FAIL → `GATE_E6=FAIL`:** hashes differ after `cp`. **HALT.**

```bash
bash gates/ewe/gates/gate_E5.sh || { echo "TURN E5 BLOCKED"; exit 1; }
bash gates/ewe/gates/gate_E6.sh || { echo "TURN E5 (deploy half) BLOCKED"; exit 1; }
git add -- plutus-vision-v2.pine pine-ide/ide/renderer/plutus-vision-v2.pine gates/ewe \
  && git commit -q -m "ewe(E5): build consumed the edit + deploy sha-equal

gate: gate_E5.sh exit 0 | gate_E6.sh exit 0 | BUILD_EXIT=0 | CONSUMED=YES"
git rev-parse HEAD > gates/ewe/proofs/sha.E5
```

---

## E6 · RENDER AND LOOK

```bash
# tool: bash — the rig must be up
DISPLAY=:3 xdotool getdisplaygeometry 2>&1 || echo "DISPLAY_DOWN"
curl -s --max-time 3 http://127.0.0.1:9234/json/version | head -c 300; echo
```
**FAIL → `RENDER_RIG_DOWN:<which>`. HALT.** Never substitute a description.

```js
// tool: browser — selectors from T7.0's measured T70.json, NEVER re-guessed
await page.select(PAIR_SELECT_ID,  'EURUSD');
await page.select(WEEK_SELECT_ID,  '2026-07-06');
await page.click(RUN_SELECTOR);
await new Promise(r=>setTimeout(r,6000));
await page.screenshot({ path: '/tmp/ewe/E6.png' });
```

```bash
# tool: bash — three guards, each killing a documented false green
identify /tmp/ewe/E6.png 2>&1 | head -1 | tee /tmp/ewe/E6.identify.txt
grep -c 'PNG image' /tmp/ewe/E6.identify.txt

python3 - <<'PY'
from PIL import Image
im = Image.open('/tmp/ewe/E6.png').convert('RGB')
w,h = im.size
crop = im.crop((int(w*0.12), int(h*0.10), int(w*0.99), int(h*0.86)))   # chart area ONLY
px = list(crop.resize((200,110)).getdata())
nonblack = sum(1 for p in px if sum(p) > 30); total = len(px)
ok = 1 if nonblack >= 0.05*total else 0
open('/tmp/ewe/E6.control.txt','w').write(f"{ok} {nonblack}\n")
print(f"CHART_OK={ok} NONBLACK={nonblack}/{total}")
PY

echo "$BARS_IN_WEEK" | tee /tmp/ewe/E6.bars.txt     # from the IDE status, via CDP
```
- **chart-region control** kills **D7** — chrome painted while the chart is empty.
- **`bars_in_week > 0`** kills **D4** — zero bars would otherwise be blamed on draw geometry.
- **no source-leak** kills **D8** — a label echoed from the `.pine` was read from source.

```python
# tool: read — SAME TURN, no verdict without it
read(path="/tmp/ewe/E6.png")
```
**Enumerate off the pixels:** E1 bands present · E2 polyline present · a label on every vertex ·
the shape token visible on each label.

```bash
cat > /tmp/ewe/E6.enumeration.json <<'JSON'
{
  "png": "/tmp/ewe/E6.png", "read_in_turn": true,
  "control": {"nonblack": <INT>, "pass": true},
  "bars_in_week": <INT>,
  "e1_bands": {"count": <INT>},
  "e2_polyline": {"present": true, "vertices": <INT>},
  "vertex_labels": ["<read off pixels>"],
  "unknowns": ["<anything not readable>"]
}
JSON
python3 -c "import json;json.load(open('/tmp/ewe/E6.enumeration.json'));print('JSON_OK')"
grep -c '<INT>\|<date>\|<read' /tmp/ewe/E6.enumeration.json || echo 0
```
**EXPECTED:** `CHART_OK=1` · bars `>0` · `JSON_OK` · placeholder count `0` · polyline `present`.
**FAIL → `BLANK-CHART` / `NO-BARS` / `UNFILLED`:** each a distinct diagnosis. HALT.
**FAIL → `POLYLINE_ABSENT`:** the E2 line did not render. Classify `SCRIPT` and proceed to E7.

```bash
bash gates/ewe/gates/gate_E7.sh || { echo "TURN E6 BLOCKED"; exit 1; }
git add gates/ewe/proofs && git commit -q -m "ewe(E6): render observed — chart control, bars, no source-leak, polyline read off pixels

gate: gate_E7.sh exit 0
evidence: E6.enumeration.json E6.control.txt E6.bars.txt E6.png"
git rev-parse HEAD > gates/ewe/proofs/sha.E6
```

---

## E7 · CLASSIFY — from the JSON only

```bash
# tool: bash
echo "$EXPECTED_WEEK" | tee /tmp/ewe/E7.expected_week.txt    # COMPUTED, never undefined
python3 - <<'PY'
import json
d=json.load(open('/tmp/ewe/E6.enumeration.json'))
exp=open('/tmp/ewe/E7.expected_week.txt').read().strip()
rows=[]
if not d["e2_polyline"]["present"]:
    rows.append({"element":"e2_polyline","class":"SCRIPT",
                 "owner":"plutus-vision-lqz/e2-render.pine",
                 "anchor":"plutus-vision-lqz/e2-render.pine:<the line.new site>"})
if d["e2_polyline"].get("span","") != exp:
    rows.append({"element":"e2_span","class":"PIPELINE","owner":"window/anchor definition",
                 "anchor":"plutus-vision-lqz/e2-render.pine:<the window site>"})
if d["e2_polyline"]["present"] and d["e2_polyline"]["vertices"] != len(d["vertex_labels"]):
    rows.append({"element":"vertex_labels","class":"SCRIPT",
                 "owner":"plutus-vision-lqz/e2-render.pine",
                 "anchor":"plutus-vision-lqz/e2-render.pine:<the label.new site>"})
if d.get("unknowns"):
    rows.append({"element":"unknowns","class":"INCONCLUSIVE","owner":"-","anchor":"-"})
json.dump(rows,open('/tmp/ewe/E7.rows.json','w'),indent=2)
print("ROWS=",len(rows))
for r in rows: print(r)
PY
```
**RULES:**
- a missing polyline is `SCRIPT` (draw geometry)
- a polyline spanning the wrong days is `PIPELINE` (window/anchor)
- vertex count ≠ label count is `SCRIPT`
- `INCONCLUSIVE` **halts**; it never auto-closes

**FAIL → `UNANCHORED_ROW`:** a row without `file:line`. A symptom with no anchor is not a finding.

```bash
bash gates/ewe/gates/gate_E8.sh || { echo "TURN E7 BLOCKED"; exit 1; }
git add gates/ewe/proofs && git commit -q -m "ewe(E7): classified from JSON — every row anchored file:line

gate: gate_E8.sh exit 0"
git rev-parse HEAD > gates/ewe/proofs/sha.E7
```
**ROWS=0 → skip to E9.**

---

## E8.i · ONE ROW PER TURN — no turn ever loops

```bash
# tool: bash — backups BEFORE the first row edit
mkdir -p /tmp/ewe/rowbak
N=$(python3 -c "import json;print(len(json.load(open('/tmp/ewe/E7.rows.json'))))")
for i in $(seq 0 $((N-1))); do cp plutus-vision-lqz/e2-render.pine /tmp/ewe/rowbak/row_$i.pre; done
ls /tmp/ewe/rowbak/ | wc -l; echo "ROWS=$N"
```
**EXPECTED:** one `.pre` per row. **FAIL → halt — no revert path, no edits.**

### For row `i` (one turn each)
```bash
grep -n '<the pattern this row fixes>' plutus-vision-lqz/e2-render.pine   # RE-DERIVE
# tool: edit — old_string copied from that fresh print; NEVER a remembered line number
python3 scripts/lqz_vision_v2_build.py 2>&1 | tee /tmp/ewe/E8.$i.build.txt
echo "BUILD_EXIT=${PIPESTATUS[0]}"; grep -c '^CONSUMED=YES' /tmp/ewe/E8.$i.build.txt
# deploy, hashes equal
# inject + RUN + screenshot -> /tmp/ewe/E8.$i.png
# chart-region control + bars>0 on THAT png
# tool: read — OPEN /tmp/ewe/E8.$i.png
cat > /tmp/ewe/E8.$i.json <<JSON
{"opened": true, "delta_gone": true, "regression": false,
 "element": "<the row's element>",
 "e1_bands_before": <INT>, "e1_bands_after": <INT>,
 "vertices_before": <INT>, "vertices_after": <INT>}
JSON
```
**`regression:false` is asserted by comparing `e1_bands_*` and `vertices_*` against
`E6.enumeration.json`** — Engine 2's fix must not make Engine 1 disappear. One new PASS with an
old PASS broken is a **net failure**.

**ON ANY SUB-STEP FAIL:**
```bash
cp /tmp/ewe/rowbak/row_$i.pre plutus-vision-lqz/e2-render.pine
python3 scripts/lqz_vision_v2_build.py && cp plutus-vision-v2.pine pine-ide/ide/renderer/plutus-vision-v2.pine
# re-render + OPEN to prove the restored state is good  (a source restore with a stale dist
# is the same bug wearing a different hat)
# record row i as BLOCKED with the verbatim error; continue to row i+1
```

```bash
bash gates/ewe/gates/gate_E10.sh $i || { echo "TURN E8.$i BLOCKED"; exit 1; }
git add -- $MY gates/ewe && git commit -q -m "ewe(E8.$i): row $i closed — opened PNG, E1 not regressed

gate: gate_E10.sh $i exit 0"
git rev-parse HEAD > gates/ewe/proofs/sha.E8_$i
```

---

## E9 · GOLDEN WEEK — three images, one turn

```js
// tool: browser — selectors measured, never re-guessed
await page.select(PAIR_SELECT_ID,  'EURUSD');
await page.select(WEEK_SELECT_ID,  '2026-07-06');
await page.click(RUN_SELECTOR);
await new Promise(r=>setTimeout(r,6000));
await page.screenshot({ path: '/tmp/ewe/E9.png' });
```
```bash
cat /tmp/e1/T2.golden.txt        # the two references recorded by EW-B1's T2
```
```python
# tool: read — THREE images, SAME turn
read(path="/tmp/ewe/E9.png")
read(path="<face_a reference>")
read(path="<face_b reference>")
```
**Enumerate against each reference separately:**
- against **face_a**: are the E1 pressure bands where the reference puts them?
- against **face_b**: are the S/D and LQZ rails where the reference puts them?
- against the render itself: is the polyline present, and does every vertex carry its label?

```bash
cat > /tmp/ewe/E9.deltas.json <<'JSON'
{
  "opened_same_turn": true,
  "render": "/tmp/ewe/E9.png",
  "face_a": {"reference": "<path>", "polyline_present": true,
             "vertices": <INT>, "labels": <INT>,
             "deltas": [{"element":"<name>","present":true,"closed":true,"accepted_name":""}]},
  "face_b": {"reference": "<path>", "deltas": []}
}
JSON
python3 -c "import json;json.load(open('/tmp/ewe/E9.deltas.json'));print('JSON_OK')"
```
**PASS:** `vertices == labels` · both faces judged against **their own** reference · every delta
`closed:true` **or** carrying `accepted_name`.
**FAIL → `VERTEX_LABEL_MISMATCH`:** a vertex without a label — you cannot verify §3 off a chart
that does not print the shapes.
**FAIL → `WRONG_REFERENCE`:** a face compared against the other face's image. HALT — that
manufactures deltas that are not defects.

```bash
bash gates/ewe/gates/gate_E9.sh || { echo "TURN E9 BLOCKED"; exit 1; }
git add gates/ewe/proofs && git commit -q -m "ewe(E9): golden week — three images opened in-turn, per-face deltas closed-or-named

gate: gate_E9.sh exit 0"
git rev-parse HEAD > gates/ewe/proofs/sha.E9
```

---

## E12 · FINAL — dist-content + hygiene

```bash
# tool: bash
sha256sum plutus-vision-lqz/e2-render.pine plutus-vision-v2.pine \
  pine-ide/ide/renderer/plutus-vision-v2.pine | tee /tmp/ewe/FINAL.sha

echo "E2_DRAW=$(grep -cE 'line\.new|label\.new' plutus-vision-lqz/e2-render.pine)"
echo "DIST_HAS_E2=$(grep -c 'e2_injected_shape' pine-ide/ide/renderer/plutus-vision-v2.pine)"
echo "LITERAL_CHAIN=$(grep -c 'SS *-> *BS *-> *R *-> *WL' pine-ide/ide/renderer/plutus-vision-v2.pine)"
echo "STALE_WIN=$(grep -c '2 \* 604800000\|3 \* 604800000' plutus-vision-lqz/e2-render.pine)"
echo "V1=$(sha256sum plutus-vision-v1.pine | cut -c1-8)"
echo "DISTS_MATCH=$([ "$(sha256sum plutus-vision-v2.pine|cut -d' ' -f1)" = \
   "$(sha256sum pine-ide/ide/renderer/plutus-vision-v2.pine|cut -d' ' -f1)" ] && echo YES || echo NO)"
echo "=== scope creep: did my commits touch only \$MY? ==="
git diff --name-only $(cat gates/ewe/proofs/sha.E0)..HEAD -- . \
  | grep -v -E "^(\gates/ewe/|plutus-vision-lqz/e2-render\.pine|plutus-vision-v2\.pine|pine-ide/ide/renderer/plutus-vision-v2\.pine)$" || echo "NONE"
echo "=== debris delta ==="
git status --porcelain | grep '^??' | sort > /tmp/ewe/UNTRACKED_NOW.txt
comm -13 /tmp/ewe/BASELINE_UNTRACKED.txt /tmp/ewe/UNTRACKED_NOW.txt | grep -v '^?? \gates/ewe/' || echo "NONE"
```
**EXPECTED:** `E2_DRAW ≥ 1` · `DIST_HAS_E2 ≥ 1` · `LITERAL_CHAIN=0` · `STALE_WIN=0` ·
`V1=0d20e831` · `DISTS_MATCH=YES` · scope creep `NONE` · debris delta `NONE`.

```bash
bash gates/ewe/gates/gate_E12.sh || { echo "TURN E12 BLOCKED"; exit 1; }
git add -- $MY gates/ewe && git commit -q -m "ewe(E12): final — dist carries E2, chain not literal, scope 0, debris 0

gate: gate_E12.sh exit 0"
git rev-parse HEAD > gates/ewe/proofs/sha.E12
```

---

## P4 · THE INDEPENDENT VERIFIER — the only non-self-graded step

The final gate in this workflow is not `gate_E12`. It is a fresh agent that has read none of
this session's conclusions.

```
target   : a fresh subagent, zero prior context
hand it  : ONLY gates/ewe/gates/*.sh  +  the commit range sha.E0..HEAD
withhold : every conclusion, count, verdict and reasoning from this session —
           especially the §12 "proven / not proven" table, which is a claim, not evidence
require  :
  a  re-run each gate_E*.sh itself in a clean shell, report the exit codes
  b  re-open /tmp/ewe/E9.png and BOTH golden references, and report the per-face deltas
  c  return {gates_passed, png_opened, faces_compared, deltas_open}
  d  write gates/ewe/proofs/verifier.txt — "VERIFIER PASS" or the failures verbatim
law      : a gate it cannot re-run is a gate that does not exist.
           its return is the ONLY input that closes this workflow.
```

**Why this exists as a separate turn and not as `gate_E12`:** every gate above was written by
the same agent that will run it, and every count in §12 was produced by that same agent. A
workflow that closes on its own verdicts is self-graded — the exact failure class this whole
document is built to prevent. `gate_E12` proves the artifact is correct; `P4` proves the gates
that claimed it are real.

```bash
bash gates/ewe/gates/gate_P4.sh || { echo "TURN P4 BLOCKED"; exit 1; }
git add gates/ewe/proofs && git commit -q -m "ewe(P4): independent verifier green — gates re-run by a fresh agent

gate: gate_P4.sh exit 0 (verifier.txt carries VERIFIER PASS)"
git rev-parse HEAD > gates/ewe/proofs/sha.P4
```

---

## §9 · DEBUG LOOP

```
gate_E<n>.sh != 0  →  classify exactly one:
  GATE_DEFECT   the gate's expectation is wrong  → fix the gate, re-run the gate only
                (the gate's sha changes → re-baseline it in the E0 record)
  INPUT_DEFECT  my literal or args were wrong    → correct, redo the action from A
  SOURCE_DEFECT the code change is wrong          → git checkout to this turn's entry, redo A
  CONCURRENCY   P1 path-lock sha changed         → HALT, name the other writer
  ENV           rig down / build tool down       → HALT, paste the verbatim error

3 attempts, counted in gates/ewe/proofs/attempt.E<n>.
3rd failure → hard stop with the gate name and all three verbatim errors.
Evidence produced before a fix is never reused for after it.
```

---

## §10 · PROGRESSION

```
E0 ─ E1 ─ E2 ─ E3 ─ E4 ─ E5 ─ E6 ─ E7 ─ E8.i* ─ E9 ─ E12 ─ P4
 │     │     │     │     │     │     │     │      │     │      │
gE0   gE1   gE2   gE3   gE4  gE5/gE6 gE7 gE8  gE10.i gE9  gE12  verifier
 │
 └─ E0's FIRST action is `bash gates/e1/gates/gate_12.sh` — EW-B1 must be closed.
    Until that exits 0, this entire column is unreachable.
```

**E6 and E9 produce the only evidence about the build.** E0–E5 are component evidence.
**P4 is the only evidence that is not self-graded** — `gate_E12` proves the artifact; `P4` proves
the gates that claimed it are real.

---

## §11 · OPEN DECISIONS THIS WORKFLOW INHERITS

| # | fork | recommended default | consequence if unresolved |
|---|---|---|---|
| D1 | sidecar transport | push into the dashboard/backtest feed; keep the sidecar transport-agnostic | **Pine has no network access** — a Pine-first transport design is dead on arrival |
| D5 | EURUSD Jul 6–10 fixture | **procure before E9** | `E9` cannot run: the golden images are EURUSD, the fixtures on disk are DXY (`cv-*`) |

---

## §12 · WHAT IS PROVEN vs WHAT IS NOT

**Proven:**
- the 7-variable contract, `grep -oE 'e2_injected_[a-z_]+' plutus-vision-lqz/e2-render.pine | sort -u`
- `e2_injected_refusal` is the OFF switch, present in the source by inspection
- the derivation rule table and shape vocabulary are the operator's verbatim rulings, canon cards
- EW-B1's gates are on disk and proven 15/15 (`gates/e1/proofs/gateproof.txt`)

**Not proven:**
- **`EW-B2 has no gate scripts.** `ls gates/ewe/gates/` returns nothing. Every gate named in
  §6 and §8 owes a script **and** a negative fixture, proven with a harness the way EW-B1's 15 were.
- Nothing about Engine 2 has rendered. No PNG of this engine exists.

**Blocked on:**
- `EW-B1 gate_12.sh` exit 0 — `E0` will not pass until then
- `D5` — the EURUSD Jul 6–10 fixture, without which `E9` cannot run

**Next action:** build `gate_E0`…`gate_E12` + their negative fixtures and prove them, then wait
on `gate_12.sh`.
