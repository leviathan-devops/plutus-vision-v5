#!/usr/bin/env bash
# cmp-guard.sh - anti-pattern A9: the scope guard (and the six files around it) is COPIED
# VERBATIM and never edited. `cmp` each of the 7 files against the boilerplate source.
#
# scope-guard.ts is a dependency of three of the seven, so a partial or edited copy fails at
# import - but that is a runtime surprise; this is the build-time proof.
# Exit: 0 all identical, 1 a difference or a missing file.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E="$(cd "$HERE/.." && pwd)"
SRC="${CU_SCOPED_SOURCE:-/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/agent_plugin_boilerplates/workspace-scoped-state-boilerplate}"
FILES=(db-path.ts scope-binding.ts scope-guard.ts scope-resolver.ts scoped-store.ts session-state.ts workspace-scoping.test.ts)

FAIL=0
[ -d "$SRC" ] || { echo "  FAIL  A9 BOILERPLATE_ABSENT: $SRC does not exist, so identity cannot be proven"; exit 1; }
for f in "${FILES[@]}"; do
  if [ ! -f "$E/scoped/$f" ]; then FAIL=$((FAIL+1)); printf '  FAIL  A9 SCOPED_FILE_MISSING  %s\n' "$f"
  elif cmp -s "$SRC/$f" "$E/scoped/$f"; then printf '  PASS  A9 cmp-identical  %s\n' "$f"
  else FAIL=$((FAIL+1)); printf '  FAIL  A9 SCOPED_FILE_EDITED  %s differs from the boilerplate\n' "$f"; fi
done
n="$(ls "$E/scoped" | wc -l)"
[ "$n" -eq 7 ] || { FAIL=$((FAIL+1)); echo "  FAIL  A9 SCOPED_COUNT  expected exactly 7 files in scoped/, found $n"; }
[ "$FAIL" -eq 0 ]
