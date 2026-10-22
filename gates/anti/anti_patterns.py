#!/usr/bin/env python3
"""anti_patterns.py — the 13 anti-pattern checks (blueprint §11).

Each check is a function returning (PASS|FAIL|SKIP, detail). A FAIL means the build
exhibits the class. The runner exits nonzero if any check FAILs.

Every check is aimed at a SUBJECT (a file, a card, a tree). A check that cannot find
its subject returns SKIP, never PASS — absence of evidence is not evidence.
"""
import json, re, sys, pathlib, collections

# ── the canon vocabulary, computed from the operator's trading sources ────────
CANON_SRC = [
 "Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md",
 "Original_Canon_Data/Toolset/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md",
 "Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md",
 "MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/TTE_SHAPE_ZONE_MECHANICS_MILITARY_GRADE.md",
 "MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/TTE_MACRO_SHAPES_COMPLETE_REFERENCE.md",
 "MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md",
 "MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_ARCHITECTURE_BIBLE_v2.1.md",
]
NONCANON_TERMS = ["choch","change of character","fvg","fair value gap","premium",
                  "discount","inducement","breaker block","liquidity void"]


# ── THE BUILD SCOPE ────────────────────────────────────────────────────────────
# A tree check that walks sibling agent trees, checkpoints and ship packages measures
# THOSE, not this build. Measuring now: DEEPSEEK_AGENT 305 + MIMO_AGENT 303 +
# Ship_Packages 256 + Checkpoints 214 files carried the term — 428 "hits" of which the
# build tree contributed a handful. The number was true and useless.
EXCLUDE_DIRS = {
    ".git", "node_modules", "Checkpoints", "Ship_Packages", "DEEPSEEK_AGENT",
    "MIMO_AGENT", "STEP_AGENT", "Original_Canon_Data", "pine-ide", "pine-ide-fork",
    "wt", ".trident", "vi", "vil", "forensic", "__pycache__",
}

def iter_tree(tree):
    """Yield every file in the BUILD tree, never a sibling tree or an archive."""
    root = pathlib.Path(tree)
    for f in root.rglob("*"):
        if not f.is_file():
            continue
        if any(part in EXCLUDE_DIRS for part in f.parts):
            continue
        yield f

def A1_baked_levels(root, pine):
    """A1 · BAKED LEVELS — a numeric literal inside a draw call."""
    if not pine: return "SKIP", "no .pine supplied"
    t = pathlib.Path(pine).read_text(errors="replace")
    # a draw call containing a decimal literal that is not 0/1/-1/100
    hits = []
    for m in re.finditer(r'\b(box\.new|line\.new|label\.new)\s*\(([^)]{0,400})\)', t, re.S):
        args = m.group(2)
        for lit in re.findall(r'\b(\d+\.\d{2,})\b', args):
            if lit not in ("0.0","1.0","100.0"): hits.append((m.group(1), lit))
    if not hits: return "PASS", "no decimal literals in draw calls"
    return "FAIL", f"{len(hits)} literal(s) in draw calls, e.g. {hits[:3]}"

def A2_card_is_not_config(root, card):
    """A2 · CONFIG DISGUISED AS A CARD — every node must be castable (has kind+spec)."""
    if not card: return "SKIP", "no card supplied"
    try: d = json.loads(pathlib.Path(card).read_text())
    except Exception as e: return "FAIL", f"card unparseable: {e}"
    nodes = d.get("nodes") or []
    if not nodes: return "FAIL", "card has no nodes — it is a config blob"
    bad = [n.get("id","?") for n in nodes if not n.get("kind") or "spec" not in n]
    if bad: return "FAIL", f"{len(bad)} node(s) without kind+spec: {bad[:3]}"
    return "PASS", f"{len(nodes)} castable nodes"

def A3_silent_fallback(root, pine):
    """A3 · SILENT FALLBACK — the kernel must PRINT a token when the card is absent."""
    if not pine: return "SKIP", "no .pine supplied"
    t = pathlib.Path(pine).read_text(errors="replace")
    has_token = bool(re.search(r'CARD:\s*ABSENT|CARD_ABSENT|\[JESL', t))
    if has_token: return "PASS", "a named absence token exists"
    return "FAIL", "no CARD:ABSENT / [JESL …] token — an absent card renders silently"

def A4_receipt_required(root, card):
    """A4 · INVENTED IP ZONES — an ip zone without a receipt."""
    if not card: return "SKIP", "no card supplied"
    d = json.loads(pathlib.Path(card).read_text())
    bad = [n.get("id") for n in d.get("nodes",[])
           if n.get("kind","").startswith("zone.ip")
           and not (n.get("spec") or {}).get("receipt")]
    if bad: return "FAIL", f"{len(bad)} IP zone(s) with no receipt: {bad[:3]}"
    return "PASS", "every IP zone carries a receipt"

def A5_setup_ancestry(root, card):
    """A5 · UNTRACEABLE SETUPS — entry_zone / shape_from must resolve in the card."""
    if not card: return "SKIP", "no card supplied"
    d = json.loads(pathlib.Path(card).read_text())
    ids = {n.get("id") for n in d.get("nodes",[])}
    bad = []
    for n in d.get("nodes",[]):
        if not n.get("kind","").startswith("setup"): continue
        s = n.get("spec") or {}
        for ref in ("entry_zone","shape_from"):
            if s.get(ref) and s[ref] not in ids: bad.append((n.get("id"), ref, s[ref]))
    if bad: return "FAIL", f"{len(bad)} unresolved reference(s): {bad[:3]}"
    return "PASS", "every setup resolves to a zone and a shape"

def A6_rockets_not_trades(root, card):
    """A6 · ROCKETS AS TRADES — a setup whose entry_zone is not an evidence node."""
    if not card: return "SKIP", "no card supplied"
    d = json.loads(pathlib.Path(card).read_text())
    fam = {n.get("id"): n.get("family") for n in d.get("nodes",[])}
    bad = [n.get("id") for n in d.get("nodes",[])
           if n.get("kind","").startswith("setup")
           and fam.get((n.get("spec") or {}).get("entry_zone")) not in ("evidence", None)]
    if bad: return "FAIL", f"{len(bad)} setup(s) enter at a non-evidence node: {bad[:3]}"
    return "PASS", "every setup enters at an evidence node (no rockets counted)"

def A7_theatrical_count(root, card):
    """A7 · THEATRICAL COUNT — emitted vs the ceiling; 27 in a week is fabrication."""
    if not card: return "SKIP", "no card supplied"
    d = json.loads(pathlib.Path(card).read_text())
    em = len([n for n in d.get("nodes",[]) if n.get("kind","").startswith("setup")])
    ceil = (d.get("meta") or {}).get("weekly_ceiling", 12)
    if em > ceil * 2: return "FAIL", f"{em} setups vs ceiling {ceil} — the engine is fabricating"
    if em > ceil: return "FAIL", f"{em} setups exceed the ceiling {ceil} — eviction must apply"
    return "PASS", f"{em} setups, ceiling {ceil}"

def A8_golden_week_fitting(root, proofs):
    """A8 · GOLDEN-WEEK FITTING — held-out weeks must exist and pass."""
    if not proofs: return "SKIP", "no proofs dir supplied"
    p = pathlib.Path(proofs)
    held = list(p.glob("P6/**/*.json")) + list(p.glob("**/heldout*"))
    if not held: return "FAIL", "no held-out-week proof — the build only works on the golden week"
    return "PASS", f"{len(held)} held-out proof(s)"

def A9_no_15m(root, tree):
    """A9 · THE 15m CREEP — the ruling is 4H/1H/30m."""
    if not tree: return "SKIP", "no tree supplied"
    hits = []
    for f in iter_tree(tree):
        if f.is_file() and f.suffix in (".py",".pine",".ts",".mjs") and "node_modules" not in str(f):
            t = f.read_text(errors="replace")
            if re.search(r'15\s*m\b|15m|"15"', t, re.I): hits.append(f.name)
    if hits: return "FAIL", f"15m referenced in {len(hits)} file(s): {hits[:4]}"
    return "PASS", "no 15m anywhere"

def A10_canon_vocabulary(root, tree):
    """A10 · MARKET-STANDARD VOCABULARY — a term the canon never uses."""
    if not tree: return "SKIP", "no tree supplied"
    corpus = ""
    for rel in CANON_SRC:
        p = pathlib.Path(root)/rel
        if p.exists(): corpus += p.read_text(errors="replace").lower()
    if not corpus: return "SKIP", "canon sources absent"
    found = collections.Counter()
    for f in iter_tree(tree):
        if f.is_file() and f.suffix in (".py",".pine",".ts",".mjs") and "node_modules" not in str(f):
            t = f.read_text(errors="replace").lower()
            for term in NONCANON_TERMS:
                if corpus.count(term) == 0 and t.count(term) > 0:
                    found[term] += t.count(term)
    if found: return "FAIL", f"non-canon terms in code: {dict(found)}"
    return "PASS", "no non-canon vocabulary in the tree"

def A11_no_stubs(root, tree):
    """A11 · THE STUB WEARING DONE — a constant/empty return where a computation belongs."""
    if not tree: return "SKIP", "no tree supplied"
    hits = []
    for f in iter_tree(tree):
        if f.is_file() and f.suffix in (".py",".ts",".mjs") and "node_modules" not in str(f):
            t = f.read_text(errors="replace")
            if re.search(r'\{?\s*["\']?stubbed["\']?\s*:\s*[Tt]rue', t) or \
               re.search(r'return\s+\[\]\s*#\s*(TODO|stub|placeholder)', t, re.I):
                hits.append(f.name)
    if hits: return "FAIL", f"{len(hits)} stub(s): {hits[:4]}"
    return "PASS", "no stubs detected"

# A12 counts PROGRESS PROSE, never the knowledge substrate. The 163-card graph is a
# deliberate artefact the operator ordered (full context in under a minute); counting it
# as "documentation outrunning code" measured the thing we were told to build as though
# it were the thing we were told to avoid. The distinction is DEFINITIONAL — the
# threshold stays at 2.0. A gate weakened to pass would be a defect of exactly the
# class these 13 checks exist to catch.
GRAPH_SUBSTRATE = {"cards", "sources", "type"}
def A12_docs_not_progress(root, tree):
    """A12 · DOCUMENTATION AS PROGRESS — progress prose vs code bytes."""
    if not tree: return "SKIP", "no tree supplied"
    doc = code = graph = 0
    for f in iter_tree(tree):
        if not f.is_file() or "node_modules" in str(f): continue
        try: n = f.stat().st_size
        except OSError: continue
        in_graph = any(part in GRAPH_SUBSTRATE for part in f.parts)
        if f.suffix == ".md":
            if in_graph: graph += n
            else:        doc += n
        elif f.suffix in (".py",".pine",".ts",".mjs"): code += n
    if code == 0: return "SKIP", "no code to compare"
    r = doc/code
    note = f" (graph {graph//1024} KB excluded as substrate)" if graph else ""
    if r > 2.0: return "FAIL", f"progress-prose/code ratio {r:.1f} — documentation is outrunning code{note}"
    return "PASS", f"progress-prose/code ratio {r:.2f}{note}"

def A13_claims_carry_artifacts(root, report):
    """A13 · SELF-GRADED SUCCESS — a PASS claim with no artifact beside it."""
    if not report: return "SKIP", "no report supplied"
    t = pathlib.Path(report).read_text(errors="replace")
    claims = len(re.findall(r'\bPASS\b', t))
    evid = len(re.findall(r'sha256|artifact://|results\.json|evidence', t))
    if claims and evid == 0: return "FAIL", f"{claims} PASS claims, zero evidence markers"
    return "PASS", f"{claims} claims / {evid} evidence markers"

CHECKS = [
 ("A1",  "baked levels",              A1_baked_levels),
 ("A2",  "config disguised as a card", A2_card_is_not_config),
 ("A3",  "silent fallback",           A3_silent_fallback),
 ("A4",  "invented IP zones",         A4_receipt_required),
 ("A5",  "untraceable setups",        A5_setup_ancestry),
 ("A6",  "rockets as trades",         A6_rockets_not_trades),
 ("A7",  "theatrical count",          A7_theatrical_count),
 ("A8",  "golden-week fitting",       A8_golden_week_fitting),
 ("A9",  "15m creep",                 A9_no_15m),
 ("A10", "market-standard vocab",     A10_canon_vocabulary),
 ("A11", "stub wearing done",         A11_no_stubs),
 ("A12", "docs as progress",          A12_docs_not_progress),
 ("A13", "self-graded success",       A13_claims_carry_artifacts),
]

def main(argv):
    root = argv[1] if len(argv)>1 else "."
    args = dict(a.split("=",1) for a in argv[2:] if "=" in a)
    R = pathlib.Path(root)
    def res(v):
        if not v: return None
        p = pathlib.Path(v)
        return str(p if p.is_absolute() else R / v)
    pine, card = res(args.get("pine")), res(args.get("card"))
    tree, proofs, report = res(args.get("tree")), res(args.get("proofs")), res(args.get("report"))
    fails = 0; rows = []
    for cid, name, fn in CHECKS:
        try:
            if   cid in ("A1","A3"): st, d = fn(root, pine)
            elif cid in ("A2","A4","A5","A6","A7"): st, d = fn(root, card)
            elif cid == "A8":  st, d = fn(root, proofs)
            elif cid in ("A9","A10","A11","A12"): st, d = fn(root, tree)
            else:              st, d = fn(root, report)
        except Exception as e:
            st, d = "FAIL", f"check crashed: {e}"
        rows.append((cid, name, st, d))
        if st == "FAIL": fails += 1
    for cid, name, st, d in rows:
        print(f"  {st:<4} {cid:<4} {name:<26} {d}")
    # ── FAIL-CLOSED ────────────────────────────────────────────────────────────
    # SKIP means the gate could not look. Thirteen SKIPs is not a clean bill of
    # health — it is thirteen checks that never ran. Measured: invoking with no
    # subjects printed "PASS" and exited 0, which is the false-green class the
    # operator's law bans outright.
    live = sum(1 for (_cid, _n, st, _d) in rows if st in ("PASS", "FAIL"))
    if live == 0:
        print(f"\n  ANTI-PATTERN GATE: INCONCLUSIVE — 0 of {len(rows)} checks had a subject")
        return 2
    if fails:
        print(f"\n  ANTI-PATTERN GATE: FAIL ({fails} class(es), {live}/{len(rows)} evaluated)")
        return 1
    print(f"\n  ANTI-PATTERN GATE: PASS ({live}/{len(rows)} evaluated)")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv))
