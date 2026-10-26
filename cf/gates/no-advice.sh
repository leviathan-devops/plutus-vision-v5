#!/usr/bin/env bash
# GATE: a prevention must be a predicate, never advice. Exit 1 with a token on a hit.
set -uo pipefail
PAT='(we should (make sure|always|be careful)|let me be careful|be more careful|pay attention to|keep in mind|watch out for|the fix is to|add a (check|warning|reminder|note) (that|to))'
rc=0
for f in "$@"; do
  hits=$(grep -nEi "$PAT" "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    while IFS= read -r line; do echo "ADVICE-NOT-PREDICATE: $f:$line"; done <<< "$hits"
    rc=1
  fi
done
exit $rc
