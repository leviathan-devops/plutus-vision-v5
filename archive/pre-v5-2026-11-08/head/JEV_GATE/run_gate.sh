#!/usr/bin/env bash
# JEV_GATE — the ONLY success gate for the PLUTUS VISION indicator port.  v2: FULL CONTEXT.
# NO person, agent, unit test, exit code, or script decides. JEV decides.
# The judge's payload cap is ~48KB, so the FULL context (the whole spec + the 6 ship docs +
# the graph + the git history + the checkpoints + the WHOLE artifact source) is CHUNKED and
# judged per chunk; the verdict is the AND (any chunk not `act` = REJECT).
#
# USAGE:  bash JEV_GATE/run_gate.sh [ARTIFACT_PATH]
# EXIT:   0 = JEV said YES (every chunk act) — anything else = REJECTED
set -uo pipefail
export JM_JUDGE_URL="${JM_JUDGE_URL:-http://127.0.0.1:8090/v1/systemone}"
ROOT="/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION"
ART="${1:-$ROOT/pine-ide/ide/renderer/plutus-vision-v2.pine}"
WORK="$(mktemp -d /tmp/jev-gate.XXXXXX)"
CTX="$WORK/full_context.txt"
CHUNK_BYTES=38000   # under the ~48KB judge cap, with headroom

# ── ASSEMBLE THE FULL CONTEXT (everything we are building — nothing omitted) ─────────────
{
  echo "################## THE SPEC (PLUTUS_VISION_INDICATOR_PORT_SPEC.md, FULL) ##################"
  cat "$ROOT/PLUTUS_VISION_INDICATOR_PORT_SPEC.md"
  echo; echo "################## THE SHIP DOCS (the 6, latest entries) ##################"
  for d in BUILD_REPORT DEBUG_LOG FAILURE_LOG SPEC_VIOLATION_LOG TESTING_LOG THEATRICALITY_LOG; do
    echo "===== $d.md ====="; tail -80 "$ROOT/$d.md" 2>/dev/null
  done
  echo; echo "################## THE GIT HISTORY (last 40) ##################"
  git -C "$ROOT" log --oneline -40
  echo; echo "################## THE CHECKPOINTS ##################"
  ls "$ROOT/Checkpoints" 2>/dev/null
  echo; echo "################## THE THEATRICALITY LOG (the anti-patterns) ##################"
  cat "$ROOT/THEATRICALITY_LOG.md" 2>/dev/null
  echo; echo "################## THE ARTIFACT UNDER TEST (the FULL source: $ART) ##################"
  cat "$ART"
} > "$CTX"

# ── CHUNK THE FULL CONTEXT ──────────────────────────────────────────────────────────────
python3 - "$CTX" "$WORK" "$CHUNK_BYTES" <<'PY'
import sys, os
ctx = open(sys.argv[1], "rb").read()
wd, n = sys.argv[2], int(sys.argv[3])
# split on line boundaries near n bytes
parts, cur = [], b""
for line in ctx.split(b"\n"):
    if len(cur) + len(line) + 1 > n and cur:
        parts.append(cur); cur = b""
    cur += line + b"\n"
if cur: parts.append(cur)
for i, p in enumerate(parts):
    open(os.path.join(wd, f"chunk_{i:02d}.txt"), "wb").write(p)
open(os.path.join(wd, "nchunks.txt"), "w").write(str(len(parts)))
print(f"chunks: {len(parts)}  (sizes: {[len(p) for p in parts]})")
PY

# ── W6: THE LITMUS RUNS FRESH ON EVERY GATE INVOCATION ─────────────────────────────────
# scripts/indicator_gate.py renders 5 real weeks + the differential + binds a live :99
# screenshot to THIS artifact. Its evidence is prepended to EVERY chunk (below). A litmus
# failure HALTS the gate with NO JEV calls and NO verdict line — JEV never judges an
# artifact that cannot render 5 real weeks. (Pin-authorized: W6 owns this file; the
# recipe.json question is FROZEN and untouched — JEV still decides every verdict.)
if ! python3 "$ROOT/scripts/indicator_gate.py" --evidence > "$WORK/litmus.log" 2>&1; then
  echo "W6 LITMUS: FAIL — the gate halts before JEV (no verdict; fix the render):"
  tail -8 "$WORK/litmus.log"
  exit 1
fi
LITMUS_EVIDENCE="$(cat "$ROOT/JEV_GATE/litmus_evidence.txt")"
tail -3 "$WORK/litmus.log" | head -2

# ── JUDGE EACH CHUNK; THE ARTIFACT EVIDENCE IS PREPENDED TO EVERY CHUNK ──────────────────
EV="THE ARTIFACT UNDER TEST: $ART
  sha256: $(sha256sum "$ART" | awk '{print $1}')
  baked-literal zone pushes (SC-19 requires 0): $(grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' "$ART" 2>/dev/null)
  live ta.*/request.security: $(grep -cE '\bta\.(pivothigh|pivotlow|highest|lowest|sma|ema|atr)|request\.security' "$ART" 2>/dev/null)

$LITMUS_EVIDENCE
"

N=$(cat "$WORK/nchunks.txt")
ALL_ACT=1
printf "JEV GATE (full context, %s chunks):\n" "$N"
for i in $(seq 0 $((N-1))); do
  python3 - "$WORK/chunk_$(printf '%02d' "$i").txt" "$WORK/row_$i.jsonl" "$EV" <<'PY'
import json, sys
ctx = open(sys.argv[1]).read()
row = {"id": f"chunk", "text": sys.argv[3] + "\n\nTHE BUILD CONTEXT (chunk):\n" + ctx}
open(sys.argv[2], "w").write(json.dumps(row) + "\n")
PY
  jm decision-tree --rows "$WORK/row_$i.jsonl" --recipe "$ROOT/JEV_GATE/recipe.json" --out "$WORK/out_$i.jsonl" 2>/dev/null
  ROUTE=$(python3 -c "import json;r=json.load(open('$WORK/out_$i.jsonl'))[0];print(r.get('route'))" 2>/dev/null || echo "ERROR")
  NOUL=$(python3 -c "import json;r=json.load(open('$WORK/out_$i.jsonl'))[0];a=r.get('answers',{}).get('pass',{});print(round(a.get('noul',-1),3))" 2>/dev/null || echo "?")
  printf "  chunk %s/%s  noul=%-7s route=%s\n" "$i" "$((N-1))" "$NOUL" "$ROUTE"
  [ "$ROUTE" = "act" ] || ALL_ACT=0
done

echo
if [ "$ALL_ACT" = "1" ]; then
  echo "JEV VERDICT: YES — every context chunk is act. THE ARTIFACT PASSES."
  exit 0
fi
echo "JEV VERDICT: NO — at least one context chunk is not act. THE ARTIFACT IS REJECTED."
exit 1
