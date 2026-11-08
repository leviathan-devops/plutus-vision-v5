#!/usr/bin/env python3
"""pv-server — the PLUTUS_VISION standalone static + bars host on :9851.

Serves TWO things from ONE origin (the page is same-origin, so no CORS games):

  1. STATIC — the forked renderer root (index.html, pine.html, tabs/, *.css)
     plus the charts/ workbench bundle and the pine-ide/ kernel (both symlinked
     into the root so the renderer's relative fetches resolve).

  2. GET /api/v1/chart/bars?pair=EUR/USD&timeframe=1H — the FIXTURE feed the
     Vela workbench's FixtureProvider consumes. It reads the pipeline's own
     bundled week (2026-07-06.json, 1.9MB, 12 cells = 3 pairs x 4 timeframes)
     and maps the fixture's bar shape to the provider's contract:
        fixture {timestamp, open, high, low, close, volume}
        -> wire  {time,      open, high, low, close, volume}
     The provider then validates every bar (barsOf) and NAMES a bad reply —
     so a shape mismatch here is a loud FEED_BAD_REPLY, never a blank chart.

CONTRACT (read from charts/workbench.js FixtureProvider.getBars):
  request   GET  {base}/api/v1/chart/bars?pair=<urlencoded pair>&timeframe=<15m|30m|1H|4H>
  response  {success: true, data: {bars: [{time, open, high, low, close, volume}]}}
  failure   {success: false, code, error}   (the provider throws coded(code, error))

Run:  python3 pv-server.py <port> <static-root>
"""
import json
import os
import re
import sys
import mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

FIXTURE = os.environ.get("PV_FIXTURE") or str(__import__("pathlib").Path(__file__).resolve().parent.parent / "fixtures/bars/2026-07-06.json")

# fixture timeframe spelling -> the spellings the workbench may ask with.
# The provider sends the FIXTURE_TF value ('15m','30m','1H','4H'); the station
# may ask with the raw code ('15','30','60','240'). Accept BOTH.
TF_ALIASES = {
    "15": "15m", "15m": "15m",
    "30": "30m", "30m": "30m",
    "60": "1H", "1h": "1H", "1H": "1H",
    "240": "4H", "4h": "4H", "4H": "4H",
}

_cache = {"cells": None, "mtime": 0}


def load_cells():
    """Read the fixture once; reload only when its mtime moves."""
    try:
        m = os.path.getmtime(FIXTURE)
    except OSError:
        return None
    if _cache["cells"] is None or m != _cache["mtime"]:
        d = json.load(open(FIXTURE))
        _cache["cells"] = d.get("cells") or []
        _cache["mtime"] = m
    return _cache["cells"]


def norm_pair(p):
    """EUR/USD | EURUSD | eurusd -> EUR/USD"""
    s = str(p or "").strip().upper().replace("-", "/")
    if "/" in s:
        return s
    if re.fullmatch(r"[A-Z]{6}", s):
        return f"{s[:3]}/{s[3:]}"
    return s


def bars_for(pair, timeframe):
    cells = load_cells()
    if cells is None:
        return None, ("FIXTURE_ABSENT", f"fixture not readable at {FIXTURE}")
    want_pair = norm_pair(pair)
    want_tf = TF_ALIASES.get(str(timeframe or "").strip(), str(timeframe or "").strip())
    for c in cells:
        if norm_pair(c.get("pair")) == want_pair and str(c.get("timeframe")) == want_tf:
            raw = c.get("bars") or []
            bars = [
                {
                    "time": b.get("timestamp"),
                    "open": b.get("open"),
                    "high": b.get("high"),
                    "low": b.get("low"),
                    "close": b.get("close"),
                    "volume": b.get("volume", 0) or 0,
                }
                for b in raw
            ]
            return bars, None
    have = sorted({f"{norm_pair(c.get('pair'))} {c.get('timeframe')}" for c in cells})
    return None, ("FIXTURE_CELL_ABSENT", f"{want_pair} {want_tf} — the fixture carries {', '.join(have)}")


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *a):
        sys.stderr.write("[pv-server] " + (fmt % a) + "\n")

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/v1/chart/bars":
            q = parse_qs(u.query)
            pair = (q.get("pair") or [""])[0]
            tf = (q.get("timeframe") or [""])[0]
            bars, err = bars_for(pair, tf)
            if err:
                code, msg = err
                return self._json(200, {"success": False, "code": code, "error": msg})
            return self._json(200, {"success": True, "data": {"pair": norm_pair(pair), "timeframe": tf, "count": len(bars), "bars": bars}})
        if u.path == "/api/v1/health":
            cells = load_cells()
            return self._json(200, {"success": True, "data": {"cells": len(cells or []), "fixture": FIXTURE}})
        return super().do_GET()

    def end_headers(self):
        # Never let the browser cache a source-of-truth file during a live iteration.
        # This class of bug (2026-10-01): `.pine` was missing from this list, so Chrome served a
        # CACHED copy of the indicator and the IDE rendered a binary that was two sessions old.
        # Only images/fonts are worth caching; everything else is re-fetched.
        path = self.path.split("?")[0]
        if not path.endswith((".png", ".jpg", ".jpeg", ".gif", ".woff", ".woff2", ".ttf", ".svg")):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9851
    root = sys.argv[2] if len(sys.argv) > 2 else "."
    os.chdir(root)
    mimetypes.add_type("text/javascript", ".mjs")
    mimetypes.add_type("text/javascript", ".js")
    print(f"[pv-server] :{port} root={root} fixture={FIXTURE}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
