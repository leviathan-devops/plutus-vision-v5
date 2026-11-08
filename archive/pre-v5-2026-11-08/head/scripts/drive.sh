#!/usr/bin/env bash
# One-process driver: exercises the tool the way a sweep does, so session state persists
# across the steps without depending on the on-disk session file surviving a code change.
set -uo pipefail
W=/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
cd "$W"
rm -f ~/.omp/agent/run/computer-use/session.json
node scripts/sweep.mjs reset   2>&1 | tail -1
node scripts/sweep.mjs expect  "1H on 605bff82: four subsystems render; nothing clipped; <=2 labels per 100px band" 2>&1 | tail -1
node scripts/sweep.mjs click 886,84 2>&1 | tail -1
node scripts/sweep.mjs look 08-menu 2>&1 | tail -1
echo "--- persisted across processes? ---"
python3 - <<'PY'
import json, pathlib
p = pathlib.Path("/home/leviathan/.omp/agent/run/computer-use/session.json")
if not p.exists():
    print("  NO session.json — state is not being persisted")
else:
    d = json.loads(p.read_text())
    print("  expectation:", (d.get("expectation") or "(NONE)")[:64])
    print("  unobserved :", d.get("unobserved"), " win:", d.get("win"))
PY
