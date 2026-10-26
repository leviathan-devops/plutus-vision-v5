#!/usr/bin/env bash
# ONE COMMAND. Exit nonzero = the tree violates a predicate. Run before every commit.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 4
fail=0

note() { echo "FIREWALL:$1"; fail=1; }

# D1 · every gate is pinned and unmodified
for g in gates/G*.sh gates/no_comment_guard.sh; do
  [ -f "$g" ] || continue
  n=$(basename "$g" .sh)
  [ -f "gates/pins/$n.sha" ] || { note "UNPINNED:$n"; continue; }
  [ "$(sha256sum "$g" | cut -d' ' -f1)" = "$(cat "gates/pins/$n.sha")" ] || note "PIN_MISMATCH:$n"
done

# D2 · no advice-as-prevention in the shipped docs/code
bash gates/no_comment_guard.sh design/DESIGN_BLUEPRINT_v2.0_AUTHORITATIVE.md \
  cf/PSEUDOCODE_BASE.md cf/verify/zfp.py cf/e2/e2_core.py >/dev/null 2>&1 \
  || note "ADVICE_AS_PREVENTION"

# D3 · the telescoping fallback (root cause B) in any live TS tree
if grep -rn --include='*.ts' "?? *TF_CONSTRUCTION_PARAMS\['4H'\]" . >/dev/null 2>&1; then
  note "TELESCOPE_DEFAULT_4H"
fi

# D4 · OUR render tree only: a draw call carrying a literal price
if [ -d pine ]; then
  if grep -rnE --include='*.pine' '(box|line|label)\.new\([^)]*[0-9]+\.[0-9]{3,}' pine >/dev/null 2>&1; then
    note "LITERAL_PRICE_IN_DRAW"
  fi
fi

# D5 · a stub wearing a name
if grep -rnE --include='*.py' --include='*.ts' 'return \{[^}]*stubbed *: *true' . >/dev/null 2>&1; then
  note "STUB"
fi

# D6 · the record must name a runnable next command
grep -q '"next_command"' runtime/record.json || note "NO_RECORD"

# D7 · the legacy .pine literal-price count must never grow (ratchet, baseline pinned)
BASE_F="gates/baselines/legacy-literal-price.count"
if [ -f "$BASE_F" ]; then
  base=$(cat "$BASE_F")
  now=$(grep -rnE --include='*.pine' '(box|line|label)\.new\([^)]*[0-9]+\.[0-9]{3,}' . 2>/dev/null | wc -l)
  [ "$now" -le "$base" ] || note "LITERAL_PRICE_REGRESSION:$now>$base"
fi

# D8 · the worker must typecheck and carry no `any`
if [ -f cf/tsconfig.json ]; then
  TSC=/home/leviathan/node_modules/.bin/tsc
  [ -x "$TSC" ] || TSC=$(command -v tsc || true)
  if [ -n "${TSC:-}" ]; then
    (cd cf && "$TSC" --noEmit -p tsconfig.json >/dev/null 2>&1) || note "WORKER_TYPECHECK"
  fi
  if grep -rnE '(: *any *[;,)=]|as +any *[;,)])' cf/src >/dev/null 2>&1; then note "TS_ANY"; fi
fi

exit $fail
