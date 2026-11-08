#!/usr/bin/env python3
"""compare — run each LuxAlgo source ALONE and the merged bundle on the SAME bars
through the real pine-station (:9741), then diff the geometry per subsystem.

  python3 compare.py [limit]        default limit 1603 (the full fixture week, 1H)

Per source: counts + error. Then geometry parity: every source drawing keyed by
(kind, rounded anchors, text) must appear in the merged output. Prints
exact-match / source-only / merged-only per subsystem and exits 1 on any loss.
"""
import json, sys, urllib.request, pathlib
from collections import Counter

W = pathlib.Path(__file__).resolve().parent.parent
SRC = W / "sources"   # the 4 cores, sha-identical to luxalgo-smc/sources
CORES = {
    "SMC": "smart-money-concepts-smc.pine",
    "SWEEPS": "liquidity-sweeps.pine",
    "VOIDS": "liquidity-voids-fvg.pine",
    "POOLS": "buyside-sellside-liquidity.pine",
}
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 1603


def run(script):
    body = json.dumps({"script": script, "pair": "EUR/USD", "timeframe": "1H", "limit": LIMIT}).encode()
    req = urllib.request.Request("http://127.0.0.1:9741/run", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        return json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        return json.loads(e.read() or b"{}") or {"success": False, "error": f"HTTP {e.code}"}


def r5(x):
    return None if x is None else round(float(x), 5)


def keys(data):
    """Canonical geometry keys for every drawing the run emitted."""
    out = Counter()
    dr = data.get("drawings") or {}
    ab = lambda o: (o["a"]["time"], r5(o["a"]["price"]), o["b"]["time"], r5(o["b"]["price"]))
    for b in dr.get("boxes") or []:
        out[("box",) + ab(b) + (b.get("color"),)] += 1
    for l in dr.get("lines") or []:
        out[("line",) + ab(l) + (l.get("color"),)] += 1
    for l in dr.get("labels") or []:
        out[("label", l.get("time"), r5(l.get("price")), l.get("text"))] += 1
    return out


res = {}
for name, f in CORES.items():
    r = run((SRC / f).read_text())
    d = r.get("data") or {}
    res[name] = (r, d)
    print(f"{name:7} ok={r.get('success')} counts={json.dumps(d.get('counts'))} "
          f"err={str(r.get('error') or r.get('code') or '')[:160]}")

mr = run((W / "plutus-vision-v0.pine").read_text())
md = mr.get("data") or {}
print(f"MERGED  ok={mr.get('success')} counts={json.dumps(md.get('counts'))} "
      f"err={str(mr.get('error') or '')[:160]}")
if not mr.get("success"):
    sys.exit(1)

mk = keys(md)
print("\n=== geometry parity (source drawing present in merged?) ===")
lost = 0
union = Counter()
for name, (r, d) in res.items():
    if not r.get("success"):
        print(f"  {name:7} SOURCE FAILED — cannot compare")
        lost += 1
        continue
    sk = keys(d)
    union += sk
    miss = sk - mk
    hit = sum((sk & mk).values())
    print(f"  {name:7} source={sum(sk.values()):4} matched={hit:4} missing={sum(miss.values()):4}")
    for k in list(miss)[:5]:
        print(f"           missing e.g. {k}")
    lost += sum(miss.values())
extra = mk - union
print(f"  MERGED-ONLY drawings (not in any source): {sum(extra.values())}")
for k in list(extra)[:5]:
    print(f"           extra e.g. {k}")
(W / "COMPARE.json").write_text(json.dumps({
    "limit": LIMIT,
    "sources": {n: {"ok": r.get("success"), "counts": d.get("counts")} for n, (r, d) in res.items()},
    "merged": md.get("counts"), "lost": lost, "extra": sum(extra.values())}, indent=1))
print(f"\nVERDICT: {'PARITY' if lost == 0 and not extra else 'DELTA'} lost={lost} extra={sum(extra.values())}")
sys.exit(0 if lost == 0 else 1)
