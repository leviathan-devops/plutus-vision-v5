#!/usr/bin/env bash
# Fails LOUD when the file the IDE serves is not the file under test.
#
# TWO DEFECTS FIXED 2026-10-02, both found by RUNNING it:
#  1. EVERY path was RELATIVE. From any cwd but the project root, `sha256sum` failed and
#     the pipeline yielded an EMPTY hash, so the comparison produced a confusing
#     SERVED_PINE_DRIFT pointing at a file that was never read. The root is now resolved
#     from this script's OWN location (the same readlink trick pv-ide.sh uses).
#  2. IT ONLY CHECKED plutus-vision-v0.pine. The three DELIVERABLES (lqz-luxalgo,
#     lqz-plutus, plutus-vision-v1) are the artifacts under test and were NEVER verified —
#     a stale served copy of a deliverable would have passed this gate silently.
#
# Run from anywhere. Exits 1 on the first drift it finds.
set -uo pipefail
W="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"

FILES=(lqz-luxalgo.pine lqz-plutus.pine plutus-vision-v1.pine plutus-vision-v0.pine)
FAIL=0
for S in "${FILES[@]}"; do
  A_PATH="$W/$S"
  R_PATH="$W/pine-ide/ide/renderer/$S"
  if [ ! -e "$A_PATH" ]; then
    echo "  ${S}: ABSENT at the project root — cannot verify"
    FAIL=1; continue
  fi
  if [ ! -e "$R_PATH" ]; then
    echo "  ${S}: ABSENT in pine-ide/ide/renderer/ — the IDE cannot serve it"
    FAIL=1; continue
  fi
  A=$(sha256sum "$A_PATH" | cut -d' ' -f1)
  B=$(sha256sum "$R_PATH" | cut -d' ' -f1)
  C=$(curl -s -m 5 "http://127.0.0.1:9851/$S" | sha256sum | cut -d' ' -f1)
  printf '  %-24s source %s  renderer %s  served %s\n' "$S" "${A:0:16}" "${B:0:16}" "${C:0:16}"
  if [ "$A" != "$B" ] || [ "$A" != "$C" ]; then
    echo "    SERVED_PINE_DRIFT: the IDE is not serving ${S} as it stands under test"
    FAIL=1
  fi
done

[ "$FAIL" = 0 ] || { echo "SERVED_PINE_DRIFT"; exit 1; }
echo "SERVED_PINE_OK"
