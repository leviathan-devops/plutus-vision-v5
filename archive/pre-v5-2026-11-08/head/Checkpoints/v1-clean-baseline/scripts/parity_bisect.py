import re, sys
from collections import Counter
sys.argv=[""]; exec(open(str(__import__("pathlib").Path(__file__).resolve().parent / "compare.py")).read().split("res = {}")[0])
full = (W/"plutus-vision-v0.pine").read_text()
parts = re.split(r"(?m)^(?=// ═══ (?:SMC|SWEEPS|VOIDS|POOLS) ═══)", full)
head, secs = parts[0], {re.match(r"// ═══ (\w+)", p).group(1): p for p in parts[1:]}
src = {n: keys(run((SRC/f).read_text())["data"]) for n, f in CORES.items() if n != "SWEEPS"}
def score(script):
    r = run(script)
    if not r.get("success"): return "FAIL " + str(r.get("error"))[:120]
    mk = keys(r["data"])
    return {n: f"{sum((sk & mk).values())}/{sum(sk.values())}" for n, sk in src.items()}
print("all     ", score(full))
for drop in secs:
    print(f"-{drop:7}", score(head + "".join(p for n, p in secs.items() if n != drop)))
