/** Runtime narrowing for untrusted boundaries. No `any`, no bare casts. */
export type Rec = Record<string, unknown>;

export function isRec(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export function arr(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined;
}

export function at(o: unknown, ...path: string[]): unknown {
  let cur: unknown = o;
  for (const k of path) {
    if (!isRec(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}

export function need<T>(v: T | undefined, code: string, detail: Record<string, unknown> = {}): T {
  if (v === undefined) throw new Error(`${code}: ${JSON.stringify(detail)}`);
  return v;
}
