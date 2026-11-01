#!/usr/bin/env python3
"""inject.py - the serve-time config rewrite (PINEBOX blueprint sections 5 and 7D).

THE SEAM. The Pine IDE page is frozen: not one byte under pine-ide/ may change. But the
page already reads its ports from ONE block, `window.dashboardConfig = { ... }`
(pine-ide/ide/renderer/pine.html:11-16), and 13 read-sites across 4 files consume it.
So per-instance isolation reaches the page by rewriting THAT BLOCK in the bytes the
server RESPONDS with. The file on disk is never written.

    on disk, forever :  window.dashboardConfig = { apiBase: '<the canonical server>', ... };
    served, instance 3: window.dashboardConfig = { "apiBase": "http://127.0.0.1:<instance 3's server>", ... };

THE FAILURE MODE IS LOUD. If the block is absent the page would talk to the DEFAULT ports
and silently contaminate another instance, so the absence is a refusal - never a
fall-through to the unrewritten page.

Library:  inject_dashboard_config(body: bytes, ports: dict) -> bytes   (raises Refused)
CLI:      inject.py --check FILE            exit 0 if FILE has the block, 1 CONFIG_BLOCK_ABSENT
          inject.py --render FILE PORTS_JSON   print the rewritten page
"""
import json
import re
import sys

BLOCK = re.compile(r"window\.dashboardConfig\s*=\s*\{[^}]*\}")

# THE PAGE HAS TWO CONFIG GLOBALS, and the blueprint's "one seam" holds for only one:
#   window.dashboardConfig        { apiBase, wsUrl, authToken, pineStation }  - defined in pine.html
#   window.PlutusPineShellConfig  { railBases, readerUrl, config }            - READ at
#       pine-ide/ide/renderer/tabs/pineshell.js:103,147 and NEVER DEFINED anywhere in the renderer.
# With it undefined, `cfg.railBases` is undefined, the engine falls to gate.mjs:21
# DEFAULT_RAIL_BASES (the canonical rail), and EVERY instance would use instance 0's rail
WORKBENCH_MAIN_API = re.compile(rb'var MAIN_API = "http://127\.0\.0\.1:9851";')
# (measured: RUN_FAILED VIL_RAIL_DOWN "no VIL rail answered on <the canonical rail>").
# So the rewrite DEFINES the second global too, in the served bytes only. readerUrl is left
# unset on purpose: pineshell.js:106 derives it from railBases[0] + '/vil/look'.
REQUIRED_PORTS = ("station", "rail", "server", "ws")
SHELL_BLOCK = re.compile(r"window\.PlutusPineShellConfig\s*=\s*\{[^}]*\}")


class Refused(Exception):
    def __init__(self, token, detail):
        super().__init__(f"{token}: {detail}")
        self.token = token
        self.detail = detail


def has_block(body: bytes) -> bool:
    return BLOCK.search(body.decode("utf-8", "replace")) is not None


def config_for(ports: dict) -> dict:
    missing = [k for k in REQUIRED_PORTS if k not in ports]
    if missing:
        raise Refused("PORTS_INCOMPLETE", "the port block lacks " + ", ".join(missing))
    host = "127.0.0.1"
    return {
        "apiBase": f"http://{host}:{ports['server']}",
        "wsUrl": f"ws://{host}:{ports['ws']}",
        "authToken": ports.get("authToken", "rw_dev_plutus_backtest"),
        "pineStation": f"http://{host}:{ports['station']}",
    }


def shell_config_for(ports: dict) -> dict:
    return {"railBases": [f"http://127.0.0.1:{ports['rail']}"]}


def inject_dashboard_config(body: bytes, ports: dict) -> bytes:
    """Rewrite ONLY the dashboardConfig block. Exactly one substitution, and the result
    must re-parse: the substituted block is checked before it is returned."""
    # STRICT decode. errors="replace" turned any invalid byte into U+FFFD and then served the
    # MUTATED page as if it were the original - exactly the silent corruption this file's
    # fail-loud contract forbids. A page that is not valid UTF-8 is refused by name.
    try:
        text = body.decode("utf-8")
    except UnicodeDecodeError as e:
        raise Refused("PAGE_NOT_UTF8", f"the page is not valid UTF-8 ({e.reason} at byte {e.start}); refusing to serve a lossy re-encoding of it")
    m = BLOCK.search(text)
    if not m:
        raise Refused("CONFIG_BLOCK_ABSENT",
                      "the page has no window.dashboardConfig block - the instance cannot reach its own ports")
    if SHELL_BLOCK.search(text):
        # a page that DEFINES the second global is a different page: rewriting only one of
        # the two would leave the other pointing at someone else's rail
        raise Refused("SHELL_CONFIG_PRESENT", "the page already defines window.PlutusPineShellConfig; inject.py must be taught to rewrite it")
    cfg, shell = config_for(ports), shell_config_for(ports)
    block = ("window.dashboardConfig = " + json.dumps(cfg) + ";\n    window.PlutusPineShellConfig = " + json.dumps(shell))
    out = text[:m.start()] + block + text[m.end():]
    # the rewrite is a PREDICATE, not a hope: each global exactly once, and each must name
    # THIS instance's own port
    d, s = BLOCK.findall(out), SHELL_BLOCK.findall(out)
    if len(d) != 1 or json.dumps(cfg["apiBase"]) not in d[0]:
        raise Refused("INJECT_FAILED", "the rewritten page does not carry exactly one dashboardConfig naming the instance's server")
    if len(s) != 1 or json.dumps(shell["railBases"][0]) not in s[0]:
        raise Refused("INJECT_FAILED", "the rewritten page does not carry exactly one PlutusPineShellConfig naming the instance's rail")
    return out.encode("utf-8")
def inject_workbench_base(body: bytes, ports: dict) -> bytes:
    """Rewrite the frozen workbench's MAIN_API in served bytes only.
    Absence is loud: the canonical server would cross-contaminate instances.
    """
    server = config_for(ports)["apiBase"].encode()
    out, n = WORKBENCH_MAIN_API.subn(b'var MAIN_API = "' + server + b'";', body)
    if n != 1:
        raise Refused("WORKBENCH_CONFIG_ABSENT", "workbench.bundle.js has no canonical MAIN_API assignment to rewrite")
    return out




def _main(argv):
    if len(argv) >= 2 and argv[0] == "--check":
        body = open(argv[1], "rb").read()
        if has_block(body):
            print(json.dumps({"ok": True, "file": argv[1]}))
            return 0
        print("REFUSED  CONFIG_BLOCK_ABSENT  —  %s has no window.dashboardConfig block" % argv[1], file=sys.stderr)
        return 1
    if len(argv) >= 3 and argv[0] == "--render":
        try:
            sys.stdout.buffer.write(inject_dashboard_config(open(argv[1], "rb").read(), json.loads(argv[2])))
            return 0
        except Refused as e:
            print("REFUSED  %s  —  %s" % (e.token, e.detail), file=sys.stderr)
            return 1
    print("usage: inject.py --check FILE | --render FILE PORTS_JSON", file=sys.stderr)
    return 2

if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
