import json, urllib.request, urllib.error
V = "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine"
lines = open(V).read().split("\n")
S = sorted(i for i, l in enumerate(lines) if l.startswith("// \u2550\u2550\u2550 "))
hdr, pools = lines[:S[0]], lines[S[3]:]
src = "\n".join(hdr + pools)
body = json.dumps({"script": src, "pair": "EUR/USD", "timeframe": "4H", "limit": 300}).encode()
req = urllib.request.Request("http://127.0.0.1:9641/run", data=body, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=120) as r:
        c = (json.load(r).get("data") or {}).get("counts", {})
        print(f"POOLS: boxes={c.get('boxes')} labels={c.get('labels')} lines={c.get('lines')}")
except urllib.error.HTTPError as e:
    print("POOLS:", e.code, e.read().decode()[:150])
