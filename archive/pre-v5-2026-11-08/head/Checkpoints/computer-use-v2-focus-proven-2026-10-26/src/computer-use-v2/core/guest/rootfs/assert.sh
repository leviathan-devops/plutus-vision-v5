#!/usr/bin/env bash
# assert.sh - the guest image's PRESENCE ASSERTION. Run inside the guest (boot.sh does it on
# every boot, and the image build must run it before sealing the image).
#
# Every binary named in manifest.txt must be on PATH. Anything missing is listed BY NAME with
# the package that provides it, and the exit is non-zero: a missing binary is a failure of the
# IMAGE, found at image build, never at first use.
#
# Exit: 0 complete, 1 incomplete (GUEST_IMAGE_INCOMPLETE on stdout, one line per missing binary).
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="${1:-$HERE/manifest.txt}"
missing=0
while read -r bin pkg; do
  case "$bin" in ""|"#"*) continue ;; esac
  if ! command -v "$bin" >/dev/null 2>&1; then
    [ "$missing" -eq 0 ] && echo "GUEST_IMAGE_INCOMPLETE: the image lacks:"
    echo "  $bin  (apk add $pkg)"; missing=$((missing + 1))
  fi
done < "$MANIFEST"
[ "$missing" -eq 0 ]
