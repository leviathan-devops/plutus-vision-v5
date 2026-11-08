import pathlib

p = pathlib.Path("/home/leviathan/.omp/agent/extensions/computer-use/index.js")
t = p.read_text()

# every branch that MUTATES the rail state must persist it, or the next process reads stale state
patches = [
    ("        S.unobserved = 0; // the pixels are now in the agent's context — that IS the look\n"
     "        log({ kind: \"shot\", path: out, sha: hash, bytes: buf.length });",
     "        S.unobserved = 0; // the pixels are now in the agent's context — that IS the look\n"
     "        log({ kind: \"shot\", path: out, sha: hash, bytes: buf.length });\n"
     "        try { saveSession(); } catch {}"),
    ("        S.unobserved = 0;\n        log({ kind: \"ack\", n, reason: a.note });",
     "        S.unobserved = 0;\n        log({ kind: \"ack\", n, reason: a.note });\n"
     "        try { saveSession(); } catch {}"),
    ("        S.expectation = null; // one expectation, one verdict — write the next one\n"
     "        log({ kind: \"verdict\", ...row });",
     "        S.expectation = null; // one expectation, one verdict — write the next one\n"
     "        log({ kind: \"verdict\", ...row });\n"
     "        try { saveSession(); } catch {}"),
]
n = 0
for a, b in patches:
    if a in t:
        t = t.replace(a, b, 1); n += 1
p.write_text(t)
print(f"persisted {n}/{len(patches)} rail-state mutations")
