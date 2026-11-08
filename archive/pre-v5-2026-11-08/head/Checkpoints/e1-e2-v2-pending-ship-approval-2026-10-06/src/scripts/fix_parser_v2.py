import pathlib

p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/scripts/input_parser_v2.mjs")
t = p.read_text()

old = """  const rows = [];
  let i = 0;
  while (i < inputs.length) {
    const inp = inputs[i];
    if (inp.inline) {
      const same = [];
      let j = i;
      while (j < inputs.length && inputs[j].inline === inp.inline) same.push(inputs[j++]);
      rows.push({
        key: `${inp.inline}@${inp.line}`,
        label: inp.title || prettyName(inp.name),
        tooltip: inp.tooltip || prettyName(inp.name),
        members: same,
      });
      i = j;
      continue;
    }
    rows.push({
      key: `l${inp.line}`,
      label: inp.title || prettyName(inp.name),
      tooltip: inp.tooltip || prettyName(inp.name),
      members: [inp],
    });
    i++;
  }
  return rows;"""

new = """  // A `title` that is literally a keyword is a source quirk, not a label. LuxAlgo's
  // liquidity-sweeps declares input.string('Only Wicks', 'options', options=[...]) - the word
  // "options" sits where the title belongs but duplicates the named arg, so TradingView falls
  // back to the variable name too. We fall back to the prettified name instead of printing
  // "options" as a label.
  const BAD_TITLES = new Set(["options", "title", "group", "tooltip", "inline", "defval"]);
  const labelFor = (inp) =>
    (inp.title && !BAD_TITLES.has(inp.title.toLowerCase()) ? inp.title : prettyName(inp.name));

  // Group by the inline KEY across the whole list, not by consecutive runs: SWEEPS declares
  // colBl(c1) colBr(c2) colBl2(c1) colBr2(c2) - alternating keys a run matcher misses.
  const rows = [];
  const byInline = new Map();
  const order = [];
  for (const inp of inputs) {
    if (!inp.inline) { order.push({ kind: "solo", inp }); continue; }
    if (!byInline.has(inp.inline)) { byInline.set(inp.inline, []); order.push({ kind: "inline", key: inp.inline }); }
    byInline.get(inp.inline).push(inp);
  }
  for (const o of order) {
    if (o.kind === "solo") {
      rows.push({ key: `l${o.inp.line}`, label: labelFor(o.inp), tooltip: o.inp.tooltip || labelFor(o.inp), members: [o.inp] });
    } else {
      const members = byInline.get(o.key);
      const titled = members.find((m) => m.title && !BAD_TITLES.has(m.title.toLowerCase()));
      const label = titled ? titled.title : prettyName(members[0].name);
      rows.push({ key: `${o.key}@${members[0].line}`, label, tooltip: (titled && titled.tooltip) || label, members });
    }
  }
  return rows;"""

assert t.count(old) == 1, f"buildRows anchor count {t.count(old)}"
t = t.replace(old, new)

old2 = """export function prettyName(name) {
  return String(name)
    .replace(/Input$/, "")
    .replace(/^(smc|swp|voi|bsl|pv)_/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^([a-z])/, (c) => c.toUpperCase())
    .replace(/\\s+/g, " ")
    .trim();
}"""

new2 = """const ACRONYMS = {
  v: "Void", th: "Threshold", bc: "Bullish", sc: "Bearish", tx: "Label", vf: "Filled", fc: "Color",
  len: "Length", mar: "Margin", buy: "Buyside", sel: "Sellside", bl: "Bull", br: "Bear",
  bl2: "Bull Area", br2: "Bear Area", bl3: "Bull Area Color", br3: "Bear Area Color",
  opt: "Options", ext: "Extend", maxB: "Max Bars", colBl: "Bull Color", colBr: "Bear Color",
  colBl2: "Bull Area", colBr2: "Bear Area", colBl3: "Bull Area", colBr3: "Bear Area",
  liq: "Liquidity", lqV: "Liquidity Void", cLIQ: "Liquidity Zone", cLQV: "Void Zone",
  lqVoid: "Void", lqText: "Label", visLiq: "Visible Levels", sellside: "Sellside",
  c: "Color", b: "Buy", s: "Sell",
};

export function prettyName(name) {
  let s = String(name).replace(/Input$/, "");
  s = s.replace(/^(smc|swp|voi|bsl|pv)_/, "");
  if (ACRONYMS[s]) return ACRONYMS[s];
  const pfx = s.match(/^([a-z]+)_([A-Za-z].*)$/);
  if (pfx) {
    const rest = pfx[2].replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    if (ACRONYMS[pfx[1]]) return `${ACRONYMS[pfx[1]]} ${rest}`;
    return rest;
  }
  return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^([a-z])/, (c) => c.toUpperCase()).replace(/\\s+/g, " ").trim();
}"""

assert t.count(old2) == 1, f"prettyName anchor count {t.count(old2)}"
t = t.replace(old2, new2)

p.write_text(t)
print("inline grouping by key + BAD_TITLES fallback + acronym prettifier applied")