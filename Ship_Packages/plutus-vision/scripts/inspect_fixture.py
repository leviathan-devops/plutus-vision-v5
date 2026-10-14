import json, pathlib, sys

F = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE/agent/reference/fixtures/bars/2026-07-06.json")
print("exists:", F.exists(), "size:", F.stat().st_size if F.exists() else 0)
d = json.loads(F.read_text())
print("top type:", type(d).__name__)
if isinstance(d, dict):
    print("top keys:", list(d.keys())[:15])
    for k, v in list(d.items())[:6]:
        if isinstance(v, dict):
            print(f"  {k}: dict keys={list(v.keys())[:8]}")
            for kk, vv in list(v.items())[:4]:
                if isinstance(vv, list) and vv:
                    print(f"    {kk}: list len={len(vv)} [0]={json.dumps(vv[0])[:200]}")
                elif isinstance(vv, dict):
                    print(f"    {kk}: dict keys={list(vv.keys())[:6]}")
                else:
                    print(f"    {kk}: {str(vv)[:80]}")
        elif isinstance(v, list) and v:
            print(f"  {k}: list len={len(v)} [0]={json.dumps(v[0])[:200]}")
        else:
            print(f"  {k}: {str(v)[:80]}")
