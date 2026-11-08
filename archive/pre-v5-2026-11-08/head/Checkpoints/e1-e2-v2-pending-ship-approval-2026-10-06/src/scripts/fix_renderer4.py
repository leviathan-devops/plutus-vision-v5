import pathlib, re
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/scripts/w4_render_parity.py")
t = p.read_text()

old_lines = """    for l in lines:
        vs = [v for v in (l.get("values") or []) if v.get("value") is not None]
        if len(vs) > 1:
            ax.plot([v["time"] for v in vs], [v["value"] for v in vs],
                    lw=1.0, color=(l.get("color") or "#2157f3"), alpha=0.9)
            nlines += 1"""
new_lines = """    for l in lines:
        # the station emits a line as {a:{time,price}, b:{time,price}} — a 2-point
        # segment (trident uses hlines/levels), NOT a values[] series.
        a, b = l.get("a") or {}, l.get("b") or {}
        if None in (a.get("time"), a.get("price"), b.get("time"), b.get("price")):
            continue
        ax.plot([a["time"], b["time"]], [a["price"], b["price"]],
                lw=float(l.get("width") or 1.0),
                color=(l.get("color") or "#2157f3"),
                ls=":" if "dotted" in str(l.get("style")) else
                   "--" if "dashed" in str(l.get("style")) else "-",
                alpha=0.9)
        nlines += 1"""
assert old_lines in t, "lines block anchor missing"
t = t.replace(old_lines, new_lines, 1)

old_lab = """    for lb in labels:
        lt, lp = lb.get("time"), lb.get("price")
        if lp is None:
            continue
        ax.plot([lt], [lp], marker="o", ms=3.5,
                color=(lb.get("textColor") or lb.get("color") or "#f23645"), alpha=0.85, ls="none")
        nlabels += 1"""
new_lab = """    for lb in labels:
        lt, lp = lb.get("time"), lb.get("price")
        if lt is None or lp is None:
            continue
        st = str(lb.get("style") or "")
        mk = "^" if "down" in st else ("v" if "up" in st else "o")
        dy = span * 0.012
        if "down" in st:
            ax.plot([lt], [lp + dy], marker=mk, ms=5,
                    color=(lb.get("textColor") or "#f23645"), alpha=0.9, ls="none")
        elif "up" in st:
            ax.plot([lt], [lp - dy], marker=mk, ms=5,
                    color=(lb.get("textColor") or "#089981"), alpha=0.9, ls="none")
        else:
            ax.plot([lt], [lp], marker=mk, ms=4,
                    color=(lb.get("textColor") or "#f23645"), alpha=0.85, ls="none")
        txt = str(lb.get("text") or "")
        if txt:
            ax.annotate(txt, (lt, lp), fontsize=5.5, color=(lb.get("textColor") or "#333"),
                        xytext=(2, 2), textcoords="offset points")
        nlabels += 1"""
assert old_lab in t, "labels block anchor missing"
t = t.replace(old_lab, new_lab, 1)
p.write_text(t)
print("  renderer corrected: lines=a/b segments, labels=time/price with text")
