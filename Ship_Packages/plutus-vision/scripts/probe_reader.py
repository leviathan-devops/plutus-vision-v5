import json, urllib.request, base64, pathlib, sys

# 1 · is the VIL rail up?
for p in (9444, 9441, 4171):
    try:
        r = urllib.request.urlopen(f"http://127.0.0.1:{p}/", timeout=4)
        print(f"  :{p} -> {r.status}")
    except Exception as e:
        print(f"  :{p} -> {type(e).__name__}: {str(e)[:70]}")

# 2 · what does the reader see? POST the real capture to /vil/look
png = pathlib.Path("/tmp/pv-comp-fixed.png")
if not png.exists():
    print("no capture to test with")
    sys.exit(0)
b64 = base64.b64encode(png.read_bytes()).decode()
body = json.dumps({
    "image_base64": b64,
    "task": "vision verdict: does this chart render the Plutus vision indicator (zone boxes / shape line / labels)? Reply PASS, FAIL or INCONCLUSIVE with one sentence.",
    "stats": {"width": 816, "height": 640, "nonBackground": 0.3478},
}).encode()
try:
    req = urllib.request.Request("http://127.0.0.1:9444/vil/look", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    r = json.load(urllib.request.urlopen(req, timeout=130))
    print("READER REPLY:", json.dumps(r)[:600])
except Exception as e:
    print("READER ERR:", type(e).__name__, str(e)[:300])
