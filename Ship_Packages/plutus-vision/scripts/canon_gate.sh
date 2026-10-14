#!/usr/bin/env bash
# canon_gate.sh — THE CANON GATE, mechanical. The pin's DOC CONTRACT: "200+ lines, >=3 file:line
# refs, the 5 read-first docs agree on the SHA." This script checks all three against disk and
# exits 1 on any miss, so the gate is a command rather than a reading.
#
#   bash scripts/canon_gate.sh        -> per-doc table + GATE: PASS|FAIL + exit code
#
# WHY IT EXISTS (measured 2026-10-02): the doc gate had been asserted from memory and was
# actually RED -- 9 of 12 docs under the floor and the SHA block stale by several artifacts.
# Assert the artifact, not the recollection.
set -uo pipefail
W="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
C="$W/context_management"
FLOOR=200
REF_FLOOR=3
READ_FIRST="POST-COMPACTION_PROMPT CURRENT_STATE BUILD_STATE EVIDENCE_STATE NEXT_STEPS"

fail=0
echo "CANON GATE — floors ${FLOOR} lines, refs >= ${REF_FLOOR} (file:line), the 5 read-first agree on the SHA"
echo
printf "  %-28s %6s %6s  %s\n" "doc" "lines" "refs" "state"
for f in "$C"/*.md; do
  name="$(basename "$f")"
  n=$(wc -l < "$f")
  # a file:line ref: an identifier path with :NN, e.g. gate.mjs:157 or pine-ide.mjs:221
  refs=$(grep -oE '[A-Za-z0-9_./-]+\.(mjs|ts|py|pine|sh|json|md):[0-9]+' "$f" | wc -l)
  state="ok"
  if [ "$name" = "CANON_MANIFEST.md" ]; then
    state="index (exempt from the floor)"
  else
    [ "$n" -ge "$FLOOR" ] || { state="UNDER-FLOOR"; fail=1; }
    [ "$refs" -ge "$REF_FLOOR" ] || { state="$state REFS<${REF_FLOOR}"; fail=1; }
  fi
  printf "  %-28s %6s %6s  %s\n" "$name" "$n" "$refs" "$state"
done
echo
# THE SHA AGREEMENT — the 5 read-first docs must carry the block, verbatim and identical
declare -A seen=()
missing=0
for name in $READ_FIRST; do
  f="$C/${name}.md"
  if ! grep -q "THE SHA BLOCK" "$f"; then echo "  NO BLOCK: ${name}.md"; missing=1; continue; fi
  block=$(awk '/THE SHA BLOCK/,/^$/' "$f" | grep -E '^\| (lqz|plutus)' | md5sum | cut -d' ' -f1)
  seen[$block]=1
done
if [ "$missing" -eq 1 ]; then fail=1; fi
if [ "${#seen[@]}" -eq 1 ] && [ "$missing" -eq 0 ]; then
  echo "  SHA agreement: all 5 read-first docs carry the IDENTICAL block"
else
  echo "  SHA agreement: MISMATCH across the read-first set (${#seen[@]} distinct blocks)"; fail=1
fi
echo
# and the block must agree with DISK, not merely with itself
d1=$(sha256sum "$W/lqz-luxalgo.pine" | cut -c1-16)
inblock=$(grep -oE 'lqz-luxalgo\.pine \| `[a-f0-9]{16}' "$C/BUILD_STATE.md" | head -1 | grep -oE '[a-f0-9]{16}$')
if [ "$d1" = "$inblock" ]; then
  echo "  DISK agreement: the block's D1 ${d1} == disk's D1"
else
  echo "  DISK agreement: MISMATCH — block says ${inblock:-absent}, disk is ${d1}"; fail=1
fi
echo
[ "$fail" -eq 0 ] && echo "GATE: PASS" || echo "GATE: FAIL"
exit "$fail"
