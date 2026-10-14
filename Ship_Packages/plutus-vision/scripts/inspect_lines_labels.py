"""Why do LINES and LABELS render 0/n?
Inspect the raw payload: the station's line/label shape may use different
keys than we assume. Ground truth, not speculation.
"""
import json, urllib.request, pathlib
D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision")
M = D / "plutus-vision-v0.pine"
body = json.dumps({"script": M.read_text(), "pair": "EUR/USD", "timeframe": "4H", "limit": 300}).encode()
req = urllib.request.Request("http://127.0.0.1:9641/run", data=body, headers={"Content-Type": "application/json"})
d = json.load(urllib.request.urlopen(req, timeout=240)).get("data") or {}
dr = d.get("drawings") or {}
for k in ("lines", "labels"):
    v = dr.get(k) or []
    print(f"\n  {k}: {len(v)}")
    if v:
        print("    FULL first record:")
        print("   ", json.dumps(v[0], indent=2)[:700])
