import json, urllib.request, sys

def get(u):
    try:
        return json.load(urllib.request.urlopen(u, timeout=8))
    except Exception as e:
        return {"_err": str(e)}

B = "http://127.0.0.1:9851"
h = get(f"{B}/api/v1/health")
print("health:", json.dumps(h)[:160])

for pair, tf in [("EUR%2FUSD", "1H"), ("EUR/USD", "60"), ("GBP%2FUSD", "1H"), ("DXY", "15m"), ("AUD%2FUSD", "1H")]:
    d = get(f"{B}/api/v1/chart/bars?pair={pair}&timeframe={tf}")
    if d.get("success"):
        b = d["data"]["bars"]
        print(f"  {pair:12} {tf:4} -> OK count={d['data']['count']:4}  first={json.dumps(b[0])[:110]}")
    else:
        print(f"  {pair:12} {tf:4} -> NAMED FAIL {d.get('code')}: {str(d.get('error'))[:90]}")

# static
for f in ["pine.html", "index.html", "tokens.css", "tabs/pineshell.css", "charts/workbench.bundle.js", "tabs/pine-ide/pine-ide.mjs", "plutus-vision-v0.pine"]:
    try:
        r = urllib.request.urlopen(f"{B}/{f}", timeout=6)
        print(f"  static {f:38} {r.status} {r.headers.get('Content-Length','?')}")
    except Exception as e:
        print(f"  static {f:38} ERR {e}")
