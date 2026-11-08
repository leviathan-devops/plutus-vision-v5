// index.ts - the OMP surface for computer-use v2. A THIN FORWARDER (blueprint section 10).
//
// It reads core/actions.json, turns a tool call into CLI argv, runs `computer`, and returns
// the core's own JSON. It implements no action: a bug fixed in core/ is fixed here at once.
// For `screenshot` it also attaches the captured frame as an IMAGE part, so the pixels enter
// the agent's context in the same call (the vision-in-the-loop requirement).
//
// Registration contract (measured from v1 and the host): a default-exported function that
// calls pi.registerTool({ name, label, description, parameters, execute(callId, params) }),
// execute returning { content:[{type:"text",text}], details, isError? }.
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = process.env.CU_CLI ?? resolve(HERE, "computer");

// the shared action table: one row per action, the only place argv is described
interface ActionRow { argv: string[]; flags: string[]; tail?: string }
interface ParamSpec { type: "string" | "number" | "boolean" | "array"; description: string }
interface ActionTable { version: string; params: Record<string, ParamSpec>; actions: Record<string, ActionRow> }
const TABLE = JSON.parse(readFileSync(resolve(HERE, "core", "actions.json"), "utf8")) as ActionTable;

type Params = Record<string, unknown>;

// The slice of the host's `pi` object this file uses. The host does not ship types for it,
// so the structural contract is stated here rather than silenced with `any`.
interface ZodLike { optional(): ZodLike; describe(text: string): ZodLike }
interface PiZod {
  string(): ZodLike; number(): ZodLike; boolean(): ZodLike;
  array(item: ZodLike): ZodLike; enum(values: [string, ...string[]]): ZodLike;
  object(shape: Record<string, ZodLike>): ZodLike;
}
interface ContentPart { type: "text" | "image"; text?: string; data?: string; mimeType?: string }
interface ToolResult { content: ContentPart[]; details: Record<string, unknown>; isError?: boolean }
interface ToolDef {
  name: string; label: string; loadMode: string; defaultInactive: boolean; description: string;
  parameters: ZodLike; execute: (callId: unknown, params: Params) => Promise<ToolResult>;
}
interface PiApi { zod: PiZod; registerTool(def: ToolDef): void }

function argvFor(params: Params): string[] | null {
  const row = TABLE.actions[String(params.action)];
  if (!row) return null;
  const argv = [...row.argv];
  for (const f of row.flags) {
    const v = params[f];
    if (v === undefined || v === null || v === false) continue;
    const flag = "--" + f.replace(/_/g, "-");
    if (v === true) argv.push(flag);
    else argv.push(flag, String(v));
  }
  if (row.tail) {
    const tail = params[row.tail];
    if (Array.isArray(tail) && tail.length) argv.push("--", ...tail.map(String));
  }
  return argv;
}

interface RunResult { code: number; out: string; err: string }

function run(argv: string[]): Promise<RunResult> {
  const { promise, resolve: done } = Promise.withResolvers<RunResult>();
  const p = spawn(CLI, argv, { stdio: ["ignore", "pipe", "pipe"] });
  let out = "", err = "";
  p.stdout.on("data", (d) => (out += d));
  p.stderr.on("data", (d) => (err += d));
  p.on("close", (code) => done({ code: code ?? 1, out: out.trim(), err: err.trim() }));
  return promise;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export default function computerUseV2(pi: PiApi): void {
  const z = pi.zod;
  // one optional field per entry of the shared param table; the action enum comes from it too
  const shape: Record<string, ZodLike> = { action: z.enum(Object.keys(TABLE.actions) as [string, ...string[]]) };
  for (const [k, spec] of Object.entries(TABLE.params)) {
    const base = spec.type === "number" ? z.number()
      : spec.type === "boolean" ? z.boolean()
      : spec.type === "array" ? z.array(z.string())
      : z.string();
    shape[k] = base.optional().describe(spec.description);
  }

  pi.registerTool({
    name: "computer",
    label: "Computer",
    loadMode: "essential",
    defaultInactive: false,
    description:
      "A self-contained Linux computer: a headed display, a terminal and a scoped filesystem. " +
      "shell_up creates a display that ANSWERS (probed, not assumed); shell_spawn launches an " +
      "app INTO it; focus/click/type/key/screenshot act on it without ever raising a window, so " +
      "the operator's focus is never stolen - proven per call by reading the focused window and " +
      "the top of the stack before and after. A refusal is a TOKEN (INSTANCE_LIVE, FOCUS_STOLEN, " +
      "ACTIVATE_FORBIDDEN, WINDOW_GONE, NO_PAGE, PORT_TAKEN ...): branch on it.",
    parameters: z.object(shape),
    execute: async (callId: unknown, params: Params): Promise<ToolResult> => {
      // the host calls execute(callId, params); a lone params object is tolerated as v1 does
      const p: Params = (callId && typeof callId === "object" && "action" in callId) ? (callId as Params) : (params ?? {});
      const argv = argvFor(p);
      if (!argv) {
        return { content: [{ type: "text", text: `COMPUTER REFUSED BAD_ACTION: unknown action '${String(p.action)}'` }],
                 details: { ok: false, error: "BAD_ACTION" }, isError: true };
      }
      const r = await run(argv);
      if (r.code !== 0) {
        const m = r.err.match(/REFUSED\s+([A-Z_]+)\s+—\s+([\s\S]*)/);
        const token = m ? m[1] : "FAILED", detail = m ? m[2].trim() : (r.err || r.out);
        return { content: [{ type: "text", text: `COMPUTER REFUSED ${token}: ${detail}` }],
                 details: { ok: false, error: token, detail }, isError: true };
      }
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(r.out) as Record<string, unknown>; } catch { /* the core printed text */ }
      const content: ContentPart[] = [{ type: "text", text: r.out }];
      const shot = details.path;
      if (p.action === "screenshot" && typeof shot === "string") {
        try {
          if (statSync(shot).size <= MAX_IMAGE_BYTES) {
            content.push({ type: "image", data: readFileSync(shot).toString("base64"), mimeType: "image/png" });
          }
        } catch { /* the path is in the text part either way */ }
      }
      return { content, details };
    },
  });
  console.log("[computer-use-v2] registered computer");
}
