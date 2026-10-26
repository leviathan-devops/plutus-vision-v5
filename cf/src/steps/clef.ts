/**
 * THE ONLY DOOR TO CLEF.
 *
 * Request  (schema-input.json):  { model:"clef", state, questions:{ <id>: {type,instructions,criteria} } }
 * Response (schema-output.json): { model, answers:{ <id>: {type, noul | score | choice+probabilities} }, usage }
 *
 * Laws enforced here, not advised:
 *   evidence in state, standard in instructions   -> every `requires` path must resolve
 *   Clef truncates long state silently             -> state over STATE_TOKEN_CAP is refused
 *   one question per item                          -> perItem() expands templates by item id
 *   no substitute for a missing answer             -> answer() throws E_ANSWER_MISSING
 *   no substitute for an unavailable judge         -> CLEF_UNAVAILABLE refusal
 */
import { Fatal, Refusal } from "./errors";
import { at, isRec, num, str } from "./guards";

export { Fatal, Refusal } from "./errors";

export type Primitive = "noul" | "choice" | "score";

export interface Question {
  id: string;
  type: Primitive;
  instructions: string | Record<string, unknown>;
  criteria?: Record<string, string> | string[];
  requires: string[];
}

export interface Policy {
  act: number;
  flag: number;
  perQuestion: Record<string, number>;
  source: string;
  rows: number;
}

export interface Answer {
  type: Primitive;
  value: number;
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
}

export const CLEF_MODEL = "@cf/cloudflare/clef";
export const MAX_QUESTIONS = 64;
export const STATE_TOKEN_CAP = 48_000;

/** Workers AI's generic run() does not model per-model payloads; this is the one typed seam. */
export async function runModel(env: Env, model: string, input: unknown): Promise<unknown> {
  const ai = env.AI as unknown as { run(m: string, i: unknown): Promise<unknown> };
  return ai.run(model, input);
}

export function resolvePath(state: unknown, path: string): boolean {
  const parts = path.split(".");
  const head = parts[0];
  if (head === undefined || head === "") return false;
  const isArr = head.endsWith("[]");
  const key = isArr ? head.slice(0, -2) : head;
  const rest = parts.slice(1).join(".");
  if (!isRec(state)) return false;
  const v = state[key];
  if (v === undefined || v === null) return false;
  if (!isArr) return rest ? resolvePath(v, rest) : true;
  if (!Array.isArray(v) || v.length === 0) return false;
  if (!rest) return true;
  return v.every((item) => resolvePath(item, rest));
}

export const tokens = (o: unknown): number => Math.ceil(JSON.stringify(o).length / 4);

/** One question per (item, template). Each question carries its own subject. */
export function perItem<T extends { id: string }>(
  templates: Question[],
  items: T[],
  subject: (item: T) => Record<string, unknown>,
): Question[] {
  const out: Question[] = [];
  for (const item of items)
    for (const t of templates)
      out.push({
        ...t,
        id: `${item.id}.${t.id}`,
        instructions: { question: t.instructions, subject: subject(item) },
      });
  return out;
}

export async function ask(
  env: Env,
  run: string,
  stage: string,
  version: string,
  state: object,
  questions: Question[],
  policy: Policy,
): Promise<Record<string, Answer>> {
  for (const q of questions)
    for (const p of q.requires)
      if (!resolvePath(state, p)) throw new Fatal("E_STATE_INCOMPLETE", { stage, q: q.id, path: p });
  const t = tokens(state);
  if (t > STATE_TOKEN_CAP) throw new Fatal("E_STATE_OVER_CAP", { stage, tokens: t, cap: STATE_TOKEN_CAP });

  if (questions.length < 1 || questions.length > MAX_QUESTIONS)
    throw new Fatal("E_QUESTION_COUNT", { stage, n: questions.length });
  for (const q of questions) {
    if (q.type === "choice") {
      const n = q.criteria && !Array.isArray(q.criteria) ? Object.keys(q.criteria).length : 0;
      if (n < 2 || n > 255) throw new Fatal("E_CHOICE_OPTIONS", { q: q.id, n });
    }
    if (q.type === "score") {
      const n = Array.isArray(q.criteria) ? q.criteria.length : 0;
      if (n < 2 || n > 10) throw new Fatal("E_SCORE_LEVELS", { q: q.id, n });
    }
    const text = typeof q.instructions === "string" ? q.instructions : str(q.instructions.question);
    if (text === undefined) throw new Fatal("E_QUESTION_TEXT", { q: q.id });
    if (text.split(/\s+/).length > 60) throw new Fatal("E_QUESTION_TOO_LONG", { q: q.id });
  }

  const payload = {
    model: "clef",
    state,
    questions: Object.fromEntries(
      questions.map((q) => [q.id, { type: q.type, instructions: q.instructions, criteria: q.criteria }]),
    ),
  };
  const fp = await sha256([CLEF_MODEL, `${stage}@${version}`, canonical(payload)].join("\u0000"));
  const ledger = env.LEDGER.getByName(run);
  const t0 = Date.now();

  let raw: unknown;
  try {
    raw = await runModel(env, CLEF_MODEL, payload);
  } catch (e) {
    await ledger.append({
      ts: new Date().toISOString(), run, stage, stage_version: version, model: CLEF_MODEL,
      fingerprint: fp, answers: {}, policy, route: "refused", route_reason: "CLEF_UNAVAILABLE",
      latency_ms: Date.now() - t0,
    });
    throw new Refusal(
      "CLEF_UNAVAILABLE",
      "confirm the AI binding in wrangler.jsonc and the model id @cf/cloudflare/clef, then retry the step",
      { stage, cause: String(e) },
    );
  }

  const answers = parseAnswers(raw, questions);
  const vals = Object.values(answers).map((a) => a.value);
  if (vals.length >= 10 && new Set(vals.map((v) => Math.round(v * 1000))).size === 1)
    throw new Fatal("E_JUDGE_CONSTANT", { stage, n: vals.length, value: vals[0] });

  await ledger.append({
    ts: new Date().toISOString(), run, stage, stage_version: version, model: CLEF_MODEL,
    fingerprint: fp, answers, policy, route: "answered",
    route_reason: `min=${Math.min(...vals)}`, latency_ms: Date.now() - t0,
  });
  return answers;
}

export function parseAnswers(raw: unknown, questions: Question[]): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  for (const q of questions) {
    const node = at(raw, "answers", q.id);
    if (!isRec(node)) throw new Fatal("E_JUDGE_MALFORMED", { q: q.id, why: "answer absent" });
    if (node.type !== q.type) throw new Fatal("E_JUDGE_MALFORMED", { q: q.id, want: q.type, got: node.type });
    if (q.type === "noul") {
      const v = num(node.noul);
      if (v === undefined || v < 0 || v > 1) throw new Fatal("E_JUDGE_MALFORMED", { q: q.id, noul: node.noul });
      out[q.id] = { type: "noul", value: v };
    } else if (q.type === "score") {
      const v = num(node.score);
      const levels = Array.isArray(q.criteria) ? q.criteria.length : 0;
      if (v === undefined || v < 0 || v > levels - 1)
        throw new Fatal("E_JUDGE_MALFORMED", { q: q.id, score: node.score, levels });
      out[q.id] = { type: "score", value: v };
    } else {
      const choice = str(node.choice);
      const conf = num(node.confidence);
      const probs = isRec(node.probabilities) ? node.probabilities : undefined;
      if (choice === undefined || conf === undefined || probs === undefined)
        throw new Fatal("E_JUDGE_MALFORMED", { q: q.id, why: "choice fields absent" });
      const p: Record<string, number> = {};
      for (const [k, x] of Object.entries(probs)) {
        const n = num(x);
        if (n === undefined) throw new Fatal("E_JUDGE_MALFORMED", { q: q.id, option: k });
        p[k] = n;
      }
      const sum = Object.values(p).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 1e-3) throw new Fatal("E_JUDGE_MALFORMED", { q: q.id, sum });
      out[q.id] = { type: "choice", value: conf, choice, probabilities: p, confidence: conf };
    }
  }
  return out;
}

/** The only way an engine reads an answer. Absent is fatal, never a default. */
export function answer(answers: Record<string, Answer>, id: string): number {
  const a = answers[id];
  if (a === undefined) throw new Fatal("E_ANSWER_MISSING", { id });
  return a.value;
}

/** THE WEAKEST CLAUSE. Never a mean. */
export function decide(clauses: Record<string, number>, policy: Policy) {
  const entries = Object.entries(clauses);
  if (entries.length === 0) throw new Fatal("E_NO_CLAUSES", {});
  const failing = entries
    .filter(([id, p]) => p < (id in policy.perQuestion ? (policy.perQuestion[id] as number) : policy.act))
    .sort((a, b) => a[1] - b[1]);
  const overall = Math.min(...entries.map(([, p]) => p));
  const first = failing[0];
  if (first === undefined) return { kind: "ALLOW" as const, overall, weakest: "" };
  if (overall >= policy.flag) return { kind: "ESCALATE" as const, overall, weakest: first[0] };
  return { kind: "DENY" as const, overall, weakest: first[0] };
}

export function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const r = o as Record<string, unknown>;
  return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
}

export async function sha256(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
