import re, sys
sys.argv=[""]; exec(open(str(__import__("pathlib").Path(__file__).resolve().parent / "compare.py")).read().split("res = {}")[0])
full = (W/"plutus-vision-v0.pine").read_text()
parts = re.split(r"(?m)^(?=// ═══ (?:SMC|SWEEPS|VOIDS|POOLS) ═══)", full)
head, secs = parts[0], {re.match(r"// ═══ (\w+)", p).group(1): p for p in parts[1:]}
mk = keys(run(full)["data"])
src = {n: keys(run((SRC/f).read_text())["data"]) for n, f in CORES.items() if n != "SWEEPS"}
r = run(head + secs["SWEEPS"]); print("SWEEPS-alone ok:", r.get("success"), r.get("error") or "", (r.get("data") or {}).get("counts"))
sw = keys(r["data"])
print(f"SWEEPS alone={sum(sw.values())} in merged={sum((sw & mk).values())} lost={sum((sw - mk).values())}")
allsrc = sw.copy(); [allsrc.update(v) for v in src.values()]
print("merged drawings not in ANY baseline:", sum((mk - allsrc).values()))
v = src["VOIDS"]; miss = v - mk; hit = v & mk
print("VOIDS evicted strictly oldest:", max(k[1] for k in miss) <= min(k[1] for k in hit),
      "| newest evicted", max(k[1] for k in miss), "oldest kept", min(k[1] for k in hit))
