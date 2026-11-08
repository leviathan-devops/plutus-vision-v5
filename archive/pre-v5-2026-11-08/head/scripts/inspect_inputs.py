#!/usr/bin/env python3
"""What the inputs panel SHOULD show: every input in the merged file, with its real title,
its group, and the INDICATOR SECTION it belongs to (SMC / SWEEPS / VOIDS / POOLS)."""
import pathlib, re, sys

p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/plutus-vision-v0.pine")
lines = p.read_text().split("\n")

section = "HEADER"
rows = []
for i, ln in enumerate(lines, 1):
    m = re.match(r"^// ═══ (\w+) ═══", ln)
    if m:
        section = m.group(1)
        continue
    m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:[\d.]+\s*/\s*)?input\.(\w+)\s*\((.*)$", ln)
    if not m:
        continue
    name, kind, rest = m.groups()
    joined = rest
    j = i - 1
    while joined.count("(") > joined.count(")") and j < len(lines):
        joined += lines[j]
        j += 1
    t = re.search(r"title\s*=\s*'([^']*)'", joined)
    g = re.search(r"group\s*=\s*'([^']*)'", joined)
    o = re.search(r"options\s*=\s*\[([^\]]*)\]", joined)
    rows.append((i, section, name, kind, t.group(1) if t else "", g.group(1) if g else "",
                 len(o.group(1).split(",")) if o else 0))

print(f"total inputs: {len(rows)}")
print(f"with title   : {sum(1 for r in rows if r[4])}")
print(f"with group   : {sum(1 for r in rows if r[5])}")
print(f"WITHOUT title: {sum(1 for r in rows if not r[4])}  <-- these show as raw var names")
print()
print("per section:")
for s in ("SMC", "SWEEPS", "VOIDS", "POOLS"):
    n = [r for r in rows if r[1] == s]
    nt = sum(1 for r in n if not r[4])
    print(f"  {s:7} {len(n):3} inputs, {nt} without a title")
print()
print("the ones WITHOUT a title (these are the ugly ones in the screenshot):")
for r in rows:
    if not r[4]:
        print(f"  line {r[0]:5} [{r[1]:7}] {r[2]}  ({r[3]})  group={r[5] or '-'}")
print()
print("groups present, per section:")
for s in ("SMC", "SWEEPS", "VOIDS", "POOLS"):
    gs = []
    for r in rows:
        if r[1] == s and r[5] and r[5] not in gs:
            gs.append(r[5])
    print(f"  {s:7} {gs}")