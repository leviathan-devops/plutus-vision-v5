import json, urllib.request, urllib.error
V = "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine"
lines = open(V).read().split("\n")
S = sorted(i for i, l in enumerate(lines) if l.startswith("// \u2550\u2550\u2550 "))
hdr = lines[:S[0]]
segs = [("SMC", lines[S[0]:S[1]]), ("SWEEPS", lines[S[1]:S[2]]),
        ("VOIDS", lines[S[2]:S[3]]), ("POOLS", lines[S[3]:])]
def run(sec):
    src = "\n".join(hdr + sec)
    body = json.dumps({"script": src, "pair": "EUR/USD", "timeframe": "4H", "limit": 300}).encode()
    req = urllib.request.Request("http://127.0.0.1:9641/run", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            c = (json.load(r).get("data") or {}).get("counts", {})
            return True, c.get("boxes", 0), c.get("labels", 0), c.get("lines", 0)
    except urllib.error.HTTPError as e:
        return False, 0, 0, 0
tot = [0, 0, 0]
for name, sec in segs:
    ok, b, l, ln = run(sec)
    tot[0] += b; tot[1] += l; tot[2] += ln
    print(f"  {name:<8} {'PASS' if ok and b+l+ln else 'FAIL'}  boxes={b:<4} labels={l:<4} lines={ln}")
print(f"  4/4: {sum(1 for _ in segs)}/4 subsystems executed")
