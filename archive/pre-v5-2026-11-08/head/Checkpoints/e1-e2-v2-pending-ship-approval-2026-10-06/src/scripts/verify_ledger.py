import json, pathlib

led = pathlib.Path("/home/leviathan/.plutus-dashboard/vil/2026-W29.jsonl")
print("=== VIL ledger rows (2026-W29) ===")
if led.exists():
    for line in led.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        r = json.loads(line)
        print(f"  week={r.get('week')} pine={str(r.get('pineSha'))[:12]} png={str(r.get('pngSha'))[:12]} "
              f"reader={r.get('readerVerdict')} orch={r.get('orchestratorVerdict')} deltas={r.get('deltas')}")
else:
    print("  no ledger")

print()
print("=== captured PNGs the gate wrote ===")
ev = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE/dashboard/dashboard/evidence/shell")
if ev.exists():
    pngs = sorted(ev.glob("pineshell-*.png"), key=lambda p: p.stat().st_mtime)
    for p in pngs[-4:]:
        print(f"  {p.name}  {p.stat().st_size} bytes")
else:
    print("  no evidence dir")
