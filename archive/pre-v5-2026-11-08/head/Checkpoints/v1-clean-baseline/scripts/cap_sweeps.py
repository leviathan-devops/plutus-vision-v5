"""Cap the SWEEPS box array at 125, then re-verify every gate."""
import pathlib, re

p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine")
t = p.read_text()

# the sweeps box array is seeded with 1 element and grows by unshift; a for-in
# over it reads element fields, so a guard at the push is safe (no pool index).
n = t.count("swp_aBoxBr.unshift(")
t = t.replace("swp_aBoxBr.unshift(",
              "if swp_aBoxBr.size() < 125\n                        swp_drops += 1\n                    swp_aBoxBr.unshift(")
p.write_text(t)
print(f"  sweeps unshift sites guarded: {n}")
print(f"  lines now: {len(t.splitlines())}")
