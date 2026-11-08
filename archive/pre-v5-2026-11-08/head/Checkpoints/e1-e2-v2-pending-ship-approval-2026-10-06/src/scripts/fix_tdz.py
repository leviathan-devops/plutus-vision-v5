import pathlib, re

p = pathlib.Path("/home/leviathan/.omp/agent/extensions/computer-use/index.js")
t = p.read_text()

a = "}\nloadSession();\n\n// ── state ─"
b = "}\n\n// ── state ─"
assert t.count(a) == 1, "early loadSession not found"
t = t.replace(a, b)

m = re.search(r"const S = \{.*?\n\};\n", t, re.S)
assert m, "S declaration not found"
note = ("\n// Load AFTER the declaration: calling this earlier runs in the temporal dead zone,\n"
        "// throws a ReferenceError, and the catch swallows it — every process would start\n"
        "// blind (found 2026-10-01 by scripts/sweep.mjs).\nloadSession();\n")
t = t[:m.end()] + note + t[m.end():]

p.write_text(t)
print("loadSession moved below the S declaration")
