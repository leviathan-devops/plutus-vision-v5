#!/usr/bin/env bash
# EXIT CONTRACT: 0 PASS · 1 FAIL · 2 INCONCLUSIVE · 3 VOID/STALE/TAMPERED · 4 GATE_DEFECT
set -uo pipefail
GATE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ="$(dirname "$GATE_ROOT")"

pinned() {
  local n="$1"
  local pin="$GATE_ROOT/pins/$n.sha"
  local f="$GATE_ROOT/$n.sh"
  [ -f "$pin" ] || { echo "VOID:NO_PIN:$n"; return 3; }
  [ "$(sha256sum "$f" | cut -d' ' -f1)" = "$(cat "$pin")" ] || { echo "VOID:GATE_TAMPERED:$n"; return 3; }
  return 0
}

subject_ok() {
  local s="$1"
  local e="$2"
  [ -f "$s" ] || { echo "VOID:SUBJECT_MISSING:$s"; return 3; }
  [ "$(sha256sum "$s" | cut -d' ' -f1)" = "$e" ] || { echo "VOID:STALE_SUBJECT:$s"; return 3; }
  return 0
}

control_pair() {
  local n="$1"
  local fn="$2"
  local g="$PROJ/fixtures/$n.good"
  local b="$PROJ/fixtures/$n.bad"
  [ -f "$g" ] && [ -f "$b" ] || { echo "GATE_DEFECT:$n:fixtures_missing"; return 4; }
  "$fn" "$g" >/dev/null 2>&1; local rg=$?
  "$fn" "$b" >/dev/null 2>&1; local rb=$?
  [ "$rg" -eq 0 ] || { echo "GATE_DEFECT:$n:positive_rc=$rg"; return 4; }
  [ "$rb" -eq 1 ] || { echo "GATE_DEFECT:$n:negative_rc=$rb"; return 4; }
  return 0
}

verdict() {
  local gate="$1"
  local code="$2"
  local card="$3"
  local reason="$4"
  local ts
  ts="$(date -u +%FT%TZ)"
  mkdir -p "$PROJ/vcards" "$PROJ/PROOF"
  printf '{"gate":"%s","code":%s,"card":"%s","reason":"%s","at":"%s"}\n' \
    "$gate" "$code" "$card" "$reason" "$ts" > "$PROJ/vcards/$card.verdict.json"
  printf '%s\t%s\t%s\t%s\t%s\n' "$ts" "$gate" "$card" "$code" "$reason" >> "$PROJ/PROOF/decision-trail.tsv"
}
