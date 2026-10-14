"""GOAL AUDIT — re-measure every gate against the CURRENT artifact on disk.
No inherited numbers. Every verdict is a fresh tool result.
"""
import pathlib, subprocess, hashlib, json, urllib.request, urllib.error, datetime, sys

D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision")
V = D / "plutus-vision-v0.pine"
SRC = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/luxalgo-smc")
URL = "http://127.0.0.1:9641"
R = {}


def sh(*a, cwd=None):
    return subprocess.run(list(a), capture_output=True, text=True, cwd=cwd or str(D)).stdout


def run(script, pair="EUR/USD", tf="4H", limit=300):
    body = json.dumps({"script": script, "pair": pair, "timeframe": tf, "limit": limit}).encode()
    req = urllib.request.Request(f"{URL}/run", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            d = json.load(r).get("data") or {}
            c = d.get("counts", {})
            return True, c, ""
    except urllib.error.HTTPError as e:
        return False, {}, json.loads(e.read().decode()).get("error", "")[:90]
    except Exception as e:
        return False, {}, str(e)[:80]


src = V.read_text()
R["sha"] = hashlib.sha256(src.encode()).hexdigest()
R["lines"] = len(src.splitlines())
R["decls"] = sh("grep", "-c", "^indicator(", str(V)).strip()
R["lux"] = sh("grep", "-c", "LuxAlgo", str(V)).strip()
lex = sh("python3", "scripts/lexcheck.py", str(V))
R["lex"] = [l for l in lex.splitlines() if "lexcheck:" in l][-1] if "lexcheck:" in lex else lex[-80:]

lines = src.split("\n")
S = sorted(i for i, l in enumerate(lines) if l.startswith("// \u2550\u2550\u2550 "))
hdr = lines[:S[0]]
R["four"] = {}
for nm, i in (("SMC", 0), ("SWEEPS", 1), ("VOIDS", 2), ("POOLS", 3)):
    end = S[i + 1] if i + 1 < len(S) else len(lines)
    ok, c, err = run("\n".join(hdr + lines[S[i]:end]))
    drew = (c.get("boxes", 0) + c.get("labels", 0) + c.get("lines", 0)) if ok else 0
    R["four"][nm] = {"ok": ok, "drew": drew, "boxes": c.get("boxes", 0),
                     "labels": c.get("labels", 0), "lines": c.get("lines", 0), "err": err}

ok, c, err = run(src)
R["full"] = {"ok": ok, "counts": c, "err": err,
             "drew": c.get("boxes", 0) + c.get("labels", 0) + c.get("lines", 0)}

R["probe"] = sh("node", "pine-ide-fork/pv_probe.mjs", str(V), "--url", URL).strip().split("\n")
R["frames"] = sorted(p.name for p in (D / "parity_frames").glob("*.png"))
R["audit_artifacts"] = sorted(str(p) for p in
                              list(pathlib.Path("/tmp").glob("sg-ocr-*.json"))
                              + list(D.glob("**/sg-ocr-*.json")))
R["checkpoints"] = sorted(p.name for p in (D / "Checkpoints").iterdir())
R["station_alive"] = bool(R["full"]["ok"])
R["audited"] = datetime.datetime.now().isoformat(timespec="seconds")

(D / "GOAL_AUDIT.json").write_text(json.dumps(R, indent=2))

print("=" * 72)
print("GOAL AUDIT — re-measured", R["audited"])
print("=" * 72)
print(f"  sha256        {R['sha']}")
print(f"  lines         {R['lines']}")
print(f"  indicator()   {R['decls']}")
print(f"  LuxAlgo marks {R['lux']}")
print(f"  lexcheck      {R['lex']}")
print("\n  per-subsystem:")
for nm, v in R["four"].items():
    print(f"    {nm:<7} {'PASS' if v['ok'] and v['drew'] else 'FAIL'}  "
          f"boxes={v['boxes']} labels={v['labels']} lines={v['lines']}"
          + (f"  err={v['err'][:44]}" if v["err"] else ""))
print(f"\n  full artifact  {'PASS' if R['full']['ok'] and R['full']['drew'] else 'FAIL'}  "
      f"boxes={R['full']['counts'].get('boxes')} labels={R['full']['counts'].get('labels')} "
      f"lines={R['full']['counts'].get('lines')}  err={R['full']['err'][:50]}")
print(f"  station alive  {R['station_alive']}")
print(f"  parity frames {len(R['frames'])}: {', '.join(R['frames'][:6])}")
print(f"  audit artifacts: {R['audit_artifacts'] or 'NONE — AUDIT GATE BLOCKED'}")
print(f"  checkpoints: {', '.join(R['checkpoints'])}")
print("\n  probe:")
for l in R["probe"][:4]:
    print(f"    {l}")
