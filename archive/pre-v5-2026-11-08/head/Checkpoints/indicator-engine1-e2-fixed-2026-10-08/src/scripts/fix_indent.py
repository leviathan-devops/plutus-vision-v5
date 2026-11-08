import pathlib
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine")
lines = p.read_text().split("\n")
out = []
fixed = 0
for l in lines:
    if l.strip() == "swp_drops += 1" and l.startswith(" " * 24):
        # the guard `if` is at 16sp in this nest; its body must be 20sp, not 24sp
        out.append(" " * 20 + "swp_drops += 1")
        fixed += 1
    else:
        out.append(l)
p.write_text("\n".join(out))
print(f"  re-indented {fixed} guard bodies to one level (20sp)")
