/** The binding surface. Every name here exists in wrangler.jsonc. */
interface Env {
  AI: Ai;
  BROWSER: Fetcher;
  R2: R2Bucket;
  D1: D1Database;
  WEEK_SEAL: DurableObjectNamespace;
  LEDGER: DurableObjectNamespace;
  PV_WEEK: Workflow;
}
