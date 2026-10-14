"""ISOLATE the POOLS regression. Was it MY budget guard, or the merge?
Re-run the merged POOLS with each candidate change reverted in-memory.
  A · as-merged
  B · budget guards removed
  C · visLiq pop removed
  D · both removed
Compare box counts against the SOURCE's 14.
"""
import json, urllib.request, urllib.error, pathlib, re

W = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION")
URL = "http://127.0.0.1:9741"
src = (W / "sources/buyside-sellside-liquidity.pine").read_text()
lines = (W / "plutus-vision-v0.pine").read_text().split("\n")
S = sorted(i for i, l in enumerate(lines) if l.startswith("// \u2550\u2550\u2550 "))
merged_pools = "\n".join(lines[:S[0]] + lines[S[3]:])


def boxes(script, label):
    body = json.dumps({"script": script, "pair": "EUR/USD", "timeframe": "4H", "limit": 0}).encode()
    req = urllib.request.Request(f"{URL}/run", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.load(r).get("data") or {}
        dr = d.get("drawings") or {}
        b, l = len(dr.get("boxes") or []), len(dr.get("lines") or [])
        print(f"  {label:<34} boxes={b:<4} lines={l}")
        return b, l
    except urllib.error.HTTPError as e:
        print(f"  {label:<34} ERROR {json.loads(e.read().decode()).get('error','')[:50]}")
        return -1, -1


print("=" * 78)
print("POOLS REGRESSION ISOLATION — source draws 14 boxes / 10 lines")
print("=" * 78)
sb, sl = boxes(src, "A0 · SOURCE (control)")
a, b = boxes(merged_pools, "A · merged as-is")

# B: strip the budget guards
nog = merged_pools
for pat in (r"\n *if bsl_b_liq_B\.size\(\) < \d+\n *bsl_drops \+= 1",
            r"\n *if bsl_b_liq_S\.size\(\) < \d+\n *bsl_drops \+= 1"):
    nog = re.sub(pat, "", nog)
bb, bl = boxes(nog, "B · merged, budget guards removed")

# C: strip the visLiq pop
nov = re.sub(r"\n *if bsl_b_liq_[BS]\.size\(\) > bsl_visLiq\n(?:.*\n)*?(?= *\n)", "\n", merged_pools)
cb, cl = boxes(nov, "C · merged, visLiq pop removed")

# D: both
d = re.sub(r"\n *if bsl_b_liq_[BS]\.size\(\) > bsl_visLiq\n(?:.*\n)*?(?= *\n)", "\n", nog)
db, dl = boxes(d, "D · both removed")

print("\n" + "=" * 78)
print("VERDICT")
print("=" * 78)
print(f"  source          boxes={sb} lines={sl}")
print(f"  merged as-is    boxes={a}  lines={b}   -> {'MATCH' if a == sb else 'REGRESSED'}")
for lbl, bb2, bl2 in (("B no-budget", bb, bl), ("C no-visLiq", cb, cl), ("D both", db, dl)):
    print(f"  {lbl:<15} boxes={bb2} lines={bl2}   -> {'MATCHES SOURCE' if bb2 == sb else 'still differs'}")
