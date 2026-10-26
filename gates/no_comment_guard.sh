# NO-COMMENT-GUARD — a prevention must be a mechanism, never a comment or a convention.
# Refusal token: COMMENT-AS-GUARD (exit 1).
check_no_comment_guard() {
  local f="$1"
  local pat='(the comment is the guard|is the guard\b|acts as a guard|serves as a guard|by convention|as a reminder|enforced by convention|the fix is to)'
  if grep -nEi "$pat" "$f" >/dev/null 2>&1; then
    grep -nEi "$pat" "$f" | while IFS= read -r line; do
      echo "COMMENT-AS-GUARD: $f:$line"
    done
    return 1
  fi
  return 0
}
