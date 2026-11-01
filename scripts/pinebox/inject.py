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

# The two config globals are found by their ASSIGNMENT and then delimited by a brace matcher that
# understands JavaScript strings and comments. The first version matched `\{[^}]*\}`, which stops at
# the FIRST `}`: a nested object or a `}` inside a string truncated the block, the rewrite spliced
# into the middle of it, and no post-condition could notice because it used the same pattern.
ASSIGN_DASH = re.compile(r"window\.dashboardConfig\s*=\s*(?=\{)")
ASSIGN_SHELL = re.compile(r"window\.PlutusPineShellConfig\s*=\s*(?=\{)")

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


class Refused(Exception):
    def __init__(self, token, detail):
        super().__init__(f"{token}: {detail}")
        self.token = token
        self.detail = detail


def _brace_end(text: str, i: int) -> int:
    """Index just past the `}` that closes the `{` at text[i]. Skips '...', "..." and `...` strings
    (with escapes) and // and /* */ comments, so a `}` inside either does not close the block."""
    depth, k, n, quote = 0, i, len(text), None
    while k < n:
        c = text[k]
        if quote:
            if c == "\\":
                k += 2
                continue
            if c == quote:
                quote = None
        elif c in "'\"`":
            quote = c
        elif text.startswith("//", k):
            k = text.find("\n", k)
            if k < 0:
                break
            continue
        elif text.startswith("/*", k):
            e = text.find("*/", k + 2)
            if e < 0:
                break
            k = e + 2
            continue
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return k + 1
        k += 1
    raise Refused("CONFIG_BLOCK_MALFORMED", "a config block opened at offset %d is never closed" % i)


def _blocks(text: str, assign) -> list:
    """[(start, end)] of every `window.X = { ... }` for the given assignment pattern."""
    return [(m.start(), _brace_end(text, m.end())) for m in assign.finditer(text)]


def _strict(body: bytes) -> str:
    try:
        return body.decode("utf-8")
    except UnicodeDecodeError as e:
        raise Refused("PAGE_NOT_UTF8", f"the page is not valid UTF-8 ({e.reason} at byte {e.start}); refusing to serve a lossy re-encoding of it")


def has_block(body: bytes) -> bool:
    return len(_blocks(_strict(body), ASSIGN_DASH)) == 1


def _token(ports: dict) -> str:
    """The per-instance credential. There is NO default: the old fallback served one committed
    token (rw_dev_plutus_backtest) to every instance, so any instance's page could authenticate to
    any other instance's terminal bridge - the exact cross-instance leak this file exists to stop."""
    t = ports.get("authToken")
    if not isinstance(t, str) or len(t) < 16:
        raise Refused("AUTH_TOKEN_UNAVAILABLE",
                      "the port block carries no per-instance authToken of at least 16 characters - generate one per `up` and pass it in PINEBOX_PORTS (never a shared default)")
    return t


def config_for(ports: dict) -> dict:
    missing = [k for k in REQUIRED_PORTS if k not in ports]
    if missing:
        raise Refused("PORTS_INCOMPLETE", "the port block lacks " + ", ".join(missing))
    # a port is an int 1024..65535 - the same rule `room` always had. A str, None or out-of-range value was interpolated
    # into the served URLs and produced a malformed config that still parsed.
    for k in REQUIRED_PORTS:
        v = ports[k]
        if isinstance(v, bool) or not isinstance(v, int) or not (1024 <= v <= 65535):
            raise Refused("BAD_PORTS", "the port block's `%s` is not an integer in 1024..65535: %r" % (k, v))
    host = "127.0.0.1"
    return {
        "apiBase": f"http://{host}:{ports['server']}",
        "wsUrl": f"ws://{host}:{ports['ws']}",
        "authToken": _token(ports),
        "pineStation": f"http://{host}:{ports['station']}",
    }


def shell_config_for(ports: dict) -> dict:
    return {"railBases": [f"http://127.0.0.1:{ports['rail']}"]}


def inject_dashboard_config(body: bytes, ports: dict) -> bytes:
    """Rewrite ONLY the dashboardConfig block. Exactly one substitution, and the result
    must re-parse: the substituted block is checked before it is returned."""
    text = _strict(body)
    found = _blocks(text, ASSIGN_DASH)
    if not found:
        raise Refused("CONFIG_BLOCK_ABSENT",
                      "the page has no window.dashboardConfig block - the instance cannot reach its own ports")
    if len(found) > 1:
        raise Refused("CONFIG_BLOCK_AMBIGUOUS", "the page defines window.dashboardConfig %d times; refusing to guess which one the app reads" % len(found))
    if _blocks(text, ASSIGN_SHELL):
        # a page that DEFINES the second global is a different page: rewriting only one of
        # the two would leave the other pointing at someone else's rail
        raise Refused("SHELL_CONFIG_PRESENT", "the page already defines window.PlutusPineShellConfig; inject.py must be taught to rewrite it")
    cfg, shell = config_for(ports), shell_config_for(ports)
    block = ("window.dashboardConfig = " + json.dumps(cfg) + ";\n    window.PlutusPineShellConfig = " + json.dumps(shell))
    start, end = found[0]
    out = text[:start] + block + text[end:]
    # the rewrite is a PREDICATE, not a hope: each global exactly once, and each must name
    # THIS instance's own port. Measured with the SAME brace matcher, over the OUTPUT.
    d, sh = _blocks(out, ASSIGN_DASH), _blocks(out, ASSIGN_SHELL)
    if len(d) != 1 or json.dumps(cfg["apiBase"]) not in out[d[0][0]:d[0][1]]:
        raise Refused("INJECT_FAILED", "the rewritten page does not carry exactly one dashboardConfig naming the instance's server")
    if len(sh) != 1 or json.dumps(shell["railBases"][0]) not in out[sh[0][0]:sh[0][1]]:
        raise Refused("INJECT_FAILED", "the rewritten page does not carry exactly one PlutusPineShellConfig naming the instance's rail")
    return out.encode("utf-8")
# The Backtest tab finds its room by probing a hardcoded port list. Left alone, EVERY instance's tab
# would find instance 0's room (or whichever answers first) - the same cross-instance leak the
# workbench constant had. Rewritten in served bytes only; absence is loud.
BACKTEST_PORTS = re.compile(rb"var PORTS = \[9443, 9446, 9447\];")


def inject_backtest_ports(body: bytes, ports: dict) -> bytes:
    room = ports.get("room")
    if not isinstance(room, int) or not (1024 <= room <= 65535):
        raise Refused("BAD_PORTS", "the instance port block has no valid `room` port: %r" % (room,))
    out, n = BACKTEST_PORTS.subn(b"var PORTS = [%d];" % room, body)
    if n != 1:
        raise Refused("BACKTEST_PORTS_ABSENT", "backtest.js has no canonical `var PORTS = [9443, 9446, 9447];` to rewrite (found %d)" % n)
    return out


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
    try:
        if len(argv) >= 2 and argv[0] == "--check":
            if has_block(open(argv[1], "rb").read()):
                print(json.dumps({"ok": True, "file": argv[1]}))
                return 0
            print("REFUSED  CONFIG_BLOCK_ABSENT  \u2014  %s has no single window.dashboardConfig block" % argv[1], file=sys.stderr)
            return 1
        if len(argv) >= 3 and argv[0] == "--render":
            sys.stdout.buffer.write(inject_dashboard_config(open(argv[1], "rb").read(), json.loads(argv[2])))
            return 0
    except Refused as e:
        print("REFUSED  %s  \u2014  %s" % (e.token, e.detail), file=sys.stderr)
        return 1
    except (OSError, ValueError) as e:      # unreadable file, bad PORTS_JSON, closed stdout: named, never a traceback
        print("REFUSED  CLI_INPUT_UNREADABLE  \u2014  %s: %s" % (type(e).__name__, e), file=sys.stderr)
        return 1
    print("usage: inject.py --check FILE | --render FILE PORTS_JSON", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
