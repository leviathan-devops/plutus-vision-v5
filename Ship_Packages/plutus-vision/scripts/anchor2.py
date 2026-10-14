import pathlib, subprocess, hashlib
D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision")
V = D / "plutus-vision-v0.pine"
sha = hashlib.sha256(V.read_bytes()).hexdigest()
def sh(*a):
    return subprocess.run(list(a), capture_output=True, text=True, cwd=str(D)).stdout.strip()
decl = sh("grep", "-c", "^indicator(", "plutus-vision-v0.pine")
lux = sh("grep", "-c", "LuxAlgo", "plutus-vision-v0.pine")
lexall = sh("python3", "scripts/lexcheck.py", "plutus-vision-v0.pine")
lexv = [l for l in lexall.splitlines() if "lexcheck:" in l][-1]
pr = sh("node", "pine-ide-fork/pv_probe.mjs", "plutus-vision-v0.pine", "--url", "http://127.0.0.1:9641")
pb = "\n".join(pr.splitlines()[:4])
block = f"""
---

## RE-MEASURED THIS TURN - the anchor every verdict above hangs from

Re-run after every edit. A PASS is a measurement, valid only for the SHA it was taken on.

```
$ sha256sum plutus-vision-v0.pine
{sha}

$ grep -c '^indicator(' plutus-vision-v0.pine        # T-02
{decl}

$ grep -c 'LuxAlgo' plutus-vision-v0.pine            # T-03
{lux}

$ python3 scripts/lexcheck.py plutus-vision-v0.pine  # T-01
{lexv}

$ node pine-ide-fork/pv_probe.mjs plutus-vision-v0.pine --url http://127.0.0.1:9641
{pb}
```

If the SHA changes, every verdict above is STALE and the gates must re-run.
"""
p = D / "TESTING_LOG.md"
t = p.read_text()
if "RE-MEASURED THIS TURN" in t:
    print("  already anchored")
else:
    i = t.find("## THE AUDIT GATE")
    t = t[:i] + block.strip() + "\n\n---\n\n" + t[i:]
    p.write_text(t)
    print(f"  anchored ({len(t.splitlines())} lines)")
