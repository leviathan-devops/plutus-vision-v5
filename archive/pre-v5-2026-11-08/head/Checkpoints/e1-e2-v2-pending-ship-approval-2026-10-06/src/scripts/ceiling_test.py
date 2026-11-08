import json, urllib.request, urllib.error, pathlib
D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision")
src = (D / "plutus-vision-v0.pine").read_text()
print("  cell            boxes  labels  lines   over500?")
bad = 0
for pair in ("EUR/USD", "GBP/USD", "DXY"):
    for tf in ("15m", "30m", "1H", "4H"):
        body = json.dumps({"script": src, "pair": pair, "timeframe": tf, "limit": 0}).encode()
        req = urllib.request.Request("http://127.0.0.1:9641/run", data=body,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=240) as r:
                c = (json.load(r).get("data") or {}).get("counts", {})
        except urllib.error.HTTPError as e:
            print(f"  {pair} {tf:<4} ERROR {e.code}"); bad += 1; continue
        b, l, ln = c.get("boxes", 0), c.get("labels", 0), c.get("lines", 0)
        over = "OVER" if b > 500 else "ok"
        if b > 500: bad += 1
        print(f"  {pair:<9} {tf:<4} {b:>5}  {l:>6}  {ln:>5}   {over}")
print(f"\n  cells over the 500 ceiling: {bad}/12")
