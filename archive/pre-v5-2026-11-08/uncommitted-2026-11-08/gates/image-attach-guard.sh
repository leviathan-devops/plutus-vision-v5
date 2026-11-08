#!/usr/bin/env bash
# image-attach-guard.sh - an image attached for a reader must carry content.
#
# THE DEFECT THIS PREVENTS (measured 2026-10-26): a 1300x750 crop of an almost-empty region was
# attached to explain "what is this blank space". 71.5% of its pixels were ONE colour, so the
# client rendered it at full width as a ~400 px grey block - the explanation reproduced the
# defect it was explaining. Prose advice does not catch this; a density predicate does.
#
#   image-attach-guard.sh FILE [MAX_PX] [MAX_FLAT_PCT]     defaults 400000 px, 60 %
# Exit: 0 carries content | 1 IMAGE_ATTACH_BLOAT with the measurements
F="${1:?usage: image-attach-guard.sh FILE [MAX_PX] [MAX_FLAT_PCT]}"
MAXPX="${2:-400000}"; MAXFLAT="${3:-60}"
[ -f "$F" ] || { echo "IMAGE_ATTACH_BLOAT: no such file $F" >&2; exit 1; }
read -r PX FLAT < <(python3 - "$F" "$MAXPX" <<'PY'
import sys
from collections import Counter
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
px = im.width * im.height
modal, n = Counter(im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()).most_common(1)[0]
print(px, f"{100.0*n/px:.1f}")
PY
)
if [ "$PX" -gt "$MAXPX" ] && awk -v f="$FLAT" -v m="$MAXFLAT" 'BEGIN{exit !(f>m)}'; then
  echo "IMAGE_ATTACH_BLOAT: $F is ${PX}px and ${FLAT}% one flat colour (> ${MAXPX}px, > ${MAXFLAT}%) - it renders as a blank block" >&2
  exit 1
fi
exit 0
