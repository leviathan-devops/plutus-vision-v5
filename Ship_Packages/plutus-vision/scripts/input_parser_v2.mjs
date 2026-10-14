/**
 * parseInputs v2 — parses a merged Pine indicator into INDICATOR SECTIONS × GROUPS × ROWS,
 * faithfully reproducing how TradingView renders the same inputs.
 *
 * What v1 got wrong (2026-10-01, operator screenshot):
 *  1. `inline=` was ignored, so the empty-title colour inputs (TradingView's "same row as the
 *     input above" convention) rendered as their own rows and fell back to the RAW VARIABLE NAME
 *     (`internalBullColorInput`). 2. The `// ═══ SMC ═══` section markers were ignored, so all 84
 *     inputs from four different indicators sat in one flat scroll with no indication of which
 *     indicator they belonged to. 3. tooltips were dropped.
 *
 * Output shape:
 *   [{ id, name, inputs: [{ line, name, kind, value, title, group, inline, tooltip, options, min, max, step }] }]
 */
export function parseInputSections(src) {
  const text = String(src);
  const lines = text.split("\n");

  // literal constants so `group = SMART_GROUP` and `defval = HISTORICAL` resolve
  const K = new Map();
  for (const l of lines) {
    const m = l.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|#[0-9a-fA-F]{6,8}|-?\d+(?:\.\d+)?|true|false)\s*(?:\/\/.*)?$/);
    if (m) K.set(m[1], m[2]);
  }
  const resolve = (tok) => { const t = String(tok || "").trim(); return K.has(t) ? K.get(t) : t; };
  const unq = (s) => {
    const t = String(s || "").trim();
    return /^'(?:[^'\\]|\\.)*'$/.test(t) || /^"(?:[^"\\]|\\.)*"$/.test(t) ? t.slice(1, -1) : t;
  };

  const SECTION_RE = /^\/\/\s*═══\s*(\w[\w \/]*?)\s*═══/;
  const INPUT_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:[\d.]+\s*\/\s*)?(?:var\s+)?input\.(\w+)\s*\(([\s\S]*)$/;

  /** split an argument list at TOP-LEVEL commas only (nested calls, arrays, strings) */
  function splitArgs(s) {
    const out = []; let depth = 0, cur = "", q = null;
    for (const ch of s) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
      if ("([{".includes(ch)) depth++;
      if (")]}".includes(ch)) { if (depth === 0) break; depth--; }
      if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  const sections = [];
  let cur = { id: "GENERAL", name: "General", inputs: [] };

  for (let i = 0; i < lines.length; i++) {
    const sm = lines[i].match(SECTION_RE);
    if (sm) {
      const name = sm[1].trim();
      const id = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
      cur = { id, name: titleCase(id), inputs: [] };
      sections.push(cur);
      continue;
    }
    const m = lines[i].match(INPUT_RE);
    if (!m) continue;
    const [_, name, kind, rest] = m;

    // join continuation lines (SWEEPS declares one input across two lines)
    let body = rest, j = i;
    let guard = 0;
    while (depthOf(body) > 0 && j + 1 < lines.length && guard++ < 12) body += "\n" + lines[++j];

    const args = splitArgs(body);
    const named = {}; const pos = [];
    for (const a of args) {
      const nm = a.match(/^([A-Za-z_]+)\s*=\s*([\s\S]+)$/);
      if (nm && !/^[([{]/.test(nm[2].trim())) named[nm[1]] = nm[2].trim();
      else pos.push(a);
    }
    const defvalRaw = named.defval ?? pos[0] ?? "";
    const titleRaw = named.title ?? pos[1] ?? "";
    const optRaw = named.options ?? pos[2] ?? "";
    const inline = (named.inline ?? "").replace(/^['"]|['"]$/g, "");
    const opts = optRaw.trim().startsWith("[")
      ? splitArgs(optRaw.trim().slice(1, optRaw.lastIndexOf("]"))).map((o) => unq(resolve(o)))
      : null;

    cur.inputs.push({
      line: i + 1, name, kind,
      raw: String(defvalRaw).trim(),
      value: unq(resolve(defvalRaw)),
      title: unq(resolve(titleRaw)),            // "" is MEANINGFUL — see inline below
      group: unq(resolve(named.group ?? "")),
      inline,
      tooltip: unq(resolve(named.tooltip ?? "")),
      options: opts,
      min: named.minval ?? null, max: named.maxval ?? null, step: named.step ?? null,
    });
    i = j;
  }

  return sections.filter((s) => s.inputs.length);

  function depthOf(s) { let d = 0, q = null; for (const ch of s) { if (q) { if (ch === q) q = null; continue; } if (ch === "'" || ch === '"') q = ch; else if ("([{".includes(ch)) d++; else if (")]}".includes(ch)) d--; } return d; }
  function titleCase(id) {
    return id.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  }
}

/**
 * Build render ROWS from a section's inputs, honouring TradingView's `inline=` convention:
 * consecutive inputs sharing an `inline` key render on ONE row, labelled by the first input's
 * title; the rest are bare swatches/checkboxes beside it. This is what gives the empty-title
 * colour inputs their correct appearance instead of a raw variable name.
 *
 * @returns [{ key, label, tooltip, members: [input] }]
 */
export function buildRows(inputs) {
  // A `title` that is literally a keyword is a source quirk, not a label. LuxAlgo's
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
  return rows;
}

/** Last-resort label when the source gives an empty title AND no inline partner:
 *  `internalBullColorInput` -> `Internal Bull Color`. */
const ACRONYMS = {
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
    .replace(/^([a-z])/, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();
}