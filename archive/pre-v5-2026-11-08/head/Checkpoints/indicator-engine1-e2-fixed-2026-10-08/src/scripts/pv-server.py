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

  3. THE AGENT'S FACE PROXY — `/api/v1/workspaces…`, `/api/v1/commands…` and
     `/api/v1/orca/terminals…` are forwarded VERBATIM to the dashboard server
     (:9430), which owns the agent-workspaces DB and the Orca terminal bridge.
     Without it the face panel reads "workspaces offline" (measured 2026-10-07).

CONTRACT (read from charts/workbench.js FixtureProvider.getBars):
  request   GET  {base}/api/v1/chart/bars?pair=<urlencoded pair>&timeframe=<15m|30m|1H|4H>
  response  {success: true, data: {bars: [{time, open, high, low, close, volume}]}}
  failure   {success: false, code, error}   (the provider throws coded(code, error))

Run:  python3 pv-server.py <port> <static-root>
"""
import json
import os
import pathlib
import re
import sys
import mimetypes
import codecs
import fcntl
import pty
import select
import shutil
import struct
import subprocess
import termios
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ── THE AGENT'S FACE PROXY (2026-10-07) ───────────────────────────────────────
# THE PINE SHELL's AGENT'S FACE panel speaks the DASHBOARD's agent-workspace API —
# `GET/POST/PATCH/DELETE /api/v1/workspaces…`, `GET /api/v1/commands/pending`, and
# the ORCA TERMINAL BRIDGE (`GET /api/v1/orca/terminals…`, `…/screen`, `…/send`).
# That API + the agent_workspaces DB + the Orca bridge all live in the DASHBOARD
# server (127.0.0.1:9430) — never here. This host serves the renderer and the chart
# feed on ONE base (`window.dashboardConfig.apiBase`, which the shell's asset loader
# and the backtest tab's bars/zones ALSO resolve against), so the standalone app can
# only work when those three prefixes are PROXIED to the dashboard.
# MEASURED 2026-10-07: every one of them returned 404 here, `face.boot()` threw at
# `refreshList()`, and the panel read "workspaces offline" with the terminal mirror
# dead. Same-origin (no CORS game); a dead upstream is a NAMED refusal, never a
# fabricated success.
FACE_API = os.environ.get("PV_FACE_API") or "http://127.0.0.1:9430"
FACE_PREFIXES = ("/api/v1/workspaces", "/api/v1/commands", "/api/v1/orca/")
FACE_TIMEOUT = float(os.environ.get("PV_FACE_TIMEOUT", "20"))


def face_route(path: str) -> bool:
    """The three prefixes the AGENT'S FACE owns (proxied to the dashboard)."""
    return path.startswith(FACE_PREFIXES)

# fixture timeframe spelling -> the spellings the workbench may ask with.
FIXTURE = os.environ.get("PV_FIXTURE") or str(__import__("pathlib").Path(__file__).resolve().parent.parent / "fixtures/bars/2026-07-06.json")
# THE E1 ZONE PAYLOAD DIR — the backtest tab's /api/v1/e1/zones reads it (2026-10-06).
E1_DIR = os.environ.get("PV_E1_DIR") or str(__import__("pathlib").Path(__file__).resolve().parent.parent / "data" / "e1")

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
            return _prediction_space(bars), None
    have = sorted({f"{norm_pair(c.get('pair'))} {c.get('timeframe')}" for c in cells})
    return None, ("FIXTURE_CELL_ABSENT", f"{want_pair} {want_tf} — the fixture carries {', '.join(have)}")

# ── THE PREDICTION SPACE (2026-07-05) ────────────────────────────────────────
# The fixture is deliberately TRUNCATED at the ANALYSIS POINT (`anchorMs`, Monday pre-London):
# "bars past the anchor are ABSENT". The E1 institutional-pressure zones and the E2 forecast
# path are BOTH predictions for the week AHEAD — i.e. FUTURE of the last bar. The vela chart
# clamps at the last bar, so a future `line.new`/`box.new` never draws. The chart therefore
# carries the target week's space: `PREDICTION_BARS` flat (at the last close) bars appended
# after the anchor, so the zones + path render IN that space, exactly as the operator sees the
# forecast for the coming week. Flat, zero-volume, and OUTSIDE the fixture file — the build's
# analysis series is never touched.
PREDICTION_BARS = int(os.environ.get("PV_PREDICTION_BARS", "126"))

def _prediction_space(bars):
    if not bars or PREDICTION_BARS <= 0:
        return bars
    step = (bars[-1]["time"] - bars[-2]["time"]) if len(bars) >= 2 else 3600000
    c = bars[-1]["close"]
    # THE SCALE — TWO FLAT BARS (fixed 2026-10-06). The chart autoscales to the BARS (the E1
    # render's plot() does not pull it). The tool needs bars whose EXTENT is the zone range, so
    # the FIRST prediction bar sits at the ceiling (flat) and the SECOND at the floor (flat):
    # both are 1px ticks (no vertical line), and together they pull the scale to span the whole
    # zone range. The earlier single `close ± band` bar drew a full-height vertical WICK — the
    # operator's remaining wonk. Two flat bars: no wick, the scale still fits. The rest of the
    # prediction space stays at the close.
    band = float(os.environ.get("PV_PREDICTION_BAND", "0.75"))
    out = list(bars)
    t = bars[-1]["time"]
    for i in range(PREDICTION_BARS):
        t += step
        if i == 0:
            out.append({"time": t, "open": c + band, "high": c + band, "low": c + band,
                        "close": c + band, "volume": 0})
        elif i == 1:
            out.append({"time": t, "open": c - band, "high": c - band, "low": c - band,
                        "close": c - band, "volume": 0})
        else:
            out.append({"time": t, "open": c, "high": c, "low": c, "close": c, "volume": 0})
    return out


# ── THE LIVE TERMINAL (2026-10-07) — the pty transport the AGENT'S FACE 2.0.0 opens ──
# FACE_VERSION 2.0.0 draws a real terminal: ONE cols×rows ANSI screen per workspace, fed by a
# pty's OWN byte stream (createAnsiScreen in agent-face.mjs). Its transport is
# `window.PlutusTerm` — in the DASHBOARD that is the Electron preload bridge over
# `ipcMain.handle('term:*')` → electron/terminal-bridge.js (a `plutus-term-<workspace>`
# tmux session attached through `script`). This standalone host runs in CHROME over HTTP:
# there is no Electron IPC, so the port must SUPPLY the same transport. (Measured
# 2026-10-07: :9430 exposes NO HTTP pty route — the bridge is IPC-only — so proxying a
# prefix could never reach it; the route has to exist here.)
#
# THE SHAPE is the bridge's own, re-hosted on Python's stdlib pty (no node-pty on this host
# either):  tmux new-session -d -s plutus-term-<ws> -x C -y R · tmux set-option window-size
# manual · pty.openpty() + `tmux attach` whose slave IS a real tty. Writes to the master are
# typed into the pane; reads are the pane's own rendering — the exact bytes createAnsiScreen
# consumes. Same-origin under /api/v1/term/*, token-gated like the rest of the face.
TERM_BUF_CAP = 1024 * 1024          # chars of scrollback retained per session (mirrors BUF_CAP)
TERM_READ_CAP = 256 * 1024          # the most read() ever replays (mirrors READ_CAP)
TERM_MAX = int(os.environ.get("PV_TERM_MAX", "4"))
TERM_TOKEN = os.environ.get("PV_TERM_TOKEN") or "rw_dev_plutus_backtest"
TERM_ID_RX = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$")
TMUX = shutil.which("tmux") or "/usr/bin/tmux"

_terms = {}
_terms_lock = threading.RLock()


def _term_dim(v, dflt):
    try:
        n = int(v)
    except (TypeError, ValueError):
        return dflt
    return max(2, min(1000, n))


def _set_winsize(fd, cols, rows):
    """Give a pty its grid. THE CLIENT'S OWN tty size is what tmux draws at (measured in the
    dashboard bridge, 2026-10-02: an unsized client pty made tmux fall back to 80x24 and clipped
    a 99-column pane). pty.openpty() leaves the winsize 0x0, so it is set BEFORE tmux attaches."""
    try:
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
    except Exception:
        pass


class TermSession:
    """ONE live pty: a tmux session attached through a stdlib pty master."""

    def __init__(self, wsid, cols, rows, cwd):
        self.id = wsid
        self.cols = _term_dim(cols, 120)
        self.rows = _term_dim(rows, 32)
        self.cwd = cwd if (cwd and os.path.isdir(str(cwd))) else os.getcwd()
        # tmux forbids '.' and ':' in a session name — sanitise the id, keep the namespace ours
        self.name = "plutus-term-" + re.sub(r"[^A-Za-z0-9_-]", "_", wsid)
        self.buf = ""
        self.seq = 0
        self.exit = None
        self.closed = False
        self.lock = threading.RLock()
        self._dec = codecs.getincrementaldecoder("utf-8")(errors="replace")
        self._spawn()

    def _has_session(self):
        try:
            subprocess.run([TMUX, "has-session", "-t", self.name], capture_output=True, timeout=5, check=True)
            return True
        except Exception:
            return False

    def _spawn(self):
        # an existing session is ADOPTED, never re-created (the bridge's own crash-survival law:
        # a tmux session outlives the server/app that made it; `new-session` on a live name fails
        # with 'duplicate session' — measured 2026-10-07 after a pv-server restart).
        if not self._has_session():
            subprocess.run([TMUX, "new-session", "-d", "-s", self.name, "-x", str(self.cols), "-y", str(self.rows), "-c", self.cwd],
                           check=True, capture_output=True, timeout=10)
        subprocess.run([TMUX, "set-option", "-t", self.name, "window-size", "manual"],
                       check=True, capture_output=True, timeout=10)
        master, slave = pty.openpty()
        _set_winsize(master, self.cols, self.rows)      # the CLIENT tty tmux draws at — sized BEFORE attach
        self.master = master
        env = dict(os.environ)
        env["TERM"] = "xterm-256color"
        env["COLORTERM"] = "truecolor"
        env.pop("TMUX", None)
        env.pop("TMUX_PANE", None)
        # its own process group, so a kill reaches tmux attach (the emitted client), not just this pid
        self.proc = subprocess.Popen([TMUX, "attach", "-t", self.name], stdin=slave, stdout=slave, stderr=slave,
                                     cwd=self.cwd, env=env, close_fds=True, start_new_session=True)
        os.close(slave)
        threading.Thread(target=self._read_loop, name="pv-term-" + self.id, daemon=True).start()

    def _read_loop(self):
        while not self.closed:
            try:
                ready, _, _ = select.select([self.master], [], [], 0.5)
            except (OSError, ValueError):
                break
            if not ready:
                if self.proc.poll() is not None:
                    break
                continue
            try:
                chunk = os.read(self.master, 65536)
            except OSError:
                break
            if not chunk:
                break
            self._emit(chunk)
        self._mark_exit()

    def _emit(self, chunk):
        text = self._dec.decode(chunk)          # incremental: a split multibyte char is held, not mangled
        if not text:
            return
        with self.lock:
            self.buf = (self.buf + text)[-TERM_BUF_CAP:]
            self.seq += len(text)

    def _mark_exit(self):
        with self.lock:
            if self.exit is not None:
                return
            code = self.proc.poll()
            self.exit = {"code": code if code is not None else None, "signal": None}

    def write(self, data):
        b = str(data).encode("utf-8")
        with self.lock:
            if self.closed:
                raise KeyError("TERM_NO_SESSION")
            os.write(self.master, b)
        return {"bytes": len(b)}

    def resize(self, cols, rows):
        c, r = _term_dim(cols, self.cols), _term_dim(rows, self.rows)
        _set_winsize(self.master, c, r)                 # the tmux CLIENT's tty: the width tmux draws at
        try:
            subprocess.run([TMUX, "resize-window", "-t", self.name, "-x", str(c), "-y", str(r)],
                           capture_output=True, timeout=5)
        except Exception:
            pass
        self.cols, self.rows = c, r
        return {"cols": c, "rows": r}

    def read(self):
        with self.lock:
            return {"buffer": self.buf[-TERM_READ_CAP:], "cursor": self.seq}

    def poll(self, cursor):
        with self.lock:
            start = max(0, self.seq - len(self.buf))
            if cursor is None or cursor < start:
                data, cur = self.buf, self.seq          # resync (a reconnecting client, or a ring roll)
            else:
                data, cur = self.buf[cursor - start:], self.seq
            return {"cursor": cur, "data": data, "name": self.name, "exit": self.exit}

    def info(self):
        return {"id": self.id, "name": self.name, "pid": self.proc.pid, "backend": "tmux+pty",
                "cols": self.cols, "rows": self.rows, "cwd": self.cwd,
                "alive": self.proc.poll() is None, "chars": len(self.buf)}

    def close(self):
        self.closed = True
        try:
            self.proc.terminate()
        except Exception:
            pass
        try:
            subprocess.run([TMUX, "kill-session", "-t", self.name], capture_output=True, timeout=5)
        except Exception:
            pass
        try:
            os.close(self.master)
        except Exception:
            pass
        return {"closed": self.name}


def term_open(wsid, cols, rows, cwd):
    if not TERM_ID_RX.match(str(wsid or "")):
        raise ValueError("BAD_WORKSPACE_ID")
    with _terms_lock:
        for k in [k for k, s in _terms.items() if s.closed]:
            _terms.pop(k, None)
        live = _terms.get(wsid)
        if live and not live.closed and live.proc.poll() is None:
            return live.info()
        if live:
            try:
                live.close()
            except Exception:
                pass
        if sum(1 for s in _terms.values() if s.proc.poll() is None) >= TERM_MAX:
            raise ValueError("TERM_LIMIT")
        try:
            s = TermSession(wsid, cols, rows, cwd)
        except subprocess.CalledProcessError as e:
            raise ValueError("TERM_SPAWN_FAILED: " + (e.stderr or b"").decode("utf-8", "replace")[:160])
        except OSError as e:
            raise ValueError("TERM_SPAWN_FAILED: " + str(e)[:160])
        _terms[wsid] = s
        return s.info()


def term_get(wsid):
    with _terms_lock:
        s = _terms.get(str(wsid or ""))
        if not s or s.closed:
            raise KeyError("TERM_NO_SESSION")
        return s


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

    def _term_ok(self, u):
        q = parse_qs(u.query)
        tok = (q.get("token") or [""])[0]
        if not tok:
            auth = self.headers.get("Authorization") or ""
            if auth.lower().startswith("bearer "):
                tok = auth[7:]
        return tok == TERM_TOKEN

    def _term_refusal(self):
        return self._json(403, {"success": False, "code": "TERM_TOKEN_REQUIRED",
                                "error": "the terminal bridge needs ?token= (or a Bearer header)"})

    def _term_get(self, u):
        if not self._term_ok(u):
            return self._term_refusal()
        q = parse_qs(u.query)
        try:
            if u.path == "/api/v1/term/sessions":
                with _terms_lock:
                    live = [s.info() for s in _terms.values() if not s.closed]
                return self._json(200, {"success": True, "data": {"sessions": live}})
            if u.path == "/api/v1/term/read":
                return self._json(200, {"success": True, "data": term_get((q.get("id") or [""])[0]).read()})
            if u.path == "/api/v1/term/poll":
                cur = (q.get("cursor") or [""])[0]
                cursor = int(cur) if cur.isdigit() else None
                return self._json(200, {"success": True, "data": term_get((q.get("id") or [""])[0]).poll(cursor)})
        except KeyError as e:
            return self._json(200, {"success": False, "code": str(e.args[0]), "error": "no such terminal session"})
        except ValueError as e:
            return self._json(200, {"success": False, "code": str(e.args[0]), "error": "bad terminal request"})
        except Exception as e:                        # a REAL failure is loud and named, never an empty screen
            return self._json(500, {"success": False, "code": "TERM_ERROR",
                                    "error": f"{type(e).__name__}: {str(e)[:160]}"})
        return self._json(404, {"success": False, "code": "TERM_ROUTE_UNKNOWN", "error": u.path})

    def _term_post(self, u):
        if not self._term_ok(u):
            return self._term_refusal()
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n > 0 else b""
        try:
            body = json.loads(raw or b"{}")
        except Exception:
            return self._json(400, {"success": False, "code": "BAD_JSON", "error": "body is not JSON"})
        try:
            if u.path == "/api/v1/term/open":
                return self._json(200, {"success": True, "data": term_open(
                    body.get("id"), body.get("cols"), body.get("rows"), body.get("cwd"))})
            if u.path == "/api/v1/term/write":
                return self._json(200, {"success": True, "data": term_get(body.get("id")).write(body.get("data", ""))})
            if u.path == "/api/v1/term/resize":
                return self._json(200, {"success": True, "data": term_get(body.get("id")).resize(
                    body.get("cols"), body.get("rows"))})
            if u.path == "/api/v1/term/close":
                out = term_get(body.get("id")).close()
                with _terms_lock:
                    _terms.pop(str(body.get("id")), None)
                return self._json(200, {"success": True, "data": out})
        except KeyError as e:
            return self._json(200, {"success": False, "code": str(e.args[0]), "error": "no such terminal session"})
        except ValueError as e:
            msg = str(e.args[0])
            return self._json(200, {"success": False, "code": msg.split(":")[0], "error": msg[:160]})
        except OSError as e:
            return self._json(200, {"success": False, "code": "TERM_WRITE_FAILED", "error": str(e)[:160]})
        except Exception as e:
            return self._json(500, {"success": False, "code": "TERM_ERROR",
                                    "error": f"{type(e).__name__}: {str(e)[:160]}"})
        return self._json(404, {"success": False, "code": "TERM_ROUTE_UNKNOWN", "error": u.path})

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith("/api/v1/term/"):
            return self._term_get(u)
        if face_route(u.path):
            return self._proxy("GET")
        if u.path == "/api/v1/chart/bars":
            q = parse_qs(u.query)
            pair = (q.get("pair") or [""])[0]
            tf = (q.get("timeframe") or [""])[0]
            bars, err = bars_for(pair, tf)
            if err:
                code, msg = err
                return self._json(200, {"success": False, "code": code, "error": msg})
            return self._json(200, {"success": True, "data": {"pair": norm_pair(pair), "timeframe": tf, "count": len(bars), "bars": bars}})
        if u.path == "/api/v1/e1/zones":
            # THE E1 ZONES for the backtest tab's overlay (2026-10-06, the operator: "plug your
            # indicator in on the back testing"). Returns the zones the v2 render draws, so the
            # room's chart can overlay them (the room's Vela chart has no pine runner, but it
            # DOES accept drawings.add('hline')). Pair-filtered, newest week first.
            q = parse_qs(u.query)
            want = (q.get("pair") or ["DXY"])[0].upper()
            try:
                files = sorted(pathlib.Path(E1_DIR).glob("*.json"), reverse=True)
            except Exception:
                files = []
            for f in files:
                if not f.stem.upper().startswith(want.replace("/", "")):
                    continue
                try:
                    doc = json.loads(f.read_text())
                except Exception:
                    continue
                out = []
                for z in doc.get("zones", []):
                    out.append({"name": z.get("name"), "top": z.get("top"),
                                "bottom": z.get("bottom"), "cat": z.get("zCat"),
                                "degree": z.get("degree_v8"), "zfp": z.get("zfp"),
                                "confluence": z.get("confluence")})
                return self._json(200, {"success": True, "data": {
                    "pair": want, "week": doc.get("target_week"), "spot": doc.get("spot"),
                    "anchor": doc.get("anchor"), "zones": out}})
            return self._json(200, {"success": False, "code": "E1_ABSENT",
                                    "error": f"no E1 file for {want} in {E1_DIR}"})
        if u.path == "/api/v1/health":
            cells = load_cells()
            return self._json(200, {"success": True, "data": {"cells": len(cells or []), "fixture": FIXTURE}})
        return super().do_GET()

    # ── THE AGENT'S FACE PROXY ──────────────────────────────────────────────
    # Forward the three face prefixes to the dashboard server VERBATIM: method,
    # query, Authorization, body. The upstream's own status + body (200, 401, 403
    # SEND_REFUSED, 404 WORKSPACE_ABSENT, 409 HANDLE_BOUND …) is passed through
    # UNCHANGED — this host never re-decides the face's contract. An unreachable
    # upstream is a LOUD named refusal (WORKSPACES_API_DOWN), never a fake success.
    def _proxy(self, method: str):
        u = urlparse(self.path)
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n) if n > 0 else None
        url = FACE_API + u.path + (("?" + u.query) if u.query else "")
        req = urllib.request.Request(url, data=body, method=method)
        for h in ("Authorization", "Content-Type", "Accept"):
            v = self.headers.get(h)
            if v:
                req.add_header(h, v)
        try:
            with urllib.request.urlopen(req, timeout=FACE_TIMEOUT) as r:
                payload, code = r.read(), r.status
                ctype = r.headers.get("Content-Type", "application/json")
        except urllib.error.HTTPError as e:          # the API's own refusal — forwarded as-is
            payload, code = e.read(), e.code
            ctype = e.headers.get("Content-Type", "application/json")
        except Exception as e:                        # the API is DOWN — loud, named, no fallback
            return self._json(503, {"success": False, "code": "WORKSPACES_API_DOWN",
                                    "error": f"{FACE_API} unreachable: {type(e).__name__}: {str(e)[:160]}"})
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path.startswith("/api/v1/term/"):
            return self._term_post(u)
        if face_route(urlparse(self.path).path):
            return self._proxy("POST")
        self.send_error(501, "this host is read-only (only the face proxy accepts writes)")

    def do_PATCH(self):
        if face_route(urlparse(self.path).path):
            return self._proxy("PATCH")
        self.send_error(501, "this host is read-only (only the face proxy accepts writes)")

    def do_PUT(self):
        if face_route(urlparse(self.path).path):
            return self._proxy("PUT")
        self.send_error(501, "this host is read-only (only the face proxy accepts writes)")

    def do_DELETE(self):
        if face_route(urlparse(self.path).path):
            return self._proxy("DELETE")
        self.send_error(501, "this host is read-only (only the face proxy accepts writes)")

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
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    # a KEYS burst arrives as one request per keystroke (the face's transport); the default backlog
    # is 5, so a 16-key word silently dropped connections (measured 2026-10-07: `echo PROBE_ALPHA`
    # reached the pane as `echo PROBE_ALP`). The client batches now; the backlog is raised anyway.
    srv.request_queue_size = 128
    srv.daemon_threads = True
    srv.serve_forever()
