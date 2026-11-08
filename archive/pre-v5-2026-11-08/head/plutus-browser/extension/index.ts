// index.ts - the OMP surface for PLUTUS-BROWSER. A THIN FORWARDER, the same shape as the pinebox extension.
//
// It reads the installed CLI's actions.json, turns a tool call into `plutus-browser` argv, runs the CLI and returns
// its JSON. It implements no verb: a fix in the CLI is a fix here. For `shot` it attaches the captured frame as an
// IMAGE part so the pixels enter the agent's context in the same call.
//
// THE CLI HAS ONE LOCATION: ~/.local/bin/plutus-browser, the link DEPLOY.sh creates, resolved to the real install.
// Absent = PLUTUS_BROWSER_CLI_UNAVAILABLE at registration, with the remedy. No other place is looked at.
import { spawn } from "node:child_process";
import { closeSync, constants, existsSync, fstatSync, openSync, readFileSync, readSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, sep } from "node:path";

class Refusal extends Error {}

const CLI_LINK = resolve(homedir(), ".local/bin/plutus-browser");
const RUN_TIMEOUT_MS = 300_000;
const MAX_OUT_CHARS = 8 * 1024 * 1024;
const MAX_ERR_CHARS = 256 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// `REFUSED  <TOKEN>  <dash>  <detail>`: the dash may be an em/en dash or a hyphen; the token may carry `:` `.` `-`
const REFUSAL = /REFUSED\s+([A-Za-z0-9_:.\-]+)\s+[\u2014\u2013-]+\s*([\s\S]*)/;

function installedCli(): string {
  if (!existsSync(CLI_LINK)) {
    throw new Refusal(`PLUTUS_BROWSER_CLI_UNAVAILABLE: ${CLI_LINK} does not exist - install the tool: bash DEPLOY.sh (the ship package) or plutus-browser/deploy.sh (the source tree)`);
  }
  const real = realpathSync(CLI_LINK);
  if (!existsSync(resolve(dirname(real), "actions.json"))) {
    throw new Refusal(`PLUTUS_BROWSER_CLI_UNAVAILABLE: ${real} has no actions.json beside it - re-run DEPLOY.sh`);
  }
  return real;
}

interface ParamSpec { type: "string" | "number" | "boolean"; description: string }
interface ActionRow { argv: string[]; flags: string[] }
interface ActionTable { version: string; params: Record<string, ParamSpec>; actions: Record<string, ActionRow> }

function loadTable(cli: string): ActionTable {
  const path = resolve(dirname(cli), "actions.json");
  let t: ActionTable;
  try { t = JSON.parse(readFileSync(path, "utf8")) as ActionTable; }
  catch (e) { throw new Refusal(`PLUTUS_BROWSER_EXT_STARTUP_FAILED: cannot parse ${path}: ${(e as Error).message} - re-run DEPLOY.sh`); }
  if (!t || typeof t.actions !== "object" || typeof t.params !== "object" || Object.keys(t.actions).length === 0) {
    throw new Refusal(`PLUTUS_BROWSER_EXT_STARTUP_FAILED: ${path} has no actions/params - re-run DEPLOY.sh`);
  }
  for (const [verb, row] of Object.entries(t.actions)) {
    for (const f of row.flags) {
      if (!Object.prototype.hasOwnProperty.call(t.params, f)) {
        throw new Refusal(`PLUTUS_BROWSER_EXT_STARTUP_FAILED: verb '${verb}' names flag '${f}' that ${path} does not declare in params`);
      }
    }
  }
  return t;
}

type Params = Record<string, unknown>;
interface ZodLike { optional(): ZodLike; describe(text: string): ZodLike }
interface PiZod {
  string(): ZodLike; number(): ZodLike; boolean(): ZodLike;
  enum(values: [string, ...string[]]): ZodLike; object(shape: Record<string, ZodLike>): ZodLike;
}
interface ContentPart { type: "text" | "image"; text?: string; data?: string; mimeType?: string }
interface ToolResult { content: ContentPart[]; details: Record<string, unknown>; isError?: boolean }
interface ToolDef {
  name: string; label: string; loadMode: string; defaultInactive: boolean; description: string;
  parameters: ZodLike; execute: (callId: unknown, params: Params, ...host: unknown[]) => Promise<ToolResult>;
}
interface PiApi { zod: PiZod; registerTool(def: ToolDef): void }

// The host calls execute(toolCallId, params, onUpdate, ctx, signal); ctx.sessionManager.getSessionId() is THE session.
// It is not a tool parameter: the agent cannot choose it. Without it the CLI refuses NO_SESSION for up/down/list.
function hostSessionId(host: unknown[]): string | undefined {
  for (const h of host) {
    const sm = (h as { sessionManager?: { getSessionId?: () => unknown } } | null)?.sessionManager;
    const id = typeof sm?.getSessionId === "function" ? sm.getSessionId() : undefined;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return undefined;
}

function argvFor(table: ActionTable, p: Params): string[] {
  const row = table.actions[String(p.verb)];
  const argv = [...row.argv];
  for (const f of row.flags) {
    const v = p[f];
    if (v === undefined || v === null || v === false) continue;
    if (v === true) argv.push(`--${f}`); else argv.push(`--${f}`, String(v));
  }
  return argv;
}

interface RunResult { code: number; out: string; err: string; truncated: boolean; timedOut: boolean }

// settles on EVERY exit path (close, spawn error, timeout); the CLI leads its own process group so a timeout signals the tree
function run(cli: string, argv: string[], session: string | undefined): Promise<RunResult> {
  const { promise, resolve: done } = Promise.withResolvers<RunResult>();
  const env = { ...process.env };
  if (session) env.CU_SESSION_ID = session; else delete env.CU_SESSION_ID;   // never inherit the host process's session id
  const c = spawn(cli, argv, { stdio: ["ignore", "pipe", "pipe"], detached: true, env });
  let out = "", err = "", settled = false, truncated = false, timedOut = false;
  let killTimer: ReturnType<typeof setTimeout> | null = null;
  const settle = (r: RunResult) => { if (settled) return; settled = true; clearTimeout(timer); done(r); };
  const killTree = (sig: NodeJS.Signals) => { try { process.kill(-(c.pid as number), sig); } catch { try { c.kill(sig); } catch { /* exited */ } } };
  const timer = setTimeout(() => {
    timedOut = true;
    killTree("SIGTERM");
    killTimer = setTimeout(() => killTree("SIGKILL"), 5000); killTimer.unref();
    settle({ code: 124, out: out.trim(), err: (err + `\nPLUTUS_BROWSER_RUN_TIMEOUT: no answer within ${RUN_TIMEOUT_MS}ms`).trim(), truncated, timedOut });
  }, RUN_TIMEOUT_MS);
  c.stdout.on("data", (d) => {
    const room = MAX_OUT_CHARS - out.length;
    if (room <= 0) { truncated = true; return; }
    const text = String(d);
    out += text.slice(0, room);
    if (text.length > room) truncated = true;
  });
  c.stderr.on("data", (d) => { err += String(d); if (err.length > MAX_ERR_CHARS) err = err.slice(-MAX_ERR_CHARS); });
  c.on("error", (e) => settle({ code: 127, out: out.trim(), err: `PLUTUS_BROWSER_SPAWN_FAILED: ${String(e?.message ?? e)} (CLI=${cli})`, truncated, timedOut }));
  c.on("close", (code) => { clearTimeout(killTimer ?? undefined); settle({ code: code ?? 1, out: out.trim(), err: err.trim(), truncated, timedOut }); });
  return promise;
}

// exit 0 promises ONE JSON object on stdout; anything else is the CLI breaking its contract -> null -> a named refusal
function parseDetails(out: string): Record<string, unknown> | null {
  try { const v = JSON.parse(out) as unknown; return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null; }
  catch { return null; }
}

// The frame path comes from the CLI's output, so it is an INPUT: attached only when it resolves inside the CLI's
// runtime dir ($XDG_RUNTIME_DIR/plutus-browser), opens O_NOFOLLOW as a regular file within the size bound, and starts
// with the PNG signature. Anything else: no image, and the reason is recorded in details.image_omitted.
function readFrame(path: string): { data: Buffer } | { why: string } {
  if (!process.env.XDG_RUNTIME_DIR) return { why: "XDG_RUNTIME_DIR is not set, so the runtime dir cannot be resolved" };
  let root: string, real: string;
  try { root = realpathSync(resolve(process.env.XDG_RUNTIME_DIR, "plutus-browser")); } catch (e) { return { why: `runtime dir: ${(e as Error).message}` }; }
  try { real = realpathSync(path); } catch (e) { return { why: (e as Error).message }; }
  if (!real.startsWith(root + sep)) return { why: `frame is outside ${root} (pass no --out to keep it inside)` };
  let fd = -1;
  try {
    fd = openSync(real, constants.O_RDONLY | constants.O_NOFOLLOW);
    const st = fstatSync(fd);
    if (!st.isFile()) return { why: "not a regular file" };
    if (st.size > MAX_IMAGE_BYTES) return { why: `larger than ${MAX_IMAGE_BYTES} bytes` };
    const buf = Buffer.alloc(st.size);
    let n = 0;
    while (n < st.size) { const r = readSync(fd, buf, n, st.size - n, n); if (r <= 0) break; n += r; }
    if (n !== st.size) return { why: "short read" };
    if (!buf.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) return { why: "not a PNG (bad signature)" };
    return { data: buf };
  } catch (e) {
    return { why: (e as Error).message };
  } finally {
    if (fd >= 0) closeSync(fd);
  }
}

const refused = (token: string, detail: string): ToolResult =>
  ({ content: [{ type: "text", text: `PLUTUS-BROWSER REFUSED ${token}: ${detail}` }], details: { ok: false, error: token, detail }, isError: true });

export default function plutusBrowserExtension(pi: PiApi): void {
  const CLI = installedCli();
  const TABLE = loadTable(CLI);
  const z = pi.zod;
  const shape: Record<string, ZodLike> = { verb: z.enum(Object.keys(TABLE.actions) as [string, ...string[]]) };
  for (const [k, spec] of Object.entries(TABLE.params)) {
    const base = spec.type === "number" ? z.number() : spec.type === "boolean" ? z.boolean() : z.string();
    shape[k] = base.optional().describe(spec.description);
  }
  pi.registerTool({
    name: "plutus_browser",
    label: "PLUTUS Browser",
    loadMode: "essential",
    defaultInactive: false,
    description:
      "The PLUTUS headed research browser (a separate tool from pinebox): one Electron window per instance on its own " +
      "background display, driven over a loopback control server. `up` brings an instance up (optionally at --url); " +
      "navigate/text/eval/images read a page that blocks headless browsers (investinglive FX option expiries, ForexFactory); " +
      "shot returns the window as an image. A refusal is a TOKEN (NO_SESSION, INSTANCE_LIVE, PORT_TAKEN:<port>, NOT_UP, " +
      "URL_SCHEME_REFUSED, EVAL_EMPTY ...): branch on it.",
    parameters: z.object(shape),
    execute: async (_callId: unknown, params: Params, ...host: unknown[]): Promise<ToolResult> => {
      const p: Params = (params && typeof params === "object" && !Array.isArray(params)) ? params : {};
      const verb = String(p.verb);
      if (!Object.prototype.hasOwnProperty.call(TABLE.actions, verb)) return refused("BAD_VERB", `unknown verb '${verb}'`);
      const allowed = new Set(TABLE.actions[verb].flags);
      const extra = Object.keys(p).filter((k) => k !== "verb" && p[k] !== undefined && p[k] !== null && !allowed.has(k));
      if (extra.length) return refused("BAD_ARGS", `'${extra.join("', '")}' not an argument of verb '${verb}' (it takes: ${[...allowed].join(", ") || "none"})`);
      let r: RunResult;
      try { r = await run(CLI, argvFor(TABLE, p), hostSessionId(host)); }
      catch (e) { return refused("PLUTUS_BROWSER_SPAWN_FAILED", String((e as Error).message ?? e).slice(0, 300)); }
      if (r.code !== 0) {
        const m = r.err.match(REFUSAL);
        if (m) return refused(m[1], m[2].trim().slice(0, 1500));
        return refused(r.timedOut ? "PLUTUS_BROWSER_RUN_TIMEOUT" : `CLI_EXIT_${r.code}`, (r.err || r.out).slice(0, 1500));
      }
      if (r.truncated) return refused("PLUTUS_BROWSER_OUTPUT_TRUNCATED", `stdout exceeded ${MAX_OUT_CHARS} characters; the first 2000 follow\n${r.out.slice(0, 2000)}`);
      const parsed = parseDetails(r.out);
      if (!parsed) return refused("CLI_CONTRACT_BROKEN", `exit 0 but stdout is not one JSON object: ${r.out.slice(0, 500)}`);
      let details: Record<string, unknown> = parsed;
      const content: ContentPart[] = [{ type: "text", text: r.out }];
      const frame = (details.data as { path?: unknown } | undefined)?.path;
      if (verb === "shot" && typeof frame === "string") {
        const img = readFrame(frame);
        if ("data" in img) content.push({ type: "image", data: img.data.toString("base64"), mimeType: "image/png" });
        else details = { ...details, image_omitted: img.why };
      }
      return { content, details };
    },
  });
  console.log(`[plutus-browser] registered plutus_browser (${Object.keys(TABLE.actions).length} verbs, CLI ${CLI})`);
}
