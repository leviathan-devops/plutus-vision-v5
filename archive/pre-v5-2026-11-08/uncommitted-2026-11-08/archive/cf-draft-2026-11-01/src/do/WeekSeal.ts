import { DurableObject } from "cloudflare:workers";

/** ONE WRITE PER (pair, week). The exactly-once point of the pipeline. */
export class WeekSeal extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS seal (k TEXT PRIMARY KEY, sha TEXT, body TEXT, at TEXT)`,
    );
  }

  async writeOnce(card: unknown): Promise<{ sha: string; created: boolean }> {
    const body = JSON.stringify(card);
    const sha = await crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(body))
      .then((b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""));

    const existing = this.ctx.storage.sql.exec<{ sha: string }>(`SELECT sha FROM seal WHERE k='card'`).toArray();
    const first = existing[0];
    if (first) return { sha: first.sha, created: false }; // refuse the second write

    this.ctx.storage.sql.exec(
      `INSERT INTO seal (k, sha, body, at) VALUES ('card', ?, ?, ?)`,
      sha,
      body,
      new Date().toISOString(),
    );
    return { sha, created: true };
  }

  async read(): Promise<{ sha: string; card: unknown } | null> {
    const rows = this.ctx.storage.sql
      .exec<{ sha: string; body: string }>(`SELECT sha, body FROM seal WHERE k='card'`)
      .toArray();
    const r = rows[0];
    return r ? { sha: r.sha, card: JSON.parse(r.body) as unknown } : null;
  }
}
