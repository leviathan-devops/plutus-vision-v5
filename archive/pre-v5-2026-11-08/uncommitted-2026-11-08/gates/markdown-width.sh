#!/usr/bin/env bash
# markdown-width.sh - a rendered artifact must fit the pane it is read in.
#
# THE DEFECT THIS PREVENTS (measured 2026-10-26): a summary whose third table column ran past
# the chat pane's right edge. The client drew 5 of 8 rows, clipped the rest, and reserved ~325 px
# of blank space below it - content present in the message, absent from the render. Prose advice
# ("keep tables narrow") does not catch this; a width predicate does.
#
#   markdown-width.sh FILE [MAX_COLUMNS]     default 96
# Exit: 0 every line fits | 1 MARKDOWN_WIDTH with file:line and the offending width
MAX="${2:-96}"
F="${1:?usage: markdown-width.sh FILE [MAX]}"
[ -f "$F" ] || { echo "MARKDOWN_WIDTH: no such file $F" >&2; exit 1; }
bad=0
while IFS= read -r line; do
  n=${#line}
  if [ "$n" -gt "$MAX" ]; then
    printf 'MARKDOWN_WIDTH: %s:%s is %s columns (> %s)\n' "$F" "$((bad+1))" "$n" "$MAX" >&2
    bad=$((bad+1))
  fi
done < <(awk 'NR>0' "$F")
[ "$bad" -eq 0 ] || { echo "MARKDOWN_WIDTH: $bad line(s) exceed $MAX columns - it will clip where it is rendered" >&2; exit 1; }
exit 0
