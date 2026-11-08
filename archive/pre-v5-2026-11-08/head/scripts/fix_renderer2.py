import pathlib
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/scripts/w4_render_parity.py")
t = p.read_text()
old = """    for b in boxes:
        a, c = b["a"], b["b"]
        ax.add_patch(Rectangle((a["time"], c["price"]), max(1, xf(c["time"]) - a["time"]),
                               max(span * 2e-4, a["price"] - c["price"]),
                               facecolor=(b.get("color") or "#4caf50"), alpha=0.30, edgecolor="none"))"""
new = """    drawn = 0
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
        drawn += 1"""
assert old in t, "box block anchor missing"
t = t.replace(old, new, 1)
t = t.replace('    for l in lines:\n        vs = [v for v in (l.get("values") or []) if v.get("value") is not None]',
              '    nlines = 0\n    for l in lines:\n        vs = [v for v in (l.get("values") or []) if v.get("value") is not None]')
t = t.replace('            ax.plot([v["time"] for v in vs], [v["value"] for v in vs],\n                    lw=1.0, color=(l.get("color") or "#2157f3"), alpha=0.9)',
              '            ax.plot([v["time"] for v in vs], [v["value"] for v in vs],\n                    lw=1.0, color=(l.get("color") or "#2157f3"), alpha=0.9)\n            nlines += 1')
t = t.replace('    for lb in labels:\n        ax.plot([lb["time"]], [lb.get("price", lb.get("a", {}).get("price"))], marker="o",\n                color=(lb.get("textColor") or lb.get("color") or "#f23645"), alpha=0.85, ls="none")',
              '    nlabels = 0\n    for lb in labels:\n        lt, lp = lb.get("time"), lb.get("price")\n        if lp is None:\n            continue\n        ax.plot([lt], [lp], marker="o", ms=3.5,\n                color=(lb.get("textColor") or lb.get("color") or "#f23645"), alpha=0.85, ls="none")\n        nlabels += 1')
t = t.replace('    ax.set_title(f"{name}   boxes={len(boxes)} lines={len(lines)} labels={len(labels)}")',
              '    ax.set_title(f"{name}   boxes={drawn}/{len(boxes)} lines={nlines}/{len(lines)} labels={nlabels}/{len(labels)}")')
t = t.replace('    return {"boxes": len(boxes), "lines": len(lines), "labels": len(labels), "sha": sha}',
              '    return {"boxes": len(boxes), "boxes_drawn": drawn, "lines": len(lines),\n            "lines_drawn": nlines, "labels": len(labels), "labels_drawn": nlabels, "sha": sha}')
t = t.replace('    print(f"  {name:<12} boxes={len(boxes):<4} lines={len(lines):<4} labels={len(labels):<4} -> {path.name} sha={sha}")',
              '    print(f"  {name:<12} boxes={drawn}/{len(boxes):<4} lines={nlines}/{len(lines):<4} labels={nlabels}/{len(labels):<4} -> {path.name} sha={sha}")')
p.write_text(t)
print("  renderer hardened: unanchored geometry skipped and counted, not crashed")
