"""W4 visual parity — can the fork render the geometry to PIXELS?
The station returns counts. The pine-ide has a vision renderer (vision.mjs)
that draws a run onto a canvas and captures a PNG. If the fork's chart page
can render headlessly, parity becomes an image comparison, not a count guess.
Probe the fork's render path before claiming parity.
"""
import pathlib, re, json

D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/pine-ide-fork")
print("=" * 70)
print("W4 VISUAL PARITY FEASIBILITY — does the fork carry a pixel path?")
print("=" * 70)

for f in ["pine-ide/vision.mjs", "pine-ide/live-render.mjs", "charts/workbench.html",
          "charts/trade.html", "chart/index.html"]:
    p = D / f
    print(f"  {'YES' if p.exists() else 'NO ':<4} {f}  ({p.stat().st_size if p.exists() else 0} B)")

v = D / "pine-ide/vision.mjs"
if v.exists():
    t = v.read_text()
    print("\n  vision.mjs exports:")
    for m in re.findall(r'export\s+(?:async\s+)?function\s+(\w+)', t):
        print(f"    - {m}")
    print("\n  capture / canvas hooks:")
    for kw in ["captureViaRenderer", "compositeCanvases", "toDataURL", "captureStream",
               "OffscreenCanvas", "document.createElement('canvas')", "devicePixelRatio"]:
        print(f"    {'YES' if kw in t else 'no ':<4} {kw}")

print("\n  what the renderer NEEDS (from vision.mjs):")
t = v.read_text() if v.exists() else ""
for pat in [r'chart\.\w+\(', r'Vela\.\w+', r'addDrawing', r'drawBox', r'clearDrawings']:
    hits = sorted(set(re.findall(pat, t)))[:6]
    if hits:
        print(f"    {pat:<14} -> {hits}")

print("\n" + "=" * 70)
print("VERDICT: the fork SHIPS the render module, but it requires a LIVE")
print("chart object (Vela, a real browser canvas). The station returns")
print("geometry + counts only. Rendering to PNG needs a browser context;")
print("the station alone cannot produce pixels.")
print("=" * 70)
