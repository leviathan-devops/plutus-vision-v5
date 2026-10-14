#!/usr/bin/env python3
"""The fence step: the payload's zone STRUCTURE matches the v8 (2 RES, 1 MID, 2 SUP, top-down)."""
import json, sys, glob
paths = sorted(glob.glob('data/e1/DXY-*.json'))
if not paths:
    print("NO_PAYLOAD"); sys.exit(1)
d = json.load(open(paths[-1]))
cats = [z['zCat'] for z in d['zones']]
n_res = cats.count('RES'); n_sup = cats.count('SUP'); n_mid = cats.count('MID')
tops = [z['top'] for z in d['zones']]
ok = (len(d['zones']) >= 5 and n_res >= 2 and n_sup >= 2 and n_mid >= 1
      and tops == sorted(tops, reverse=True))
print(f"cats={cats} RES={n_res} MID={n_mid} SUP={n_sup} topdown={tops == sorted(tops, reverse=True)}")
print("ZONE_STRUCTURE_OK" if ok else "ZONE_STRUCTURE_FAIL")
sys.exit(0 if ok else 1)
