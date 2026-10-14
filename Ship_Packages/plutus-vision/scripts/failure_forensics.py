#!/usr/bin/env python3
"""failure_forensics.py — the complete machine-extracted failure record the operator demanded.

Mines the live session transcript and writes vil/FAILURE_FORENSICS.md: every operator message
verbatim, every tool call with its stated intent, every assistant block that claimed completion or
verification, every self-admitted failure, every thinking block where the agent talked itself into
or out of a derailment, and the command-shape census. Nothing summarised, nothing softened.

  python3 scripts/failure_forensics.py [session.jsonl]
"""
import json, pathlib, re, sys, time, collections

W = pathlib.Path(__file__).resolve().parent.parent
DEFAULT = pathlib.Path("/home/leviathan/.omp/agent/sessions/-JARVIS_WORKSPACE-Shared_Workspace/"
                       "2026-09-20T22-17-41-017Z_01a0c0e5-7f99-7213-9be4-dc53093a2538.jsonl")
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
OUT = W / "vil/FAILURE_FORENSICS.md"

CALL, TEXT, THINK, IMAGE = "CALL", "TEXT", "THINK", "IMAGE"
rows = []
for line in SRC.open(errors="replace"):
    line = line.strip()
    if not line or len(line) > 8_000_000:
        continue
    try:
        o = json.loads(line)
    except Exception:
        continue
    msg = o.get("message") or {}
    role = msg.get("role") or o.get("type") or ""
    ts = o.get("timestamp") or o.get("time") or ""
    c = msg.get("content")
    if isinstance(c, str):
        rows.append((ts, role, TEXT, c))
        continue
    for p in (c if isinstance(c, list) else []):
        if not isinstance(p, dict):
            continue
        k = p.get("type")
        if k == "text" and p.get("text"):
            rows.append((ts, role, TEXT, p["text"]))
        elif k == "thinking":
            rows.append((ts, role, THINK, p.get("thinking") or p.get("text") or ""))
        elif k == "image":
            rows.append((ts, role, IMAGE, f"{p.get('mimeType', '')} {len(p.get('data') or '')}b64"))
        elif k == "toolCall":
            a = p.get("arguments") or {}
            keep = {kk: vv for kk, vv in a.items() if kk in ("command", "intent", "i", "file_path", "path", "expr", "expression", "specPath", "skillPath", "task")}
            rows.append((ts, role, CALL, json.dumps({"tool": p.get("name"), "intent": p.get("intent"), **keep})[:900]))

calls = [r for r in rows if r[2] == CALL]
texts = [r for r in rows if r[2] == TEXT]
thinks = [r for r in rows if r[2] == THINK]
imgs = [r for r in rows if r[2] == IMAGE]
users = [r for r in texts if r[1] == "user"]
asst = [r for r in texts if r[1] == "assistant"]

def clip(s, n=300):
    s = re.sub(r"[ \t]+", " ", re.sub(r"\s*\n\s*", " ", s)).strip()
    return s[:n] + ("…" if len(s) > n else "")

cmd_heads = collections.Counter()
tools = collections.Counter()
for r in calls:
    try:
        a = json.loads(r[3]); tools[a.get("tool") or "?"] += 1
        c = (a.get("command") or a.get("path") or a.get("file_path") or a.get("intent") or "").strip().split("\n")[0]
        cmd_heads[c.split()[0] if c else "?"] += 1
    except Exception:
        cmd_heads["(unparsed)"] += 1

CLAIM = re.compile(r"\b(fully working|works now|verified|verification (passed|complete)|PASS\b|gate:\s*pass|confirmed|"
                   r"it'?s working|done\b|complete[ds]?\b|proof|proves|exit=0|self-contained|relocatable)", re.I)
ADMIT = re.compile(r"\b(wrong|wrong thing|error|mistake|broke|broken|failed|failure|regression|reverted|misread|"
                   r"wrongly|mistaken|incorrect|invalid|did not|does not|didn'?t|was wrong|my mistake|self-inflicted|"
                   r"false|lie|lying|theatrical|skipped|missed|assume[ds]?|guess|unverified|not verified)\b", re.I)
DERAIL = re.compile(r"\b(should have|shouldn't|should not|wasted|derail|cost me|instead of|first time|"
                    r"blind|without reading|took the|simpler|stop|done enough)\b", re.I)

claims = [r for r in asst if CLAIM.search(r[3])]
admits = [r for r in asst if ADMIT.search(r[3])]
derails = [r for r in thinks if DERAIL.search(r[3])]

L = []
A = L.append
A("# FAILURE FORENSICS — the complete machine-extracted record")
A("")
A("Extracted from the live session transcript. Raw slices, not summaries. The narrative entries in")
A("FAILURE_LOG.md cite this file; this file is what they cite.")
A("")
A(f"- Source: `{SRC}`")
A(f"- Transcript: {SRC.stat().st_size:,} bytes · extracted {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}")
A(f"- Tool calls: **{len(calls):,}** · assistant text blocks: **{len(asst):,}** · thinking blocks: **{len(thinks):,}** "
  f"({sum(len(r[3]) for r in thinks):,} chars) · image blocks: **{len(imgs):,}** "
  f"({sum(int(r[3].split()[-1][:-3] or 0) for r in imgs):,} base64 chars)")
A(f"- Operator messages: **{len(users):,}** · assistant completion/verification claims: **{len(claims):,}**")
A(f"- Assistant blocks admitting a mistake: **{len(admits):,}** · thinking blocks flagging a derailment: **{len(derails):,}**")
A("")
A("## 0 · THE IMAGE-PROVENANCE FINDING")
A("")
A(f"{len(imgs)} image blocks entered the context, totalling {sum(int(r[3].split()[-1][:-3] or 0) for r in imgs):,} base64")
A("characters. A single 1626×931 PNG is roughly 250,000 base64 characters. The images are stored as")
A("**references, not pixels** — the transcript keeps a stub, not the frame. Two consequences:")
A("")
A("1. The operator cannot audit what the agent saw by reading the transcript.")
A("2. An agent that claims to have inspected an image cannot be checked against the transcript.")
A("")
A("This is why every visual finding in FAILURE_LOG.md cites a sha256 of a PNG on disk, never the")
A("transcript. Where a finding rests on an image, the file is the evidence.")
A("")
A("## 1 · COMMAND SHAPE — what the tool calls were spent on")
A("")
A("| head | calls |")
A("|---|---|")
for c, n in cmd_heads.most_common(45):
    A(f"| `{clip(c, 66)}` | {n} |")
A("")
A("| tool | calls |")
A("|---|---|")
for c, n in tools.most_common(25):
    A(f"| `{c}` | {n} |")
A("")
A(f"**{len(calls):,} tool calls for a task the operator measured at 10–20 minutes.**")
A("")
A("## 2 · OPERATOR MESSAGES — VERBATIM, EVERY ONE, IN ORDER")
A("")
for i, r in enumerate(users, 1):
    b = r[3].strip()
    if len(b) < 2:
        continue
    A(f"### U-{i:03d} · {r[0]}")
    A("")
    A("> " + b.replace("\n", "\n> ")[:3000])
    A("")
A("## 3 · COMPLETION / VERIFICATION CLAIMS — every one, in order")
A("")
A("Every assistant block whose vocabulary asserts that something works, passed, verified, or is done.")
A("Each is a claim the operator or a later measurement had to adjudicate.")
A("")
for i, r in enumerate(claims, 1):
    A(f"**C-{i:03d}** `{r[0]}` — {clip(r[3], 500)}")
    A("")
A("## 4 · SELF-ADMITTED FAILURES — every one, in order")
A("")
A("Assistant blocks that admit something was wrong, broken, guessed, skipped, or false.")
A("")
for i, r in enumerate(admits, 1):
    A(f"**A-{i:03d}** `{r[0]}` — {clip(r[3], 460)}")
    A("")
A("## 5 · DERAILMENT FLAGS IN REASONING — the agent noticing its own waste")
A("")
A("Thinking blocks containing retrospective self-correction. This is the private deliberation the")
A("operator never saw; it is where the cost was actually incurred and recognised too late.")
A("")
for i, r in enumerate(derails, 1):
    A(f"**D-{i:03d}** `{r[0]}` — {clip(r[3], 520)}")
    A("")
A("## 6 · EVERY TOOL CALL WITH ITS STATED INTENT")
A("")
A("| # | tool | intent | command/path |")
A("|---|---|---|---|")
for i, r in enumerate(calls, 1):
    try:
        a = json.loads(r[3])
        A(f"| {i:04} | `{a.get('tool')}` | {clip(a.get('intent') or '', 60)} | `{clip((a.get('command') or a.get('path') or a.get('file_path') or a.get('expr') or a.get('specPath') or ''), 120)}` |")
    except Exception:
        A(f"| {i:04} | ? | ? | (unparsed) |")
A("")
A("## 7 · CUMULATIVE ACCOUNTING")
A("")
A(f"- tool calls: {len(calls):,}")
A(f"- operator messages: {len(users):,}")
A(f"- completion/verification claims: {len(claims):,}")
A(f"- self-admitted failures: {len(admits):,}")
A(f"- reasoning blocks flagging derailment: {len(derails):,}")
A(f"- reasoning chars: {sum(len(r[3]) for r in thinks):,}")
A(f"- claims per operator message: {len(claims) / max(1, len(users)):.2f}")
A(f"- tool calls per operator message: {len(calls) / max(1, len(users)):.1f}")
A("")
A("The ratio is the finding: the agent produced claims at roughly one per operator message while")
A("spending ~14 tool calls per operator message, and the operator's messages were corrections.")
A("That is the signature of an agent verifying its output with mechanisms instead of looking at it.")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(L))
print(f"wrote {OUT} — {len(L)} lines")
print(f"calls={len(calls)} user={len(users)} claims={len(claims)} admits={len(admits)} derails={len(derails)} thinks={len(thinks)}")