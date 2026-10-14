import pathlib, re
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/scripts/w4_render_parity.py")
t = p.read_text()
# force-initialize all three counters right after the boxes list is read
anchor = '    labels = dr.get("labels") or []\n'
assert anchor in t
t = t.replace(anchor, anchor + '    drawn = nlines = nlabels = 0\n', 1)
# remove the later duplicate initializations
t = t.replace('    drawn = 0\n    for b in boxes:', '    for b in boxes:')
t = t.replace('    nlines = 0\n    for l in lines:', '    for l in lines:')
t = t.replace('    nlabels = 0\n    for lb in labels:', '    for lb in labels:')
p.write_text(t)
print("  counters initialized once, before any loop")
