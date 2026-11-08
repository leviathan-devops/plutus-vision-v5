#!/usr/bin/env bash
# subshell-exit.sh - a `refuse` inside $(...) exits only the subshell, so the caller carries on
# with an empty value and prints MORE refusals (measured: `click --id 9` printed three), or
# worse, prints an "ok" result built from an empty string.
#
# THE SET OF REFUSING FUNCTIONS IS COMPUTED, not listed: a function is "refusing" if its
# body calls `refuse` or `exit 1`, or calls a refusing function (to a fixpoint). Any
# `$(refusing_fn ...)` must then be followed by `|| exit` / `|| return` / `|| refuse`.
#
# Exit: 0 clean, 1 SUBSHELL_EXIT_LEAK with every offending line.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 - "$HERE" <<'PY'
import re, sys, glob, os
root = sys.argv[1]
files = sorted(glob.glob(root + "/core/*.sh") + glob.glob(root + "/core/adapters/*.sh"))
body = {}                      # function name -> its text
for f in files:
    src = open(f).read().split("\n")
    i = 0
    while i < len(src):
        m = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\(\)\s*\{", src[i])
        if m:
            name, depth, buf = m.group(1), 0, []
            while i < len(src):
                buf.append(src[i])
                depth += src[i].count("{") - src[i].count("}")
                if depth <= 0 and (len(buf) > 1 or src[i].rstrip().endswith("}")):
                    break
                i += 1
            body[name] = "\n".join(buf)
        i += 1
# the primitives that END the current process
base = re.compile(r"(?<![\w-])(refuse|exit 1)(?![\w-])")
refusing = {n for n, b in body.items() if base.search(re.sub(r"#.*", "", b))}
# `refuse` itself, `need`, `require_*` are defined in lib.sh and are refusing by that rule
# A word is a CALL only in command position (line start, after ; | & ( { $( ! then do else).
# `rec_get "$id" cdp` names a flag, not the function cdp().
def call_re(name):
    return re.compile(r"(?:^|[;|&({]\s*|\$\(\s*|\bthen\s+|\bdo\s+|\belse\s+)(?:!\s*)?%s(?=[\s;|&)\"']|$)" % re.escape(name), re.M)
changed = True
while changed:
    changed = False
    for n, b in body.items():
        if n in refusing:
            continue
        text = re.sub(r"#.*", "", b)
        if any(call_re(r).search(text) for r in refusing):
            refusing.add(n); changed = True
# a refusing function whose every call site is a statement (not substituted) is fine; only
# command substitution is the leak
sub = re.compile(r"\$\(\s*(%s)\b" % "|".join(sorted(map(re.escape, refusing)))) if refusing else None
bad = []
for f in files:
    for no, line in enumerate(open(f).read().split("\n"), 1):
        code = re.sub(r"(^|\s)#.*", "", line)
        if not sub or not sub.search(code):
            continue
        # the substitution's own line must propagate the failure
        if re.search(r"\|\|\s*(exit|return|refuse|\{|true\b)", code) or re.search(r"\)\"\s*\|\|", code):
            continue
        # `local x="$(fn)"` and `[ -n "$(fn)" ]` swallow the status: both are leaks too
        bad.append("%s:%d: %s" % (os.path.relpath(f, root), no, line.strip()))
if bad:
    print("SUBSHELL_EXIT_LEAK: a refusing function is substituted without '|| exit $?':")
    print("\n".join(bad))
    sys.exit(1)
print("ok: %d refusing functions computed, no unguarded substitution" % len(refusing))
PY
