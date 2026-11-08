#!/usr/bin/env python3
"""lexcheck.py — I-1: namespace collision linter for Pine merges (blueprint §20).
PASS 1 types · PASS 2 top-level bindings · PASS 3 functions · PASS 4 input titles ·
PASS 5 object budget · PASS 6 version+license. Exit 0 PASS / 1 FAIL."""
import re, sys, pathlib, collections
def main(paths):
    per = {}
    for p in paths:
        t = pathlib.Path(p).read_text()
        types = set(re.findall(r'(?m)^type\s+(\w+)', t))
        binds = set(m.group(1) for m in re.finditer(r'(?m)^(?:var(?:ip)?\s+)?(?:[\w<>\[\]]+\s+)?(\w+)\s*=(?!=)', t))
        fns = set(re.findall(r'(?m)^(\w+)\([^)]*\)\s*=>', t)) | set(re.findall(r'(?m)^method\s+(\w+)\(', t))
        titles = re.findall(r'input\.\w+\([^,]*,\s*[\'"]([^\'"]+)[\'"]', t)
        boxes = [int(x) for x in re.findall(r'max_boxes_count\s*=\s*(\d+)', t)]
        per[p] = dict(types=types, binds=binds, fns=fns, titles=titles, boxes=boxes)
        vers = re.findall(r'//@version=(\d+)', t)
        lic = bool(re.search(r'CC BY-NC-SA|©\s*\w+|Copyright', t))
        per[p]['vers'] = vers; per[p]['lic'] = lic
    fails = 0
    print("PASS 1 — types:")
    tc = collections.defaultdict(list)
    for p, d in per.items():
        for x in d['types']: tc[x].append(pathlib.Path(p).name)
    for x, fs in sorted(tc.items()):
        if len(fs) > 1: print(f"  COLLISION type {x}: {fs}"); fails += 1
    if not any(len(fs) > 1 for fs in tc.values()): print("  clean")
    print("PASS 2 — top-level bindings:")
    bc = collections.defaultdict(list)
    for p, d in per.items():
        for x in d['binds']: bc[x].append(pathlib.Path(p).name)
    n = 0
    for x, fs in sorted(bc.items()):
        if len(fs) > 1: print(f"  SHADOW {x}: {fs}"); n += 1; fails += 1
    if not n: print("  clean")
    print("PASS 3 — functions (len<=2 flagged high-risk):")
    fc = collections.defaultdict(list)
    for p, d in per.items():
        for x in d['fns']: fc[x].append(pathlib.Path(p).name)
    for x, fs in sorted(fc.items()):
        tag = " HIGH-RISK" if len(x) <= 2 else ""
        if len(fs) > 1 or len(x) <= 2: print(f"  {x}: {fs}{tag}")
    print("PASS 4 — input titles:")
    it = collections.defaultdict(list)
    for p, d in per.items():
        for x in d['titles']: it[x].append(pathlib.Path(p).name)
    for x, fs in sorted(it.items()):
        if len(fs) > 1: print(f"  DUP TITLE '{x}': {fs}")
    print("PASS 5 — object budget (ceiling 500):")
    tot = 0
    for p, d in per.items():
        b = max(d['boxes']) if d['boxes'] else 50
        tot += b; print(f"  {pathlib.Path(p).name}: boxes={b}")
    print(f"  TOTAL {tot} vs 500 -> {'OVER' if tot > 500 else 'ok'}")
    if tot > 500: fails += 1
    print("PASS 6 — version + license:")
    for p, d in per.items():
        print(f"  {pathlib.Path(p).name}: version={d['vers'] or ['?']} license={'ok' if d['lic'] else 'MISSING'}")
        if not d['lic']: fails += 1
    print(f"\nlexcheck: {'FAIL' if fails else 'PASS'} ({fails} findings)")
    return 1 if fails else 0
if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or ["sources/smart-money-concepts.pine"]))
