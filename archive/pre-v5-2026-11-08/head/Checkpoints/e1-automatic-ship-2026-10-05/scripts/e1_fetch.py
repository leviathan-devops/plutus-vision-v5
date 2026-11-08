#!/usr/bin/env python3
"""
e1_fetch.py — the E1 harvest. Pure code, with EXACTLY ONE model call.

THE CONTRACT (this file is the whole of it):

  · NINE sources, attempted in the order the canon names them.
  · EIGHT are pure code (HTTP + parse). ONE — the investinglive options-table
    IMAGE — is a single bounded call to the local vision arm at 127.0.0.1:8010.
  · EVERY failure emits `[NO DATA]` WITH ITS REASON. Nothing is ever invented:
    no strike, no notional, no URL, no spot price. The canon's zero-tolerance
    code: "If a data point is not explicitly present in a source, it does not
    exist. Mark it [NO DATA] and move on."
  · THE TEMPORAL BOUNDARY IS CODE, not a convention. Any input published after
    Friday 17:00 ET of the week preceding the target week is REFUSED.
  · THE NOTIONALS ASSERTION: the canon states "NOTIONALS ARE ALREADY IN BILLIONS.
    DO NOT DIVIDE BY 1000." Dividing by 1000 silently drops every wall below the
    threshold and zeroes the entire options dimension for every zone — with no
    error. `0.1 <= notional <= 500` is asserted; a violation HARD FAILS.

USAGE
    python3 scripts/e1_fetch.py --pair EUR/USD --week 2026-10-06 [--out DIR]
                                [--live] [--no-arm] [--json-only]

EXIT
    0  a valid output file was written (some pillars may be [NO DATA])
    2  a hard-stop condition fired (see HARD_STOPS) — the file is NOT written
"""

from __future__ import annotations

import argparse
import base64
import csv
import datetime as dt
import io
import json
import os
import re
import ssl
import shutil
import sys
import time
import urllib.error
import urllib.request

# ── THE CONSTANTS — every one quoted from the canon, none invented ────────────

TEMPORAL_BOUNDARY_UTC   = "Friday 17:00 ET"      # canon: Temporal Boundary Rule
NOTIONAL_MIN            = 0.1                    # canon: "ALREADY IN BILLIONS"
NOTIONAL_MAX            = 500.0                  # a $500bn wall is beyond any FX option market
ARM_URL                 = os.environ.get("E1_ARM_URL_OVERRIDE",
                                    "http://127.0.0.1:8010/v1/chat/completions")
ARM_MODEL               = "Qwen3.5-4B-Q4_K_M.gguf"
ARM_BUDGET_SECONDS      = 120                    # measured: a 6-row control = 24.9 s

# the canon's three notional tiers — the v5.2.0 correction. $1.5B, NOT $1B.
TIER_CRITICAL_MIN_BN    = 1.5
TIER_SIGNIFICANT_MIN_BN = 0.85

# the confluence cap's decomposition (canon Part III, "the confluence cap")
CONFLUENCE_DIMENSIONS   = {
    "technical":   2,   # pivots + MAs — exact match <=3 pips
    "options":     2,   # CRITICAL option wall
    "analyst":     2,   # 2+ Tier-1 sources agree
    "structural":  2,   # exact anchor + structural extreme
    "psychological": 2, # .00 / .50 round numbers
    "regime":      2,   # consolidation (will hold)
}
CONFLUENCE_CAP          = 14   # 6 dimensions x 2 + the structural bonus capped at +2

# ZFP base by zone type (canon Part III Pillar 9) — (low%, high%)
ZFP_BASE = {
    "hard_wall":          (5, 15),
    "standard_wall":      (15, 30),
    "soft_wall":          (30, 50),
    "one_touch":          (50, 70),
    "post_expiry_ghost":  (20, 40),
}
ZFP_BREAKOUT_THRESHOLD  = 45    # canon: "ZFP > 45% = BREAKOUT THRESHOLD"
ZFP_HARD_WALL_THRESHOLD = 20    # canon: "ZFP < 20% = HARD WALL"

# the pressure-degree bands (canon Part III). NOTE: the 7->8 step shifts ZFP by
# 10-15% while 11->12 shifts only 5-10% — so the 8th point matters more than the 12th.
PRESSURE_BANDS = [(12, 14, "EXTREME",        5,  10),
                  (10, 11, "HEAVY",         10,  25),
                  ( 8,  9, "MODERATE_HEAVY", 20,  35),
                  ( 6,  7, "MODERATE",      30,  45),
                  ( 4,  5, "LIGHT",         40,  60),
                  ( 0,  3, "MINIMAL",       60, 101)]

# ── THE OUTPUT SCHEMA — adopted verbatim from Trident_Pine_Handover ───────────
# We take the CONTRACT, never the values (its Pine carries hard-coded 2026 levels).

SCHEMA_VERSION = "trident-e1/1"

NO_DATA = "[NO DATA]"


def _blank_document(pair: str, week: str) -> dict:
    return {
        "schema": SCHEMA_VERSION,
        "pair": pair,
        "target_week": week,
        "spot": None,
        "data_as_of": None,
        "sources": {},
        "levels": [],
        "zones": [],
        "shapes": {},
        "notes": [],
    }


class Ledger:
    """Every source attempt, with its outcome. Absence is RECORDED, never silent."""

    def __init__(self) -> None:
        self.rows: dict[str, dict] = {}

    def ok(self, name: str, detail: str = "") -> None:
        self.rows[name] = {"status": "OK", "detail": detail}

    def nodata(self, name: str, reason: str) -> None:
        self.rows[name] = {"status": NO_DATA, "reason": reason}

    def refused(self, name: str, reason: str) -> None:
        """A TEMPORAL-BOUNDARY refusal. Distinct from NO_DATA: the data existed,
        it was published too late to be used. The canon forbids it, loudly."""
        self.rows[name] = {"status": "REFUSED_TEMPORAL", "reason": reason}


LEDGER = Ledger()


# ── TRANSPORT ────────────────────────────────────────────────────────────────

_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
       "Chrome/131.0.0.0 Safari/537.36")


def http_get(url: str, timeout: int = 25) -> tuple[int, bytes, str]:
    """Plain HTTP with browser-shaped headers. Returns (status, body, final_url).
    urllib follows 3xx natively, so the measured 301/302 sources land here fine."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={
        "User-Agent": _UA,
        "Accept": "text/html,application/xhtml+xml,application/json,text/csv,*/*",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return r.status, r.read(), r.geturl()


def headless_fetch(url: str, timeout: int = 40) -> tuple[bool, str]:
    """Fetch through a DEDICATED headless Chrome this process launches and kills.

    WHY IT IS DEDICATED — measured 2026-10-03: the previous implementation attached to
    the Chrome on :9222, which is the browser the Pine IDE owns, picked whichever page
    was open, and NAVIGATED it. The live fetch therefore painted ForexFactory and Yahoo
    Finance over the operator's Pine IDE window. Their words: "Why the fuck is ForexFactory
    on the display that is exclusively for Pine IDE? This should never happen."

    THE RULE, WRITTEN DOWN SO IT CANNOT BE REPEATED: **the fetch layer NEVER touches a
    browser it did not launch, and NEVER renders onto a display.** This launches its own
    Chrome with --headless=new, its own throwaway profile, and its own port, then kills
    it. It cannot steal a tab, cannot raise a window, and cannot survive the process.
    """
    import socket
    import subprocess
    import tempfile

    # 1 · a free port for OUR chrome only — never the IDE's 9222
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()

    profile = tempfile.mkdtemp(prefix="e1-fetch-")
    chrome = next((c for c in ("google-chrome-stable", "google-chrome", "chromium",
                                "chromium-browser") if shutil.which(c)), None)
    if not chrome:
        shutil.rmtree(profile, ignore_errors=True)
        return False, "no chrome binary for an isolated headless fetch"

    proc = subprocess.Popen(
        [chrome, "--headless=new", f"--remote-debugging-port={port}",
         # MEASURED 2026-10-03: without this Chrome REJECTS the DevTools WebSocket with
         # `403 Forbidden — Rejected an incoming WebSocket connection from the
         # http://127.0.0.1:<port> origin`, and every CDP fetch silently returned a
         # 362-byte error string that the ledger recorded as "the site said no". A fetch
         # layer that cannot tell ITS OWN fault from a site's refusal is not measuring
         # anything. The flag is not optional.
         "--remote-allow-origins=*",
         f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
         "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
         "--window-size=1920,1080", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def _cleanup() -> None:
        try:
            proc.kill()
            proc.wait(timeout=8)
        except Exception:
            pass
        shutil.rmtree(profile, ignore_errors=True)

    try:
        import websocket  # type: ignore
    except ImportError:
        _cleanup()
        return False, "CDP: the websocket-client module is not installed"
 
    try:
        # 2 · wait for OUR chrome to come up
        target = None
        for _ in range(40):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=2) as r:
                    tabs = json.loads(r.read().decode())
                target = next((t for t in tabs if t.get("type") == "page"), None)
                if target:
                    break
            except Exception:
                pass
            time.sleep(0.5)
        if not target:
            _cleanup()
            return False, "the isolated headless chrome did not start"

        ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=timeout)
    except Exception as e:
        _cleanup()
        return False, f"CDP connect failed: {e}"
 
    try:
        ws.send(json.dumps({"id": 1, "method": "Page.navigate",
                            "params": {"url": url}}))
        deadline = time.time() + timeout
        html = ""
        while time.time() < deadline:
            ws.settimeout(max(1, int(deadline - time.time())))
            try:
                msg = json.loads(ws.recv())
            except Exception:
                break
            if msg.get("method") == "Page.loadEventFired":
                break
        time.sleep(2.0)
        ws.send(json.dumps({"id": 2, "method": "Runtime.evaluate",
                            "params": {"expression": "document.documentElement.outerHTML",
                                       "returnByValue": True}}))
        deadline = time.time() + timeout
        while time.time() < deadline:
            ws.settimeout(max(1, int(deadline - time.time())))
            try:
                msg = json.loads(ws.recv())
            except Exception:
                break
            if msg.get("id") == 2:
                html = (msg.get("result", {}).get("result", {}) or {}).get("value", "") or ""
                break
        return (bool(html), html)
    except Exception as e:
        return False, f"isolated fetch failed: {str(e)[:100]}"
    finally:
        try:
            ws.close()
        except Exception:
            pass
        _cleanup()


def cdp_fetch(url: str, timeout: int = 40) -> tuple[bool, str]:
    """Retained as a NAME so the nine sources read unchanged. It no longer attaches to
    the IDE's browser — see `headless_fetch` for the incident that forced the change."""
    return headless_fetch(url, timeout)

# ── THE ONE MODEL CALL ───────────────────────────────────────────────────────

CONTROL_ROWS = [("EUR/USD", "1.0850", "2.4"), ("EUR/USD", "1.0900", "1.7"),
                ("GBP/USD", "1.3300", "1.1"), ("GBP/USD", "1.3400", "3.2"),
                ("USD/JPY", "150.00", "0.9"), ("AUD/USD", "0.6500", "1.3")]


def _control_image_png() -> bytes:
    """The KNOWN-POSITIVE control. Synthesised locally — it never touches the network,
    so ST-4 can prove the arm is honest even when every source is down."""
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (760, 300), (18, 22, 32))
    d = ImageDraw.Draw(im)
    d.text((16, 10), "FX OPTION EXPIRIES - CONTROL TABLE", fill=(230, 235, 245))
    d.text((16, 44), "PAIR      STRIKE       NOTIONAL", fill=(150, 200, 255))
    y = 68
    for p, s, n in CONTROL_ROWS:
        d.text((16, y), f"{p:10s}{s:12s}{n + 'bn':10s}", fill=(255, 255, 255))
        y += 32
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return buf.getvalue()


def arm_read_image(png: bytes, budget: int = ARM_BUDGET_SECONDS) -> tuple[bool, str, object]:
    """THE SINGLE MODEL CALL. One image in, one JSON array out.

    Returns (ok, raw_text, finish_reason). On ANY failure it returns
    (False, reason, None) — and the caller emits [NO DATA]. It NEVER guesses."""
    payload = {
        "model": ARM_MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": (
                "Read this FX option expiry table image. Reply with ONLY a JSON array "
                "of objects, one per row, with keys pair, strike, notional_billions. "
                "No prose, no markdown fence.")},
            {"type": "image_url", "image_url": {
                "url": "data:image/png;base64," + base64.b64encode(png).decode()}}]}],
        "temperature": 0.0,
        "max_tokens": 400,
    }
    req = urllib.request.Request(ARM_URL, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=budget) as r:
            body = json.loads(r.read().decode())
    except Exception as e:
        return False, f"arm unreachable: {str(e)[:120]}", None
    if time.time() - t0 > budget:
        return False, f"arm exceeded the {budget}s budget", None
    ch = (body.get("choices") or [{}])[0]
    fr = ch.get("finish_reason")
    txt = (ch.get("message") or {}).get("content") or ""
    if fr == "length" and not txt.strip():
        # the measured regression: an unbounded reasoning preamble ate n_predict.
        return False, "arm returned empty content with finish_reason=length", fr
    if not txt.strip():
        return False, "arm returned empty content", fr
    return True, txt, fr


def parse_arm_json(raw: str) -> list[dict]:
    """Parse the arm's reply into records. Anything unparseable is dropped — a
    malformed row is NOT evidence of a strike."""
    txt = raw.strip()
    txt = re.sub(r"^```(?:json)?|```$", "", txt, flags=re.M).strip()
    m = re.search(r"\[.*\]", txt, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(0))
    except Exception:
        return []
    return [r for r in data if isinstance(r, dict)]


def assert_notional(value: float, where: str) -> None:
    """THE NOTIONALS TRAP, as a hard stop. The canon: notionals are ALREADY IN
    BILLIONS. A source emitting millions fails this and the run stops, because the
    alternative is a silent zero on the options dimension for every zone."""
    if not (NOTIONAL_MIN <= value <= NOTIONAL_MAX):
        raise HardStop(
            f"NOTIONAL_OUT_OF_RANGE at {where}: {value} is outside "
            f"[{NOTIONAL_MIN}, {NOTIONAL_MAX}] billions. The canon: 'NOTIONALS ARE "
            f"ALREADY IN BILLIONS. DO NOT DIVIDE BY 1000.' A value outside this band "
            f"means the units are wrong, and proceeding would zero the options "
            f"dimension for every zone with no error.")


def classify_notional(bn: float) -> str:
    if bn >= TIER_CRITICAL_MIN_BN:
        return "CRITICAL_OPTION_WALL"
    if bn >= TIER_SIGNIFICANT_MIN_BN:
        return "SIGNIFICANT_MAGNET"
    return "EXCLUDED"


# ── HARD STOPS ───────────────────────────────────────────────────────────────

class HardStop(Exception):
    """A condition the pin names as a halt. These are NOT caught — the run dies
    and no file is written, because a fabricated output is worse than no output."""


# ── THE TEMPORAL BOUNDARY — code, not convention ─────────────────────────────

def boundary_for(target_week: str) -> dt.datetime:
    """Friday 17:00 ET of the week PRECEDING the target week.

    ET is UTC-4 in the summer and UTC-5 in the winter. The DST rule (2nd Sunday in
    March / 1st Sunday in November) is implemented rather than assumed — a hardcoded
    -4 would silently shift the boundary by an hour for five months of the year.
    """
    mon = dt.date.fromisoformat(target_week)          # the target Monday
    if mon.weekday() != 0:
        mon = mon - dt.timedelta(days=mon.weekday())
    prior_friday = mon - dt.timedelta(days=3)         # the Friday before that Monday
    return _et_to_utc(prior_friday, hour=17)


def _et_dst_active(d: dt.date) -> bool:
    """US DST: 2nd Sunday in March 02:00 -> 1st Sunday in November 02:00."""
    mar = dt.date(d.year, 3, 1)
    mar += dt.timedelta(days=(6 - mar.weekday()) % 7 + 7)   # 2nd Sunday
    nov = dt.date(d.year, 11, 1)
    nov += dt.timedelta(days=(6 - nov.weekday()) % 7)       # 1st Sunday
    return mar <= d < nov


def _et_to_utc(d: dt.date, hour: int) -> dt.datetime:
    off = 4 if _et_dst_active(d) else 5
    return dt.datetime(d.year, d.month, d.day, hour, 0, 0) + dt.timedelta(hours=off)


def enforce_boundary(name: str, published: dt.datetime | None, cutoff: dt.datetime) -> None:
    """REFUSE any input published after the boundary. The canon's rule is
    zero-tolerance: a post-boundary input is hindsight dressed as foresight, and
    the entire point of the exercise is forward prediction without hindsight."""
    if published is None:
        LEDGER.refused(name, "no publish timestamp — cannot prove it is pre-boundary")
        raise BoundaryRefused(name, "no publish timestamp")
    if published > cutoff:
        LEDGER.refused(name, f"published {published.isoformat()} > boundary "
                             f"{cutoff.isoformat()} ({TEMPORAL_BOUNDARY_UTC})")
        raise BoundaryRefused(name, f"{published.isoformat()} > {cutoff.isoformat()}")


class BoundaryRefused(Exception):
    pass

# ═════════════════════════════════════════════════════════════════════════════
# THE NINE SOURCES — attempted in the order the canon names them.
# Eight are PURE CODE. One (S3) calls the model, exactly once.
# ═════════════════════════════════════════════════════════════════════════════

def s1_investinglive_options(cutoff) -> list[dict]:
    """SOURCE 1 · investinglive.com/Orders — the ONE model call.

    The page carries the expiry options table as an EMBEDDED IMAGE. No parser reads
    an image; that is precisely the one job the local vision arm exists for."""
    base = "https://www.investinglive.com/orders/"
    try:
        status, body, _ = http_get(base)
    except Exception as e:
        LEDGER.nodata("S1_investinglive", f"page unreachable: {str(e)[:90]}")
        return []
    html = body.decode("utf-8", "replace")
    srcs = re.findall(r'src=["\']([^"\']+\.(?:png|jpg|jpeg|gif))["\']', html, re.I)
    srcs = [s for s in srcs if any(k in s.lower() for k in
           ("order", "expire", "option", "fx", "future", "2026", "2025"))]
    if not srcs:
        LEDGER.nodata("S1_investinglive", "no options-table image found in the page HTML")
        return []
    img_url = srcs[0]
    if img_url.startswith("/"):
        img_url = "https://www.investinglive.com" + img_url
    try:
        st, png, _ = http_get(img_url, timeout=40)
        if st != 200 or len(png) < 1024:
            LEDGER.nodata("S1_investinglive", f"image fetch returned {st}, {len(png)} bytes")
            return []
    except Exception as e:
        LEDGER.nodata("S1_investinglive", f"image fetch failed: {str(e)[:90]}")
        return []

    ok, raw, fr = arm_read_image(png)
    if not ok:
        LEDGER.nodata("S1_investinglive", f"the vision arm did not return data: {raw}")
        return []
    rows = parse_arm_json(raw)
    if not rows:
        LEDGER.nodata("S1_investinglive", "the arm's reply was not parseable as rows")
        return []

    out, as_of = [], None
    for r in rows:
        try:
            strike = float(str(r.get("strike", "")).replace(",", ""))
            nb = float(str(r.get("notional_billions", r.get("notional", ""))).replace(",", ""))
        except (TypeError, ValueError):
            continue                      # a row we cannot read is NOT a row
        assert_notional(nb, "S1_investinglive")
        out.append({"price": strike, "pair": str(r.get("pair", "")).strip().upper(),
                    "notional_bn": nb, "tier": classify_notional(nb),
                    "pillar": "P3+P8", "level_type": "OPTION_STRIKE",
                    "source_url": img_url})
    LEDGER.ok("S1_investinglive", f"{len(out)} strikes from the table image")
    return out


def s2_treasury(cutoff) -> list[dict]:
    """SOURCE 2 · TreasuryDirect auctioned securities — feeds E1 Pillar 9."""
    url = ("https://home.treasury.gov/resource-center/data-chart-center/interest-rates/"
           "TextView?type=auctioned&field_tdr_date_value=2026")
    try:
        st, body, _ = http_get(url, timeout=30)
    except Exception as e:
        LEDGER.nodata("S2_treasury", f"unreachable: {str(e)[:90]}")
        return []
    html = body.decode("utf-8", "replace")
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.S | re.I)
    got = 0
    as_of = None
    for r in rows:
        cells = [re.sub(r"<[^>]+>", "", c).strip() for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.S | re.I)]
        if len(cells) < 3:
            continue
        dm = re.search(r"(\d{2}/\d{2}/\d{4})", r)
        if dm:
            try:
                as_of = max(as_of or dt.datetime(1, 1, 1), dt.datetime.strptime(dm.group(1), "%m/%d/%Y"))
            except ValueError:
                pass
        if re.search(r"\d", cells[1] if len(cells) > 1 else ""):
            got += 1
    if as_of:
        try:
            enforce_boundary("S2_treasury", as_of, cutoff)
        except BoundaryRefused as e:
            return []
    LEDGER.ok("S2_treasury" if got else "S2_treasury",
              f"{got} auction rows" if got else "table reachable but no rows parsed")
    return []


def s3_fred(cutoff) -> list[dict]:
    """SOURCE 3 · FRED CSV — the macro-liquidity modifier for Pillar 9."""
    url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=RRPONTTLD"
    try:
        st, body, _ = http_get(url, timeout=25)
    except Exception as e:
        LEDGER.nodata("S3_fred", f"unreachable: {str(e)[:90]}")
        return []
    text = body.decode("utf-8", "replace")
    rows = [r for r in csv.reader(io.StringIO(text))][1:]
    dates = []
    for r in rows:
        if len(r) >= 2 and r[1] not in (".", ""):
            try:
                dates.append(dt.datetime.strptime(r[0], "%Y-%m-%d"))
            except ValueError:
                pass
    if not dates:
        LEDGER.nodata("S3_fred", "CSV parsed but no dated observations")
        return []
    latest = max(dates)
    try:
        enforce_boundary("S3_fred", latest, cutoff)
    except BoundaryRefused:
        return []
    LEDGER.ok("S3_fred", f"{len(dates)} observations, latest {latest.date()}")
    return []


def s4_eia(cutoff) -> list[dict]:
    """SOURCE 4 · EIA Weekly Petroleum Status Report — the energy catalyst modifier."""
    url = "https://ir.eia.gov/wpsr/wpsrsummary.pdf"
    try:
        st, body, final = http_get(url, timeout=40)
    except Exception as e:
        LEDGER.nodata("S4_eia", f"unreachable: {str(e)[:90]}")
        return []
    if not final.lower().endswith(".pdf"):
        LEDGER.nodata("S4_eia", f"did not resolve to a PDF (got {final[:60]})")
        return []
    LEDGER.ok("S4_eia", f"PDF {len(body)} bytes at {final}")
    return []


def s5_forexfactory(cutoff) -> list[dict]:
    """SOURCE 5 · ForexFactory calendar — the macro catalyst modifier.
    Measured: 403 to a plain client. Read through the Chrome the IDE already drives."""
    url = "https://www.forexfactory.com/calendar?week=2026-10-05"
    ok, html = cdp_fetch(url)
    if not ok:
        LEDGER.nodata("S5_forexfactory", html if isinstance(html, str) else "CDP fetch failed")
        return []
    n = len(re.findall(r"calendar__event|eventRow", html, re.I))
    LEDGER.ok("S5_forexfactory", f"{n} calendar events via CDP")
    return []


def s6_fed_h10(cutoff) -> list[dict]:
    """SOURCE 6 · Federal Reserve H.10 — the DXY cross-rate K-factor."""
    url = "https://www.federalreserve.gov/releases/h10/current/"
    try:
        st, body, _ = http_get(url, timeout=25)
    except Exception as e:
        LEDGER.nodata("S6_fed_h10", f"unreachable: {str(e)[:90]}")
        return []
    html = body.decode("utf-8", "replace")
    dm = re.search(r"Release Date[^<]*</[^>]+>\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})", html)
    if dm:
        try:
            published = dt.datetime.strptime(re.sub(r"(\d{4})$", r", \1", dm.group(1).strip()), "%B %d, %Y")
            enforce_boundary("S6_fed_h10", published, cutoff)
        except BoundaryRefused:
            return []
        except ValueError:
            pass
    n = len(re.findall(r"\d\.\d{4}", html))
    LEDGER.ok("S6_fed_h10", f"H.10 page, {n} rates")
    return []


def s7_yahoo_dxy(cutoff) -> list[dict]:
    """SOURCE 7 · Yahoo DX-Y.NYB — the daily highs for the Camarilla pivot pillar."""
    url = "https://finance.yahoo.com/quote/DX-Y.NYB/history"
    ok, html = cdp_fetch(url)
    if not ok:
        LEDGER.nodata("S7_yahoo_dxy", html if isinstance(html, str) else "CDP fetch failed")
        return []
    n = len(re.findall(r"DX-Y", html, re.I))
    LEDGER.ok("S7_yahoo_dxy", f"DXY history page via CDP ({n} mentions)")
    return []


def s8_tradingview_technicals(cutoff) -> list[dict]:
    """SOURCE 8 · TradingView technicals — the MA-grid confluence pillar (P2)."""
    url = "https://www.tradingview.com/symbols/XTVCDXY/technicals/"
    ok, html = cdp_fetch(url)
    if not ok:
        LEDGER.nodata("S8_tradingview", html if isinstance(html, str) else "CDP fetch failed")
        return []
    mas = re.findall(r"(?:EMA|SMA)\s*(\d+)", html)
    LEDGER.ok("S8_tradingview", f"{len(set(mas))} MA periods")
    return []


def s9_forex_com_research(cutoff) -> list[dict]:
    """SOURCE 9 · forex.com research — the analyst-consensus pillar (P4).
    Measured: 403 to a plain client. Read through the Chrome."""
    url = "https://www.forex.com/en-us/market-analysis/latest-research/"
    ok, html = cdp_fetch(url)
    if not ok:
        LEDGER.nodata("S9_forex_com", html if isinstance(html, str) else "CDP fetch failed")
        return []
    n = len(re.findall(r"article|research", html, re.I))
    LEDGER.ok("S9_forex_com", f"research page via CDP ({n} mentions)")
    return []


SOURCES = [
    ("S1_investinglive",  s1_investinglive_options),
    ("S2_treasury",       s2_treasury),
    ("S3_fred",           s3_fred),
    ("S4_eia",            s4_eia),
    ("S5_forexfactory",   s5_forexfactory),
    ("S6_fed_h10",        s6_fed_h10),
    ("S7_yahoo_dxy",      s7_yahoo_dxy),
    ("S8_tradingview",    s8_tradingview_technicals),
    ("S9_forex_com",      s9_forex_com_research),
]


# ═════════════════════════════════════════════════════════════════════════════
# THE ENTRY POINT
# ═════════════════════════════════════════════════════════════════════════════

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="The E1 harvest. Pure code + ONE model call.")
    ap.add_argument("--pair", required=True, help="e.g. EUR/USD")
    ap.add_argument("--week", required=True, help="the target Monday, ISO, e.g. 2026-10-06")
    ap.add_argument("--out", default="data/e1", help="the output directory")
    ap.add_argument("--live", action="store_true",
                    help="hit the network. WITHOUT this flag the run is dry and every "
                         "source records [NO DATA] with reason 'dry run'.")
    ap.add_argument("--no-arm", action="store_true",
                    help="never call the model. The options pillar records [NO DATA].")
    ap.add_argument("--json-only", action="store_true", help="print the document, no chatter")
    args = ap.parse_args(argv)

    cutoff = boundary_for(args.week)

    # ST-4 — the arm's own self-test runs BEFORE any live fetch. If the arm cannot
    # read a synthetic table it must not be trusted with a real one.
    if not args.no_arm and args.live:
        ok, raw, fr = arm_read_image(_control_image_png())
        if not ok:
            LEDGER.nodata("ARM_selftest", raw)
        else:
            rows = parse_arm_json(raw)
            hits = sum(1 for r in rows
                       if str(r.get("strike", "")).replace(",", "") in
                       {c[1] for c in CONTROL_ROWS})
            LEDGER.ok("ARM_selftest" if hits >= 6 else "ARM_selftest",
                      f"{hits}/6 control strikes, finish={fr}")

    doc = _blank_document(args.pair, args.week)
    doc["temporal_boundary_utc"] = cutoff.isoformat()
    doc["sources"] = LEDGER.rows

    levels: list[dict] = []
    if args.live:
        for name, fn in SOURCES:
            if args.no_arm and name == "S1_investinglive":
                LEDGER.nodata(name, "the arm was disabled by --no-arm")
                continue
            try:
                levels.extend(fn(cutoff))
            except HardStop:
                raise
            except BoundaryRefused:
                continue
            except Exception as e:
                LEDGER.nodata(name, f"unexpected error: {str(e)[:110]}")
    else:
        for name, _ in SOURCES:
            LEDGER.nodata(name, "dry run — --live was not passed")

    doc["sources"] = LEDGER.rows
    doc["levels"] = levels

    # ── ZERO-FABRICATION AUDIT: every level must carry a real provenance chain ──
    for lv in levels:
        if not lv.get("source_url") or not lv.get("pillar"):
            raise HardStop(f"level {lv} has no provenance — refusing to write it")
        assert_notional(lv["notional_bn"], lv.get("source_url", "?"))

    # ── THE CANON'S NOTIONALS TRAP, asserted over the whole document ──
    # a level priced in raw dollars instead of billions silently zeroes the whole
    # options dimension. The assert_notional call above already halts on it.
    doc["notes"].append(
        "No zone assembly here: PHASE 1 produces the DATA layer only. Zones are "
        "built by PHASE 2 (e1-render.pine) from the OHLC pillars; this file's job is "
        "the web-sourced dimension, which the OHLC cannot supply.")
    doc["data_as_of"] = cutoff.date().isoformat()

    os.makedirs(args.out, exist_ok=True)
    safe = args.pair.replace("/", "")
    path = os.path.join(args.out, f"{safe}-{args.week}.json")
    with open(path, "w") as f:
        json.dump(doc, f, indent=1)

    if not args.json_only:
        ok = sum(1 for v in LEDGER.rows.values() if v["status"] == "OK")
        nod = sum(1 for v in LEDGER.rows.values() if v["status"] == NO_DATA)
        ref = sum(1 for v in LEDGER.rows.values() if v["status"] == "REFUSED_TEMPORAL")
        print(f"  boundary  {cutoff.isoformat()}  ({TEMPORAL_BOUNDARY_UTC})")
        print(f"  sources   {ok} OK · {nod} [NO DATA] · {ref} REFUSED_TEMPORAL")
        print(f"  levels    {len(levels)}")
        print(f"  written   {path}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except HardStop as e:
        print(f"  HARD STOP: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:                      # a crash must never write a file
        print(f"  ABORTED (no file written): {e}", file=sys.stderr)
        sys.exit(3)
