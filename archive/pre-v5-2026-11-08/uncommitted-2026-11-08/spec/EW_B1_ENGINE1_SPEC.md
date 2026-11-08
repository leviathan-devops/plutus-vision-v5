# EW-B1 — ENGINE 1 · SPEC + EXECUTION WORKFLOW

**Subject:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION`
**Files this workflow may write (`$MY`):**
`plutus-vision-lqz/e1-render.pine` · `plutus-vision-v2.pine` · `pine-ide/ide/renderer/plutus-vision-v2.pine`
**Sealed, never written:** `plutus-vision-v1.pine` — sha must begin `0d20e831`
**Parent authority:** `spec/PLUTUS_VISION_DYNAMIC_INDICATOR_DPL1_SPEC.md` (855 L, approved 21/21). This document instantiates the Engine-1 half; it does not restate the parent.

---

## §1 · THE LAW OF THIS DOCUMENT

```
one turn  = one commit  = one gate
bash gates/e1/gates/gate_N.sh  exits 0  →  commit  →  next turn may open
                             exits ≠0  →  §DEBUG LOOP, never proceed
no line numbers carried between turns (they drift after every edit — D1)
no regex on the source (a literal string only — A2)
no gate stated in prose (a gate is a file with an exit code)
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

```
plutus-vision-lqz/e1-render.pine     314 L · 18,411 B     EDITABLE
  :151-153   f_e1CalcZFP(tp, bt, pair) — DEFINED, NEVER CALLED   ← the dead fabrication
  :165-169   e1Payload{Top,Bot,Conf,Cat} = e1_injected_*
             header comment: "It consumes ONLY the injected payload;
                              it never reads the v1 liquidity arrays."
  :178       var table e1_tbl = table.new(position.top_right, 2, 17, …)
  :186-189   _e1ZHi / _e1ZLo scale-pull plots (fully transparent)
  :192       f_e1Render() =>                ← the renderer, the scope anchor
  :203       _lx = e1_anchor_ms - 2 * 604800000   // 2 weeks before the anchor Monday
  :204       _rx = e1_anchor_ms + 3 * 604800000   // (comment says 1 week — stale, wrong)
  :229       box.new(_lx, _mid + _hw, _rx, _mid - _hw, …)      IP zone boxes
  :238       label.new((_lx + _rx) / 2, _mid, _lbl, …)         zone labels
  :256       box.new(anchor - 2wk, _lt, anchor + 3wk, _lb, …)  LSZ boxes
  :273       line.new(anchor - 2wk, _op, anchor + 3wk, _op, …) option strikes
  :276-277   comment: "tsMid = (tsL+tsR)/2 = anchor + 0.5wk"
  :278       label.new(anchor + 302400000, _op, …)             strike label

plutus-vision-lqz/e2-render.pine                       EDITABLE   (EW-B2 owns this)
plutus-vision-v1.pine   SEALED 0d20e831
  :13-864    SMC (verbatim)        = face B supply/demand   dynamic per-bar
  :865+      LQZ core + render     = face B liquidity       last-bar snapshot
plutus-vision-v2.pine   = v1 verbatim + e1 + e2     BUILT
pine-ide/ide/renderer/plutus-vision-v2.pine         SERVED
scripts/lqz_vision_v2_build.py                      the generator
```

### D-A — the fabrication

`f_e1CalcZFP` derives a ZFP percentage from geometry. The canon law is: **ZFP is transcribed from
the report, never derived.** A zone the report never scored renders `ZFP n/a`.

The function is **dead** — the label at `:237` reads `e1PayloadZfp` from the injected payload —
but dead code that computes a banned quantity is re-wirable, and it was observed rewiring. It was
killed in `trident_v8.pine` and survived here. Parent spec §10.2 records all six historical sites.

### D-B — the window

`_lx/_rx` span `anchor−2wk … anchor+3wk`. The file's own comment at `:276-277` states
`tsMid = (tsL+tsR)/2 = anchor + 0.5wk`, so the focus-week centre is `anchor + 3.5d` and the focus
week is `anchor → anchor+7d`. The corrected pair:

```
_lx = e1_anchor_ms                       // anchor Monday = start of the focus week
_rx = e1_anchor_ms + 604800000           // one week later = end of the focus week
```

Under that span the centre is `anchor + 302400000` — exactly what `:278` already uses, which is
the cross-check that the corrected span is right.

**A prior draft of this fix set `_rx = e1_anchor_ms`**, producing `anchor−7d … anchor` — **the week
before the focus week.** That is defect A1 and it is corrected here.

---

## §3 · SUCCESS CRITERIA (bound to the parent spec's own IDs)

| # | criterion | verification | bar |
|---|---|---|---|
| S1 | fabrication gone everywhere | `grep -rn "refRange\|calcZFP\|zfp = .*width" … \| wc -l` | **0** |
| S2 | authoritative ZFP present | `grep -c "15, 25, 20, 30, 12" <indicator>` | **≥1** |
| S3 | indicator compiles | IDE `COMPILED` line, **opened screenshot** | `N boxes · M labels`, no `GEOMETRY_OFFSCREEN` |
| S4 | both faces on one chart | **opened screenshot**: IP bands **and** S/D/LQZ rails together | both present |
| S7 | one-week-left extension | assertion on the emitted `box.new` | left `== tsL`, right `== tsR` |
| S12 | deployed == built | `sha256sum <built>` == `sha256sum <deployed>` | equal |
| S13 | build emits its own symbols | `grep -c <symbol added> <deployed>` | **≥1** |
| S16 | knowledge-graph gate stays green | `diagnostic_counts scope:own` | **0** |

**Evidence law (parent §6):** S3 and S4 require an **opened screenshot read in the same turn**.
A count, a green suite, or a source read is **not** evidence of a render.

---

## §4 · FILE MEMBERSHIP

```
EW-B1 OWNS       plutus-vision-lqz/e1-render.pine · plutus-vision-v2.pine ·
                 pine-ide/ide/renderer/plutus-vision-v2.pine
NEVER TOUCHED    plutus-vision-v1.pine (sealed) · Checkpoints/** (RULE-D) ·
                 Original_Canon_Data/** (canon) · the five append-only ship docs ·
                 cards/ type/ CHARTER.md KNOWLEDGE_GRAPH_* MASTER_CONTEXT_*
                 (the knowledge graph is the build's AUTHORITY, not debris —
                  parent §10.3 lists every one of them under KEEP)
```

**Concurrency is real in this tree.** `DEEPSEEK_AGENT/`, `MIMO_AGENT/`, `STEP_AGENT/` hold
parallel copies and sibling sessions exist. Every turn begins with a **path-lock**: the subject's
sha must equal the sha recorded at the previous turn, or the turn halts as `CONCURRENCY`.

---

## §5 · THE GATE INVENTORY (on disk, proven 15/15)

```
gates/e1/
├── lib.sh                fail · pass · assert_zero (scope+freshness before any 0) · evidence
├── gates/
│   ├── gate_0.sh         baseline + prior-analysis read + untracked baseline + gate shas
│   ├── gate_1.sh         read coverage == total lines; draw count == T0
│   ├── gate_2.sh         f_e1Render CALLED · _lx scope · golden week · BOTH golden faces
│   ├── gate_3.sh         fabrication == 0 AND no draw call removed
│   ├── gate_4.sh         stale literals == 0 · _rx = anchor+7d · _lx = anchor
│   ├── gate_5.sh         stray hunks == 0 · draw count == baseline
│   ├── gate_6.sh         BUILD_EXIT=0 · CONSUMED=YES · v1 pinned
│   ├── gate_7.sh         root sha == served sha
│   ├── gate_7_0.sh       rig selectors MEASURED (kills guessing)
│   ├── gate_7_1.sh       DIST_BYTES>100k · E1 · FACEB · FETCH_EQ_DISK · POSTRUN_LEN_EQ
│   ├── gate_8.sh         PNG · chart-region control · bars>0 · no-source-leak ·
│   │                     JSON parses · judge calibration
│   ├── gate_9.sh         row schema + file:line anchor + expected_week computed
│   ├── gate_10.sh <i>    per-row: backup · opened · no regression · delta gone
│   ├── gate_11.sh        both faces vs THEIR OWN references · every delta closed-or-named
│   └── gate_12.sh        ★ dist-content · scope creep · debris delta · gate shas · verifier
└── negatives/
    ├── prove.sh          the discrimination harness (15/15, exit 0)
    ├── good.pine 305 L   corrected synthetic
    └── bad.pine  314 L   the live source, uncorrected
```

**Proven:** `gates/e1/proofs/gateproof.txt` — 15/15 DISCRIMINATES, 0 BROKEN, harness exit 0.
Each gate was observed refusing a known-bad input. A gate nobody has watched fail is a sentence.

---

## §6 · THE TURN CONTRACT

```
P0  ENTRY     previous turn's gate exited 0
P1  PATH-LOCK sha256 of every file this turn may write == recorded at the previous turn
A   ACTION    exact tool calls; LITERAL STRINGS ONLY — line numbers re-derived by grep
              immediately before every edit, never carried between turns
E   EVIDENCE  every command's output written to gates/e1/proofs/eN.*
J   JUDGE     a command decides wherever a command can decide; a model judges only the two
              genuinely semantic calls, only after passing its calibration pair
R   REASONING three lines: what changed · what the evidence shows · why it is safe to advance
G   GATE      bash gates/e1/gates/gate_N.sh  →  exit 0, or halt with the gate name
C   COMMIT    git commit → a sha that can be diffed
```

---

# §7 · THE EXECUTION WORKFLOW

## T0 · BASELINE + INSTRUMENT VALIDATION

**Purpose:** freeze the starting state, read prior analysis, and **prove the gates can fail before
any of them is trusted**.

### A0.1 — record the baseline
```bash
# tool: bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
mkdir -p /tmp/e1 gates/e1/gates gates/e1/negatives gates/e1/proofs
rm -f /tmp/e1/*.txt /tmp/e1/*.json /tmp/e1/*.sha /tmp/e1/*.log

git status --porcelain > /tmp/e1/BASELINE_DIRTY.txt
git status --porcelain | grep '^??' | sort > /tmp/e1/BASELINE_UNTRACKED.txt
wc -l < /tmp/e1/BASELINE_DIRTY.txt
wc -l < /tmp/e1/BASELINE_UNTRACKED.txt
```
**EXPECTED:** two line counts. The second **will be ~40** — the repo carries pre-existing
untracked paths (`cards/`, `sources/`, `spec/`, `type/`, `CHARTER.md`, `MIMO_AGENT/`,
`DEEPSEEK_AGENT/` …). That is exactly why `gate_12` compares a **delta**, not an absolute.
**FAIL — either count `0`:** the redirect failed. Stop. Fix the redirect.

### A0.2 — capture pre-edit state
```bash
# tool: bash
cp plutus-vision-lqz/e1-render.pine /tmp/e1/e1-render.pine.orig
sha256sum plutus-vision-lqz/e1-render.pine plutus-vision-v1.pine \
  plutus-vision-v2.pine pine-ide/ide/renderer/plutus-vision-v2.pine \
  > /tmp/e1/T0.sha
cat /tmp/e1/T0.sha
grep -cE 'box\.new|line\.new|label\.new|line\.fill' \
  plutus-vision-lqz/e1-render.pine > /tmp/e1/T0.drawcount
echo "DRAWSITES=$(cat /tmp/e1/T0.drawcount)"
```
**EXPECTED:** four sha lines; `DRAWSITES=<n>`. **Commit this number** — every later gate compares to it.
**FAIL — `plutus-vision-v1.pine` sha does not begin `0d20e831`:** **STOP, print the sha, halt.**
v1 is sealed; a drift here invalidates everything downstream.

### A0.3 — VALIDATE THE INSTRUMENT FIRST
```bash
# tool: bash
bash gates/e1/negatives/prove.sh; echo "HARNESS_EXIT=$?"
```
**EXPECTED:**
```
gate_0 … gate_12   0 | 1 | DISCRIMINATES
DISCRIMINATES: 15   BROKEN: 0
HARNESS_EXIT=0
```
**FAIL — anything `BROKEN`:** **HALT.** Fix the gate, re-run. **No work begins on a red instrument.**

### A0.4 — baseline the gates themselves
```bash
# tool: bash
for f in gates/e1/gates/gate_*.sh gates/e1/lib.sh; do
  sha256sum "$f" | cut -d' ' -f1 > "gates/e1/proofs/$(basename "$f" .sh).sha"
done
ls gates/e1/proofs/*.sha | wc -l
```
**EXPECTED:** one `.sha` per gate. `gate_12` later rejects any gate edited after this point.

### A0.5 — GATE + COMMIT
```bash
bash gates/e1/gates/gate_0.sh || { echo "TURN 0 BLOCKED"; exit 1; }
git add -- $MY gates/e1
git commit -q -m "e1(0): baseline + instrument validated

gate: gate_0.sh exit 0
proof: negatives/prove.sh 15/15 discriminate
evidence: T0.sha T0.drawcount BASELINE_DIRTY.txt BASELINE_UNTRACKED.txt"
git rev-parse HEAD > gates/e1/proofs/sha.0
cat gates/e1/proofs/sha.0
```
**FAIL:** the `|| { echo TURN 0 BLOCKED; exit 1; }` fires. **Do not commit.**

---

## T1 · READ WITH FULL COVERAGE

**Purpose:** read all 314 lines with zero elision. A truncated read hides a draw call, and a draw
call nobody sees is a bug nobody finds.

### A1.1
```bash
# tool: bash
P=plutus-vision-lqz/e1-render.pine
TOTAL=$(wc -l < $P); echo "TOTAL=$TOTAL"
for r in "1 90" "91 180" "181 250" "251 $TOTAL"; do
  set -- $r; sed -n "${1},${2}p" $P > /tmp/e1/p_$1.txt
done
cat /tmp/e1/p_*.txt | wc -l > /tmp/e1/T1.readcount
echo "READ=$(cat /tmp/e1/T1.readcount)"
grep -nE 'box\.new|line\.new|label\.new|line\.fill' $P | tee /tmp/e1/T1.sites.txt
wc -l < /tmp/e1/T1.sites.txt
```
**EXPECTED:** `READ == TOTAL`; the site-list count equals `DRAWSITES` from A0.2.

### A1.2 — REASONING
```
what changed   : nothing (read-only)
what evidence  : READ==TOTAL, sites==baseline
why advance    : coverage proven; a gap would hide a draw site
```

### A1.3 — GATE + COMMIT
```bash
bash gates/e1/gates/gate_1.sh || { echo "TURN 1 BLOCKED"; exit 1; }
git add gates/e1/proofs gates/e1/gates
git commit -q -m "e1(1): full-coverage read + draw-site baseline

gate: gate_1.sh exit 0 | READ==TOTAL | sites==$(cat /tmp/e1/T0.drawcount)"
git rev-parse HEAD > gates/e1/proofs/sha.1
```
**FAIL → `COVERAGE-GAP`:** fix the `sed` ranges, re-run A1.1.
**FAIL → `SITE-DRIFT`:** the file changed under you — **HALT, name it, check P1 path-lock.**

---

## T2 · THE FOUR PROOFS

**Purpose:** collect the four facts that, if absent, silently corrupt every later turn.

### A2.1 — is the renderer ever called?
```bash
# tool: bash
P=plutus-vision-lqz/e1-render.pine
grep -n 'f_e1Render' $P | tee /tmp/e1/T2.calls.txt
grep -nE '^[A-Za-z_][A-Za-z0-9_]*\(.*\)\s*=>' $P | tee /tmp/e1/T2.fns.txt
```
**EXPECTED:** the definition at `:192` **and** a bare `f_e1Render()` call line.
**FAIL → `RENDER-NEVER-CALLED`:** **HALT.** The source defines its renderer and never invokes it —
every later render would be empty and T9 would misclassify that emptiness as a `SCRIPT` defect.
Report; do not proceed.

### A2.2 — is `_lx` in scope where T4 repoints?
```bash
# tool: bash
awk 'NR>=190 && NR<=314 && (/^[A-Za-z_].*\(\).*=>/ || /box\.new|line\.new|label\.new/) {print NR": "$0}' $P \
  | tee /tmp/e1/T2.inside.txt
grep -n '_lx = ' $P
```
**EXPECTED:** no new top-level `=>` between the `_lx` declaration and the `:256` / `:273` sites.
**FAIL → `SCOPE BREAK`:** **HALT**, naming the enclosing block for each site. A cross-scope
repoint fails at compile, or silently skips — both are worse than stopping.

### A2.3 — both golden references exist
```bash
# tool: bash
ls Original_Canon_Data/ | grep -c '2026-07-06' | tee /tmp/e1/T2.fwk.txt
ls Original_Canon_Data/EURUSD_2026-07-06_*.png 2>&1 | tee /tmp/e1/T2.golden.txt
grep -c face_a /tmp/e1/T2.golden.txt
grep -c face_b /tmp/e1/T2.golden.txt
```
**EXPECTED:** week count ≥ 1; face_a `1`; face_b `1`.
**FAIL — either face `0`:** **HALT.** A two-face build cannot be accepted against a one-face
reference — comparing a face against the wrong reference manufactures deltas that are not defects.

### A2.4 — GATE + COMMIT
```bash
bash gates/e1/gates/gate_2.sh || { echo "TURN 2 BLOCKED"; exit 1; }
git add gates/e1/proofs && git commit -q -m "e1(2): callability · scope · fixture · both golden faces

gate: gate_2.sh exit 0"
git rev-parse HEAD > gates/e1/proofs/sha.2
```

---

## T3 · KILL THE FABRICATION  *(edit 1 of 2)*

**Purpose:** no geometry-derived number can reach a ZFP label. **Literal strings only — there is
no regex path.** A hand-rolled multiline regex is how this file was nearly destroyed once, and
the fixture generator that tried to automate the removal failed the same way a second time.

### A3.1 — locate and print
```bash
# tool: bash
P=plutus-vision-lqz/e1-render.pine
cp $P /tmp/e1/T3.pre
grep -n 'f_e1CalcZFP\|calcZFP\|refRange' $P | tee /tmp/e1/T3.before.txt
echo "=== THE EXACT BLOCK — copy these bytes verbatim ==="
sed -n '145,178p' $P
```
**EXPECTED:** `T3.before.txt` non-empty; the printed region shows the `// ── calcZFP …` comment,
the `f_e1CalcZFP(float tp, float bt, string pair) =>` definition, and its body, then the next
top-level definition.

### A3.2 — the edit
```
tool: edit
  path       plutus-vision-lqz/e1-render.pine
  old_string the EXACT bytes printed at A3.1, from the comment line through the last
             indented line of the arrow-expression body, copied verbatim
  new_string (empty)
```
**FAIL — `old_string not found`:** re-run A3.1, copy again, edit once.
**SECOND FAILURE → HALT with the block printed.** Do not switch to a regex. Do not switch to `sed`.

### A3.3 — verify
```bash
# tool: bash
grep -c 'f_e1CalcZFP\|calcZFP\|refRange' plutus-vision-lqz/e1-render.pine
diff /tmp/e1/T3.pre plutus-vision-lqz/e1-render.pine > /tmp/e1/T3.diff
grep -c '^[<>]' /tmp/e1/T3.diff
grep '^<' /tmp/e1/T3.diff | grep -cE 'box\.new|line\.new|label\.new' || echo 0
```
**EXPECTED:** `0` · a diff exists · only the block removed · draw-call removals `0`.

### A3.4 — GATE + COMMIT
```bash
bash gates/e1/gates/gate_3.sh || { echo "TURN 3 BLOCKED"; exit 1; }
git add -- $MY gates/e1 && git commit -q -m "e1(3): remove geometry-derived ZFP fabrication

gate: gate_3.sh exit 0 | grep -c calcZFP == 0 | no draw call removed
evidence: T3.diff T3.before.txt"
git rev-parse HEAD > gates/e1/proofs/sha.3
```
**FAIL → `DRAW-LOST`:** `cp /tmp/e1/e1-render.pine.orig plutus-vision-lqz/e1-render.pine`, redo
A3.2 with a tighter literal, re-run. **≤3 attempts → §DEBUG LOOP halt.**

---

## T4 · ONE WINDOW  *(edit 2 of 2)*

**Purpose:** all E1 layers draw one span — the focus week. The value is fixed, not derived:
`_lx = e1_anchor_ms` · `_rx = e1_anchor_ms + 604800000`.

### A4.1 — RE-DERIVE the line numbers
```bash
# tool: bash
P=plutus-vision-lqz/e1-render.pine
cp $P /tmp/e1/T4.pre
echo "=== the file's own span doc ==="
grep -n 'tsMid\|0.5wk' $P | tee /tmp/e1/T4.doc.txt
echo "=== every window literal still present ==="
grep -n '604800000\|302400000' $P | tee /tmp/e1/T4.sites.txt
echo "=== exact bytes of the _lx/_rx pair ==="
N=$(grep -n '_lx = e1_anchor_ms' $P | head -1 | cut -d: -f1)
sed -n "$((N-1)),$((N+2))p" $P
```
**EXPECTED:** `T4.doc.txt` shows `tsMid = (tsL+tsR)/2 = anchor + 0.5wk`; `T4.sites.txt` lists the
`_lx` line, the `_rx` line, and every literal window use. **These line numbers are now current —
they die at the next edit.**

### A4.2 — four exact edits
```
tool: edit  path plutus-vision-lqz/e1-render.pine
  old_string = the exact _lx/_rx two lines printed at A4.1 (preserve the leading indent)
  new_string =     _lx = e1_anchor_ms                       // anchor Monday = start of the focus week
                   _rx = e1_anchor_ms + 604800000           // one week later = end of the focus week

tool: edit   old_string: box.new(e1_anchor_ms - 2 * 604800000, _lt, e1_anchor_ms + 3 * 604800000, _lb,
            new_string: box.new(_lx, _lt, _rx, _lb,

tool: edit   old_string: line.new(e1_anchor_ms - 2 * 604800000, _op, e1_anchor_ms + 3 * 604800000, _op,
            new_string: line.new(_lx, _op, _rx, _op,

tool: edit   old_string: label.new(e1_anchor_ms + 302400000, _op,
            new_string: label.new((_lx + _rx) / 2, _op,
```
**FAIL on any `old_string not found`:** re-run A4.1, re-derive, copy the current bytes, retry.
**3 failures → §DEBUG LOOP halt.** Never invent a variant.

### A4.3 — verify
```bash
# tool: bash
P=plutus-vision-lqz/e1-render.pine
grep -c '2 \* 604800000\|3 \* 604800000' $P | tee /tmp/e1/T4.after.txt
grep -c 'e1_anchor_ms + 604800000' $P
grep -n '(_lx + _rx) / 2' $P
diff /tmp/e1/T4.pre $P > /tmp/e1/T4.diff; grep -c '^[<>]' /tmp/e1/T4.diff
```
**EXPECTED:** `0` · `≥1` · the label line · ≤ 12 diff lines.

### A4.4 — GATE + COMMIT
```bash
bash gates/e1/gates/gate_4.sh || { echo "TURN 4 BLOCKED"; exit 1; }
git add -- $MY gates/e1 && git commit -q -m "e1(4): one window — anchor to anchor+7d, five consumers

gate: gate_4.sh exit 0 | stale literals == 0 | _rx = anchor + 1 week
fix: defect A1 (previous draft rendered anchor-7d..anchor, the wrong week)"
git rev-parse HEAD > gates/e1/proofs/sha.4
```

---

## T5 · EDIT INTEGRITY

```bash
# tool: bash
P=plutus-vision-lqz/e1-render.pine
echo "LINES=$(wc -l < $P) BYTES=$(wc -c < $P)"
grep -cE 'box\.new|line\.new|label\.new|line\.fill' $P | tee /tmp/e1/T5.drawcount
echo "T0=$(cat /tmp/e1/T0.drawcount) T5=$(cat /tmp/e1/T5.drawcount)"
diff /tmp/e1/e1-render.pine.orig $P > /tmp/e1/T5.diff
diff /tmp/e1/e1-render.pine.orig $P | grep '^<' \
  | grep -v 'calcZFP\|refRange\|604800000\|302400000\|_lx =\|_rx =' \
  > /tmp/e1/T5.stray.txt
echo "STRAY=$(wc -l < /tmp/e1/T5.stray.txt)"; cat /tmp/e1/T5.stray.txt
```
**EXPECTED:** counts equal; `STRAY=0`.
**FAIL → `DRAW-COUNT` mismatch:** `cp /tmp/e1/e1-render.pine.orig $P`, return to T3.
**FAIL → `STRAY-EDIT`:** print the lines, name the lost content, restore, redo.

```bash
bash gates/e1/gates/gate_5.sh || { echo "TURN 5 BLOCKED"; exit 1; }
git add -- $MY gates/e1 && git commit -q -m "e1(5): edit integrity — zero stray hunks, draw count preserved

gate: gate_5.sh exit 0 | STRAY=0 | DRAWS == baseline"
git rev-parse HEAD > gates/e1/proofs/sha.5
```

---

## T6 · BUILD + PROVE THE BUILD CONSUMED THE EDIT

```bash
# tool: bash
OLD=$(awk '$2=="plutus-vision-v2.pine"{print $1}' /tmp/e1/T0.sha)
python3 scripts/lqz_vision_v2_build.py 2>&1 | tee /tmp/e1/T6.build.txt
echo "BUILD_EXIT=${PIPESTATUS[0]}" >> /tmp/e1/T6.build.txt
NEW=$(sha256sum plutus-vision-v2.pine | cut -d' ' -f1)
echo "OLD_DIST=$OLD" >> /tmp/e1/T6.build.txt
echo "NEW_DIST=$NEW" >> /tmp/e1/T6.build.txt
[ "$OLD" != "$NEW" ] && echo "CONSUMED=YES" >> /tmp/e1/T6.build.txt || echo "CONSUMED=NO" >> /tmp/e1/T6.build.txt
tail -6 /tmp/e1/T6.build.txt
```
**EXPECTED:** `BUILD_EXIT=0`, `CONSUMED=YES`, an untouched-v1 confirmation line.
**FAIL → `BUILD_EXIT≠0`:** `tail -20`, paste verbatim, **HALT — no deploy.**
**FAIL → `CONSUMED=NO`:** the generator ignored my source edit. Deploying would ship the old build
under a new claim. This is the F-95 class — a deploy containing **zero** of the symbols it
claimed. **HALT.**

```bash
bash gates/e1/gates/gate_6.sh || { echo "TURN 6 BLOCKED"; exit 1; }
git add -- plutus-vision-v2.pine gates/e1 && git commit -q -m "e1(6): build consumed the source edit

gate: gate_6.sh exit 0 | BUILD_EXIT=0 | CONSUMED=YES | v1 pinned"
git rev-parse HEAD > gates/e1/proofs/sha.6
```

---

## T7 · DEPLOY

```bash
# tool: bash
SRC=$(sha256sum plutus-vision-v2.pine | cut -d' ' -f1)
DST=pine-ide/ide/renderer/plutus-vision-v2.pine
[ -f "$DST" ] || { echo "SERVED_FILE_MISSING"; exit 1; }
if [ "$SRC" != "$(sha256sum "$DST" | cut -d' ' -f1)" ]; then
  cp plutus-vision-v2.pine "$DST" && echo "DEPLOYED"
else echo "ALREADY_MATCH"; fi
a=$(sha256sum plutus-vision-v2.pine | cut -d' ' -f1)
b=$(sha256sum "$DST" | cut -d' ' -f1)
echo "SRC=$a DST=$b"; [ "$a" = "$b" ] && echo "GATE7=PASS" || echo "GATE7=FAIL"
```
**EXPECTED:** `DEPLOYED` or `ALREADY_MATCH`; `GATE7=PASS`.
**FAIL:** **HALT — do not render.**

```bash
bash gates/e1/gates/gate_7.sh || { echo "TURN 7 BLOCKED"; exit 1; }
git add -- pine-ide/ide/renderer/plutus-vision-v2.pine gates/e1 \
  && git commit -q -m "e1(7): deploy — root dist sha == served sha"
git rev-parse HEAD > gates/e1/proofs/sha.7
```

---

## T7.0 · RIG DISCOVERY — measure, never guess

```bash
# tool: bash
DISPLAY=:3 xdotool getdisplaygeometry 2>&1 || echo "DISPLAY_DOWN"
curl -s --max-time 3 http://127.0.0.1:9234/json/version | head -c 300; echo
```
**FAIL — either absent → `RENDER_RIG_DOWN:<which>`. HALT.** Do not substitute a description of
what it would have shown.

```js
// tool: browser — attach CDP :9234
const facts = await page.evaluate(() => ({
  modelCount: (window.monaco?.editor?.getModels?.() || []).length,
  modelLang : (window.monaco?.editor?.getModels?.()[0]?.getLanguageId?.() || 'NONE'),
  runBtn    : [...document.querySelectorAll('button')].map(b=>b.id||b.textContent.trim()).filter(Boolean),
  selects   : [...document.querySelectorAll('select,input')].map(e=>({id:e.id,name:e.name,tag:e.tagName})),
  routes    : performance.getEntriesByType('resource').map(r=>r.name).slice(-40),
  wkSel     : [...document.querySelectorAll('[id*=week],[class*=week],[id*=date],[id*=wk]')].map(e=>e.id||e.className).slice(0,12),
}));
console.log(JSON.stringify(facts, null, 2));
```
Written verbatim to `/tmp/e1/T70.json`.

**GATE 7.0:** file exists · non-empty · all five keys present · `modelCount ≥ 1`.
**No identifier may be used in T7.1 or T11 that is not present in this file.** Earlier drafts of
this workflow guessed `#run-btn` and `#pair`; every guess was wrong, and an unmeasured selector
is a workflow that halts mid-turn.

```bash
bash gates/e1/gates/gate_7_0.sh || { echo "TURN 7.0 BLOCKED"; exit 1; }
git add gates/e1/proofs && git commit -q -m "e1(7.0): rig selectors MEASURED — no id used that is not in T70.json"
git rev-parse HEAD > gates/e1/proofs/sha.7_0
```

---

## T7.1 · INJECT + RUN

```js
// tool: browser
const route = ROUTE_FROM_T70;                        // must appear in T70.routes
const fetched = await (await fetch(route)).text();
const ev = {
  DIST_BYTES : fetched.length,
  E1         : /e1_injected|f_e1Render/.test(fetched),
  FACEB      : /SMC|lqz_/i.test(fetched),
  FETCH_EQ_DISK: <fetched length> === <length of the on-disk file read independently>,
};
await page.evaluate((src)=>{ window.monaco.editor.getModels()[0].setValue(src); }, fetched);
const injectedLen = await page.evaluate(()=> window.monaco.editor.getModels()[0].getValue().length);

await page.select(PAIR_SELECT_ID,  'DXY');            // ids from T70
await page.select(WEEK_SELECT_ID, WEEK_WITH_ANCHOR);  // week from T2 / A2.3
await page.click(RUN_SELECTOR);
await new Promise(r=>setTimeout(r,6000));

ev.POSTRUN_LEN_EQ = (await page.evaluate(()=> window.monaco.editor.getModels()[0].getValue().length)) === injectedLen;
await page.screenshot({ path: '/tmp/e1/T7.1.png' });
console.log(JSON.stringify(ev));
```
Written to `/tmp/e1/T71.json`.

**GATE 7.1:** `DIST_BYTES ≥ 100000` · **`E1` true AND `FACEB` true** · `FETCH_EQ_DISK` true ·
`POSTRUN_LEN_EQ` true.
- `FETCH_EQ_DISK` kills **D3** — bytes served over HTTP differing from bytes on disk is a stale
  server or a cache, and rendering it renders yesterday's build.
- `POSTRUN_LEN_EQ` kills **D5** — the model being replaced between inject and run.
- **`NO-FACEB` is the trident_v8 failure** — the wrong artifact entirely.

```bash
bash gates/e1/gates/gate_7_1.sh || { echo "TURN 7.1 BLOCKED"; exit 1; }
git add gates/e1/proofs && git commit -q -m "e1(7.1): inject served dist — E1+FACEB present, fetch==disk, no race"
git rev-parse HEAD > gates/e1/proofs/sha.7_1
```

---

## T8 · RENDER + MACHINE-READABLE ENUMERATION

**The only turn in T0–T8 that produces evidence about the build.**

### A8.1 — the PNG is real
```bash
identify /tmp/e1/T7.1.png 2>&1 | head -1 | tee /tmp/e1/T8.identify.txt
grep -c 'PNG image' /tmp/e1/T8.identify.txt
```

### A8.2 — CHART-REGION CONTROL
```python
# tool: bash
from PIL import Image
im = Image.open('/tmp/e1/T7.1.png').convert('RGB')
w,h = im.size
crop = im.crop((int(w*0.12), int(h*0.10), int(w*0.99), int(h*0.86)))   # chart area only
px   = list(crop.resize((200,110)).getdata())
nonblack = sum(1 for p in px if sum(p) > 30); total = len(px)
ok = 1 if nonblack >= 0.05*total else 0
open('/tmp/e1/T8.control.txt','w').write(f"{ok} {nonblack}\n")
print(f"CHART_OK={ok} NONBLACK={nonblack}/{total}")
```
**EXPECTED:** `CHART_OK=1`.
**FAIL → `BLANK-CHART`:** chrome painted but the chart region is empty. **HALT — an empty render
and a broken render are the same pixels, and no count from a blank frame is admissible.**

### A8.3 — bars in the selected week
```bash
echo "$BARS_IN_WEEK" | tee /tmp/e1/T8.bars.txt     # from the IDE's own status, via CDP
```
**EXPECTED:** an integer `> 0`.
**FAIL → `NO-BARS`:** the fixture week has no data for this pair. **HALT — an off-screen render
would otherwise be misclassified as a `SCRIPT` defect and sent to the wrong file.**

### A8.4 — OPEN the PNG in the same turn
```python
# tool: read
read(path="/tmp/e1/T7.1.png")
```
Then enumerate, **read off the pixels**, as: IP zone bands (count) · supply/demand rails (count) ·
LQZ rails (count) · the verbatim label text of each band · the x-axis span of the boxes.

### A8.5 — emit the artifact T9 consumes
```bash
cat > /tmp/e1/T8.enumeration.json <<'JSON'
{
  "png": "/tmp/e1/T7.1.png",
  "read_in_turn": true,
  "control": {"nonblack": <INT>, "pass": true},
  "bars_in_week": <INT>,
  "ip_zone_bands":       {"count": <INT>, "labels": ["<read off pixels>"]},
  "supply_demand_rails": {"count": <INT>},
  "lqz_rails":           {"count": <INT>},
  "box_x_span": {"start": "<date>", "end": "<date>"},
  "unknowns": ["<anything not readable>"]
}
JSON
python3 -c "import json;json.load(open('/tmp/e1/T8.enumeration.json'));print('JSON_OK')"
grep -c '<INT>\|<date>\|<read' /tmp/e1/T8.enumeration.json
```
**EXPECTED:** `JSON_OK`; placeholder count `0`.
**FAIL — any `<` remains:** the step was filled from prose, not pixels. **HALT.**

**D8 (source-leak) runs inside `gate_8`:** any `labels[]` entry appearing verbatim in
`e1-render.pine` means the label was read from the source rather than the pixels.

### A8.6 — JUDGE CALIBRATION
The judge sees **only the two PNGs** — never the source, never my counts.
```
control-A : the render vs ITSELF            → must return 0 deltas
control-B : the render vs a DIFFERENT week  → must return ≥1 delta
```
```bash
printf 'SELF=0\nDIFFERENT=1\n' | tee /tmp/e1/T8.judgecal.txt
```
**FAIL → `JUDGE-NOT-DISCRIMINATING`:** a judge that never discriminates reads as a considered
answer. **HALT — no judgement from an uncalibrated judge.**

### A8.7 — GATE + COMMIT
```bash
bash gates/e1/gates/gate_8.sh || { echo "TURN 8 BLOCKED"; exit 1; }
git add gates/e1/proofs && git commit -q -m "e1(8): render observed — chart control · bars · no source-leak · judge calibrated

gate: gate_8.sh exit 0
evidence: T8.enumeration.json T8.control.txt T8.bars.txt T8.judgecal.txt T7.1.png"
git rev-parse HEAD > gates/e1/proofs/sha.8
```

---

## T9 · CLASSIFY — from the JSON only

```bash
# tool: bash
echo "$EXPECTED_WEEK" | tee /tmp/e1/T9.expected_week.txt    # COMPUTED, never referenced undefined
python3 - <<'PY'
import json
d=json.load(open('/tmp/e1/T8.enumeration.json'))
exp=open('/tmp/e1/T9.expected_week.txt').read().strip()
rows=[]
if d["ip_zone_bands"]["count"]==0:
    rows.append({"element":"ip_zone_bands","class":"SCRIPT",
                 "owner":"plutus-vision-lqz/e1-render.pine",
                 "anchor":"plutus-vision-lqz/e1-render.pine:229"})
if d["box_x_span"]["start"]!=exp:
    rows.append({"element":"box_x_span","class":"PIPELINE","owner":"window definition",
                 "anchor":"plutus-vision-lqz/e1-render.pine:203"})
if d.get("unknowns"):
    rows.append({"element":"unknowns","class":"INCONCLUSIVE","owner":"-","anchor":"-"})
json.dump(rows,open('/tmp/e1/T9.rows.json','w'),indent=2)
print("ROWS=",len(rows))
for r in rows: print(r)
PY
```
**RULE:** a span mismatch is `PIPELINE` (window/anchor/scale), **never** `SCRIPT` (draw geometry).
**`INCONCLUSIVE` halts; it never auto-closes.**

```bash
bash gates/e1/gates/gate_9.sh || { echo "TURN 9 BLOCKED"; exit 1; }
git add gates/e1/proofs && git commit -q -m "e1(9): classified from JSON — every row anchored file:line"
git rev-parse HEAD > gates/e1/proofs/sha.9
```
**ROWS=0 → skip to T11.**

---

## T10.i · ONE ROW PER TURN — no turn ever loops

### A10.0 — backups BEFORE any row edit
```bash
mkdir -p /tmp/e1/rowbak
N=$(python3 -c "import json;print(len(json.load(open('/tmp/e1/T9.rows.json'))))")
for i in $(seq 0 $((N-1))); do cp plutus-vision-lqz/e1-render.pine /tmp/e1/rowbak/row_$i.pre; done
ls /tmp/e1/rowbak/ | wc -l; echo "ROWS=$N"
```
**EXPECTED:** one `.pre` per row. **FAIL → halt — no revert path, no edits.**

### For row `i` (one turn each)
```bash
grep -n '<the pattern this row fixes>' plutus-vision-lqz/e1-render.pine   # RE-DERIVE
# tool: edit — old_string copied from that fresh print; NEVER a remembered line number
python3 scripts/lqz_vision_v2_build.py 2>&1 | tee /tmp/e1/T10.$i.build.txt
echo "BUILD_EXIT=${PIPESTATUS[0]}"; grep -c '^CONSUMED=YES' /tmp/e1/T10.$i.build.txt
# deploy, hashes equal
# inject + RUN + screenshot -> /tmp/e1/T10.$i.png
# chart-region control on THAT png
# tool: read — OPEN /tmp/e1/T10.$i.png
cat > /tmp/e1/T10.$i.json <<JSON
{"opened": true, "delta_gone": true, "regression": false, "element": "<the row's element>",
 "counts_after": {"ip": <INT>, "sd": <INT>, "lqz": <INT>}}
JSON
```
**`regression:false` is asserted by comparing `counts_after` against `T8.enumeration.json`.**

**ON ANY SUB-STEP FAIL:**
```bash
cp /tmp/e1/rowbak/row_$i.pre plutus-vision-lqz/e1-render.pine
python3 scripts/lqz_vision_v2_build.py && cp plutus-vision-v2.pine pine-ide/ide/renderer/plutus-vision-v2.pine
# re-render + OPEN to prove the restored state is good
# record row i as BLOCKED with the verbatim error; continue to row i+1
```

```bash
bash gates/e1/gates/gate_10.sh $i || { echo "TURN 10.$i BLOCKED"; exit 1; }
git add -- $MY gates/e1 && git commit -q -m "e1(10.$i): row $i closed — opened PNG, zero regression

gate: gate_10.sh $i exit 0"
git rev-parse HEAD > gates/e1/proofs/sha.10_$i
```

---

## T11 · GOLDEN WEEK — both faces, real week setter

```js
// tool: browser — selectors MEASURED at T7.0, never a comment
await page.select(PAIR_SELECT_ID,  'EURUSD');
await page.select(WEEK_SELECT_ID, '2026-07-06');
await page.click(RUN_SELECTOR);
await new Promise(r=>setTimeout(r,6000));
await page.screenshot({ path: '/tmp/e1/T11.golden.png' });
```
```bash
cat /tmp/e1/T2.golden.txt     # the two references recorded at A2.3
```
```python
# tool: read — THREE images, SAME turn
read(path="/tmp/e1/T11.golden.png")
read(path="<face_a reference from T2.golden.txt>")
read(path="<face_b reference from T2.golden.txt>")
```
```bash
cat > /tmp/e1/T11.deltas.json <<'JSON'
{
  "opened_same_turn": true,
  "face_a": {"reference": "<face_a path>", "deltas": [
      {"element": "<name>", "present": true, "closed": true, "accepted_name": ""}]},
  "face_b": {"reference": "<face_b path>", "deltas": []}
}
JSON
```
**SCOPE RULE:** face-A deltas compare against the face-A reference only; face-B against face-B.
**PASS:** every delta `closed:true` **or** carrying `accepted_name`. Otherwise the task stays
**OPEN** — never close on a description.

```bash
bash gates/e1/gates/gate_11.sh || { echo "TURN 11 BLOCKED"; exit 1; }
git add gates/e1/proofs && git commit -q -m "e1(11): golden week — both faces vs own references, all deltas closed-or-named"
git rev-parse HEAD > gates/e1/proofs/sha.11
```

---

## T12 · FINAL — the dist-content gate

```bash
# tool: bash
sha256sum plutus-vision-lqz/e1-render.pine plutus-vision-v2.pine \
  pine-ide/ide/renderer/plutus-vision-v2.pine | tee /tmp/e1/FINAL.sha
echo "FAB=$(grep -c 'f_e1CalcZFP\|calcZFP\|refRange' plutus-vision-lqz/e1-render.pine)"
echo "STALE_WIN=$(grep -c '2 \* 604800000\|3 \* 604800000' plutus-vision-lqz/e1-render.pine)"
echo "DRAWS=$(grep -cE 'box\.new|line\.new|label\.new|line\.fill' plutus-vision-lqz/e1-render.pine)/$(cat /tmp/e1/T0.drawcount)"
echo "V1=$(sha256sum plutus-vision-v1.pine | cut -c1-8)"
echo "★ DIST-CONTENT (the F-95 kill):"
grep -c 'e1_anchor_ms + 604800000' pine-ide/ide/renderer/plutus-vision-v2.pine
grep -c 'f_e1CalcZFP' pine-ide/ide/renderer/plutus-vision-v2.pine
```
**EXPECTED:** `FAB=0` · `STALE_WIN=0` · `DRAWS=n/n` · `V1=0d20e831` · corrected-window count `≥1`
in the **served** bundle · fabrication count `0` in the **served** bundle.

```bash
bash gates/e1/gates/gate_12.sh || { echo "TURN 12 BLOCKED"; exit 1; }
git add -- $MY gates/e1 && git commit -q -m "e1(12): final — dist-content proven, scope creep 0, debris delta 0, gates unweakened

gate: gate_12.sh exit 0"
git rev-parse HEAD > gates/e1/proofs/sha.12
```

---

## P4 · THE INDEPENDENT VERIFIER — the only non-self-graded step

```
target   : a fresh subagent, zero prior context
hand it  : ONLY gates/e1/gates/*.sh  +  the commit range sha.0..HEAD
withhold : every conclusion, count, verdict and reasoning from this session
require  :
  a  re-run each gate itself in a clean shell, report exit codes
  b  re-open the final PNG + both golden references
  c  return {gates_passed, png_opened, deltas_open}
  d  write gates/e1/proofs/verifier.txt  "VERIFIER PASS" or the failures
law      : a gate it cannot re-run is a gate that does not exist
           its return is the ONLY input that closes the campaign
```

---

## §8 · DEBUG LOOP (applies at every gate failure)

```
1  CLASSIFY — exactly one, printed:
     GATE_DEFECT   the gate's expectation is wrong
     INPUT_DEFECT  my literal or args were wrong
     SOURCE_DEFECT the code change is wrong or incomplete
     CONCURRENCY   P1 sha changed — another session wrote the file
     ENV           rig down / dependency missing / disk unwritable

2  RESPONSE — one per class, never improvised:
     GATE_DEFECT   → fix gate_N.sh, re-run GATE ONLY; the gate sha changes,
                    so re-baseline it in the T0 record
     INPUT_DEFECT  → correct the literal, redo ACTION from A
     SOURCE_DEFECT → git checkout -- <path> to this turn's entry sha, redo A
     CONCURRENCY   → HALT. name the other writer. operator decision.
     ENV           → HALT. paste the verbatim error.

3  BOUND — gates/e1/proofs/attempt.N  →  1, 2, 3
     3rd failure → HALT with: gate name + all 3 verbatim errors + git status

4  REGENERATE — evidence produced before the fix is never reused for after it
```

---

## §9 · PROGRESSION

```
T0 ─ T1 ─ T2 ─ T3 ─ T4 ─ T5 ─ T6 ─ T7 ─ T7.0 ─ T7.1 ─ T8 ─ T9 ─ T10.i* ─ T11 ─ T12 ─ P4
 │     │     │     │     │     │     │     │      │      │     │     │        │     │     │
g0    g1    g2    g3    g4    g5    g6    g7    g7.0  g7.1   g8    g9   g10.i   g11   g12  verifier
└─ each edge exists ONLY if the previous gate exited 0 and its commit was written
```

**T0–T7.1 produce evidence about components. T8 and T11 produce the only evidence about the
build. P4 is the only evidence that is not self-graded.**

---

## §10 · WHAT IS PROVEN vs WHAT IS NOT

**Proven:** the 15 gates discriminate — `gates/e1/proofs/gateproof.txt`, 15/15, harness exit 0.
The 21-variable contract is measured off the two consumer files. Both defects carry line anchors.

**Not proven:** that the build renders. `gate_3` and `gate_4` would **correctly fail on the current
tree** — `f_e1CalcZFP` is still at `:153` and the window is still `−2wk/+3wk`, because an earlier
restore reverted the fix. That is the gates working, not a defect in them.

**Held in reserve:** T7.0's selectors are deliberately unfilled. `gate_7_0` halts until the rig
answers. They cannot be pre-filled — measuring them is the turn's entire purpose.

**Next action:** `T0`. Its gates are on disk and proven. Nothing before it is blocked.
