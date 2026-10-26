#!/usr/bin/env bash
# blueprint-gate.sh - a blueprint is a manufacturing design, not prose.
# Five sections must be PRESENT and one thing must be ABSENT, each mechanically checkable:
#   BLUEPRINT_INCOMPLETE     a required section is missing
#   BLUEPRINT_TIME_ESTIMATE  a phase carries a time estimate instead of an exit criterion (B7)
# Exit: 0 the design is checkable | 1 refused, with the token and the missing part named.
F="${1:?usage: blueprint-gate.sh FILE.md}"
[ -f "$F" ] || { echo "BLUEPRINT_INCOMPLETE: no such file $F" >&2; exit 1; }
fail() { echo "$1: $2" >&2; exit 1; }
has() { grep -qiE "$1" "$F"; }
has '^#+.*CONSTRAINT' || fail BLUEPRINT_INCOMPLETE "no hard-constraint section (the law that shapes everything)"
has '^#+.*(PLANE|STACK)' || fail BLUEPRINT_INCOMPLETE "no planes/stack section (one dependency direction)"
has '^#+.*(DEGRADATION|FAILURE CONTRACT|FAILURE MODE)' || fail BLUEPRINT_INCOMPLETE "no degradation / failure contract"
has '^#+.*ANTI-PATTERN' || fail BLUEPRINT_INCOMPLETE "no anti-pattern section with wired detectors (§11)"
has '^#+ *(§15|.*RISK)' || fail BLUEPRINT_INCOMPLETE "no risk register"
has '^#+.*(BUILD SEQUENCE|PHASES?)' || fail BLUEPRINT_INCOMPLETE "no build sequence"
has '^#+.*SUMMARY' || fail BLUEPRINT_INCOMPLETE "no one-paragraph summary (the compression test)"
# B7: a phase must exit on a criterion, never on a duration.
if grep -qiE '(within|in|takes|spend)[[:space:]]+[0-9]+[[:space:]]*(day|days|week|weeks|hour|hours)' "$F"; then
  fail BLUEPRINT_TIME_ESTIMATE "a phase is sized by a duration, which cannot fail - state an exit criterion instead"
fi
rows=$(grep -cE '^\| *(CRIT|CRITICAL|HIGH|MED|MEDIUM|LOW) *\|' "$F" || true)
[ "${rows:-0}" -ge 3 ] || fail BLUEPRINT_INCOMPLETE "the risk register has ${rows:-0} severity-ranked row(s), needs 3+"
exit 0
