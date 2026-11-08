#!/usr/bin/env python3
"""The fence step: the render carries the full category ladder (RES red / MID orange / SUP teal)."""
import sys
src = open('plutus-vision-v2.pine').read()
has_rgb = all(s in src for s in ('color.rgb(180,40,30)', 'color.rgb(255,152,0)', 'color.rgb(0,150,150)'))
has_bad = 'timestamp(2026' in src
cats = set()
import re
for m in re.findall(r'e1_injected_cat\.push\("([^"]+)"\)', src):
    cats.add(m)
ok = has_rgb and not has_bad and cats >= {'RES', 'MID', 'SUP'}
print(f"ladder3={has_rgb} ts2026={has_bad} cats={sorted(cats)}")
print("RENDER_LADDER_OK" if ok else "RENDER_LADDER_FAIL")
sys.exit(0 if ok else 1)
