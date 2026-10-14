#!/usr/bin/env python3
"""
indicator_gate.py — the W6 LITMUS (PIN_INDICATOR_PORT_BUILD.md: W6 gate-desk).

    python3 scripts/indicator_gate.py --evidence   # run + write JEV_GATE/litmus_evidence.txt

WHAT IT DOES (all three W6 deliverables):
  1. THE 5-WEEK LITMUS — 5 seeded-random real weeks of DXY 1H (yfinance, committed
     cache), 400 REAL bars each ending at the week's Friday close, rendered through
     pine-station with the SERVED artifact (inline bars). HARD assertions per week:
     render ok:true AND >=5 zone boxes AND >=1 RES-role label AND >=1 SUP-role label
     AND all-real bars (no flat-pad run > 12h — the AP-8 guard).
  2. THE TWO-WEEK DIFFERENTIAL — the max-range week (breakout proxy) vs the min-range
     week (consolidation proxy): ceiling ZFPs reported with direction. HARD: the five
     ceilings must VARY (an identical 5/5 = an undiscriminating ZFP = FAIL).
  3. THE LIVE SCREENSHOT — captures the :99 IDE window fresh, asserts the IDE buffer
     holds THIS artifact (WebKit localStorage sha == file sha), records sha+mtime+dims.

FAIL-CLOSED: any assertion failure exits 1 with the reason on stdout. run_gate.sh
ingests the evidence into EVERY JEV chunk and halts (no JEV calls) on failure.

A LITMUS, not a verdict — JEV still judges (AP-G2). This script never prints a verdict.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import random
import re
import sqlite3
import subprocess
import sys
import typing
import urllib.request
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(ROOT, "pine-ide", "ide", "renderer", "plutus-vision-v2.pine")
EVP = os.path.join(ROOT, "JEV_GATE", "litmus_evidence.txt")
SHOT = os.path.join(ROOT, "JEV_GATE", "litmus_shot.png")
CACHE = os.path.join(ROOT, "data", "litmus", "dxy_1h.csv")
STATION = "http://127.0.0.1:9741/run"
SEED = 20261011
WINDOW = 400          # history bars per litmus week (>= 300 for the Pine lookbacks)
MAXFLAT = 12          # a real week never prints >12 identical closes in a row (AP-8)

RES_ROLES = ("IP Resistance Ceiling", "Upper IP Resistance")
SUP_ROLES = ("Mid-Range Support", "Key IP Support")


def fail(msg: str) -> "typing.NoReturn":
    print(f"LITMUS FAIL — {msg}")
    sys.exit(1)


def artifact_sha() -> str:
    return hashlib.sha256(open(ART, "rb").read()).hexdigest()


def load_bars() -> list:
    """DXY 1H from the committed cache (fetch once when absent — never per-run network)."""
    if not os.path.exists(CACHE):
        print("litmus: cache absent, fetching DXY 1H (6mo) via yfinance…", flush=True)
        try:
            import yfinance as yf
        except ImportError:
            fail("yfinance missing and no cache — cannot build real weeks")
        df = yf.download("DX-Y.NYB", period="6mo", interval="1h", progress=False,
                         auto_adjust=False)
        if df is None or len(df) < 600:
            fail(f"yfinance returned {0 if df is None else len(df)} bars (< 600)")
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        df.to_csv(CACHE)
        print(f"litmus: cached {len(df)} bars -> {CACHE}", flush=True)
    rows: list = []
    with open(CACHE) as f:
        r0 = f.readline().strip().split(",")
        r1 = f.readline().strip()
        if r1.startswith("Ticker,"):
            # yfinance multi-index: Price-row / Ticker-row / Datetime-row, then data.
            f.readline()
            head = ["Datetime"] + r0[1:]
        else:
            head = r0
            # r1 was the first data row — rewind one line.
            f.seek(0)
            f.readline()
        ci = {n: head.index(n) for n in ("Open", "High", "Low", "Close")}
        for ln in f:
            p = ln.strip().split(",")
            if len(p) <= max(ci.values()):
                continue
            ts = dt.datetime.fromisoformat(p[0])
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=dt.timezone.utc)
            ms = int(ts.timestamp() * 1000)
            rows.append({"time": ms, "open": float(p[ci["Open"]]), "high": float(p[ci["High"]]),
                         "low": float(p[ci["Low"]]), "close": float(p[ci["Close"]]),
                         "volume": 0})
    if len(rows) < 600:
        fail(f"cache holds {len(rows)} bars (< 600)")
    return rows


def fridays(rows: list) -> list:
    """Eligible week-ends: a Friday bar with >= WINDOW bars of history before it."""
    out, seen = [], set()
    for i, b in enumerate(rows):
        d = dt.datetime.fromtimestamp(b["time"] / 1000, ET)
        fri = (d - dt.timedelta(days=(d.weekday() - 4) % 7)).date()
        if d.weekday() == 4 and i + 1 >= WINDOW and fri not in seen:
            # the week's LAST Friday bar (keep advancing while still Friday)
            j = i
            while j + 1 < len(rows) and dt.datetime.fromtimestamp(
                    rows[j + 1]["time"] / 1000, ET).date() == d.date():
                j += 1
            if j + 1 >= WINDOW:
                out.append((str(fri), j))
                seen.add(fri)
    return out


def realness(win: list) -> str | None:
    """None when the window is all-real bars; else the defect."""
    run, prev = 1, None
    for b in win:
        run = run + 1 if b["close"] == prev else 1
        prev = b["close"]
        if run > MAXFLAT:
            return f"flat run > {MAXFLAT}h at {b['time']} (pad, not price)"
    lo = min(b["low"] for b in win)
    hi = max(b["high"] for b in win)
    if hi - lo <= 0.05:
        return f"week range {hi - lo:.4f} <= 0.05 (dead feed)"
    return None


def render(script: str, bars: list) -> dict:
    body = json.dumps({"script": script, "pair": "DXY", "timeframe": "1H",
                       "bars": bars}).encode()
    q = urllib.request.Request(STATION, data=body,
                               headers={"Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(q, timeout=120).read())
    except Exception as e:
        fail(f"station unreachable: {type(e).__name__}: {str(e)[:160]}")


def ceiling_zfp(labels: list) -> int | None:
    for t in labels:
        if t.startswith("IP Resistance Ceiling"):
            try:
                return int(t.split("|")[2].strip().split("%")[0])
            except (IndexError, ValueError):
                return None
    return None


def e2_shape(labels: list) -> str:
    days = [t.strip() for t in labels if "|" not in t and "%" in t]
    return "/".join(days) if days else "NONE"


def canonical(script: str) -> list[str]:
    """Render the TWO canonical feeds (the station's default window + the IDE's
    508-bar fixture) and return geometry evidence lines: zone boxes, day tags,
    ghost span. Real measurements, fresh every run — the per-chunk header's
    substance for slices whose own content cannot substantiate the verdict."""
    out: list[str] = []
    try:
        fx = json.loads(urllib.request.urlopen(
            "http://127.0.0.1:9851/api/v1/chart/bars?pair=DXY&timeframe=1H",
            timeout=30).read())["data"]["bars"]
    except Exception as e:
        fail(f"IDE fixture unreachable: {e}")
    for name,kw in (("station-Oct", {"limit": 382}), ("IDE-fixture", {"bars": fx})):
        body = json.dumps({"script": script, "pair": "DXY", "timeframe": "1H",
                           **kw}).encode()
        q = urllib.request.Request(STATION, data=body,
                                   headers={"Content-Type": "application/json"})
        try:
            d = json.loads(urllib.request.urlopen(q, timeout=120).read())
        except Exception as e:
            fail(f"canonical {name} render unreachable: {e}")
        if not d.get("success"):
            fail(f"canonical {name} render success=false")
        dr = d["data"].get("drawings", {})
        boxes = [(round(b["a"]["price"], 4), round(b["b"]["price"], 4))
                 for b in (dr.get("boxes", []) or [])]
        tags = [(l.get("text") or "") for l in (dr.get("labels", []) or [])]
        days = [t for t in tags if "|" not in t and "%" in t]
        out.append(f"canonical {name}: boxes={boxes} days={days} "
                   f"tables={dr.get('other', {}).get('__tables__', 0)}")
    return out


def deadpaths() -> str:
    """Live grep counts for every removed dead path (recipe clause 3: none remain).
    Counts CODE occurrences (// comments stripped — the removal notes name the
    symbols, the code must not). Any nonzero count FAILS the litmus."""
    raw = open(ART, encoding="utf-8").read()
    src = "\n".join(ln.split("//")[0] for ln in raw.splitlines())
    syms = ["f_e1CalcZFP", "e1WeekTag", "_zfp0", "e1BackWeeks", "e1FwdWeeks",
            "e1ShowFill", "e1_injected_lsz_top", "e1_injected_lsz_bottom",
            "e1_injected_lsz_pri"]
    hits = {s: len(re.findall(re.escape(s) + r"(?![A-Za-z0-9_])", src))
            for s in syms}
    bad = {s: n for s, n in hits.items() if n > 0}
    if bad:
        fail(f"dead paths resurrected in code: {bad}")
    return "dead-path audit (live grep, comments stripped): all 9 symbols 0 in code"


def screenshot(sha: str) -> tuple[str, str]:
    """Fresh :99 capture bound to THIS artifact (buffer sha must match the file)."""
    ls = os.path.expanduser("~/.local/share/pine-ide-webview.py/localstorage/"
                            "http_127.0.0.1_9851.localstorage")
    if not os.path.exists(ls):
        fail("IDE localStorage absent — the IDE is not up on :99")
    c = sqlite3.connect(f"file:{ls}?mode=ro", uri=True)
    try:
        raw = c.execute("SELECT value FROM ItemTable WHERE key='plutus.pine.editorSource'"
                        ).fetchone()
    except sqlite3.Error as e:
        fail(f"IDE storage unreadable: {e}")
    finally:
        c.close()
    if not raw:
        fail("IDE buffer empty — nothing rendered to screenshot")
    bufsha = hashlib.sha256(bytes(raw[0]).decode("utf-16-le").encode()).hexdigest()
    if bufsha != sha:
        fail(f"IDE buffer is STALE (buffer {bufsha[:16]} != artifact {sha[:16]}) — "
             f"re-sync before the litmus binds a screenshot")
    try:
        wins = subprocess.run(["xwininfo", "-root", "-children"], capture_output=True,
                              text=True, env={**os.environ, "DISPLAY": ":99"},
                              timeout=15).stdout
    except Exception as e:
        fail(f":99 unreachable: {e}")
    wid = next((ln.split()[0] for ln in wins.splitlines() if '"Plutus Vision"' in ln),
               None)
    if not wid:
        fail("Plutus Vision window absent on :99")
    subprocess.run(["import", "-window", wid, SHOT],
                   env={**os.environ, "DISPLAY": ":99"}, timeout=60, check=True)
    info = subprocess.run(["identify", "-format", "%wx%h", SHOT], capture_output=True,
                          text=True, timeout=15).stdout.strip()
    shotsha = hashlib.sha256(open(SHOT, "rb").read()).hexdigest()
    mtime = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return f"{SHOT} {info} sha={shotsha[:16]} mtime={mtime}", shotsha


def render_week(script: str, rows: list, fri: str, end: int) -> tuple:
    """Render one Friday-close window; fail closed on any defect. Returns the
    per-week record (fri, range, boxes, has_res, has_sup, ceiling, shape, bars)."""
    win = rows[end + 1 - WINDOW:end + 1]
    if (bad := realness(win)) is not None:
        fail(f"week {fri}: {bad}")
    wrange = max(b["high"] for b in win) - min(b["low"] for b in win)
    d = render(script, win)
    if not d.get("success"):
        fail(f"week {fri}: station success=false: {json.dumps(d)[:200]}")
    dr = d["data"].get("drawings", {})
    nb = len(dr.get("boxes", []) or [])
    labels = [(l.get("text") or "") for l in (dr.get("labels", []) or [])]
    has_res = any(any(r in t for r in RES_ROLES) for t in labels)
    has_sup = any(any(s in t for s in SUP_ROLES) for t in labels)
    if nb < 5 or not has_res or not has_sup:
        fail(f"week {fri}: boxes={nb} res={has_res} sup={has_sup} "
             f"(need >=5 + RES + SUP)")
    return (fri, wrange, nb, has_res, has_sup, ceiling_zfp(labels),
            e2_shape(labels), d["data"].get("bars"))


def differential(script: str, rows: list, fris: list) -> int:
    """--differential (the wave-plan's W1 gate cmd): the widest-range eligible week
    vs the narrowest, rendered. A PROBE + report: exit 0 when both render with
    RES+SUP (fail-closed on render defects); the ceiling delta is REPORTED, not
    gated — render-level regime direction is measured, not a proven law (the 5-week
    variance check in main() carries the teeth)."""
    spans = []
    for fri, end in fris:
        win = rows[end + 1 - WINDOW:end + 1]
        spans.append((max(b["high"] for b in win) - min(b["low"] for b in win),
                      fri, end))
    (whi, fhi, ehi), (wlo, flo, elo) = max(spans), min(spans)
    a = render_week(script, rows, fhi, ehi)
    b = render_week(script, rows, flo, elo)
    print(f"differential: wide {a[0]} (range {a[1]:.3f}, ceiling {a[5]}%) vs "
          f"narrow {b[0]} (range {b[1]:.3f}, ceiling {b[5]}%) -> "
          f"{'DISCRIMINATES' if a[5] != b[5] else 'TIED (info only)'}")
    return 0


def main() -> int:
    want_evidence = "--evidence" in sys.argv
    sha = artifact_sha()
    script = open(ART, encoding="utf-8").read()
    rows = load_bars()
    fris = fridays(rows)
    if "--differential" in sys.argv:
        return differential(script, rows, fris)
    if len(fris) < 5:
        fail(f"only {len(fris)} eligible Fridays (< 5)")
    rng = random.Random(SEED)
    weeks = sorted(rng.sample(fris, 5))
    print(f"litmus: artifact {sha[:16]} · {len(rows)} bars · Fridays {len(fris)} · "
          f"seed {SEED} · weeks {[w for w, _ in weeks]}", flush=True)

    per_week, ceilings = [], []
    for fri, end in weeks:
        rec = render_week(script, rows, fri, end)
        per_week.append(rec)
        ceilings.append(rec[5])
        print(f"  week {rec[0]}: boxes={rec[2]} RES+SUP ok ceiling={rec[5]}% E2={rec[6]} "
              f"range={rec[1]:.3f}", flush=True)

    if len(set(ceilings)) < 2:
        fail(f"ceilings identical 5/5 ({ceilings[0]}%) — the ZFP does not discriminate")
    hi = max(range(5), key=lambda i: per_week[i][1])
    lo = min(range(5), key=lambda i: per_week[i][1])
    diff = (f"breakout-proxy {per_week[hi][0]} (range {per_week[hi][1]:.3f}, "
            f"ceiling {per_week[hi][5]}%) vs consolidation-proxy {per_week[lo][0]} "
            f"(range {per_week[lo][1]:.3f}, ceiling {per_week[lo][5]}%)")

    shotline, _ = screenshot(sha)
    print(f"  shot: {shotline}", flush=True)
    canon = canonical(script)
    for ln in canon:
        print(f"  {ln[:160]}", flush=True)
    dp = deadpaths()
    print(f"  {dp}", flush=True)

    ev = [
        "LITMUS EVIDENCE (scripts/indicator_gate.py — FRESH this gate run)",
        f"artifact: pine-ide/ide/renderer/plutus-vision-v2.pine sha={sha}",
        f"data: DXY 1H yfinance, {len(rows)} bars, cache=data/litmus/dxy_1h.csv",
        f"seed: {SEED} · window: {WINDOW} real bars/Friday close · flat-cap: {MAXFLAT}h",
        *canon,
        dp,
    ]
    for fri, wr, nb, hr, hs, cz, sh, bars in per_week:
        ev.append(f"week {fri}: ok:true boxes={nb} RES={hr} SUP={hs} "
                  f"ceiling-ZFP={cz}% E2={sh} range={wr:.3f} bars={bars}")
    ev.append(f"differential: {diff}")
    ev.append(f"screenshot: {shotline} (buffer sha == artifact sha — BOUND)")
    ev.append("LITMUS: PASS — 5/5 weeks render >=5 zones with RES+SUP over real bars")
    text = "\n".join(ev) + "\n"
    if want_evidence:
        open(EVP, "w").write(text)
        print(f"litmus: evidence -> {EVP}")
    print(text, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
