// index.ts - the OMP surface for PINEBOX. A THIN FORWARDER (blueprint section 9).
//
// It reads PLUTUS_VISION/scripts/pinebox/actions.json, turns a tool call into `pinebox` argv,
// runs the CLI and returns its JSON. It implements no verb: a fix in the CLI is a fix here.
// For `shot` it attaches the captured frame as an IMAGE part so the pixels enter the agent's
// context in the same call (vision in the loop).
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

const PINEBOX_DIR = process.env.PINEBOX_DIR
  ?? resolve(homedir(), "JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/scripts/pinebox");
const CLI = process.env.PINEBOX_CLI ?? resolve(PINEBOX_DIR, "pinebox");

interface ParamSpec { type: "string" | "number" | "boolean"; description: string }
interface ActionRow { argv: string[]; flags: string[] }
interface ActionTable { version: string; params: Record<string, ParamSpec>; actions: Record<string, ActionRow> }
const TABLE = JSON.parse(readFileSync(resolve(PINEBOX_DIR, "actions.json"), "utf8")) as ActionTable;

type Params = Record<string, unknown>;

// The slice of the host's `pi` object this file uses (the host ships no types for it).
interface ZodLike { optional(): ZodLike; describe(text: string): ZodLike }
interface PiZod {
  string(): ZodLike; number(): ZodLike; boolean(): ZodLike;
  enum(values: [string, ...string[]]): ZodLike; object(shape: Record<string, ZodLike>): ZodLike;
}
interface ContentPart { type: "text" | "image"; text?: string; data?: string; mimeType?: string }
interface ToolResult { content: ContentPart[]; details: Record<string, unknown>; isError?: boolean }
interface ToolDef {
  name: string; label: string; loadMode: string; defaultInactive: boolean; description: string;
  parameters: ZodLike; execute: (callId: unknown, params: Params) => Promise<ToolResult>;
}
interface PiApi { zod: PiZod; registerTool(def: ToolDef): void }

function argvFor(p: Params): string[] | null {
  const row = TABLE.actions[String(p.verb)];
  if (!row) return null;
  const argv = [...row.argv];
  for (const f of row.flags) {
    // the table's `action` flag is drive's computer-use verb; the tool names it drive_action
    const v = f === "action" ? p.drive_action : p[f];
    if (v === undefined || v === null || v === false) continue;
    if (v === true) argv.push(`--${f}`); else argv.push(`--${f}`, String(v));
  }
  return argv;
}

interface RunResult { code: number; out: string; err: string }
function run(argv: string[]): Promise<RunResult> {
  const { promise, resolve: done } = Promise.withResolvers<RunResult>();
  const c = spawn(CLI, argv, { stdio: ["ignore", "pipe", "pipe"] });
  let out = "", err = "";
  c.stdout.on("data", (d) => (out += d));
  c.stderr.on("data", (d) => (err += d));
  c.on("close", (code) => done({ code: code ?? 1, out: out.trim(), err: err.trim() }));
  return promise;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export default function pineboxExtension(pi: PiApi): void {
  const z = pi.zod;
  const shape: Record<string, ZodLike> = { verb: z.enum(Object.keys(TABLE.actions) as [string, ...string[]]) };
  for (const [k, spec] of Object.entries(TABLE.params)) {
    const base = spec.type === "number" ? z.number() : spec.type === "boolean" ? z.boolean() : z.string();
    shape[k === "action" ? "drive_action" : k] = base.optional().describe(spec.description);
  }
  pi.registerTool({
    name: "pinebox",
    label: "PineBox",
    loadMode: "essential",
    defaultInactive: false,
    description:
      "The Pine IDE as a self-contained, multi-instance agent computer. `up` brings an instance up " +
      "(a headed window that stays in the background, three services on a port block derived from " +
      "the id, the IDE served with that instance's own ports, a verified frame); shot/load/drive " +
      "act on it in-process over CDP and never raise a window. A refusal is a TOKEN " +
      "(PORT_TAKEN:<port>, INSTANCE_LIVE, CONFIG_BLOCK_ABSENT, FOCUS_STOLEN ...): branch on it.",
    parameters: z.object(shape),
    execute: async (callId: unknown, params: Params): Promise<ToolResult> => {
      const p: Params = (callId && typeof callId === "object" && "verb" in callId) ? (callId as Params) : (params ?? {});
      const argv = argvFor(p);
      if (!argv) {
        return { content: [{ type: "text", text: `PINEBOX REFUSED BAD_VERB: unknown verb '${String(p.verb)}'` }], details: { ok: false, error: "BAD_VERB" }, isError: true };
      }
      const r = await run(argv);
      if (r.code !== 0) {
        const m = r.err.match(/REFUSED\s+([A-Za-z_:0-9]+)\s+—\s+([\s\S]*)/);
        const token = m ? m[1] : "FAILED", detail = m ? (m[2].split("\n")[0] ?? "").trim() : (r.err || r.out);
        return { content: [{ type: "text", text: `PINEBOX REFUSED ${token}: ${detail}` }], details: { ok: false, error: token, detail }, isError: true };
      }
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(r.out.split("\n").pop() ?? "{}") as Record<string, unknown>; } catch { /* text */ }
      const content: ContentPart[] = [{ type: "text", text: r.out }];
      const frame = (details.path ?? (details.frame as { path?: string } | undefined)?.path);
      if ((p.verb === "shot" || p.verb === "up" || p.verb === "load") && typeof frame === "string") {
        try {
          if (statSync(frame).size <= MAX_IMAGE_BYTES) content.push({ type: "image", data: readFileSync(frame).toString("base64"), mimeType: "image/png" });
        } catch { /* the path is in the text part either way */ }
      }
      return { content, details };
    },
  });
  console.log("[pinebox] registered pinebox");
}
