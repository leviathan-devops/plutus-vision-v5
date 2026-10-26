# UNTESTED-BLOCKER — a block named in a document must have PROOF/blocks/<NAME>.txt:
#   line 1 starts with "$ " (the command that was run), the last line is "rc=<n>", and the body
#   between them is non-empty. A block with no such file was asserted, not measured.
# Refusal token: UNTESTED_BLOCKER (exit 1).
check_untested_blocker() {
  local f="$1"
  local root; root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  local names rc=0
  names=$(grep -oE '(BLOCKED[: ]+|record\.blocked \+= )[A-Z][A-Z0-9_]{4,}' "$f" | grep -oE '[A-Z][A-Z0-9_]{4,}$' | sort -u)
  for n in $names; do
    local ev="$root/PROOF/blocks/$n.txt"
    if [ ! -s "$ev" ]; then echo "UNTESTED_BLOCKER: $n has no evidence file $ev"; rc=1; continue; fi
    head -1 "$ev" | grep -q '^\$ ' || { echo "UNTESTED_BLOCKER: $n evidence line 1 is not a command"; rc=1; continue; }
    tail -1 "$ev" | grep -qE '^rc=[0-9]+$' || { echo "UNTESTED_BLOCKER: $n evidence has no rc= last line"; rc=1; continue; }
    [ "$(wc -l < "$ev")" -ge 3 ] || { echo "UNTESTED_BLOCKER: $n evidence has no output body"; rc=1; }
  done
  return $rc
}
