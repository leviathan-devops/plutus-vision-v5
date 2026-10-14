import re, pathlib
p = pathlib.Path("plutus-vision-v0.pine"); L = p.read_text().split("\n"); out = []
DROP = re.compile(r"^\s*\w+_drops \+= 1\s*$")
GUARD = re.compile(r"^(\s*)if (swp_aBoxBr|voi_lqV|bsl_b_liq_[BS])\.size\(\) < \d+\s*$")
DECL = re.compile(r"^var int (smc|swp|voi|bsl)_drops|^var int smc_fairValueGapBoxCount")
i = 0; dedent_next = None
while i < len(L):
    s = L[i]
    if DROP.match(s) or DECL.match(s): i += 1; continue
    g = GUARD.match(s)
    if g: dedent_next = len(g.group(1)); i += 1; continue
    if dedent_next is not None:
        ind = len(s) - len(s.lstrip())
        if ind > dedent_next: s = " " * dedent_next + s.lstrip()
        dedent_next = None
    out.append(s); i += 1
t = "\n".join(out)
# restore the source FVG one-liner (prefixed)
t = re.sub(r"// W3 budget: the FVG pool.*?\nsmc_fairValueGapBox\(.*?\n        box\.new\((.*?)\)\n",
           lambda m: "smc_fairValueGapBox(leftTime,rightTime,topPrice,bottomPrice,boxColor) => box.new(" + m.group(1) + ")\n",
           t, flags=re.S)
t = re.sub(r"\n        na\n    else\n", "\n", t)  # leftover guard else, if any
p.write_text(t)
print("guards left:", len(re.findall(r"_drops|size\(\) < (100|125|75)\b|FairValueGapBoxCount", t)))
