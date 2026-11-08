#!/usr/bin/env python3
"""lqz_panel_ide.py — compose the four-panel IDE grids from the LEDGER, newest row wins.

THE SELECTION BUG THIS FIXES (found by looking at the output, not by reading the code):
The first version keyed `best[(pineSha, timeframe)] = row` in FILE ORDER, so the LAST row in
the file won. The ledger is append-only and holds MANY rows per (deliverable, TF) — including
runs made BEFORE the vision.mjs fill fix. The 15m grid therefore showed a D1 panel with the
brass slabs still on it, while the run that produced it had measured nonBg 0.16821 (clean).
**A stale row rendered as the current state.** The fix: select by the row's own `createdAt`,
so the newest capture is the one that reaches the grid.

Every panel is a ledger row's own `pngPath`, so the image cannot contain a frame the ledger
does not name.
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

R = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION")
LEDGER = R / "vil/2026-W29.jsonl"

# THE SHAS COME FROM THE FILES, NOT A HARD-CODED MAP.
# The map was hard-coded and D1's sha CHANGED when the builder fix landed (b6dda2da ->
# f339228a), so the lookup silently fell through to a STALE row: the 15m grid rendered a D1
# panel with the brass slabs still on it while the ledger held a clean run under the new sha.
# Reading the shas from disk means the grid always shows the CURRENT artifact, and a rebuild
# can never leave the composer pointing at a superseded file.
import hashlib


def sha16(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()[:16]


DELIVERABLES = [("D1  lqz-luxalgo", "lqz-luxalgo.pine"),
                ("D2  lqz-plutus", "lqz-plutus.pine"),
                ("D3  plutus-vision-v1", "plutus-vision-v1.pine")]
NAMES = {}   # filled at runtime from disk
ORDER = ["D1  lqz-luxalgo", "D2  lqz-plutus", "D3  plutus-vision-v1"]   # display order
LIB = "/home/leviathan/Pictures/WINNING_TRADE_LIBARARY/LIQUIDITY LADDERS/Screenshot from 2026-07-13 19-13-10.png"


def newest_by_key():
    """(pineSha, timeframe) -> the row with the LATEST createdAt whose png still exists."""
    best = {}
    for line in LEDGER.read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        c = r.get("counts") or {}
        if not c:
            continue
        p = pathlib.Path(r.get("pngPath") or "")
        if not p.exists():
            continue
        key = (str(r.get("pineSha")), str(r.get("timeframe")))
        created = str(r.get("createdAt") or "")
        if key not in best or created > str(best[key].get("createdAt") or ""):
            best[key] = r
    return best


def compose(tf, best, out_dir):
    panels = [{"cap": "LIBRARY REFERENCE",
               "sub": "the operator's own frame — thin lines + LARGE bands + labels",
               "path": LIB}]
    for nm in ORDER:
        f = next((fn for n2, fn in DELIVERABLES if n2 == nm), None)
        if not f:
            continue
        want = sha16(R / f)
        src_mtime = (R / f).stat().st_mtime
        # match on the sha PREFIX (the ledger stores the full 64-hex; we hold 16)
        sha = next((k for k in {kk[0] for kk in best} if k.startswith(want)), None)
        r = best.get((sha, tf)) if sha else None
        # THE FRESHNESS TEST: the frame must be NEWER than the source it renders.
        if r:
            png = pathlib.Path(r["pngPath"])
            if png.exists() and png.stat().st_mtime < src_mtime:
                r = None      # a stale frame recorded under a fresh row -- treat as missing
        if not r:
            # NO POST-FIX ROW FOR THIS TF. Say so rather than falling back to an old one.
            panels.append({"cap": nm, "sub": "NO POST-FIX CAPTURE for this TF — UNPROVEN",
                           "path": None, "stale": True})
            continue
        c = r["counts"]
        panels.append({
            "cap": nm,
            "sub": f"{r.get('readerVerdict')} · boxes {c['boxes']} · lines {c['lines']} · labels {c['labels']} · bars {c['bars']}",
            "path": str(pathlib.Path(r["pngPath"])),
            "created": str(r.get("createdAt") or "")[:19],
            "stale": False,
        })
    if len(panels) < 4:
        print(f"  {tf}: only {len(panels)} panels — SKIPPED")
        return None

    fb = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
    fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
    fB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
    W, H, HEAD, GAP = 760, 596, 46, 10
    gw = 2 * W + 3 * GAP
    gh = 2 * (H + HEAD) + 3 * GAP
    cv = Image.new("RGB", (gw, gh + 40), (12, 14, 18))
    d = ImageDraw.Draw(cv)
    d.text((GAP, 12), f"PLUTUS VISION — {tf} — [ library | D1 | D2 | D3 ] on identical EUR/USD bars",
           font=fB, fill=(235, 238, 242))
    d.text((GAP, gh + 20),
           "every panel the IDE's own capture, indexed by its own ledger — NEWEST row per panel",
           font=fs, fill=(140, 148, 158))
    for i, p in enumerate(panels):
        col, row = i % 2, i // 2
        x = GAP + col * (W + GAP)
        y = 40 + GAP + row * (H + HEAD + GAP)
        if p.get("stale") or not p.get("path"):
            d.rectangle([x, y, x + W, y + HEAD + H], outline=(120, 60, 60), width=2)
            d.text((x + 12, y + HEAD + H // 2 - 8), "NO POST-FIX CAPTURE", font=fb, fill=(220, 120, 120))
            d.text((x + 7, y + 4), p["cap"], font=fb, fill=(226, 232, 240))
            d.text((x + 7, y + 21), p["sub"], font=fs, fill=(220, 120, 120))
            continue
        im = Image.open(p["path"]).convert("RGB")
        s = min(W / im.width, H / im.height)
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
        ox, oy = x + (W - im.width) // 2, y + HEAD + (H - im.height) // 2
        d.rectangle([x, y, x + W, y + HEAD + H], outline=(52, 58, 68), width=1)
        d.rectangle([ox, oy, ox + im.width, oy + im.height], fill=(0, 0, 0))
        cv.paste(im, (ox, oy))
        d.text((x + 7, y + 4), p["cap"], font=fb, fill=(226, 232, 240))
        d.text((x + 7, y + 21), p["sub"], font=fs, fill=(120, 200, 140) if i else (200, 180, 120))
    out = out_dir / f"panel-grid-IDE-{tf}-2026-W29.png"
    cv.save(out)
    stamps = [p.get("created", "") for p in panels[1:]]
    print(f"  wrote {out.name}  {cv.size[0]}x{cv.size[1]}  newest rows: {stamps}")
    return out


if __name__ == "__main__":
    best = newest_by_key()
    print(f"  ledger keys with a live png: {len(best)}")
    for tf in ("15m", "30m", "1H", "4H"):
        compose(tf, best, R / "reports")
