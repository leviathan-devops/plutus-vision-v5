import json, urllib.request, pathlib, base64, sys

W = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION")
merged = (W / "plutus-vision-v0.pine").read_text()
print(f"merged: {len(merged)} bytes, {len(merged.splitlines())} lines")

tgt = [t for t in json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list"))
       if t.get("type") == "page" and "9851" in t.get("url", "")][0]
print("page:", tgt["url"])

# drive via the CDP websocket
import websocket  # may be absent; fall back to raw
print("ws lib:", "yes")
