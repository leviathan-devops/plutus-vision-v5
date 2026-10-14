import json, urllib.request, pathlib
D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision")
M = D / "plutus-vision-v0.pine"
body = json.dumps({"script": M.read_text(), "pair": "EUR/USD", "timeframe": "4H", "limit": 300}).encode()
req = urllib.request.Request("http://127.0.0.1:9641/run", data=body, headers={"Content-Type": "application/json"})
d = json.load(urllib.request.urlopen(req, timeout=240)).get("data") or {}
dr = d.get("drawings") or {}
print("  drawing keys:", list(dr.keys()))
for k in ("boxes", "lines", "labels"):
    v = dr.get(k) or []
    print(f"  {k}: {len(v)}")
    if v:
        print(f"    sample: {json.dumps(v[0])[:260]}")
