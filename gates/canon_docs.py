#!/usr/bin/env python3
"""canon_docs.py — the canon-doc gate (U1..U4).

The canon-doc-update skill ends in a mechanical gate. This is that gate for THIS project,
where the artefact is a .pine (not a dist/index.js), and where the cross-consistency
fingerprint is the V1 SEAL.

    U1  DENSITY      every standard doc >= 200 L; >= 3 file:line refs; evidence docs carry shas
    U2  CONSISTENCY  the 5 read-first docs each carry the SEAL sha, and it equals the disk
    U3  FRESH LOGS   RUNNING_BUILD_LOG + RUNNING_DEBUG_LOG carry timestamped entries
    U4  MANIFEST     every (N lines) claim in CANON_MANIFEST matches the disk

Exit: 0 all gates pass · 1 a gate failed · 2 the gate could not evaluate (fail-closed)
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else ".")
SYNC = "--sync" in sys.argv
CM = ROOT / "context_management"
SEAL_FILE = ROOT / "plutus-vision-v1.pine"

STANDARD = [
    "POST-COMPACTION_PROMPT", "CURRENT_STATE", "NEXT_STEPS", "TASK_QUEUE",
    "BUILD_STATE", "CHANGELOG", "COMPACTION_SURVIVAL", "EVIDENCE_STATE",
    "DECISION_CHAIN",
]
LOGS = ["RUNNING_BUILD_LOG", "RUNNING_DEBUG_LOG"]
READ_FIRST = ["COMPACTION_SURVIVAL", "POST-COMPACTION_PROMPT", "BUILD_STATE",
              "CURRENT_STATE", "EVIDENCE_STATE"]
EVIDENCE_DOCS = {"BUILD_STATE", "EVIDENCE_STATE"}

REF_RE = re.compile(r"\.(md|py|pine|json|sh|yaml):[0-9]")
SHA_RE = re.compile(r"[a-f0-9]{40,64}")


def sync_manifest():
    """Rewrite every "(N lines)" claim in CANON_MANIFEST.md from the disk.

    The manifest is an INDEX — an index maintained by hand drifts on the first edit, and the
    self-count is unfixable by hand (writing the count changes the count). Generated, it cannot.
    Iterated to a fixpoint because the manifest's own length is one of the claims.
    """
    mf = CM / "CANON_MANIFEST.md"
    s = mf.read_text()
    for _ in range(6):
        new = s
        for m in re.finditer(r"^- ([\w_-]+)\.md \((\d+) lines\)", s, re.M):
            name = m.group(1)
            real = nlines(CM / f"{name}.md")
            if real < 0 or real == 0:
                continue
            new = new.replace(f"- {name}.md ({m.group(2)} lines)", f"- {name}.md ({real} lines)", 1)
        if new == s:
            break
        s = new
        mf.write_text(s)
        s = mf.read_text()
    print(f"  manifest synced: {sum(1 for _ in open(mf))} lines")



fails, rows = 0, []


def nlines(p):
    return sum(1 for _ in open(p, errors="ignore")) if p.exists() else 0


if SYNC:
    sync_manifest()

# ── U1 ────────────────────────────────────────────────────────────────────────
for name in STANDARD:
    f = CM / f"{name}.md"
    if not f.exists():
        rows.append(("FAIL", "U1", name, "file absent"))
        fails += 1
        continue
    txt = f.read_text(errors="ignore")
    L, refs, shas = nlines(f), len(REF_RE.findall(txt)), len(SHA_RE.findall(txt))
    if L < 200:
        rows.append(("FAIL", "U1", name, f"{L} L < 200 floor"))
        fails += 1
    elif refs < 3:
        rows.append(("FAIL", "U1", name, f"{L} L but {refs} file:line refs — padding, not density"))
        fails += 1
    elif name in EVIDENCE_DOCS and shas < 1:
        rows.append(("FAIL", "U1", name, f"{L} L but 0 SHA refs — unverifiable evidence doc"))
        fails += 1
    else:
        rows.append(("PASS", "U1", name, f"{L} L · {refs} refs · {shas} sha"))

# ── U2 ────────────────────────────────────────────────────────────────────────
if not SEAL_FILE.exists():
    rows.append(("FAIL", "U2", "the seal", "plutus-vision-v1.pine is ABSENT — cannot fingerprint"))
    fails += 1
else:
    true_sha = hashlib.sha256(SEAL_FILE.read_bytes()).hexdigest()
    for name in READ_FIRST:
        f = CM / f"{name}.md"
        txt = f.read_text(errors="ignore") if f.exists() else ""
        if true_sha not in txt:
            found = SHA_RE.findall(txt)[:1]
            rows.append(("FAIL", "U2", name,
                         f"does not carry the seal {true_sha[:12]}… (carries {found[0][:12] + '…' if found else 'none'})"))
            fails += 1
        else:
            rows.append(("PASS", "U2", name, f"seal {true_sha[:12]}… matches the disk"))

# ── U3 ────────────────────────────────────────────────────────────────────────
for name in LOGS:
    f = CM / f"{name}.md"
    txt = f.read_text(errors="ignore") if f.exists() else ""
    n = len(re.findall(r"^## \[\d{4}-\d{2}-\d{2}T", txt, re.M))
    if n > 0:
        rows.append(("PASS", "U3", name, f"{n} timestamped entries"))
    else:
        rows.append(("FAIL", "U3", name, "0 timestamped entries — the fresh-capture rule was violated"))
        fails += 1

# ── U4 ────────────────────────────────────────────────────────────────────────
mf = CM / "CANON_MANIFEST.md"
if not mf.exists():
    rows.append(("FAIL", "U4", "CANON_MANIFEST", "absent"))
    fails += 1
else:
    txt = mf.read_text(errors="ignore")
    bad, checked = 0, 0
    for m in re.finditer(r"^- ([\w_-]+)\.md \((\d+) lines\)", txt, re.M):
        n, claimed = m.group(1), int(m.group(2))
        f = CM / f"{n}.md"
        real = nlines(f)
        checked += 1
        if real != claimed:
            rows.append(("FAIL", "U4", n, f"manifest says {claimed}, disk has {real}"))
            bad += 1
    if bad == 0 and checked >= 11:
        rows.append(("PASS", "U4", "CANON_MANIFEST", f"{checked} counts match the disk"))
    elif checked < 11:
        rows.append(("FAIL", "U4", "CANON_MANIFEST", f"only {checked} docs indexed (<11)"))
        fails += 1
    else:
        fails += bad

# ── verdict ───────────────────────────────────────────────────────────────────
for st, gate, name, detail in rows:
    print(f"  {st:<4} {gate}  {name:<24} {detail}")

live = sum(1 for r in rows if r[0] in ("PASS", "FAIL"))
if live == 0:
    print("\n  CANON-DOC GATE: INCONCLUSIVE — no doc evaluated")
    sys.exit(2)
if fails:
    print(f"\n  CANON-DOC GATE: FAIL ({fails} finding(s))")
    sys.exit(1)
print(f"\n  CANON-DOC GATE: PASS ({live} checks)")
sys.exit(0)
