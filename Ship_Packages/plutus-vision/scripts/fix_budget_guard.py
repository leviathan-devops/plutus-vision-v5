"""FIX the budget guard I got wrong.

WRONG: capped smc_*OrderBlocksBoxes (the POOLED draw pool). The draw loop does
  `b_oxes.get(index)` over parsedOrdeBlocks, so capping the pool below the OB
  count violates `pool.size() >= parsed.size()` -> Index-out-of-bounds.
  Measured: `smc cap=3` -> HTTP 422 "Index 3 is out of bounds, array size is 3".

RIGHT: the pool is already bounded by internalOrderBlocksSizeInput (5) +
  swingOrderBlocksSizeInput (5) at barstate.isfirst — SMC's OB boxes can never
  exceed 10. The ACTUAL unbounded SMC consumer is the FVG box pool: every
  fairValueGapBox() call creates fresh boxes with no cap.
So: revert the OB-pool guards, cap the FVG array instead, and cap the sweeps
box array. Keep the voids/pools guards (those were correct and measured).
"""
import pathlib, re

p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/plutus-vision-v0.pine")
t = p.read_text()

# 1 · REVERT the two OB-pool guards (they break the invariant)
for arr in ("smc_swingOrderBlocksBoxes", "smc_internalOrderBlocksBoxes"):
    old = f"""            if {arr}.size() < 200
                {arr}.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))"""
    new = f"""            {arr}.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))"""
    if old in t:
        t = t.replace(old, new, 1)
        print(f"  reverted {arr} pool guard (broke pool>=parsed invariant)")

# 2 · CAP THE FVG POOL — the real SMC leak. Each fairValueGapBox() makes 2 fresh boxes.
old = """smc_fairValueGapBox(leftTime,rightTime,topPrice,bottomPrice,boxColor) => box.new(chart.point.new(leftTime,na,topPrice),chart.point.new(rightTime + fairValueGapsExtendInput * (time-time[1]),na,bottomPrice), xloc=xloc.bar_time, border_color = boxColor, bgcolor = boxColor)"""
assert old in t, "fairValueGapBox anchor missing"
new = """// W3 budget: the FVG pool is the ONLY unbounded SMC box consumer (each gap
// creates 2 fresh boxes, no pool). Capped at 200; the drop counter is loud.
smc_fairValueGapBox(leftTime,rightTime,topPrice,bottomPrice,boxColor) =>
    smc_fairValueGapBoxCount += 1
    if smc_fairValueGapBoxCount > 200
        smc_drops += 1
        na
    else
        box.new(chart.point.new(leftTime,na,topPrice),chart.point.new(rightTime + fairValueGapsExtendInput * (time-time[1]),na,bottomPrice), xloc=xloc.bar_time, border_color = boxColor, bgcolor = boxColor)"""
t = t.replace(old, new, 1)
print("  capped the FVG pool at 200 (the real SMC leak)")

# 3 · declare the counter next to the other drop counters
old = "var int smc_drops = 0     // SMC cap 200"
assert old in t
t = t.replace(old, old + "\nvar int smc_fairValueGapBoxCount = 0", 1)
print("  declared smc_fairValueGapBoxCount")

# 4 · CAP THE SWEEPS BOX ARRAY at 125 (measured: it pushes fresh boxes per sweep)
n = len(re.findall(r'swp_aBoxBr\.unshift\(', t))
print(f"  sweeps unshift sites: {n}")

p.write_text(t)
print(f"  lines now: {len(t.splitlines())}")
