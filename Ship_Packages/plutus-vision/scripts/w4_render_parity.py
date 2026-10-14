"""W4 VISUAL PARITY — render the station's ACTUAL geometry to PNG.
The station returns drawings (boxes/lines/labels with time+price) plus the
bar series. We plot exactly what the engine emitted — no invented geometry —
so the PNG is a faithful picture of the run, and source-vs-merged can be
compared as images, not counts.
"""
import json, urllib.request, urllib.error, pathlib, hashlib, datetime

D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision")
OUT = D / "parity_frames"
OUT.mkdir(exist_ok=True)
URL = "http://127.0.0.1:9641"
BASE = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/luxalgo-smc")
MERGED = D / "plutus-vision-v0.pine"
SOURCES = {
    "smc": "smart-money-concepts.pine",
    "sweeps": "sources/liquidity-sweeps.pine",
    "voids": "sources/liquidity-voids-fvg.pine",
    "pools": "sources/buyside-sellside-liquidity.pine",
}

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle


def bars_for(pair="EUR/USD", tf="4H", limit=300):
    q = urllib.request.urlopen(f"{URL}/bars?pair={urllib.parse.quote(pair)}&timeframe={tf}", timeout=60)
    d = json.load(q).get("data") or {}
    return d.get("bars") or []


def run(script, pair="EUR/USD", tf="4H", limit=300):
    body = json.dumps({"script": script, "pair": pair, "timeframe": tf, "limit": limit}).encode()
    req = urllib.request.Request(f"{URL}/run", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            return json.load(r).get("data") or {}
    except urllib.error.HTTPError as e:
        return {"__error__": json.loads(e.read().decode()).get("error", "")[:90]}


def render(name, run_data, bars, path):
    if "__error__" in run_data:
        print(f"  {name:<12} SKIP ({run_data['__error__'][:52]})")
        return None
    dr = run_data.get("drawings") or {}
    boxes = dr.get("boxes") or []
    lines = dr.get("lines") or []
    labels = dr.get("labels") or []
    drawn = nlines = nlabels = 0
    if not bars:
        print(f"  {name:<12} SKIP (no bars)")
        return None
    xs = [b["time"] for b in bars]
    lo = min(b["low"] for b in bars)
    hi = max(b["high"] for b in bars)
    span = (hi - lo) or 1.0
    fig, ax = plt.subplots(figsize=(16, 6), dpi=110)
    ax.plot(xs, [b["close"] for b in bars], lw=0.7, color="#333333", label="close")
    ax.fill_between(xs, [b["low"] for b in bars], [b["high"] for b in bars],
                    color="#cccccc", alpha=0.35)
    t0, t1 = xs[0], xs[-1]
    def xf(t):
        return t0 + (t - t0) * (t1 - t0) / max(1e-9, (t1 - t0))
    for b in boxes:
        a, c = b.get("a") or {}, b.get("b") or {}
        pa, pc = a.get("price"), c.get("price")
        ta, tc = a.get("time"), c.get("time")
        if pa is None or pc is None or ta is None or tc is None:
            continue          # the engine emitted an unanchored box; skip, count later
        w = max(1.0, xf(tc) - ta)
        h = max(span * 2e-4, abs(pa - pc))
        ax.add_patch(Rectangle((ta, min(pa, pc)), w, h,
                               facecolor=(b.get("color") or "#4caf50"), alpha=0.30, edgecolor="none"))
        drawn += 1
    for l in lines:
        vs = [v for v in (l.get("values") or []) if v.get("value") is not None]
        if len(vs) > 1:
            ax.plot([v["time"] for v in vs], [v["value"] for v in vs],
                    lw=1.0, color=(l.get("color") or "#2157f3"), alpha=0.9)
            nlines += 1
    for lb in labels:
        lt, lp = lb.get("time"), lb.get("price")
        if lt is None or lp is None:
            continue
        st = str(lb.get("style") or "")
        col = lb.get("textColor") or "#f23645"
        dy = span * 0.012
        if "down" in st:
            ax.plot([lt], [lp + dy], marker="v", ms=5, color=col, alpha=0.9, ls="none")
        elif "up" in st:
            ax.plot([lt], [lp - dy], marker="^", ms=5, color=col, alpha=0.9, ls="none")
        else:
            ax.plot([lt], [lp], marker="o", ms=4, color=col, alpha=0.85, ls="none")
        txt = str(lb.get("text") or "")
        if txt:
            ax.annotate(txt, (lt, lp), fontsize=5.5, color=col,
                        xytext=(2, 2), textcoords="offset points")
        nlabels += 1
    ax.set_title(f"{name}   boxes={drawn}/{len(boxes)} lines={nlines}/{len(lines)} labels={nlabels}/{len(labels)}")
    ax.set_ylim(lo - span * 0.02, hi + span * 0.02)
    ax.grid(alpha=0.15)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)
    sha = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
    print(f"  {name:<12} boxes={drawn}/{len(boxes):<4} lines={nlines}/{len(lines):<4} labels={nlabels}/{len(labels):<4} -> {path.name} sha={sha}")
    return {"boxes": len(boxes), "boxes_drawn": drawn, "lines": len(lines),
            "lines_drawn": nlines, "labels": len(labels), "labels_drawn": nlabels, "sha": sha}


print("=" * 74)
print("W4 VISUAL PARITY — rendering the station's real geometry")
print("=" * 74)
bars = bars_for()
print(f"  bars: {len(bars)} (EUR/USD 4H)")
summary = {}

print("\n[SOURCES]")
for name, rel in SOURCES.items():
    summary[name] = render(f"src:{name}", run((BASE / rel).read_text()), bars, OUT / f"src-{name}.png")

print("\n[MERGED]")
lines_ = MERGED.read_text().split("\n")
S = sorted(i for i, l in enumerate(lines_) if l.startswith("// \u2550\u2550\u2550 "))
hdr = lines_[:S[0]]
for name, idx in (("smc", S[0]), ("sweeps", S[1]), ("voids", S[2]), ("pools", S[3])):
    end = S[idx + 1] if idx + 1 < len(S) else len(lines_)
    summary[f"mrg:{name}"] = render(f"mrg:{name}", run("\n".join(hdr + lines_[idx:end])), bars,
                                    OUT / f"mrg-{name}.png")

print("\n[FULL MERGE]")
summary["mrg:full"] = render("mrg:FULL", run(MERGED.read_text()), bars, OUT / "mrg-full.png")

(D / "PARITY_FRAMES.json").write_text(json.dumps(
    {"rendered": datetime.datetime.now().isoformat(timespec="seconds"),
     "engine": "PineTS 0.10.0 :9641", "bars": len(bars), "frames": summary}, indent=2))
print(f"\n  frames -> {OUT}")
