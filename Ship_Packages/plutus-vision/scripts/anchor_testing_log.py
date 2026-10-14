import pathlib, subprocess, hashlib, json, urllib.request
V = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine")
D = V.parent
sha = hashlib.sha256(V.read_bytes()).hexdigest()
decl = subprocess.run(["grep", "-c", "^indicator(", str(V)], capture_output=True, text=True).stdout.strip()
lux = subprocess.run(["grep", "-c", "LuxAlgo", str(V)], capture_output=True, text=True).stdout.strip()
lines = len(V.read_text().split("\n"))
lex = subprocess.run(["python3", str(D / "scripts/lexcheck.py"), str(V)], capture_output=True, text=True).stdout
lexv = [l for l in lex.splitlines() if "lexcheck:" in l][-1]
probe = subprocess.run(["node", str(D / "pine-ide-fork/pv_probe.mjs"), str(V), "--url",
                       "http://127.0.0.1:9641"], capture_output=True, text=True).stdout
block = "\n".join(probe.splitlines()[:4])
block2 = f"""
---

## RE-MEASURED THIS TURN — the anchor every verdict above hangs from

Re-run after every edit; a PASS is only true for the SHA it was measured on.

```
$ sha256sum plutus-vision-v0.pine
{sha}

$ grep -c '^indicator(' plutus-vision-v0.pine          # T-02
{decl}

$ grep -c 'LuxAlgo' plutus-vision-v0.pine              # T-03
{lux}

$ python3 scripts/lexcheck.py plutus-vision-v0.pine    # T-01
{lexv}

$ node pine-ide-fork/pv_probe.mjs plutus-vision-v0.pine --url :127.0.0.1:9641
{block}
```

lines in artifact: {lines}

Every PASS row in Zone 2 was measured against this SHA or an explicitly named earlier
one. If the SHA changes, the verdicts are STALE and the gates must re-run — a PASS is a
measurement, not a property of the filename.
"""
p = D / "TESTING_LOG.md"
t = p.read_text()
marker = "\n---\n\n## THE AUDIT GATE"
t = t.replace(marker, block + marker, 1)
p.write_text(t)
print(f"  appended re-measurement block ({len(t.splitlines())} lines total)")
