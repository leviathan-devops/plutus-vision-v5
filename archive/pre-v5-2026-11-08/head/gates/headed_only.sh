# HEADED-ONLY — operator ruling 2026-10-25: every browser/GUI/render runs on a real display.
# Refusal token: HEADED_ONLY_VIOLATION (exit 1). The pattern is assembled so this file does not
# itself contain the forbidden word.
check_headed_only() {
  local f="$1"
  local pat="head(-| |_)?less|--disable-gpu-headed|chrome-headless-shell"
  if grep -nEi "$pat" "$f" >/dev/null 2>&1; then
    grep -nEi "$pat" "$f" | while IFS= read -r line; do
      echo "HEADED_ONLY_VIOLATION: $f:$line"
    done
    return 1
  fi
  return 0
}
