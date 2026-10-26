/**
 * The two failure types. There is no third: no default, no substitute, no empty result
 * standing in for a missing one.
 *
 *   Fatal    the input violated an invariant the engine enforces (a value is wrong)
 *   Refusal  a dependency the engine needs is unavailable (a value cannot be obtained)
 */
export class Fatal extends Error {
  constructor(
    public code: string,
    public detail: Record<string, unknown> = {},
  ) {
    super(`${code}: ${JSON.stringify(detail)}`);
  }
}

export class Refusal extends Error {
  constructor(
    public code: string,
    public remedy: string,
    public detail: Record<string, unknown> = {},
  ) {
    super(`${code}: ${JSON.stringify(detail)} - ${remedy}`);
  }
}

/** Total indexing: an out-of-range read is an invariant violation, never a zero. */
export function must<T>(v: T | undefined, code: string, detail: Record<string, unknown> = {}): T {
  if (v === undefined) throw new Fatal(code, detail);
  return v;
}
