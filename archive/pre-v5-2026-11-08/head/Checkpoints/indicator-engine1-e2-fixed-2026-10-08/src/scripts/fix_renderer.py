import pathlib
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/scripts/w4_render_parity.py")
t = p.read_text()
t = t.replace(
    'ax.add_patch(Rectangle((a["time"], c["price"]), max(1, xf(c["time"]) - a["time"]),\n'
    '                               max(span * 2e-4, b["price"] - a["price"]),',
    'ax.add_patch(Rectangle((a["time"], c["price"]), max(1, xf(c["time"]) - a["time"]),\n'
    '                               max(span * 2e-4, a["price"] - c["price"]),')
t = t.replace('ax.plot([lb["time"]], [lb["a"]["price"]], marker="o"',
              'ax.plot([lb["time"]], [lb.get("price", lb.get("a", {}).get("price"))], marker="o"')
t = t.replace('color=(lb.get("color") or "#f23645"), alpha=0.85, ls="none")',
              'color=(lb.get("textColor") or lb.get("color") or "#f23645"), alpha=0.85, ls="none")')
t = t.replace('facecolor=(b.get("color") or "#4caf50")', 'facecolor=(b.get("color") or "#4caf50")')
p.write_text(t)
print("  renderer patched for a.price / b.price")
