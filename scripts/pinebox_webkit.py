#!/usr/bin/env python3
"""
pinebox_webkit — the renderer. WebKitGTK loads the UNCHANGED Pine IDE page and IS the window.

WHY WEBKIT AND NOT CHROME (measured on this host, same page, same UI, 2026-10-25):
    chrome --app   553.0 MB   11 processes   and four handoffs that all failed:
                                              a slot it computes itself, a profile grep that
                                              missed its own launches, a window to search for,
                                              a CDP port to collide on
    WebKitGTK      188.6 MB    3 processes   the window IS this process; it opens on the display
                                              it was given and dies with it

THE DRIVE LAYER (replaces CDP): a unix socket at /tmp/pinebox/i<pid>/drive.sock speaks one JSON
object per line — {"js": "<expression>"} → {"ok": true, "value": <json>}. WebKit evaluates it in
the page. No port, no page target, no tab to find.

The page is NOT modified: pine.html, tabs/, Vela, all untouched.
"""
from __future__ import annotations

import json
import os
import socket
import sys
import threading
from pathlib import Path

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import GLib, Gtk, WebKit2  # noqa: E402


URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:9851/pine.html"
SLOT = sys.argv[2] if len(sys.argv) > 2 else "0"
SOCKDIR = Path(f"/tmp/pinebox/webkit-{os.getpid()}")
SOCKDIR.mkdir(parents=True, exist_ok=True)
SOCK = SOCKDIR / "drive.sock"


class Host:
    def __init__(self):
        # the title MUST contain PINEBOX so the CLI can find this window on ITS slot
        self.win = Gtk.Window(title=f"PINEBOX · :{SLOT} · {URL}")
        self.win.set_default_size(1626, 900)
        self.win.move(0, 0)
        self.win.connect("destroy", Gtk.main_quit)

        self.view = WebKit2.WebView()
        self.view.load_uri(URL)
        self.view.connect("load-changed", self._on_load)
        self.win.add(self.view)
        self.win.show_all()

        self.ready = threading.Event()
        threading.Thread(target=self._serve, daemon=True).start()

    def _on_load(self, _v, ev):
        name = ev.value_nick
        print(f"LOAD {name}", flush=True)
        if name == "finished":
            self.ready.set()

    # ── the drive socket ────────────────────────────────────────────────────
    def _serve(self):
        if SOCK.exists():
            SOCK.unlink()
        srv = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        srv.bind(str(SOCK))
        srv.listen(8)
        print(f"DRIVE {SOCK}", flush=True)
        while True:
            try:
                conn, _ = srv.accept()
            except OSError:
                return
            threading.Thread(target=self._handle, args=(conn,), daemon=True).start()

    def _handle(self, conn):
        with conn:
            f = conn.makefile("rwb")
            for line in f:
                try:
                    req = json.loads(line.decode() or "{}")
                except Exception:
                    f.write(b'{"ok":false,"error":"BAD_JSON"}\n'); f.flush(); continue
                js = req.get("js")
                if not js:
                    f.write(b'{"ok":false,"error":"NEED_JS"}\n'); f.flush(); continue
                result = {"ok": False, "error": "NO_ANSWER"}
                done = threading.Event()

                def cb(view, res, _r=result, _d=done):
                    try:
                        _r["ok"] = True
                        _r["value"] = view.run_javascript_finish(res).get_js_value().to_json(0)
                    except Exception as exc:
                        _r["ok"] = False
                        _r["error"] = str(exc)[:200]
                    _d.set()

                GLib.idle_add(lambda: (self.view.run_javascript(js, None, cb), False)[1])
                done.wait(20)
                f.write((json.dumps(result) + "\n").encode()); f.flush()


if __name__ == "__main__":
    h = Host()
    print(f"PINEBOX_READY slot=:{SLOT} url={URL}", flush=True)
    Gtk.main()
