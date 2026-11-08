#!/usr/bin/env python3
"""lqz_diag.py — report the detector's internals per timeframe.

Answers the question a box count cannot: did the detector find swings, did price
touch them, did any level reach two touches, and did the cluster confirm anything.

  python3 scripts/lqz_diag.py [indicator.pine]
"""
import json, pathlib, sys, time, urllib.error, urllib.request

W = pathlib.Path(__file__).resolve().parent.parent
ind = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else W / "lqz-plutus.pine"
core = (W / "plutus-vision-lqz/lqz-core.pine").read_text()
render = (W / "plutus-vision-lqz/lqz-render.pine").read_text()

DIAG = """
plot(array.size(lqzLvl),      'trackedLevels')
plot(array.size(lqzLevels),    'sunkLevels')
plot(array.size(lqzZLevel),   'zones')
plot(nz(ta.atr(14), 0),       'atr')
plot(lqzTolP,                 'tolPrice')
"""

HOST = """lqzV1PoolMid()  => float(na)
lqzV1PoolRail() => 0.0
lqzV1SweepPrc() => float(na)
lqzV1VoidLo()   => float(na)
lqzV1VoidHi()   => float(na)
"""


def run(tf, limit):
    script = ("//@version=6\nindicator('lqz diag', overlay = true)\n" + HOST + core
              + DIAG + render + "\nif barstate.islast\n    f_lqzRender()\n")
    body = json.dumps({"script": script, "pair": "EUR/USD", "timeframe": tf, "limit": limit}).encode()
    t0 = time.time()
    raw = urllib.request.urlopen(urllib.request.Request(
        "http://127.0.0.1:9741/run", data=body,
        headers={"Content-Type": "application/json"}), timeout=90).read()
    return json.loads(raw), time.time() - t0


print(f"indicator: {ind.name}")
print(f"{'tf':5} {'bars':>6} {'secs':>6} {'tracked':>8} {'sunk':>6} {'zones':>6} {'atr':>10} {'tolP':>10}")
for tf in ("15m", "30m", "1H", "4H"):
    try:
        r, secs = run(tf, 1603)
    except urllib.error.HTTPError as e:
        print(f"{tf:5} {'-':>6} {'-':>6}  HTTP {e.code} {e.read().decode(errors='replace')[:80]}")
        continue
    d = r.get("data") or {}
    if not r.get("success"):
        print(f"{tf:5} {'-':>6} {secs:6.1f}  ERR {str(r.get('error'))[:80]}")
        continue
    plots = {p["title"]: [x["value"] for x in p["values"] if isinstance(x, dict)]
             for p in d.get("plots") or []}
    def last(k):
        v = [x for x in plots.get(k, []) if isinstance(x, (int, float))]
        return v[-1] if v else 0
    def avg(k):
        v = [x for x in plots.get(k, []) if isinstance(x, (int, float)) and x > 0]
        return sum(v) / len(v) if v else 0
    bars = max((len(v) for v in plots.values()), default=0)
    print(f"{tf:5} {bars:6} {secs:6.1f} {int(last('trackedLevels')):8} "
          f"{int(last('sunkLevels')):6} {int(last('zones')):6} "
          f"{avg('atr'):10.6f} {avg('tolPrice'):10.6f}")