import sys
from PIL import Image

# 1 · crop the chart region out of the full-viewport screenshot
full = Image.open("/tmp/pv-full.png")
print("full viewport:", full.size)
chart = full.crop((750, 0, min(1626, full.width), min(875, full.height)))
chart.save("/tmp/pv-full-chart.png")
print("chart region:", chart.size)

# 2 · scale the IDE's own composite down so the whole layout is viewable
try:
    comp = Image.open("/tmp/pv-ide-capture.png")
    print("composite:", comp.size)
    # the composite is very tall; split into the top page-height and scale
    h = 1200
    top = comp.crop((0, 0, comp.width, min(h, comp.height)))
    scale = 1100 / max(1, top.height)
    top = top.resize((int(top.width * scale), int(top.height * scale)))
    top.save("/tmp/pv-comp-top.png")
    print("composite top scaled:", top.size)
except Exception as e:
    print("composite err:", e)
