# SAFE-DELETE-GUARD — a deletion is allowed only if it is listed, untracked, and not protected.
# The subject file contains ONE path per line; every path must pass.
# Refusal tokens: DELETE_NOT_LISTED · DELETE_TRACKED · DELETE_PROTECTED · DELETE_OUTSIDE_ROOT
check_safe_delete() {
  local subject="$1"
  local manifest="${2:-gates/delete-manifest.txt}"
  local rc=0
  while IFS= read -r target; do
    [ -z "$target" ] && continue
    case "$target" in \#*) continue ;; esac

    case "$(realpath -m "$target")" in
      "$(realpath -m .)"/*) : ;;
      *) echo "DELETE_OUTSIDE_ROOT: $target"; rc=1; continue ;;
    esac

    local listed=0
    if [ -f "$manifest" ]; then
      while IFS= read -r line; do
        [ -z "$line" ] && continue
        case "$line" in \#*) continue ;; esac
        line="${line%/}"
        case "$target" in "$line"|"$line"/*) listed=1; break ;; esac
      done < "$manifest"
    fi
    if [ "$listed" -ne 1 ]; then echo "DELETE_NOT_LISTED: $target"; rc=1; continue; fi

    if git ls-files --error-unmatch "$target" >/dev/null 2>&1; then
      echo "DELETE_TRACKED: $target"; rc=1; continue
    fi

    case "$target" in
      Checkpoints/*|MASTER_CONTEXT/*|cards/*|data/*|Original_Canon_Data/*|.git/*)
        echo "DELETE_PROTECTED: $target"; rc=1; continue ;;
      design/DESIGN_BLUEPRINT_v1.0_AS_DESIGNED.md)
        echo "DELETE_PROTECTED: $target"; rc=1; continue ;;
    esac
  done < "$subject"
  return $rc
}
