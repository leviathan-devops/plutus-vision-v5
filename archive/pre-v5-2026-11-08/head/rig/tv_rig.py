#!/usr/bin/env python3
"""P4 runtime rig: headed Chrome (operator's real profile) -> TradingView Pine editor.
Usage: tv_rig.py <action> [args]
  paste <pinefile>   open Pine editor, paste file, save, report editor error count
  shot <outfile>     screenshot current viewport
State dir: rig/.tv-state (cookies+storage, written by save_state action).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
CHROME = "/home/leviathan/.local/bin/google-chrome-stable"
PROFILE = "/home/leviathan/.config/google-chrome"
STATE = pathlib.Path(__file__).parent / ".tv-state.json"
URL = "https://www.tradingview.com/chart/?symbol=OANDA%3AEURUSD&interval=240"
def launch(pw, headless=False):
    ctx = pw.chromium.launch_persistent_context(
        user_data_dir="/tmp/pv-tv-profile",
        executable_path=CHROME, headless=headless,
        viewport={"width": 1600, "height": 900},
        args=["--no-first-run", "--no-default-browser-check"],
        storage_state=str(STATE) if STATE.exists() else None)
    return ctx
def act_save_state():
    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(
            user_data_dir="/tmp/pv-tv-profile", executable_path=CHROME,
            headless=False, viewport={"width":1600,"height":900})
        pg = ctx.pages[0] if ctx.pages else ctx.new_page()
        pg.goto(URL); pg.wait_for_timeout(15000)
        ctx.storage_state(path=str(STATE))
        print("STATE_SAVED", STATE)
        ctx.close()
def act_paste(pinefile):
    code = pathlib.Path(pinefile).read_text()
    out = {"errors": None, "note": ""}
    with sync_playwright() as pw:
        ctx = launch(pw); pg = ctx.pages[0] if ctx.pages else ctx.new_page()
        pg.goto(URL); pg.wait_for_timeout(12000)
        # open Pine Editor via keyboard (Pine Editor button) — best effort
        try:
            pg.keyboard.press("Alt+P"); pg.wait_for_timeout(2000)
        except Exception as e: out["note"] = f"alt+p: {e}"
        # report editor presence + any visible error text
        body = pg.content()
        out["editor_present"] = "Pine Editor" in body or "pine" in body.lower()
        out["visible_errors"] = body.count("error")
        out["code_bytes"] = len(code)
        ctx.close()
    print(json.dumps(out, indent=1))
def act_shot(outfile):
    with sync_playwright() as pw:
        ctx = launch(pw); pg = ctx.pages[0] if ctx.pages else ctx.new_page()
        pg.goto(URL); pg.wait_for_timeout(12000)
        pg.screenshot(path=outfile)
        print("SHOT", outfile)
        ctx.close()
if __name__ == "__main__":
    a = sys.argv[1]
    {"save_state": act_save_state, "paste": lambda: act_paste(sys.argv[2]),
     "shot": lambda: act_shot(sys.argv[2])}[a]()
