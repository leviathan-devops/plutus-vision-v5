import pathlib
p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine")
t = p.read_text()
n = t.count("bsl_aZZ.in_out(")
t = t.replace("bsl_aZZ.in_out(", "bsl_aZZ.bsl_roll(")
p.write_text(t)
print(f"  bsl_aZZ.in_out( -> bsl_aZZ.bsl_roll(  ({n} sites)")
print("  stale calls left:", t.count("bsl_aZZ.in_out("))
print("  bsl_roll decls:", t.count("method bsl_roll("))
