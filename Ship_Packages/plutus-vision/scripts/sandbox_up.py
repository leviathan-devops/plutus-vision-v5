"""PLUTUS_VISION — sandboxed station bring-up.
Installs the PineTS engine into the forked station (the checkpoint has no
node_modules — it is gitignored), starts it on THIS project's own port, and
proves the four LuxAlgo sources + the merged file all run.
Zero coupling to the dashboard or any other session: own dir, own port, own PID.
"""
import pathlib, subprocess, os, sys, json, time, urllib.request, urllib.error

W = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION")
ST = W / "pine-ide/pine-station"
PORT = 9741                      # OUR port — the dashboard uses 9441
NODE = "node"


def sh(cmd, cwd=None, env=None, timeout=600):
    return subprocess.run(cmd, shell=isinstance(cmd, str), cwd=cwd, env=env,
                          capture_output=True, text=True, timeout=timeout,
                          input=None if isinstance(cmd, str) else None)


print("=" * 74)
print(f"PLUTUS_VISION SANDBOXED STATION — port {PORT}")
print("=" * 74)

# ── 1 · install the engine ──────────────────────────────────────────────
nm = ST / "node_modules"
if not (nm / "pinets").exists():
    print(f"  installing PineTS into {nm} ...")
    r = subprocess.run([NODE, "-e",
        "const{execSync}=require('child_process');"
        "execSync('npm install --no-audit --no-fund',{cwd:process.argv[1],stdio:'inherit'});",
        str(ST)], capture_output=True, text=True, timeout=900)
    print(f"  npm rc={r.returncode}")
else:
    print("  node_modules/pinets present")

pj = json.loads((ST / "package.json").read_text())
print(f"  deps declared: {list(pj.get('dependencies', {}))}")
print(f"  pinets present: {(nm / 'pinets').exists()}")
print(f"  vela-pinets present: {(nm / '@luxalgo/vela-pinets').exists()}")

# ── 2 · start OUR OWN station ───────────────────────────────────────────
env = dict(os.environ)
env["PINE_STATION_PORT"] = str(PORT)
env["PINE_STATION_HOST"] = "127.0.0.1"
log = W / "station.log"
lf = open(log, "w")
proc = subprocess.Popen([NODE, "server.mjs"], cwd=str(ST), env=env,
                        stdout=lf, stderr=subprocess.STDOUT, start_new_session=True)
print(f"  station pid {proc.pid} -> {log}")

URL = f"http://127.0.0.1:{PORT}"
ok = False
for _ in range(40):
    time.sleep(0.5)
    try:
        with urllib.request.urlopen(URL + "/", timeout=3) as r:
            info = json.load(r)["data"]
        ok = True
        break
    except Exception:
        pass
if not ok:
    print("  STATION DID NOT COME UP — log tail:")
    print("\n".join(log.read_text().splitlines()[-15:]))
    sys.exit(3)
print(f"  UP  engine={info['engine']['name']}@{info['engine']['version']} "
      f"vela={info.get('velaPinets')} pid={info['pid']}")
print(f"  canon pinned: {info.get('canon', {}).get('sha256', '')[:16]} "
      f"({info.get('canon', {}).get('lines')} L)")


# ── 3 · prove the merge in THIS sandbox ────────────────────────────────
def run(script, pair="EUR/USD", tf="4H", limit=300):
    body = json.dumps({"script": script, "pair": pair, "timeframe": tf, "limit": limit}).encode()
    req = urllib.request.Request(f"{URL}/run", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.load(r).get("data") or {}
            return True, d.get("counts", {}), ""
    except urllib.error.HTTPError as e:
        return False, {}, json.loads(e.read().decode()).get("error", "")[:90]


merged = (W / "plutus-vision-v0.pine").read_text()
CORE = {"SMC": "sources/luxalgo-smc-smc.pine" if False else None}
print("\n  THE 4 CORE SOURCES + THE MERGE, in this sandbox:")
srcs = {"SMC": W / "smart-money-concepts.pine",
        "SWEEPS": W / "sources/liquidity-sweeps.pine",
        "VOIDS": W / "sources/liquidity-voids-fvg.pine",
        "POOLS": W / "sources/buyside-sellside-liquidity.pine"}
for nm_, p in srcs.items():
    if not p.exists():
        print(f"    {nm_:<7} MISSING {p.name}")
        continue
    okk, c, e = run(p.read_text())
    if okk:
        print(f"    {nm_:<7} OK  boxes={c.get('boxes')} labels={c.get('labels')} lines={c.get('lines')}")
    else:
        print(f"    {nm_:<7} {e[:56]}")

okm, cm, em = run(merged)
print(f"    MERGED  {'OK ' if okm else 'ERR'} boxes={cm.get('boxes')} "
      f"labels={cm.get('labels')} lines={cm.get('lines')}" + (f"  {em[:50]}" if em else ""))
json.dump({"port": PORT, "pid": proc.pid, "url": URL, "merged_ok": okm,
           "merged_counts": cm}, open(W / "SANDBOX.json", "w"), indent=2)
print(f"\n  sandbox -> {W / 'SANDBOX.json'}")
