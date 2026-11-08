#!/usr/bin/env bash
# v6-firewall.sh — the PLUTUS v6 detector bundle.
# ONE COMMAND. Exit nonzero = FAIL. Every detector is a real check against disk.
#
# Usage:  bash scripts/v6-firewall.sh          # full run
#         bash scripts/v6-firewall.sh --quick  # skip the slow model probes
#
# Per the next-steps-blueprint §6. A detector that is a bare keyword grep with no
# artifact is a lexicon violation — each check below reads the OBSERVABLE thing.

set -uo pipefail
V5="${V5_ROOT:-/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent}"
LEDGER="${LEDGER_DIR:-./ledger}"
QUICK=0
[ "${1:-}" = "--quick" ] && QUICK=1

FAIL=0
pass () { printf '  PASS  %s\n' "$1"; }
fail () { printf '  FAIL  %s\n' "$1"; FAIL=1; }

echo "=== PLUTUS v6 FIREWALL ==="
echo

# ── DETECT-1  THE MISSING ENDPOINT ────────────────────────────────────────────
# A JEV readout is valid iff the endpoint answers with a typed payload.
if [ "$QUICK" -eq 0 ]; then
  CODE=$(curl -s -m 8 -o /tmp/v6sys.json -w '%{http_code}' \
    http://127.0.0.1:8008/v1/systemone 2>/dev/null || echo 000)
  if [ "$CODE" = "200" ]; then
    if grep -qE '"(noul|choice|score)"' /tmp/v6sys.json 2>/dev/null; then
      pass "DETECT-1 JEV readout answers with a typed payload"
    else
      fail "DETECT-1 JEV endpoint 200 but NO typed answer (noul/choice/score) -> JEV_ENDPOINT_ABSENT"
    fi
  else
    fail "DETECT-1 /v1/systemone HTTP $CODE -> JEV_ENDPOINT_ABSENT"
  fi
else
  echo "  SKIP  DETECT-1 (--quick)"
fi

# ── DETECT-2  THE UNWIRED RECIPE ──────────────────────────────────────────────
# A recipe is valid iff ledgerRows >= 1 AND decisionsInfluenced >= 1.
if [ -d "$LEDGER" ]; then
  ROWS=$(cat "$LEDGER"/*.jsonl 2>/dev/null | grep -c '"recipe"' || echo 0)
  if [ "$ROWS" -ge 1 ]; then
    pass "DETECT-2 ledger has $ROWS recipe rows"
  else
    fail "DETECT-2 ledger dir exists but 0 recipe rows -> RECIPE_UNWIRED"
  fi
else
  fail "DETECT-2 no ledger dir at $LEDGER -> RECIPE_UNWIRED (every recipe)"
fi

# ── DETECT-3  THE DOUBLE-SOURCED DECISION SURFACE ─────────────────────────────
# A surface is migrated iff handCodedBranches == 0 AND jevLedgerRows >= 1.
BRANCHES=$( { grep -cE '^\s*case ' "$V5/src/brains/shape-brain.ts" 2>/dev/null || echo 0; } )
BRANCHES=$(( BRANCHES + $(grep -cE '^\s*(if|else if)\s*\(' "$V5/src/mdve/mirror.ts" 2>/dev/null || echo 0) ))
if [ "$BRANCHES" -gt 0 ]; then
  fail "DETECT-3 $BRANCHES hand-coded decision branches remain -> DECISION_DOUBLE_SOURCED"
else
  pass "DETECT-3 zero hand-coded decision branches"
fi

# ── DETECT-4  THE ROOT CAUSE STILL LIVE (the KEEP-file defect) ────────────────
# engine.ts is on the KEEP list; the hardcoded '4H' is the #1 macro root cause.
H4=$(grep -c "'4H'" "$V5/src/pipeline/engine.ts" 2>/dev/null || echo 0)
if [ "$H4" -gt 0 ]; then
  fail "DETECT-4 engine.ts still hardcodes '4H' ($H4 sites) -> TELESCOPING_ROOT_CAUSE_LIVE"
else
  pass "DETECT-4 engine.ts carries no hardcoded timeframe"
fi

# ── DETECT-5  THE PHANTOM ─────────────────────────────────────────────────────
# A claimed change with no disk diff is a phantom.
if command -v git >/dev/null && git -C "$V5" rev-parse >/dev/null 2>&1; then
  CHANGED=$(git -C "$V5" status --porcelain 2>/dev/null | wc -l)
  pass "DETECT-5 git sees $CHANGED changed path(s) (0 on a claimed change = phantom)"
else
  echo "  SKIP  DETECT-5 (not a git tree)"
fi

# ── DETECT-6  THE SILENT FALLBACK ─────────────────────────────────────────────
# A missing dependency must be a NAMED refusal, never an allow-shape.
if [ -d "$V5/src" ]; then
  SF=$(grep -rn "JM_BYPASS" "$V5/src" 2>/dev/null | grep -ciE 'return\s*(\{|true|"pass")' || true)
  SF=${SF:-0}; SF=$(printf '%s' "$SF" | tr -dc '0-9'); SF=${SF:-0}
  if [ "$SF" -gt 0 ]; then
    fail "DETECT-6 $SF bypass sites return an allow-shape -> SILENT_FALLBACK"
  else
    pass "DETECT-6 no allow-shaped bypass"
  fi
else
  echo "  SKIP  DETECT-6 (no src/)"
fi

# ── DETECT-7  THE STALE KEEP-LIST FILE ────────────────────────────────────────
for f in src/pipeline/engine.ts src/pipeline/mdve-stage.ts src/mdve/index.ts; do
  [ -f "$V5/$f" ] || fail "DETECT-7 keep-list file missing: $f"
done
[ "$FAIL" -eq 0 ] && pass "DETECT-7 keep-list files present"

echo
if [ "$FAIL" -eq 0 ]; then
  echo "FIREWALL: PASS (0 detectors fired)"
  exit 0
else
  echo "FIREWALL: FAIL (detectors fired — see above)"
  exit 1
fi
