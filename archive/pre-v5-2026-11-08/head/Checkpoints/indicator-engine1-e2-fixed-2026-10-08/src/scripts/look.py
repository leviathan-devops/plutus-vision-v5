import json, urllib.request, base64, pathlib, sys

png = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/pv-cap-wide.png")
b64 = base64.b64encode(png.read_bytes()).decode()
body = json.dumps({
    "image_base64": b64,
    "task": "vision verdict: does this chart render the Plutus vision indicator (zone boxes / shape line / labels)? Reply PASS, FAIL or INCONCLUSIVE with one sentence.",
    "stats": {"width": 816, "height": 640},
}).encode()
req = urllib.request.Request("http://127.0.0.1:9754/vil/look", data=body,
                             headers={"Content-Type": "application/json"}, method="POST")
r = json.load(urllib.request.urlopen(req, timeout=130))
d = r.get("data", r)
print("VERDICT:", d.get("verdict"))
print("ANSWERS:", json.dumps(d.get("answers")))
print("NOTE:", d.get("note"))
print("MODEL:", d.get("model"), "|", d.get("ms"), "ms")
