#!/usr/bin/env python3
"""Plutus Vision — native desktop shell (lightweight fallback).

A GTK3 + WebKit2 (libwebkit2gtk-4.1) window hosting the pine-ide renderer.
This is the SAME web engine the Tauri shell compiles onto on Linux; it is kept
as the zero-build fallback for hosts where the Tauri binary is absent. One
native process + webkit's web/network helpers — no bundled browser, no
multi-process Chromium.

  PV_URL    renderer URL   (default http://127.0.0.1:9851/pine.html)
  PV_TITLE  window title   (default "Plutus Vision")
  PV_SOFT=1 force software rendering (never GPU)
"""
import os
import sys

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import Gtk, WebKit2  # noqa: E402


def main() -> int:
    url = os.environ.get("PV_URL", "http://127.0.0.1:9851/pine.html")
    title = os.environ.get("PV_TITLE", "Plutus Vision")

    win = Gtk.Window(title=title)
    win.set_default_size(1626, 931)
    win.set_icon_name("plutus-vision")
    win.connect("destroy", Gtk.main_quit)

    view = WebKit2.WebView()
    settings = view.get_settings()
    settings.set_enable_developer_extras(bool(os.environ.get("PV_DEVTOOLS")))
    if os.environ.get("PV_SOFT") == "1":
        settings.set_hardware_acceleration_policy(
            WebKit2.HardwareAccelerationPolicy.NEVER
        )
    view.load_uri(url)

    win.add(view)
    win.show_all()
    win.maximize()
    Gtk.main()
    return 0


if __name__ == "__main__":
    sys.exit(main())
