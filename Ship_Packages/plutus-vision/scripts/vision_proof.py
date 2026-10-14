"""PLUTUS VISION — the vision proof inside the sandbox.
Renders the MERGE and each of the 4 ORIGINALS from THIS station (9741) into
PNGs, then compares the merged geometry against each source's geometry
per-object (time + price), so parity is measured, not asserted.
"""
import json, urllib.request, urllib.error, pathlib, urllib.parse, hashlib, datetime, sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

W = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION")
OUT = W / "vision_frames"
OUT.mkdir(exist_ok=True)
URL = "http://127.0.0.1:9741"
CORE = {
    "smc": W / "smart-money-concepts.pine",
    "sweeps": W / "sources/liquidity-sweeps.pine",
    "voids": W / "sources/liquidity-voids-fvg.pine",
    "pools": W / "sources/buyside-sellside-liquidity.pine",
}


def bars_for(pair="EUR/USD", tf="4H"):
    q = urllib.parse.urlencode({"pair": pair, "timeframe": tf})
    with urllib.request.urlopen(f"{URL}/bars?{q}", timeout=90) as r:
        return (json.load(r).get("data") or {}).get("bars") or []


def run(script, pair="EUR/USD", tf="4H", limit=0):
    body = json.dumps({"script": script, "pair": pair, "timeframe": tf, "limit": limit}).encode()
    req = urllib.request.Request(f"{URL}/run", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.load(r).get("data") or {}
    except urllib.error.HTTPError as e:
        return {"__err__": json.loads(e.read().decode()).get("error", "")[:80]}


def draw(name, rd, bars, path):
    if "__err__" in rd:
        print(f"  {name:<14} SKIP  {rd['__err__'][:48]}")
        return None
    dr = rd.get("drawings") or {}
    boxes, lines, labels = dr.get("boxes") or [], dr.get("lines") or [], dr.get("labels") or []
    if not bars:
        print(f"  {name:<14} SKIP  no bars")
        return None
    xs = [b["time"] for b in bars]
    lo, hi = min(b["low"] for b in bars), max(b["high"] for b in bars)
    span = (hi - lo) or 1.0
    fig, ax = plt.subplots(figsize=(17, 6.5), dpi=110)
    ax.plot(xs, [b["close"] for b in bars], lw=0.7, color="#222")
    ax.fill_between(xs, [b["low"] for b in bars], [b["high"] for b in bars], color="#ddd", alpha=0.4)
    db = dl = dt = 0
    for b in boxes:
        a, c = b.get("a") or {}, b.get("b") or {}
        if None in (a.get("time"), a.get("price"), c.get("time"), c.get("price")):
            continue
        w = max(xs[-1] - xs[0], 1) * 0.004
        ax.add_patch(Rectangle((a["time"], min(a["price"], c["price"])), w,
                               max(span * 2e-4, abs(a["price"] - c["price"])),
                               facecolor=b.get("color") or "#4caf50", alpha=0.3, edgecolor="none"))
        db += 1
    for l in lines:
        a, b = l.get("a") or {}, l.get("b") or {}
        if None in (a.get("time"), a.get("price"), b.get("time"), b.get("price")):
            continue
        ax.plot([a["time"], b["time"]], [a["price"], b["price"]],
                lw=float(l.get("width") or 1.0), color=l.get("color") or "#2157f3",
                ls=":" if "dotted" in str(l.get("style")) else "--" if "dashed" in str(l.get("style")) else "-",
                alpha=0.9)
        dl += 1
    for t in labels:
        lt, lp = t.get("time"), t.get("price")
        if lt is None or lp is None:
            continue
        st = str(t.get("style") or "")
        col = t.get("textColor") or "#f23645"
        dy = span * 0.012
        if "down" in st:
            ax.plot([lt], [lp + dy], marker="v", ms=5, color=col, alpha=0.9, ls="none")
        elif "up" in st:
            ax.plot([lt], [lp - dy], marker="^", ms=5, color=col, alpha=0.9, ls="none")
        else:
            ax.plot([lt], [lp], marker="o", ms=4, color=col, alpha=0.85, ls="none")
        if t.get("text"):
            ax.annotate(str(t["text"]), (lt, lp), fontsize=5.5, color=col, xytext=(2, 2),
                        textcoords="offset points")
        dt += 1
    ax.set_title(f"{name}   boxes {db}/{len(boxes)}  lines {dl}/{len(lines)}  labels {dt}/{len(labels)}",
                 fontsize=11)
    ax.set_ylim(lo - span * 0.02, hi + span * 0.02)
    ax.grid(alpha=0.15)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)
    sha = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
    print(f"  {name:<14} boxes {db}/{len(boxes):<4} lines {dl}/{len(lines):<4} "
          f"labels {dt}/{len(labels):<4} -> {path.name}  sha={sha}")
    return {"boxes": len(boxes), "boxes_drawn": db, "lines": len(lines), "lines_drawn": dl,
            "labels": len(labels), "labels_drawn": dt, "png": path.name, "sha": sha,
            "geom": [[[round(x["price"], 8), x["time"]] for x in [b["a"], b["b"]]]
                     for b in boxes if (b.get("a") or {}).get("price") is not None]}


print("=" * 78)
print("PLUTUS VISION — VISION PROOF (sandbox :9741)")
print("=" * 78)
bars = bars_for()
print(f"  bars {len(bars)}  EUR/USD 4H\n")

res = {}
print("[THE 4 ORIGINALS]")
for nm, p in CORE.items():
    res[nm] = draw(f"src:{nm}", run(p.read_text()), bars, OUT / f"src-{nm}.png")

print("\n[THE MERGE]")
merged = run((W / "plutus-vision-v0.pine").read_text())
res["merge"] = draw("PLUTUS VISION", merged, bars, OUT / "plutus-vision-merged.png")

# per-object geometry comparison
print("\n[PARITY — merged geometry vs each source]")
cmp_rows = []
for nm in CORE:
    s, m = res.get(nm), res.get("merge")
    if not s or not m:
        cmp_rows.append((nm, "NO SOURCE RUN", "", ""))
        continue
    sg = {(round(a[0], 8), a[1]) for pair in s["geom"] for a in pair}
    mg = {(round(a[0], 8), a[1]) for pair in m["geom"] for a in pair}
    inter = sg & mg
    print(f"  {nm:<8} src {s['boxes_drawn']:>3} boxes | merged {m['boxes_drawn']:>3} | "
          f"exact-match {len(inter)} | src-only {len(sg-mg)} | merged-only {len(mg-sg)}")
    cmp_rows.append((nm, s["boxes_drawn"], m["boxes_drawn"], len(inter)))

(W / "VISION_PROOF.json").write_text(json.dumps(
    {"at": datetime.datetime.now().isoformat(timespec="seconds"), "station": URL,
     "bars": len(bars), "frames": {k: (v or {}) for k, v in res.items()},
     "parity": cmp_rows}, indent=2))
print(f"\n  frames -> {OUT}")
print(f"  proof   -> {W / 'VISION_PROOF.json'}")
