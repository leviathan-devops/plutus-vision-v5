"""POOLS PARITY ADJUDICATION — two-sided, before any verdict.
Side A: was my expectation wrong?  Side B: is the observed behavior a defect?
The merged POOLS must CONTAIN the source's zones. If it draws 0 of 14, that is
either (A) a bar-window artifact, (B) a real regression, or (C) the source's
zones being drawn only under a condition the merge alters. Measure each.
"""
import json, urllib.request, urllib.error, pathlib

W = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION")
URL = "http://127.0.0.1:9741"
src = (W / "sources/buyside-sellside-liquidity.pine").read_text()
lines = (W / "plutus-vision-v0.pine").read_text().split("\n")
S = sorted(i for i, l in enumerate(lines) if l.startswith("// \u2550\u2550\u2550 "))
hdr = lines[:S[0]]
merged_pools = "\n".join(hdr + lines[S[3]:])


def geom(script, limit=0, tf="4H"):
    body = json.dumps({"script": script, "pair": "EUR/USD", "timeframe": tf, "limit": limit}).encode()
    req = urllib.request.Request(f"{URL}/run", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.load(r).get("data") or {}
    except urllib.error.HTTPError as e:
        return None, json.loads(e.read().decode()).get("error", "")[:80]
    dr = d.get("drawings") or {}
    pts = set()
    for b in (dr.get("boxes") or []):
        a, c = b.get("a") or {}, b.get("b") or {}
        if a.get("price") is not None:
            pts.add((round(a["price"], 8), a["time"]))
        if c.get("price") is not None:
            pts.add((round(c["price"], 8), c["time"]))
    return {"boxes": len(dr.get("boxes") or []), "lines": len(dr.get("lines") or []),
            "bars": d.get("bars"), "pts": pts}, ""


print("=" * 78)
print("POOLS PARITY — two-sided adjudication")
print("=" * 78)
S0, e0 = geom(src)
M0, e1 = geom(merged_pools)
print(f"  SOURCE  boxes={S0['boxes'] if S0 else 'ERR'} lines={S0['lines'] if S0 else '-'} "
      f"bars={S0['bars'] if S0 else '-'}  {e0}")
print(f"  MERGED  boxes={M0['boxes'] if M0 else 'ERR'} lines={M0['lines'] if M0 else '-'} "
      f"bars={M0['bars'] if M0 else '-'}  {e1}")

if S0 and M0:
    inter = S0["pts"] & M0["pts"]
    print(f"\n  exact corner-point matches : {len(inter)} of {len(S0['pts'])} source points")
    print(f"  source-only (MISSING)      : {len(S0['pts'] - M0['pts'])}")
    print(f"  merged-only (extra)        : {len(M0['pts'] - S0['pts'])}")
    print("\n  SIDE A — was my probe wrong?")
    print(f"    both ran on the SAME bars ({S0['bars']} vs {M0['bars']}) — "
          f"{'consistent' if S0['bars']==M0['bars'] else 'MISMATCH'}")
    print("    comparison uses every corner point, not a count — window-independent")
    print("\n  SIDE B — is the observed behavior a real defect?")
    if len(S0["pts"] - M0["pts"]) == 0:
        print("    VERDICT: PARITY — the merge CONTAINS every source zone.")
    else:
        miss = sorted(S0["pts"] - M0["pts"])[:6]
        print(f"    VERDICT: REAL REGRESSION — {len(S0['pts']-M0['pts'])} source corners absent.")
        print(f"    first missing (price,time): {miss}")
        print("    NOTE: check the merged gate — `bsl_count > 2` must be IDENTICAL to source `count > 2`,")
        print("          and the pool arrays must be seeded identically (source seeds 1 element).")
