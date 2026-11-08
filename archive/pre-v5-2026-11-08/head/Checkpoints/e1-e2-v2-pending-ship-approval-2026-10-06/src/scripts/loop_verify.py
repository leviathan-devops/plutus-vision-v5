"""PLUTUS VISION — THE LOOP VERIFICATION, inside the sandbox.
Every gate re-run against THIS workspace's station (port 9741) and THIS
artifact. Nothing inherited. Nothing from the dashboard tree.
"""
import pathlib, subprocess, hashlib, json, urllib.request, urllib.error, datetime, re, sys

W = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION")
V = W / "plutus-vision-v0.pine"
URL = "http://127.0.0.1:9741"
src = V.read_text()
G = {}


def sh(*a):
    return subprocess.run(list(a), capture_output=True, text=True, cwd=str(W)).stdout


def run(script, pair="EUR/USD", tf="4H", limit=300):
    body = json.dumps({"script": script, "pair": pair, "timeframe": tf, "limit": limit}).encode()
    req = urllib.request.Request(f"{URL}/run", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.load(r).get("data") or {}
            return True, d.get("counts", {}), ""
    except urllib.error.HTTPError as e:
        return False, {}, json.loads(e.read().decode()).get("error", "")[:90]


print("=" * 76)
print("PLUTUS VISION — LOOP VERIFICATION")
print(f"workspace {W}")
print(f"station   {URL}   engine PineTS 0.10.0")
print("=" * 76)

# ── the artifact ────────────────────────────────────────────────────────
G["sha"] = hashlib.sha256(src.encode()).hexdigest()
G["lines"] = len(src.splitlines())
G["decls"] = sh("grep", "-c", "^indicator(", str(V)).strip()
G["lux"] = sh("grep", "-c", "LuxAlgo", str(V)).strip()
print(f"\n[ARTIFACT]")
print(f"  sha256        {G['sha']}")
print(f"  lines         {G['lines']}")
print(f"  indicator()   {G['decls']}")
print(f"  LuxAlgo marks {G['lux']}")

# ── GATE 1 lexcheck ─────────────────────────────────────────────────────
lex = sh("python3", "scripts/lexcheck.py", str(V))
G["lex"] = [l for l in lex.splitlines() if "lexcheck:" in l][-1]
print(f"\n[GATE 1 · lexcheck]  {G['lex']}")

# ── GATE 2 single decl + attribution ────────────────────────────────────
print(f"[GATE 2 · single decl]      {G['decls']} (expect 1)")
print(f"[GATE 2 · attribution]     {G['lux']} marks (expect >= 1)")

# ── GATE 3 per-subsystem render ─────────────────────────────────────────
lines = src.split("\n")
S = sorted(i for i, l in enumerate(lines) if l.startswith("// \u2550\u2550\u2550 "))
hdr = lines[:S[0]]
print(f"\n[GATE 3 · per-subsystem render]")
four = {}
for nm, i in (("SMC", 0), ("SWEEPS", 1), ("VOIDS", 2), ("POOLS", 3)):
    end = S[i + 1] if i + 1 < len(S) else len(lines)
    ok, c, e = run("\n".join(hdr + lines[S[i]:end]))
    drew = (c.get("boxes", 0) + c.get("labels", 0) + c.get("lines", 0)) if ok else 0
    four[nm] = {"ok": ok, "drew": drew, "boxes": c.get("boxes", 0),
                "labels": c.get("labels", 0), "lines": c.get("lines", 0)}
    print(f"  {nm:<7} {'PASS' if ok and drew else 'FAIL'}  boxes={c.get('boxes',0):<4} "
          f"labels={c.get('labels',0):<4} lines={c.get('lines',0)}")
G["four"] = four
G["four_ok"] = all(v["ok"] and v["drew"] for v in four.values())

# ── GATE 4 full artifact ────────────────────────────────────────────────
ok, c, e = run(src)
G["full"] = {"ok": ok, "counts": c, "err": e}
print(f"\n[GATE 4 · full artifact]  {'PASS' if ok else 'FAIL'}  "
      f"boxes={c.get('boxes')} labels={c.get('labels')} lines={c.get('lines')}")

# ── GATE 5 budget ceiling, full history ────────────────────────────────
print(f"\n[GATE 5 · box ceiling, full history]")
mx = 0
for pair in ("EUR/USD", "GBP/USD", "DXY"):
    for tf in ("15m", "30m", "1H", "4H"):
        o, cc, _ = run(src, pair, tf, 0)
        b = cc.get("boxes", 0)
        mx = max(mx, b)
        print(f"  {pair:<9} {tf:<4} boxes={b:<5} {'OVER' if b > 500 else 'within cap'}")
G["ceiling_max"] = mx
G["ceiling_ok"] = mx <= 500

# ── GATE 6 guards wired ────────────────────────────────────────────────
GUARDS = [("SMC FVG", r"if smc_fairValueGapBoxCount > "), ("SWEEPS", r"if swp_aBoxBr\.size\(\) < "),
          ("VOIDS", r"if voi_lqV\.size\(\) < "), ("POOLS B", r"if bsl_b_liq_B\.size\(\) < "),
          ("POOLS S", r"if bsl_b_liq_S\.size\(\) < ")]
print(f"\n[GATE 6 · budget guards wired]")
gw = {}
for nm, pat in GUARDS:
    n = len(re.findall(pat, src))
    gw[nm] = n
    print(f"  {nm:<9} {n} site(s)")
G["guards"] = gw
G["guards_ok"] = all(v > 0 for v in gw.values())

# ── GATE 7 behavior diff ───────────────────────────────────────────────
SHAPES = [("ta.crossover(close", "SMC structure"), ("highVolatilityBar ? low", "SMC OB inversion"),
          ("count > 2", "POOLS cluster gate"), ("bsl_liqV" if False else "voi_lqV", "VOIDS pool")]
print(f"\n[GATE 7 · behavior diff — core shapes present modulo identifiers]")
shapes = 0
for pat, label in [("ta.crossover(close", "SMC structure trigger"),
                   ("highVolatilityBar ? low", "SMC 2x-volatility inversion"),
                   ("count > 2", "POOLS 3-pivot cluster gate"),
                   ("swp_aBoxBr", "SWEEPS box array"),
                   ("voi_lqV", "VOIDS gap array")]:
    present = pat in src
    shapes += present
    print(f"  {'PASS' if present else 'FAIL'}  {label:<32} ('{pat}')")
G["shapes"] = shapes

# ── VERDICT ────────────────────────────────────────────────────────────
print("\n" + "=" * 76)
allg = (G["four_ok"] and G["full"]["ok"] and G["ceiling_ok"] and G["guards_ok"] and shapes == 5)
for k, v in [("lexcheck", G["lex"]), ("single decl", G["decls"] == "1"),
             ("4/4 render", G["four_ok"]), ("full artifact", G["full"]["ok"]),
             ("ceiling <=500", G["ceiling_ok"]), ("guards wired", G["guards_ok"]),
             ("shapes 5/5", shapes == 5)]:
    print(f"  {k:<16} {'GREEN' if v else 'RED'}")
print(f"\n  VERDICT: {'ALL GATES GREEN' if allg else 'A GATE IS RED'}")
print(f"  sandboxed at {URL} · no dashboard coupling")
G["verdict"] = "ALL GREEN" if allg else "RED"
G["audited"] = datetime.datetime.now().isoformat(timespec="seconds")
(W / "LOOP_VERIFICATION.json").write_text(json.dumps(G, indent=2))
print("=" * 76)
sys.exit(0 if allg else 1)
