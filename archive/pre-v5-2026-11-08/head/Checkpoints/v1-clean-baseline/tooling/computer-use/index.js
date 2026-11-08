/**
 * computer-use — the first-class direct-look path for driving and verifying a LIVE GUI product.
 *
 * WHY THIS EXISTS. On 2026-10-01 a six-hour session verified a product with a 4B local VLM
 * answering four presence questions, batched screenshots, background jobs between the action
 * and its observation, and a video nobody watched. The agent reported PASS on frames it had
 * itself found defective. The mechanism failed because nothing forced the agent to LOOK.
 *
 * THE RAIL (the whole point of this tool). State is tracked per display+window:
 *
 *   · every mutating action (click/type/key/drag/scroll/setvalue) increments `unobserved`
 *   · `screenshot` returns the PNG AS AN IMAGE BLOCK — the pixels enter the agent's context —
 *     and clears `unobserved`
 *   · `verdict` is REFUSED when `unobserved > 0`  ("you cannot judge a state you did not look at")
 *   · `verdict` is REFUSED when no named `expectation` was written before the interaction
 *   · `report` lists every unobserved interaction as an honest gap
 *
 * There is no model fallback. This tool never calls a VLM. The only thing that can carry a
 * verdict is the agent's own read of a frame this tool returned.
 *
 * Multi-display: displays are DISCOVERED, never hardcoded. Windows are addressed by id or by
 * title regex, and all coordinates are WINDOW-RELATIVE (the tool does the origin translation).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";

const STATE_DIR = process.env.COMPUTER_USE_HOME || join(homedir(), ".omp", "agent", "run", "computer-use");
const LEDGER = join(STATE_DIR, "runs.jsonl");

// Session state is persisted, not just the ledger. A caller that drives the tool across several
// short invocations (a sweep: expect -> click -> look -> verdict) would otherwise lose the written
// expectation, and every rail would refuse for the wrong reason. Found by scripts/sweep.mjs on
// 2026-10-01: the rail was RIGHT, the state was not carried.
const SESSION = join(STATE_DIR, "session.json");
function saveSession() {
  try {
    if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(SESSION, JSON.stringify({
      display: S.display, win: S.win, winTitle: S.winTitle, plan: S.plan,
      expectation: S.expectation ?? null, unobserved: S.unobserved ?? 0,
      lastShot: S.lastShot ?? null, rows: Array.isArray(S.rows) ? S.rows : [],
    }, null, 1));
  } catch (e) { /* never let bookkeeping break the tool */ }
}
function loadSession() {
  try {
    if (!existsSync(SESSION)) return;
    const s = JSON.parse(readFileSync(SESSION, "utf8"));
    Object.assign(S, {
      display: s.display ?? null, win: s.win ?? null, winTitle: s.winTitle ?? null,
      plan: s.plan ?? null, expectation: s.expectation ?? null,
      unobserved: s.unobserved ?? 0, lastShot: s.lastShot ?? null,
      rows: Array.isArray(s.rows) ? s.rows : [],
    });
  } catch (e) { /* a corrupt session file must not brick the tool */ }
}

// ── state ───────────────────────────────────────────────────────────────────
const S = {
  display: null,          // ":3"
  win: null,              // window id
  winTitle: null,
  plan: null,             // set by action=plan
  expectation: null,      // set by action=expect
  unobserved: 0,          // mutations since the last screenshot
  lastShot: null,         // { path, sha, bytes, at }
  rows: [],               // the current run's verdicts
  actions: [],            // every action this session (for report)
};

// Load AFTER the declaration: calling this earlier runs in the temporal dead zone,
// throws a ReferenceError, and the catch swallows it — every process would start
// blind (found 2026-10-01 by scripts/sweep.mjs).
loadSession();

function ensureDir() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
}

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    timeout: opts.timeoutMs ?? 20000,
    env: { ...process.env, DISPLAY: S.display || process.env.DISPLAY },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function trySh(cmd, args, opts = {}) {
  try { return { ok: true, out: sh(cmd, args, opts) }; }
  catch (e) { return { ok: false, out: String(e.stdout || "") + String(e.stderr || e.message || "") }; }
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function log(row) {
  ensureDir();
  appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n");
}

// ── display discovery ────────────────────────────────────────────────────────
function discoverDisplays() {
  const out = [];
  let socks = [];
  try { socks = readdirSync("/tmp/.X11-unix"); } catch { socks = []; }
  for (const s of socks) {
    if (!/^X\d+$/.test(s)) continue;
    const d = ":" + s.slice(1);
    const geo = trySh("xdpyinfo", [], { timeoutMs: 4000 });
    if (!geo.ok) continue;
    const m = geo.out.match(/dimensions:\s+(\d+)x(\d+)/);
    // NOT --onlyvisible: an override-redirect / unmapped-managed window still holds pixels we
    // must be able to capture and click.
    const wins = trySh("xdotool", ["search", "--name", "."], { timeoutMs: 4000 });
    const titles = [];
    if (wins.ok) {
      for (const w of wins.out.trim().split("\n").filter(Boolean).slice(0, 24)) {
        const t = trySh("xdotool", ["getwindowname", w], { timeoutMs: 2500 });
        titles.push({ id: w, name: (t.ok ? t.out : "").trim() });
      }
    }
    out.push({ display: d, geometry: m ? `${m[1]}x${m[2]}` : "?", windows: titles });
  }
  return out;
}

function pickWindow(winId, titleRe) {
  if (winId) {
    const g = trySh("xdotool", ["getwindowgeometry", String(winId)]);
    const p = g.ok ? g.out.match(/Position:\s+(-?\d+),(-?\d+)/) : null;
    const z = g.ok ? g.out.match(/Geometry:\s+(\d+)x(\d+)/) : null;
    const t = trySh("xdotool", ["getwindowname", String(winId)]);
    S.win = String(winId);
    S.winTitle = t.ok ? t.out.trim() : String(winId);
    return {
      id: S.win, title: S.winTitle,
      origin: p ? { x: +p[1], y: +p[2] } : null,
      size: z ? { w: +z[1], h: +z[2] } : null,
      display: S.display,
    };
  }
  if (titleRe) {
    // BUG (found by scripts/rail-test.mjs): searching only $DISPLAY missed the target when the
    // window lives on a DIFFERENT display than this process. Search every display, then bind it.
    const saved = S.display;
    for (const d of discoverDisplays()) {
      S.display = d.display;
      const r = trySh("xdotool", ["search", "--name", titleRe], { timeoutMs: 4000 });
      if (r.ok && r.out.trim()) {
        const id = r.out.trim().split("\n")[0];
        return pickWindow(id, null);
      }
    }
    S.display = saved;
    return null;
  }
  if (S.win) return pickWindow(S.win, null);
  return null;
}

function resolveDisplay(w) {
  // the window lives on exactly one display; find it by scanning
  const saved = S.display;
  const displays = discoverDisplays();
  for (const d of displays) {
    S.display = d.display;
    const g = trySh("xdotool", ["getwindowgeometry", String(w)], { timeoutMs: 3000 });
    if (g.ok) { S.display = d.display; return d.display; }
  }
  S.display = saved;
  return saved;
}

const requireWindow = () => {
  if (!S.win) {
    const err = new Error("NO_WINDOW — pass win=<id> or title=<regex> (run action=displays first)");
    err.code = "NO_WINDOW";
    throw err;
  }
  return S.win;
};

// ── the tool ─────────────────────────────────────────────────────────────────
function buildComputerUseTool(pi) {
  const ACTIONS = [
    "displays", "focus", "look", "screenshot", "observe", "click", "type", "key", "drag", "scroll",
    "setvalue", "plan", "expect", "verdict", "ack", "report", "reset",
  ];

  const wrap = async (fn) => {
    try {
      const r = await fn();
      return {
        content: r.content ?? [{ type: "text", text: r.text }],
        details: r.details ?? {},
        ...(r.isError ? { isError: true } : {}),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        content: [{ type: "text", text: `COMPUTER-USE ${e.code || "FAILED"} (loud): ${msg}` }],
        details: { isError: true, error: msg, code: e.code || "FAILED" },
        isError: true,
      };
    }
  };

  return {
    name: "computer-use",
    label: "Computer Use",
    description:
      "Drive and VERIFY a live GUI product with vision-in-the-loop built in. " +
      "USE THIS INSTEAD OF `read` WHEN THE TARGET IS A LIVE APP: action=look (optionally title=\"...\") returns the " +
      "current pixels AS AN IMAGE in one call — that is the read-tool equivalent. " +
      "Discover displays, focus a window, " +
      "interact with real input (click/type/key/drag/scroll), and screenshot — the screenshot is returned AS AN IMAGE " +
      "so the pixels enter your context. RAILS: every mutating action counts as an unobserved interaction; " +
      "action=verdict is REFUSED unless a screenshot was taken after the last mutation AND a named expectation " +
      "was written first. No model is ever consulted — only the agent's own read of a returned frame can carry a verdict.",
    parameters: pi.zod.object({
      action: pi.zod.string(),
      display: pi.zod.string().optional(),
      win: pi.zod.string().optional(),
      title: pi.zod.string().optional(),
      x: pi.zod.number().optional(),
      y: pi.zod.number().optional(),
      x2: pi.zod.number().optional(),
      y2: pi.zod.number().optional(),
      button: pi.zod.string().optional(),
      keys: pi.zod.string().optional(),
      text: pi.zod.string().optional(),
      delayMs: pi.zod.number().optional(),
      out: pi.zod.string().optional(),
      grid: pi.zod.boolean().optional(),
      plan: pi.zod.string().optional(),
      expectation: pi.zod.string().optional(),
      verdict: pi.zod.string().optional(),
      found: pi.zod.string().optional(),
      missing: pi.zod.string().optional(),
      wrong: pi.zod.string().optional(),
      note: pi.zod.string().optional(),
    }),
    execute: (args) => wrap(async () => {
      const a = args || {};
      let act = a.action;
      S.actions.push({ act, at: new Date().toISOString() });

      if (act === "reset") {
        S.plan = null; S.expectation = null; S.unobserved = 0; S.lastShot = null; S.rows = [];
        S.actions = []; S.win = null; S.display = null;
        return { text: "COMPUTER-USE: state reset" };
      }

      if (act === "displays") {
        const ds = discoverDisplays();
        if (a.display) S.display = a.display;
        const lines = ds.map((d) =>
          `${d.display} ${d.geometry}  ${d.windows.length} windows\n` +
          d.windows.map((w) => `    ${w.id}  ${w.name}`).join("\n"));
        return {
          text: `DISPLAYS (${ds.length}):\n${lines.join("\n\n")}\n\n` +
                `Now: action=focus title=<regex> (or win=<id>) to bind a target.`,
          details: { displays: ds },
        };
      }

      if (act === "focus") {
        if (a.display) S.display = a.display;
        const w = pickWindow(a.win, a.title);
        if (!w) return { text: `FOCUS failed — no window matched ${a.win || a.title || "(current)"}`, isError: true };
        if (!S.display || a.display) resolveDisplay(w.id);
        return {
          text: `FOCUS ${w.id} "${w.title}" on ${w.display} · origin ${w.origin?.x},${w.origin?.y} · size ${w.size?.w}x${w.size?.h}\n` +
                `Coordinates you pass to click/type/drag are WINDOW-RELATIVE (0,0 = window top-left).`,
          details: w,
        };
      }

      // bind/refresh the window for every action below
      // `look` and `claim` bind (or need no window) themselves — they must NOT be pre-gated,
      // or `look` can never bind by title and `claim` reports NO_WINDOW instead of its own refusal.
      const SELF_BOUND = ["plan", "expect", "verdict", "report", "ack", "look", "claim"];
      if (!SELF_BOUND.includes(act)) {
        if (a.display) S.display = a.display;
        if (a.win || a.title) {
          const w = pickWindow(a.win, a.title);
          if (w && (!S.display || a.display)) resolveDisplay(w.id);
        } else {
          requireWindow();
        }
      }

      if (act === "plan") {
        if (!a.plan) return { text: "PLAN required: pass plan=<the test plan as text>", isError: true };
        S.plan = a.plan;
        log({ kind: "plan", plan: a.plan });
        return { text: `PLAN recorded (${a.plan.length} chars). Mutating actions are now permitted; the LOOK rail is unchanged.` };
      }

      if (act === "expect") {
        if (!a.expectation) return { text: "EXPECT required: pass expectation=<the named expectation, written BEFORE interacting>", isError: true };
        S.expectation = a.expectation;
        log({ kind: "expect", expectation: a.expectation });
        try { saveSession(); } catch {}
        return { text: `EXPECTATION recorded: "${a.expectation}"\n(The next verdict is judged against this.)` };
      }

      if (act === "ack") {
        const n = S.unobserved;
        if (n === 0) return { text: "ACK: nothing to acknowledge — no unobserved interactions." };
        if (!a.note || String(a.note).trim().length < 12) {
          const d = { code: "ACK_UNJUSTIFIED", delta: `${n} interaction(s) acknowledged without a look and without a reason` };
          log({ kind: "ack_refused", ...d });
          return {
            text:
`ACK REFUSED — ${n} unobserved interaction(s) claimed as observed with no reason.

Acking without looking is the bypass this rail exists to close. If you genuinely saw the result
(someone else described it, it was in the output you read), say so:

REMEDY: action=ack note="<why you saw it without a capture>"  — the note is recorded permanently.`,
            isError: true,
            details: { refused: true, delta: d },
          };
        }
        S.unobserved = 0;
        log({ kind: "ack", n, reason: a.note });
        try { saveSession(); } catch {}
        return {
          text: `ACK: ${n} interaction(s) marked observed WITHOUT a capture.
` +
                `  reason: ${a.note}
` +
                `  This is recorded as a GAP in the ledger and counted by action=report.`,
          details: { acked: n, reason: a.note },
        };
      }

      // action=look — the ONE-CALL path, the read-tool equivalent: bind the target (if a title
      // is given) and return the current pixels as an image block. Falls through to screenshot
      // so there is exactly ONE capture implementation.
      if (act === "look") {
        if (a.display) S.display = a.display;
        if (a.win || a.title) {
          const w = pickWindow(a.win, a.title);
          if (!w) return { text: `LOOK failed — no window matched ${a.win || a.title}`, isError: true };
          resolveDisplay(w.id);
        }
        act = "screenshot";
        a.action = "screenshot";
      }

      if (act === "screenshot") {
        const win = requireWindow();
        ensureDir();
        const out = a.out || join(STATE_DIR, "shots", `${Date.now()}-${act}.png`);
        const dir = out.includes("/") ? out.slice(0, out.lastIndexOf("/")) : ".";
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const r = trySh("import", ["-window", win, "-silent", out], { timeoutMs: 25000 });
        if (!r.ok || !existsSync(out)) {
          return { text: `SCREENSHOT failed: ${r.out || "import produced no file"}`, isError: true };
        }
        const buf = readFileSync(out);
        const hash = sha256(buf);
        S.lastShot = { path: out, sha: hash, bytes: buf.length, at: new Date().toISOString() };
        S.unobserved = 0; // the pixels are now in the agent's context — that IS the look
        log({ kind: "shot", path: out, sha: hash, bytes: buf.length });
        try { saveSession(); } catch {}
        return {
          content: [
            { type: "text", text:
                `SCREENSHOT ${win} "${S.winTitle}" ${S.display}\n` +
                `path: ${out}\nsha256: ${hash}\nbytes: ${buf.length}\n` +
                `unobserved interactions cleared (was ${S.unobserved}).\n` +
                `LOOK at the image below, then run action=verdict with found/missing/wrong.` },
            { type: "image", data: buf.toString("base64"), mimeType: "image/png" },
          ],
          details: { path: out, sha: hash, bytes: buf.length, unobserved: 0 },
        };
      }

      if (act === "observe") {
        const win = requireWindow();
        const tree = trySh("xwininfo", ["-id", win, "-tree"], { timeoutMs: 8000 });
        return {
          text: `OBSERVE ${win} "${S.winTitle}" (${S.display})\n` +
                `${tree.ok ? tree.out.slice(0, 4000) : "xwininfo failed: " + tree.out}\n` +
                `NOTE: xwininfo lists X windows, not web/canvas DOM. For a canvas app use action=screenshot — the pixels ARE the interface.`,
          details: { win, display: S.display },
        };
      }

      // ── mutating actions: every one counts as an unobserved interaction ──────
      if (["click", "type", "key", "drag", "scroll", "setvalue"].includes(act)) {
        const win = requireWindow();
        const g0 = pickWindow(win, null);
        const bump = () => { S.unobserved += 1; };
        let what = "";

        if (act === "click") {
          if (a.x == null || a.y == null)
            return { text: "CLICK needs x,y (WINDOW-RELATIVE) — run action=screenshot and read the pixels for coordinates", isError: true };
          const ox = (g0.origin?.x ?? 0) + a.x, oy = (g0.origin?.y ?? 0) + a.y;
          trySh("xdotool", ["mousemove", "--window", win, String(a.x), String(a.y)]);
          trySh("xdotool", ["click", a.button || "1"]);
          what = `click ${a.button || 1} at window(${a.x},${a.y}) = screen(${ox},${oy})`;
        }
        if (act === "type") {
          if (!a.text) return { text: "TYPE needs text=", isError: true };
          trySh("xdotool", ["type", "--window", win, "--delay", String(a.delayMs ?? 25), "--", a.text]);
          what = `type ${a.text.length} chars`;
        }
        if (act === "key") {
          if (!a.keys) return { text: "KEY needs keys= (e.g. ctrl+a, Return, Escape)", isError: true };
          for (const k of a.keys.split(/\s+/).filter(Boolean))
            trySh("xdotool", ["key", "--window", win, k]);
          what = `key ${a.keys}`;
        }
        if (act === "drag") {
          if (a.x == null || a.y == null || a.x2 == null || a.y2 == null)
            return { text: "DRAG needs x,y,x2,y2 (window-relative)", isError: true };
          trySh("xdotool", ["mousemove", "--window", win, String(a.x), String(a.y)]);
          trySh("xdotool", ["mousedown", "1"]);
          const steps = 10;
          for (let i = 1; i <= steps; i++) {
            trySh("xdotool", ["mousemove", "--window", win,
              String(Math.round(a.x + ((a.x2 - a.x) * i) / steps)),
              String(Math.round(a.y + ((a.y2 - a.y) * i) / steps))]);
          }
          trySh("xdotool", ["mouseup", "1"]);
          what = `drag (${a.x},${a.y}) -> (${a.x2},${a.y2})`;
        }
        if (act === "scroll") {
          const dir = a.button === "up" ? "4" : a.button === "down" ? "5" : a.button === "left" ? "6" : "7";
          const times = a.delayMs ?? 3;
          trySh("xdotool", ["click", "--repeat", String(times), dir]);
          what = `scroll ${a.button || "down"} x${times}`;
        }
        if (act === "setvalue") {
          if (!a.text) return { text: "SETVALUE needs text=", isError: true };
          trySh("xdotool", ["type", "--window", win, "--delay", String(a.delayMs ?? 25), "--clearmodifiers", "--", a.text]);
          what = `setvalue ${a.text.length} chars`;
        }

        bump();
        log({ kind: "act", act, what, unobserved: S.unobserved });
        try { saveSession(); } catch {}
        return {
          text: `${act.toUpperCase()}: ${what} on ${win} "${S.winTitle}" (${S.display})\n` +
                `⚠ UNOBSERVED — ${S.unobserved} interaction(s) since the last look.\n` +
                `A verdict is REFUSED until you action=screenshot and LOOK at the pixels.`,
          details: { act, unobserved: S.unobserved },
        };
      }

      // ── the rail ────────────────────────────────────────────────────────────
      if (act === "verdict") {
        if (S.unobserved > 0) {
          log({ kind: "verdict_refused", reason: "unobserved", n: S.unobserved });
          return {
            text:
`VERDICT REFUSED — ${S.unobserved} unobserved interaction(s) since the last screenshot.

You cannot record a verdict about a state you have not looked at. This rail exists because a
4B VLM + batched captures + background jobs produced PASS verdicts on defective frames
(PLUTUS_VISION 2026-10-01, FAILURE_LOG F-08/F-11).

REMEDY: action=screenshot  →  LOOK at the returned image  →  action=verdict again.`,
            isError: true,
            details: { refused: true, unobserved: S.unobserved },
          };
        }
        if (!S.expectation) {
          const d = { code: "NO_EXPECTATION", delta: `verdict requested with no named expectation; unobserved=${S.unobserved}` };
          log({ kind: "verdict_refused", ...d });
          return {
            details: { refused: true, delta: d },
            text:
`VERDICT REFUSED — no named expectation was written.

Write what a correct render SHOULD show BEFORE interacting, so the verdict is measured against
a pre-written ruler rather than against whatever happened to appear.

REMEDY: action=expect expectation="..." then interact, screenshot, look, verdict.`,
            isError: true,
            details: { refused: true, noExpectation: true },
          };
        }
        if (!S.lastShot) {
          const d = { code: "NO_SCREENSHOT", delta: "verdict requested with no screenshot in this run; the state was never looked at" };
          log({ kind: "verdict_refused", ...d });
          return { text: "VERDICT REFUSED — no screenshot has been taken in this run.\n" +
                         `DELTA: ${d.delta}`, isError: true, details: { refused: true, delta: d } };
        }
        const v = String(a.verdict || "INCONCLUSIVE").toUpperCase();
        if (!["PASS", "FAIL", "INCONCLUSIVE"].includes(v)) {
          return { text: `VERDICT must be PASS | FAIL | INCONCLUSIVE (got "${v}")`, isError: true };
        }
        // A PASS that carries deltas IS the theatrical shape ("PASS, but the labels overlap").
        // It is refused unless the caller names force=1 — and the override is logged as an override.
        if (v === "PASS" && (a.missing || a.wrong) && !a.force) {
          const d = { code: "PASS_WITH_DELTAS", delta: `PASS recorded while missing="${a.missing}" wrong="${a.wrong}"` };
          log({ kind: "verdict_refused", ...d });
          return {
            text:
`VERDICT REFUSED — PASS with deltas is the theatrical shape.

  missing: ${a.missing || "(none)"}
  wrong:   ${a.wrong || "(none)"}

A verdict is either PASS with nothing wrong, or FAIL / INCONCLUSIVE with the deltas named.
"Mostly fine" is not a verdict; record it as FAIL and name what is wrong, or fix it and re-look.

REMEDY: fix the defect, look again, record a clean PASS — OR record FAIL with the deltas.`,
            isError: true,
            details: { refused: true, delta: d },
          };
        }
        if (v === "PASS" && (a.missing || a.wrong) && a.force) {
          log({ kind: "verdict_override", missing: a.missing, wrong: a.wrong, note: a.note || "" });
        }
        const row = {
          verdict: v,
          expectation: S.expectation,
          found: a.found || "", missing: a.missing || "", wrong: a.wrong || "",
          note: a.note || "",
          shot: S.lastShot,
          at: new Date().toISOString(),
        };
        S.rows.push(row);
        try { saveSession(); } catch {}
        S.expectation = null; // one expectation, one verdict — write the next one
        log({ kind: "verdict", ...row });
        try { saveSession(); } catch {}
        return {
          text:
`VERDICT ${v}\n` +
`  expectation: ${row.expectation}\n` +
`  found:   ${row.found || "(none recorded)"}\n` +
`  missing: ${row.missing || "(none recorded)"}\n` +
`  wrong:   ${row.wrong || "(none recorded)"}\n` +
`  evidence: ${row.shot.path} sha256:${row.shot.sha.slice(0, 16)}\n` +
`${row.verdict === "PASS" && (row.missing || row.wrong) ? "⚠ PASS carries deltas — name them or downgrade to FAIL." : ""}`,
          details: row,
        };
      }

      // ── C · action=claim — a completion statement GENERATED FROM THE LEDGER ──────────
      // This is the anti-theatre lever. You cannot hand-write a completion line that carries
      // shas; this emits one, and it REFUSES when there is nothing looked-at behind it.
      if (act === "claim") {
        const withDeltas = S.rows.filter((r) => r.missing || r.wrong);
        const cleanPass = S.rows.filter((r) => r.verdict === "PASS" && !r.missing && !r.wrong);
        const failures = S.rows.filter((r) => r.verdict === "FAIL");
        if (!S.rows.length) {
          const d = { code: "CLAIM_UNSUPPORTED", delta: "no verdict has been recorded in this run; nothing was looked at" };
          log({ kind: "claim_refused", ...d });
          return {
            text:
`CLAIM REFUSED — nothing behind it.

A completion statement here is supposed to carry the sha256 of the frames it rests on. This run
has recorded ZERO verdicts, so there is no frame, no look, and nothing to cite.

REMEDY:  action=expect → interact → action=look → LOOK at the image → action=verdict → action=claim
         (that is five cheap calls, and the result is unfalsifiable by anyone who reads the ledger.)`,
            isError: true,
            details: { refused: true, delta: d },
          };
        }
        const lines = S.rows.map((r, i) =>
          `${i + 1}. ${r.verdict.padEnd(13)} ${r.shot.sha.slice(0, 16)}  ` +
          `expectation: ${r.expectation.slice(0, 70)}
` +
          `      found="${r.found}" ${r.missing ? `missing="${r.missing}" ` : ""}${r.wrong ? `wrong="${r.wrong}"` : ""}`);
        const verdict = failures.length ? "FAIL" : (withDeltas.length ? "PASS WITH OPEN DELTAS" : "PASS");
        const out =
`VERIFICATION CLAIM — generated from ${S.rows.length} recorded verdict(s) on ${S.winTitle || "no target"}
  overall: ${verdict}
  clean PASS: ${cleanPass.length} · FAIL: ${failures.length} · PASS-with-deltas: ${withDeltas.length}
  unobserved interactions outstanding: ${S.unobserved}

${lines.join("\n")}

evidence frames:
${S.rows.map((r) => "  " + r.shot.path + "  sha256:" + r.shot.sha).join("\n")}

Anything not listed here was not verified. Copying a claim without these shas is unverifiable.`;
        log({ kind: "claim", verdict, verdicts: S.rows.length });
        return { text: out, details: { verdict, rows: S.rows } };
      }

      if (act === "report") {
        // the audit surface: interactions vs looks vs verdicts. A low ratio is the signature of
        // driving the app without observing it (which is what every bypass via bash looks like —
        // it never reaches this ledger, so the ratio is the tell).
        let ledgerRows = [];
        try { ledgerRows = existsSync(LEDGER) ? readFileSync(LEDGER, "utf8").trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } }) : []; } catch {}
        const acts = ledgerRows.filter((r) => r.kind === "act").length;
        const shots = ledgerRows.filter((r) => r.kind === "shot").length;
        const acks = ledgerRows.filter((r) => r.kind === "ack");
        const refusals = ledgerRows.filter((r) => r.kind === "verdict_refused" || r.kind === "ack_refused" || r.kind === "claim_refused");
        const overrides = ledgerRows.filter((r) => r.kind === "verdict_override");
        const pass = S.rows.filter((r) => r.verdict === "PASS").length;
        const fail = S.rows.filter((r) => r.verdict === "FAIL").length;
        const inc = S.rows.filter((r) => r.verdict === "INCONCLUSIVE").length;
        const rows = S.rows.map((r, i) =>
          `${i + 1}. ${r.verdict.padEnd(13)} shot=${r.shot.sha.slice(0, 12)}  found="${r.found}" missing="${r.missing}" wrong="${r.wrong}"`).join("\n");
        const ratio = acts ? (shots / acts).toFixed(2) : "n/a";
        return {
          text:
`COMPUTER-USE REPORT\n` +
`  target:  ${S.win ? `${S.win} "${S.winTitle}" on ${S.display}` : "(none bound)"}\n` +
`  plan:    ${S.plan ? "yes" : "NO PLAN"}\n` +
`  verdicts: ${pass} PASS / ${fail} FAIL / ${inc} INCONCLUSIVE\n` +
`  unobserved interactions right now: ${S.unobserved}\n\n` +
`${rows || "  (no verdicts recorded)"}\n` +
`\n── THE AUDIT SURFACE (whole ledger, this session) ──\n` +
`  interactions driven : ${acts}\n` +
`  frames captured     : ${shots}\n` +
`  look-ratio          : ${ratio}  ${ratio !== "n/a" && +ratio < 1 ? "⚠ below 1.0 — driving without observing" : "✓"}\n` +
`  acks w/o a look     : ${acks.length}${acks.length ? " → " + acks.map((a) => a.reason).join("; ").slice(0, 120) : ""}\n` +
`  rail refusals       : ${refusals.length}  (every one recorded — refusals are evidence, not noise)\n` +
`  PASS overrides      : ${overrides.length}  (PASS forced while carrying deltas)` +
`${overrides.length ? "\n" + overrides.map((o) => `    ${o.missing || ""} ${o.wrong || ""}`).join("\n") : ""}\n` +
`\nA run is DONE when every verdict came from a frame that was opened, and every "wrong" is\n` +
`either fixed-and-re-seen or filed OPEN with an owner. It is NOT done because a gate said PASS.`,
          details: { pass, fail, inc, unobserved: S.unobserved, rows: S.rows, ratio, acks: acks.length, refusals: refusals.length, overrides: overrides.length },
        };
      }

      return { text: `COMPUTER-USE ${act}: unhandled (loud) — no branch for "${act}"`, isError: true };
    }),
  };
}

function computerUseExtension(pi) {
  pi.registerTool(buildComputerUseTool(pi));
  console.log("[computer-use] registered computer-use");
}

export default computerUseExtension;
