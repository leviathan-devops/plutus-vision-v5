/**
 * The exact Cloudflare surface this Worker uses, declared locally.
 * Rationale: @cloudflare/workers-types could not be installed in this sandbox
 * (registry unreachable), and the alternative — `any` at the boundary — is banned.
 * Every declaration below mirrors the documented shape of the binding we call.
 */

declare module "cloudflare:workers" {
  export class DurableObject<Env = unknown> {
    protected ctx: DurableObjectState;
    protected env: Env;
    constructor(ctx: DurableObjectState, env: Env);
  }
  export class WorkflowEntrypoint<Env = unknown, Params = unknown> {
    protected ctx: ExecutionContext;
    protected env: Env;
    constructor(ctx: ExecutionContext, env: Env);
    run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<unknown>;
  }
  export interface WorkflowEvent<T> {
    payload: T;
    instanceId: string;
    timestamp: Date;
  }
  export interface RetryConfig {
    retries?: { limit: number; delay?: string; backoff?: "constant" | "linear" | "exponential" };
  }
  export interface WorkflowStep {
    do<T>(name: string, fn: () => Promise<T>): Promise<T>;
    do<T>(name: string, config: RetryConfig, fn: () => Promise<T>): Promise<T>;
    sleep(name: string, duration: string): Promise<void>;
  }
}

interface DurableObjectState {
  storage: {
    sql: {
      exec<T = Record<string, unknown>>(query: string, ...bindings: unknown[]): {
        toArray(): T[];
        one(): T;
      };
    };
  };
  blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T>;
}

interface DurableObjectNamespace {
  getByName(name: string): DurableObjectStub;
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectStub {
  append(row: Record<string, unknown>): Promise<void>;
  rows(run: string): Promise<unknown[]>;
  writeOnce(card: unknown): Promise<{ sha: string; created: boolean }>;
  read(): Promise<{ sha: string; card: unknown } | null>;
}

interface Ai {
  run(model: string, input: unknown): Promise<unknown>;
}

interface Fetcher {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | Uint8Array | string): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
}

interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

interface D1Database {
  prepare(query: string): D1Stmt;
  exec(query: string): Promise<unknown>;
}

interface Workflow {
  create(options?: { id?: string; params?: unknown }): Promise<{ id: string }>;
  get(id: string): Promise<{ status(): Promise<unknown> }>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ExportedHandler<EnvType> {
  fetch(request: Request, env: EnvType, ctx?: ExecutionContext): Promise<Response>;
}

declare module "@cloudflare/puppeteer" {
  interface HTTPResponse { ok(): boolean; status(): number; }
  interface ElementHandle { screenshot(o: { type: "png" }): Promise<Uint8Array | ArrayBuffer>; }
  interface Page {
    setViewport(v: { width: number; height: number; deviceScaleFactor?: number }): Promise<void>;
    goto(url: string, o?: { waitUntil?: string; timeout?: number }): Promise<HTTPResponse | null>;
    waitForSelector(sel: string, o?: { timeout?: number }): Promise<ElementHandle | null>;
  }
  interface Browser { newPage(): Promise<Page>; close(): Promise<void>; }
  const puppeteer: { launch(binding: Fetcher): Promise<Browser> };
  export default puppeteer;
}
