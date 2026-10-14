import sys
from PIL import Image

src = sys.argv[1]
out = sys.argv[2]
top = int(sys.argv[3]) if len(sys.argv) > 3 else 0
height = int(sys.argv[4]) if len(sys.argv) > 4 else 1100

im = Image.open(src)
print("full:", im.size)
crop = im.crop((0, top, im.width, min(im.height, top + height)))
crop.save(out)
print("crop:", crop.size, "->", out)
