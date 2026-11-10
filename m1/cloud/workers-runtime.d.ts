// ambient Workers runtime types for the cloud surface (tsc-only; wrangler provides the real module)
declare module 'cloudflare:workers' {
  export class DurableObject<Env = unknown> {
    constructor(ctx: DurableObjectState, env: Env);
  }
  interface DurableObjectState { id: { name: string }; storage: { get(key: string): Promise<unknown>; put(key: string, value: unknown): Promise<void> }; }
}
