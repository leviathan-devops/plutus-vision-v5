import pathlib
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/scripts/w4_render_parity.py")
t = p.read_text()
old = '''    for lb in labels:
        ax.plot([lb["time"]], [lb.get("price", lb.get("a", {}).get("price"))], marker="o", ms=3.5,
                color=(lb.get("textColor") or lb.get("color") or "#f23645"), alpha=0.85, ls="none")'''
new = '''    for lb in labels:
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
        nlabels += 1'''
assert old in t, "labels anchor still missing"
t = t.replace(old, new, 1)
p.write_text(t)
print("  labels corrected (time/price + style-aware marker + text)")
