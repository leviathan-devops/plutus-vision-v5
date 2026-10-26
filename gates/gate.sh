#!/usr/bin/env bash
# gates/gate.sh <gate> <subject> <expected_sha|-> <card_id>
# The ONLY way a gate is run. It pins itself, pins its subject, proves its own
# control pair separates, then judges. The caller never writes the verdict.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
source "$HERE/lib.sh"

G="${1:?gate}"
SUBJ="${2:?subject}"
SHA="${3:--}"
CARD="${4:?card}"

[ -f "$HERE/$G.sh" ] || { echo "GATE_DEFECT:NO_SUCH_GATE:$G"; exit 4; }
source "$HERE/$G.sh"

pinned "$G"
r=$?
if [ "$r" -ne 0 ]; then verdict "$G" 3 "$CARD" "gate_pin"; exit 3; fi

if [ "$SHA" != "-" ]; then
  subject_ok "$SUBJ" "$SHA"
  r=$?
  if [ "$r" -ne 0 ]; then verdict "$G" 3 "$CARD" "stale_subject"; exit 3; fi
fi

control_pair "$G" "check_$G"
r=$?
if [ "$r" -ne 0 ]; then verdict "$G" 4 "$CARD" "control_failed"; exit 4; fi

"check_$G" "$SUBJ"
rc=$?
case "$rc" in
  0) why=pass ;;
  1) why=fail ;;
  2) why=inconclusive ;;
  *) why=unexpected; rc=2 ;;
esac
verdict "$G" "$rc" "$CARD" "$why"
exit "$rc"
