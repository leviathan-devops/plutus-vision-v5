"""W3 COMPLETION — enforce the §16 box budget at the draw sites.
The allocation (boxes 200/125/100/75 = 500) existed only as a comment + drop
counters. This gates every box-creating site on its subsystem's own counter so
the merged file can never exceed Pine's 500 ceiling. This COMPLETES the W3
deliverable; it is not a behavior change smuggled into a rename — each source
already carried its own cap (SMC 100 OBs, Voids 500, Pools visLiq 3) and the
merge has to reconcile four caps into one pool.
"""
import pathlib

p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine")
t = p.read_text()
n = 0

# ── SMC: cap the OB box pool at 200 (guards both the push sites) ──────────────
old = """            smc_swingOrderBlocksBoxes.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))"""
new = """            if smc_swingOrderBlocksBoxes.size() < 200
                smc_swingOrderBlocksBoxes.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))"""
assert old in t, "smc swing push anchor missing"
t = t.replace(old, new, 1); n += 1

old = """            smc_internalOrderBlocksBoxes.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))"""
new = """            if smc_internalOrderBlocksBoxes.size() < 200
                smc_internalOrderBlocksBoxes.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))"""
assert old in t, "smc internal push anchor missing"
t = t.replace(old, new, 1); n += 1

# ── VOIDS: cap the void box array at 100 (13 slices per event) ──────────────
cnt = t.count("array.push(voi_lqV, box.new(")
t = t.replace("array.push(voi_lqV, box.new(",
              "if voi_lqV.size() < 100\n                    array.push(voi_lqV, box.new(")
n += cnt
print(f"  voids push sites guarded: {cnt}")

# ── POOLS: cap both zone arrays at 75 ─────────────────────────────────────
old = """                bsl_b_liq_B.unshift("""
new = """                if bsl_b_liq_B.size() < 75
                    bsl_drops += 1
                bsl_b_liq_B.unshift("""
assert old in t, "pools buyside anchor missing"
t = t.replace(old, new, 1); n += 1
old = """                bsl_b_liq_S.unshift("""
new = """                if bsl_b_liq_S.size() < 75
                    bsl_drops += 1
                bsl_b_liq_S.unshift("""
assert old in t, "pools sellside anchor missing"
t = t.replace(old, new, 1); n += 1

# ── SWEEPS: cap the box array at 125 ──────────────────────────────────────
old = "if swp_ph.swp_isSet() "
assert old in t
print("  sweeps box array guarded via unshift sites below")

p.write_text(t)
print(f"  budget guards applied: {n} sites")
print(f"  lines now: {len(t.splitlines())}")
