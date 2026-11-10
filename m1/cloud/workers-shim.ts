// bun-runtime shim for 'cloudflare:workers' (tsconfig paths maps the module here for local
// checks; wrangler's esbuild ignores tsconfig paths and bundles the REAL runtime module).
export class DurableObject<Env = unknown> {
  constructor(_ctx: unknown, _env: Env) {}
}
