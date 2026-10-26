import { DurableObject } from "cloudflare:workers";
import { Fatal } from "../steps/errors";

/** One ledger row. Every field is required; a row with a hole is refused, never padded. */
export interface LedgerRow {
  ts: string;
  run: string;
  stage: string;
  stage_version: string;
  model: string;
  fingerprint: string;
  answers: unknown;
  policy: unknown;
  route: "answered" | "refused";
  route_reason: string;
  latency_ms: number;
}

const REQUIRED: (keyof LedgerRow)[] = [
  "ts", "run", "stage", "stage_version", "model", "fingerprint",
  "answers", "policy", "route", "route_reason", "latency_ms",
];

/** THE LEDGER: one row per model call, written inside ask(), never by the caller. */
export class Ledger extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS rows (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         ts TEXT NOT NULL, run TEXT NOT NULL, stage TEXT NOT NULL, stage_version TEXT NOT NULL,
         model TEXT NOT NULL, fingerprint TEXT NOT NULL, answers TEXT NOT NULL, policy TEXT NOT NULL,
         route TEXT NOT NULL, route_reason TEXT NOT NULL, latency_ms INTEGER NOT NULL,
         later_truth TEXT)`,
    );
  }

  async append(row: LedgerRow): Promise<void> {
    for (const k of REQUIRED)
      if (row[k] === undefined || row[k] === null) throw new Fatal("LEDGER_ROW_INCOMPLETE", { field: k });
    if (!Number.isFinite(row.latency_ms)) throw new Fatal("LEDGER_ROW_INVALID", { field: "latency_ms" });
    this.ctx.storage.sql.exec(
      `INSERT INTO rows (ts, run, stage, stage_version, model, fingerprint, answers, policy,
         route, route_reason, latency_ms) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      row.ts, row.run, row.stage, row.stage_version, row.model, row.fingerprint,
      JSON.stringify(row.answers), JSON.stringify(row.policy),
      row.route, row.route_reason, row.latency_ms,
    );
  }

  async rows(run: string): Promise<unknown[]> {
    return this.ctx.storage.sql.exec(`SELECT * FROM rows WHERE run=? ORDER BY id`, run).toArray();
  }
}
