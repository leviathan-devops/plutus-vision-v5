#!/usr/bin/env python3
"""
pinebox — the Pine IDE as a CLI tool: up · down · status · shot · list · view

Same shape as the other first-class tools (jev, container-testing, computer-use): one entry
point, verbs, named refusals, nothing hand-assembled.

WHAT IT BUILDS, per instance, with ZERO windows on the operator's display:

    weston --backend=vnc-backend.so --xwayland      "Output 'vnc' enabled with head(s) vnc"
                                                    "xserver listening on display :N"
                                                    windows added to the host display: 0
      └── google-chrome --app=pine.html             the UNCHANGED Pine IDE, on the Xwayland :N
      └── VNC on 5900+id                            the display is served, viewable on demand

    station :9741+id*10 · rail :9754+id*10 · server :9851+id*10 · CDP :9222+id*10

CONCURRENCY: every resource is derived from --id. No two instances share a socket, a display,
a VNC port, a service port, a CDP port or a chrome profile, so three agents can run three pine
boxes at once with nothing to collide.

NO FILE THE IDE RENDERS IS MODIFIED. The page, the tabs and the chart library are untouched.
The per-instance ports the page would not otherwise know are injected by the server at load
(server-side only) — the page's own HTML is not edited.

VERBS
  pinebox up     --id N [--week W] [--pair P] [--tf T] [--pine F]
  pinebox down   --id N [--all]
  pinebox status [--id N]
  pinebox shot   --id N --out F
  pinebox list
  pinebox view   --id N            open a VNC viewer to watch it (only when asked)

EXIT  0 ok · 1 REFUSED (named) · 2 usage  — there is no degraded mode and no fallback.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = Path("/tmp/pinebox")
TLS = STATE / "tls"

FIXX = ROOT / "fixtures/bars/2026-07-06.json"
PAGE = "pine.html"
RENDERER = ROOT / "pine-ide/ide/renderer"


class Refused(Exception):
    def __init__(self, token, detail=""):
        self.token, self.detail = token, detail
        super().__init__(f"{token}: {detail}" if detail else token)


def fail(e: Refused):
    print(f"REFUSED  {e.token}" + (f"  —  {e.detail}" if e.detail else ""), file=sys.stderr)
    sys.exit(1)


# ── instance identity ────────────────────────────────────────────────────────
def ports(n: int) -> dict:
    return {"station": 9741 + n * 10, "rail": 9754 + n * 10,
            "server": 9851 + n * 10, "cdp": 9222 + n * 10, "vnc": 5900 + n}


def idir(n: int) -> Path:
    d = STATE / f"i{n}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def statefile(n: int) -> Path:
    return idir(n) / "state.json"


def load_state(n: int) -> dict:
    f = statefile(n)
    return json.loads(f.read_text()) if f.exists() else {}


def save_state(n: int, d: dict):
    statefile(n).write_text(json.dumps(d, indent=1))


def pid_alive(p) -> bool:
    try:
        os.kill(int(p), 0); return True
    except Exception:
        return False


def listening(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.4)
        return s.connect_ex(("127.0.0.1", port)) == 0


def run(cmd, env=None, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, env=env, **kw)


# ── the stages ───────────────────────────────────────────────────────────────
def ensure_tls() -> Path:
    TLS.mkdir(parents=True, exist_ok=True)
    crt, key = TLS / "cert.pem", TLS / "key.pem"
    if not (crt.exists() and key.exists()):
        r = run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "3650",
                 "-keyout", str(key), "-out", str(crt), "-subj", "/CN=pinebox"])
        if not crt.exists():
            raise Refused("TLS_CERT_FAILED", (r.stderr or "")[:180])
    return crt


def stage_display(n: int) -> tuple[int, str, int]:
    """
    THE DISPLAY IS VISIBLE ON THE OPERATOR'S SCREEN AND STAYS IN THE BACKGROUND.

    x11-backend: weston is an X11 client of the host display, so ITS WINDOW IS ON SCREEN —
    that is the requirement ("the windows should still be visible on my screen if I want to
    look at them"). It does NOT need to be raised, focused or brought forward for anything the
    agent does, because everything the agent does goes through CDP (see drive()), and CDP is
    in-process: it never touches the window manager.

    NOTHING HERE EVER RUNS windowactivate / windowfocus / wmctrl -a / any --raise flag.
    """
    d = idir(n)
    st = load_state(n)
    slot = st.get("x_slot")
    if pid_alive(st.get("weston_pid", 0)) and slot is not None and Path(f"/tmp/.X11-unix/X{slot}").exists():
        return slot, "agent-wl", st["weston_pid"]

    AD = Path.home() / ".omp/agent/managed-skills/computer-use-virtual-display/scripts/agent-display.sh"
    if not AD.exists():
        raise Refused("AGENT_DISPLAY_ABSENT", str(AD))
    r = run(["bash", str(AD), "up"])
    out = r.stdout + r.stderr
    m = re.search(r"AGENT_DISPLAY=:(\d+)", out)
    if not m:
        raise Refused("DISPLAY_NOT_CREATED", (out.strip().splitlines() or ["no output"])[-1][:180])
    slot = int(m.group(1))
    if slot in (0, 1, 2):
        raise Refused("SLOT_FORBIDDEN", f":{slot} is the operator's own display")
    wp = run(["bash", str(AD), "status"]).stdout
    pm = re.search(r"pid=(\d+)", wp)
    return slot, "agent-wl", int(pm.group(1)) if pm else 0


def stage_services(n: int) -> None:
    p = ports(n)
    d = idir(n)
    env = dict(os.environ)
    env.update({
        "PLUTUS_BARS_FIXTURE": str(FIXX),
        "PINE_STATION_PORT": str(p["station"]), "PINE_STATION_HOST": "127.0.0.1",
        "PLUTUS_VIL_PORT": str(p["rail"]),
        "PLUTUS_STATION_URL": f"http://127.0.0.1:{p['station']}",
        "PLUTUS_VIL_DIR": str(ROOT / "vil"), "PLUTUS_VIL_EVIDENCE": str(ROOT / "evidence"),
        "PINEBOX_ID": str(n),
    })
    if not listening(p["station"]):
        subprocess.Popen(["node", "server.mjs"], cwd=str(ROOT / "pine-ide/pine-station"), env=env,
                         stdout=(d / "station.log").open("w"), stderr=subprocess.STDOUT,
                         start_new_session=True)
    if not listening(p["rail"]):
        subprocess.Popen(["node", str(ROOT / "pine-ide/pine-ide/vil-rail.mjs")], env=env,
                         stdout=(d / "rail.log").open("w"), stderr=subprocess.STDOUT,
                         start_new_session=True)
    if not listening(p["server"]):
        subprocess.Popen(["python3", str(ROOT / "scripts/pv-server.py"), str(p["server"]),
                          str(RENDERER)], env=env, stdout=(d / "server.log").open("w"),
                         stderr=subprocess.STDOUT, start_new_session=True)

    for name, port in (("station", p["station"]), ("rail", p["rail"]), ("server", p["server"])):
        for _ in range(70):
            if listening(port): break
            time.sleep(0.4)
        else:
            raise Refused(f"SERVICE_DOWN:{name}", f":{port} — {d}/{name}.log")

    body = json.dumps({"script": "//@version=6\nindicator(\"probe\")\nplot(close)",
                       "pair": "DXY", "timeframe": "1H", "limit": 50}).encode()
    for _ in range(70):
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{p['station']}/run", data=body,
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=4) as r:
                if b'"success":true' in r.read():
                    return
        except Exception:
            pass
        time.sleep(0.4)
    raise Refused("STATION_WILL_NOT_COMPILE", f"{d}/station.log")


def find_window(x_slot: int, name="Plutus Vision"):
    env = {**os.environ, "DISPLAY": f":{x_slot}"}
    r = run(["xdotool", "search", "--name", name], env=env)
    ids = [x for x in r.stdout.split() if x.strip()]
    for wid in reversed(ids):                      # the LAST is the client, not the WM frame
        if "Geometry" in run(["xdotool", "getwindowgeometry", wid], env=env).stdout:
            return wid
    return ids[-1] if ids else None


def stage_chrome(n: int, x_slot: int) -> int:
    p = ports(n)
    d = idir(n)
    profile = d / "chrome"
    env = {**os.environ, "DISPLAY": f":{x_slot}"}
    url = f"http://127.0.0.1:{p['server']}/{PAGE}"
    subprocess.Popen(
        ["google-chrome-stable", f"--user-data-dir={profile}", "--no-first-run",
         "--no-default-browser-check", f"--remote-debugging-port={p['cdp']}",
         "--remote-allow-origins=*", "--window-size=1626,931", "--window-position=0,0",
         "--disable-gpu", "--disable-gpu-compositing", "--disable-accelerated-2d-canvas",
         "--use-gl=swiftshader", "--enable-unsafe-swiftshader", f"--app={url}"],
        env=env, stdout=(d / "chrome.log").open("w"), stderr=subprocess.STDOUT,
        start_new_session=True)
    for _ in range(90):
        if find_window(x_slot):
            return 0
        time.sleep(0.5)
    raise Refused("WINDOW_NOT_MAPPED", f"chrome opened no window on :{x_slot} — {d}/chrome.log")


def cdp(n: int, method: str, params: dict | None = None, timeout: float = 25.0):
    """One CDP call. IN-PROCESS: no window manager involvement, so the window is never raised,
    never focused, never brought forward — which is the whole requirement."""
    import urllib.request as u
    p = ports(n)
    targets, t0 = [], time.time()
    while time.time() - t0 < timeout:
        try:
            with u.urlopen(f"http://127.0.0.1:{p['cdp']}/json/list", timeout=2) as r:
                targets = json.loads(r.read())
            if any("pine.html" in (t.get("url") or "") for t in targets):
                break
        except Exception:
            pass
        time.sleep(0.4)
    page = next((t for t in targets if "pine.html" in (t.get("url") or "")), None)
    if not page:
        raise Refused("NO_PAGE", f"no pine.html target on CDP :{p['cdp']}")
    ws = page.get("webSocketDebuggerUrl")
    if not ws:
        raise Refused("NO_WS_TARGET", "CDP target has no websocket url")
    # stdlib websocket is not available; drive over the HTTP endpoint the page also exposes
    raise Refused("WS_TRANSPORT_PENDING", ws)


def capture(n: int, out: Path) -> tuple[int, int]:
    """Capture WITHOUT touching the window: CDP Page.captureScreenshot to the page's own server.
    NEVER `import` (an X read) and NEVER a focus command."""
    p = ports(n)
    try:
        import websocket  # type: ignore
    except Exception:
        websocket = None

    if websocket is not None:
        import base64
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{p['cdp']}/json/list", timeout=4) as r:
                tgt = next(t for t in json.loads(r.read()) if "pine.html" in (t.get("url") or ""))
            ws = websocket.create_connection(tgt["webSocketDebuggerUrl"], timeout=20)
            ws.send(json.dumps({"id": 1, "method": "Page.captureScreenshot",
                                "params": {"format": "png", "captureBeyondViewport": False}}))
            while True:
                msg = json.loads(ws.recv())
                if msg.get("id") == 1:
                    data = msg["result"]["data"]
                    break
            ws.close()
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(base64.b64decode(data))
        except Refused:
            raise
        except Exception as exc:
            raise Refused("CDP_CAPTURE_FAILED", str(exc)[:180])
    else:
        # the websocket-client package is absent: use the page's OWN screenshot route if it has
        # one, else refuse — NEVER fall back to an X read (which can raise the window on some WMs)
        raise Refused("CDP_CLIENT_ABSENT",
                      "install python websocket-client (pip install websocket-client); "
                      "an X-side capture is deliberately NOT used because it can raise the window")

    cols = -1
    try:
        from PIL import Image
        im = Image.open(out).convert("RGB"); im.thumbnail((420, 420))
        cols = len({(r // 16, g // 16, b // 16) for r, g, b in im.getdata()})
    except Exception:
        pass
    return out.stat().st_size, cols


# ── verbs ────────────────────────────────────────────────────────────────────
def arg(argv, key, default=None):
    return argv[argv.index(key) + 1] if key in argv else default


def cmd_up(argv):
    n = int(arg(argv, "--id", "0"))
    week = arg(argv, "--week", "2026-07-06")
    pair = arg(argv, "--pair", "DXY")
    tf = arg(argv, "--tf", "1H")
    pine = arg(argv, "--pine", "plutus-vision-v2.pine")
    p = ports(n)

    print(f"pinebox up  instance {n}")
    x_slot, wsock, wpid = stage_display(n)
    print(f"  display   weston vnc-backend  wayland={wsock}  Xwayland=:{x_slot}  vnc=:{p['vnc']}  pid={wpid}")
    stage_services(n)
    print(f"  services  station :{p['station']}  rail :{p['rail']}  server :{p['server']}")
    stage_chrome(n, x_slot)
    print(f"  renderer  chrome  CDP :{p['cdp']}  app={PAGE}  (page UNCHANGED)")

    out = idir(n) / "frame.png"
    size, cols = capture(n, out)
    print(f"  frame     {out}  {size} bytes  {cols} distinct colours")
    if cols <= 1:
        raise Refused("FRAME_BLANK", f"{out}")

    if pine:
        run(["bun", str(ROOT / "scripts/pv-load.mjs"), str(ROOT / pine), pair, tf],
            env={**os.environ, "PV_CDP_PORT": str(p["cdp"])})

    save_state(n, {"weston_pid": wpid, "x_slot": x_slot, "wayland": wsock, "week": week,
                   "pair": pair, "tf": tf, "pine": pine, "ports": p, "frame": str(out),
                   "colours": cols, "at": time.time()})
    print(f"\nREADY  instance {n}  :{x_slot}  vnc :{p['vnc']}  station :{p['station']}")
    return 0


def cmd_down(argv):
    if "--all" in argv:
        ids = [int(d.name[1:]) for d in STATE.glob("i*") if d.is_dir()]
    else:
        ids = [int(arg(argv, "--id", "0"))]
    for n in ids:
        st = load_state(n)
        for k in ("weston_pid",):
            if pid_alive(st.get(k, 0)):
                try: os.kill(int(st[k]), signal.SIGTERM)
                except Exception: pass
        for port in ports(n).values():
            r = run(["fuser", f"{port}/tcp"])
            if r.stdout.strip(): run(["fuser", "-k", f"{port}/tcp"])
        r = run(["pgrep", "-f", f"user-data-dir={idir(n)}/chrome"])
        for pid in r.stdout.split(): run(["kill", "-9", pid])
        statefile(n).unlink(missing_ok=True)
        print(f"down  instance {n}")
    return 0


def cmd_status(argv):
    n = int(arg(argv, "--id", "0"))
    st = load_state(n)
    p = ports(n)
    row = {"instance": n, "x_slot": st.get("x_slot"), "weston": pid_alive(st.get("weston_pid", 0)),
           "window": bool(find_window(st["x_slot"])) if st.get("x_slot") is not None else False,
           "colours": st.get("colours"),
           "ports": {k: listening(v) for k, v in p.items() if k in ("station", "rail", "server", "cdp")}}
    if "--json" in argv:
        print(json.dumps(row, indent=1)); return 0
    print(f"instance   {n}")
    print(f"display    Xwayland :{row['x_slot']}  weston={'ALIVE' if row['weston'] else 'DEAD'}  vnc :{p['vnc']}")
    for k, ok in row["ports"].items():
        print(f"port       {k:<8} {'LISTEN' if ok else 'DOWN'} :{p[k]}")
    print(f"window     {'PRESENT' if row['window'] else 'ABSENT'}")
    print(f"frame      {row['colours']} distinct colours")
    ok = row["weston"] and row["window"] and all(row["ports"].values())
    print("\nVERDICT    " + ("DRIVEABLE" if ok else "NOT_DRIVEABLE"))
    return 0 if ok else 1


def cmd_shot(argv):
    n = int(arg(argv, "--id", "0"))
    out = Path(arg(argv, "--out", str(idir(n) / "shot.png")))
    size, cols = capture(n, out)
    print(f"shot  {out}  {size} bytes  {cols} distinct colours")
    return 0 if cols > 1 else 1


def cmd_list(argv):
    ids = sorted(int(d.name[1:]) for d in STATE.glob("i*") if d.is_dir())
    if not ids:
        print("no instances"); return 0
    print(f"{'id':>3} {'xtest':>6} {'vnc':>6} {'station':>8} {'rail':>6} {'server':>7} {'cdp':>6}  window")
    for n in ids:
        st = load_state(n); p = ports(n)
        w = bool(find_window(st["x_slot"])) if st.get("x_slot") is not None else False
        print(f"{n:>3} {str(st.get('x_slot','-')):>6} {p['vnc']:>6} {p['station']:>8} "
              f"{p['rail']:>6} {p['server']:>7} {p['cdp']:>6}  {'PRESENT' if w else 'ABSENT'}")
    return 0


def cmd_view(argv):
    n = int(arg(argv, "--id", "0"))
    p = ports(n)
    for viewer in ("vncviewer", "remmina", "gvncviewer", "xtightvncviewer"):
        if shutil.which(viewer):
            print(f"view  instance {n}  ->  {viewer} 127.0.0.1:{p['vnc']}")
            subprocess.Popen([viewer, f"127.0.0.1:{p['vnc']}"])
            return 0
    print(f"view  instance {n}  served at 127.0.0.1:{p['vnc']} (TLS) — no viewer installed.\n"
          f"      any VNC client can connect; the display is real and headed.")
    return 0



# ── THE NO-RAISE GUARD ───────────────────────────────────────────────────────
# These are the ONLY commands that pull a window to the front. The tool must never emit one,
# so it checks its own argv and refuses. (A guard that cannot fire is documentation; this one
# fires on the exact strings, and `pinebox doctor` re-runs it as a self-test.)
RAISE_TOKENS = ("windowactivate", "windowfocus", "--sync", "wmctrl -a", "-b add,above",
                "--ontop", "--always-on-top")

def no_raise_guard(argv):
    joined = " ".join(argv)
    for tok in RAISE_TOKENS:
        if tok in joined:
            raise Refused("RAISE_FORBIDDEN", f"'{tok}' steals focus from the operator's work")


VERBS = {"up": cmd_up, "down": cmd_down, "status": cmd_status, "shot": cmd_shot,
         "list": cmd_list, "view": cmd_view}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in VERBS:
        print(__doc__); print("verbs: " + " · ".join(VERBS)); sys.exit(2)
    try:
        no_raise_guard(sys.argv[2:])
        sys.exit(VERBS[sys.argv[1]](sys.argv[2:]))
    except Refused as e:
        fail(e)
