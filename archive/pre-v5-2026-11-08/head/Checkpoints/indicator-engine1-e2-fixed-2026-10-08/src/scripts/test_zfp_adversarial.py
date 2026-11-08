#!/usr/bin/env python3
"""test_zfp_adversarial.py — THE P5 ADVERSARIAL PROBE (the deployed decision function).

The surface: `e1_zfp.zfp(zone, bars, spot, zones_so_far)` + `classify_zone_type` — the exported
decision functions both engines read. The corpus per the adversarial-first rule:
  positive + negative + edge + the FULL evasion family.

EVERY probe carries a PRE-REGISTERED expectation. A failure is adjudicated BOTH ways before any
verdict (my expectation wrong? / real defect?).

EXIT 0 = the ZFP is robust. EXIT 1 = a confirmed defect.
"""
from __future__ import annotations
import math
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import e1_zfp as Z  # noqa: E402

PASS, FAIL, PROBE_ERR = [], [], []


def ok(name, cond, detail=""):
    (PASS if cond else FAIL).append((name, detail))
    print(f"{'PASS' if cond else 'FAIL'} {name} {detail}")


def bars(n=60, base=100.0, step=0.01):
    return [{"o": base + i * step, "h": base + i * step + 0.02, "l": base + i * step - 0.02,
             "c": base + i * step, "v": 100, "t": 1750000000 + i * 3600} for i in range(n)]


def main() -> int:
    B = bars()
    z = {"top": 101.5, "bottom": 101.4, "zone_type": "SOFT_WALL", "levels": []}

    # ── A1 EMPTY: no bars, no spot — must not crash, must return a number ──────────────
    try:
        v = Z.zfp(z, [], None, [])
        ok("A1 empty bars -> a number, no crash", isinstance(v, int), f"{v}")
    except Exception as e:
        ok("A1 empty bars -> a number, no crash", False, f"{type(e).__name__}: {e}")

    # ── A2 MISSING ZONE KEYS — a zone dict with no top/bottom ───────────────────────────
    try:
        v = Z.zfp({"zone_type": "HARD_WALL"}, B, 100.0, [])
        ok("A2 a zone with no top/bottom does not crash", isinstance(v, int), f"{v}")
    except Exception as e:
        ok("A2 a zone with no top/bottom does not crash", False, f"{type(e).__name__}: {e}")

    # ── A3 UNKNOWN ZONE TYPE — must fall back to a canon ladder value, never KeyError ──
    try:
        v = Z.zfp({"top": 101.5, "bottom": 101.4, "zone_type": "NOT_A_TYPE"}, B, 100.0, [])
        ok("A3 an unknown zone_type falls back (no KeyError)", isinstance(v, int), f"{v}")
    except Exception as e:
        ok("A3 an unknown zone_type falls back (no KeyError)", False, f"{type(e).__name__}: {e}")

    # ── A4 NaN PRICES — a NaN must not silently poison the arithmetic ──────────────────
    try:
        v = Z.zfp({"top": float("nan"), "bottom": 101.4, "zone_type": "SOFT_WALL"}, B, 100.0, [])
        finite = (isinstance(v, int) and not (isinstance(v, float) and math.isnan(v)))
        ok("A4 a NaN price yields a finite int (no NaN leak)", finite, f"{v!r}")
    except Exception as e:
        ok("A4 a NaN price yields a finite int", False, f"{type(e).__name__}: {e}")

    # ── A5 THE CLAMP — an absurd base+modifier sum cannot escape 0..100 ────────────────
    bo = bars(60, 100.0, 0.5)                    # a violent charge -> every modifier at once
    v = Z.zfp({"top": 101.2, "bottom": 101.1, "zone_type": "ONE_TOUCH"}, bo, 100.0, [])
    ok("A5 the ZFP is clamped to 0..100", 0 <= v <= 100, f"{v}")

    # ── A6 NEGATIVE / ZERO spot — must not crash ───────────────────────────────────────
    for s in (0, -1.0, None):
        try:
            v = Z.zfp(z, B, s, [])
            ok(f"A6 spot={s!r} does not crash", isinstance(v, int), f"{v}")
        except Exception as e:
            ok(f"A6 spot={s!r} does not crash", False, f"{type(e).__name__}: {e}")

    # ── A7 THE EVASION FAMILY: every zone type resolves to its canon base band ─────────
    for zt, (lo, hi) in Z.ZFP_BASE.items():
        v = Z.zfp({"top": 101.5, "bottom": 101.4, "zone_type": zt}, [], None, [])
        mid = (lo + hi) / 2
        ok(f"A7 {zt} base midpoint in band", abs(v - mid) <= 1, f"{v} vs {mid}")

    # ── A8 THE POSITIVE CONTROL: a genuine ACCELERATING breakout fires; a quiet week does not ──
    # (the first run used a CONSTANT slope — no acceleration, so the momentum modifier correctly
    # did not fire. That was a PROBE ERROR, adjudicated: the mechanism is proven by
    # test_zfp_discriminates; the probe's data was wrong, not the code.)
    accel = []
    _p = 100.0
    for i in range(60):
        _p += 0.002 if i < 40 else (0.01 + 0.002 * (i - 40))   # accelerating charge at the end
        accel.append({"o": _p, "h": _p + 0.01, "l": _p - 0.01, "c": _p, "v": 100,
                      "t": 1750000000 + i * 3600})
    v_bo = Z.zfp(z, accel, 100.0, [])
    quiet = bars(60, 100.0, 0.0)
    v_q = Z.zfp(z, quiet, 100.0, [])
    ok("A8 positive control: an accelerating breakout > quiet", v_bo > v_q, f"{v_bo} > {v_q}")

    # ── A9 ZONES_SO_FAR = None (the cascade input) — must not crash ────────────────────
    try:
        v = Z.zfp(z, B, 100.0, None)
        ok("A9 zones_so_far=None does not crash", isinstance(v, int), f"{v}")
    except Exception as e:
        ok("A9 zones_so_far=None does not crash", False, f"{type(e).__name__}: {e}")

    print(f"\nP5 ADVERSARIAL: {len(PASS)} pass / {len(FAIL)} fail / {len(PROBE_ERR)} probe-err")
    for n, d in FAIL:
        print(f"  FAIL {n} {d}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
