#!/usr/bin/env python3
"""lqz_luxalgo_build.py — DELIVERABLE 1: the three LuxAlgo liquidity detectors, one display.

REWRITTEN after the D1 failure: concatenating plutus-vision-v0.pine's whole body stranded
the cluster (sunk=1500, zones=0 at every cap and every threshold). Extracting SECTIONS —
the approach that made D3 work — isolates the three liquidity detectors with no SMC, no
2000-line body, and nothing to saturate the engine's 500-box budget before LQZ draws.

  python3 scripts/lqz_luxalgo_build.py [out.pine]
"""
import pathlib, re, sys

W = pathlib.Path(__file__).resolve().parent.parent
V0 = (W / "plutus-vision-v0.pine").read_text().split("\n")
CORE = (W / "plutus-vision-lqz/lqz-core.pine").read_text()
RENDER = (W / "plutus-vision-lqz/lqz-render.pine").read_text()


def section(name):
    start = next(i for i, l in enumerate(V0) if l.startswith(f"// ═══ {name} ═══"))
    end = len(V0)
    for j in range(start + 1, len(V0)):
        if V0[j].startswith("// ═══ ") and V0[j].rstrip().endswith("═══"):
            end = j
            break
    return "\n".join(V0[start:end]).rstrip() + "\n"


def decls(used_prefixes):
    """Declarations v0 makes above the sections — only those whose names the sections touch."""
    out = []
    for l in V0:
        s = l.strip()
        if s.startswith("// ═══"):
            break
        if not re.match(r"^(var |type |[A-Za-z_][A-Za-z0-9_]*\s*=\s*input\.)", s):
            continue
        if s.startswith("indicator(") or s.startswith("//"):
            continue
        if any(p in s for p in used_prefixes):
            out.append(l)
    return "\n".join(out)


TAPS = """
// ═══ LQZ V1 TAPS ═══
var float lqzV1Mid  = na
var float lqzV1Rail = na
var float lqzV1Swp  = na
var float lqzV1VLo  = na
var float lqzV1VHi  = na

lqzV1PoolMid()  => lqzV1Mid
lqzV1PoolRail() => lqzV1Rail
lqzV1SweepPrc() => lqzV1Swp
lqzV1VoidLo()   => lqzV1VLo
lqzV1VoidHi()   => lqzV1VHi
"""


def tap(text, anchor, inject, name, want=1):
    got = text.count(anchor)
    if got != want:
        raise SystemExit(f"tap {name}: matched {got}x, need {want}")
    return text.replace(anchor, inject + anchor)


def build() -> str:
    pools = section("POOLS")
    voids = section("VOIDS")
    sweeps = section("SWEEPS")

    pools = tap(pools,
        "            if not na(bsl_getB.bx) and bsl_st_B == bsl_getB.bx.get_left()",
        "            if not na(bsl_minP)\n"
        "                lqzV1Mid := math.avg(bsl_minP, bsl_maxP)\n"
        "                lqzV1Rail := bsl_atr / bsl_liqMar\n", "POOLS", want=2)
    voids = tap(voids, "    if voi_bull \n",
        "    if voi_bull and not voi_bull[1]\n"
        "        lqzV1VLo := voi_b.l[1]\n        lqzV1VHi := voi_b.h[2]\n    if voi_bull \n", "VOIDS-bull")
    voids = tap(voids, "    if voi_bear\n",
        "    if voi_bear and not voi_bear[1]\n"
        "        lqzV1VLo := voi_b.l[1]\n        lqzV1VHi := voi_b.h[2]\n    if voi_bear\n", "VOIDS-bear")
    sweeps = tap(sweeps, "method swp_line(swp_piv swp_get, color c, string s='sd') => \n",
        "method swp_line(swp_piv swp_get, color c, string s='sd') => \n    lqzV1Swp := swp_get.prc\n",
        "SWEEPS")

    # ── SUPPRESS THE DETECTORS' OWN PAINT, KEEP THEIR DETECTION ─────────────
    # D1's deliverable is "the three LuxAlgo detectors bundled with proper full-width
    # horizontal display". Driving their own paint reproduces the exact defect this pass
    # removes: three render styles stacked at one level (measured 117 boxes vs 36 LQZ
    # lines; the chart unreadable). We override the colour INPUTS in place — same names,
    # so every .set_top()/.set_rightbottom() and array push keeps working untouched.
    # THE FULL LIST. Two misses cost a whole verification round:
    #  1. the POOLS colours are declared `input.color (` WITH A SPACE, so a regex of
    #     `input\.color\(` never matched them;
    #  2. the SWEEPS AREA colours (`*_2` at 50% alpha, `*_3` at 25%) were not listed —
    #     those are the large translucent bands that dominated the frame.
    SILENT = ("swp_colBl", "swp_colBr", "swp_colBl2", "swp_colBr2",
              "swp_colBl3", "swp_colBr3",
              "voi_lqBC", "voi_lqSC",
              "bsl_cLIQ_B", "bsl_cLIQ_S", "bsl_cLQV_B", "bsl_cLQV_S")
    for blk_name, blk in (("sweeps", sweeps), ("voids", voids), ("pools", pools)):
        for cname in SILENT:
            blk = re.sub(rf"^{cname}\s*=\s*input\.color\s*\(.*?\)$",
                         f"{cname} = color(na)", blk, flags=re.M)
        if blk_name == "sweeps": sweeps = blk
        elif blk_name == "voids": voids = blk
        else: pools = blk

    d = decls(("swp_", "voi_", "bsl_", "lqz", "PIP", "syminfo", "math."))
    # drop the colour inputs we override with transparent constants
    d = "\n".join(l for l in d.split("\n")
                   if not re.match(r"^\s*(swp_colBl|swp_colBr|voi_lqBC|voi_lqSC|bsl_cLIQ_B|bsl_cLIQ_S|bsl_cLQV_B|bsl_cLQV_S)\s*=", l))

    # ── SUPPRESS THE DETECTORS' OWN PRIMITIVES ───────────────────────────────
    # D1's deliverable is "the three LuxAlgo detectors bundled with proper
    # full-width horizontal display". Driving their 34 draw calls would reproduce
    # the exact defect this pass removes: three render styles stacked at the same
    # level (measured: 117 boxes, only 36 LQZ lines, the chart unreadable).
    # The calls STAY — the code still holds real box/line handles, so every
    # .set_top()/.set_rightbottom() keeps working and detection is untouched.
    # Only the COLOURS go transparent, so nothing paints but the LQZ layer.
    core_body = CORE[CORE.index("// ── inputs ──"):]
    # candles are OFF in D1 — this deliverable is the LUXALGO trio only; the candle
    # strategy is D2. Two detectors, two deliverables, one clean comparison.
    core_body = core_body.replace('lqzSource   = input.string("both"',
                                  'lqzSource   = input.string("luxalgo"', 1)
    core_body = re.sub(r"lqzMaxLevels\s*=\s*input\.int\([^\n]*\n", "lqzMaxLevels = 900\n", core_body)
    # the shared V2 candle detector is not part of D1
    v2a = core_body.find("// ═════════════════════════════════════════════════════════════════════════════\n// V2")
    v2b = core_body.find("// ═════════════════════════════════════════════════════════════════════════════\n// V1")
    if v2a != -1 and v2b != -1:
        # D1 has no candle detector, but the CLUSTER still needs the ATR-derived
        # tolerance that lives inside the V2 block — stripping it whole leaves
        # "lqzTolP is not defined".
        core_body = core_body[:v2a] + (
            "// tolerance the cluster needs (the V2 detector block is not part of D1)\n"
            "lqzAtr  = ta.atr(14)\n"
            "lqzTolP = lqzTol * nz(lqzAtr, syminfo.mintick * 10)\n"
        ) + core_body[v2b:]

    return ("//@version=6\n"
            "// lqz-luxalgo — the three LuxAlgo liquidity detectors, ONE full-width display\n"
            "// GENERATED by scripts/lqz_luxalgo_build.py — edit plutus-vision-lqz/*.pine, not this file.\n"
            'indicator("LQZ LuxAlgo", overlay = true, max_labels_count = 500, max_lines_count = 500, max_boxes_count = 500)\n\n'
            f"{TAPS}\n{d}\n"
            "// ═══ SWEEPS (verbatim + tap) ═══\n" + sweeps +
            "\n// ═══ VOIDS (verbatim + tap) ═══\n" + voids +
            "\n// ═══ POOLS (verbatim + tap) ═══\n" + pools +
            "\n// ═══ LQZ core + render ═══\n" + core_body + "\n" + RENDER +
            "\nif barstate.islast\n    f_lqzRender()\n")


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else W / "lqz-luxalgo.pine"
    txt = build()
    out.write_text(txt)
    print(f"wrote {out.name}  {len(txt.splitlines())} lines")