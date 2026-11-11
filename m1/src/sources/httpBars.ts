// httpBars.ts - the HTTP RangeBarSource (BUILD_WORKFLOW P1.TURN-01).
// Filesystem behavior stays behind fsSource (m1/src/fs-source.ts); this module is the
// Worker-shaped HTTP reader over the same bar layout with an injected fetch. Every row is
// validated (integer strictly-increasing times, finite OHLC, high/low shape); a missing bar
// is never fabricated - a short or failed fetch refuses with E1_BAR_SOURCE_FAILED.
import { validateBars, type Asset, type Bar, type BarTf, type RangeBarSource } from '../bars';

/** Minimal fetch surface: status + parsed JSON. Inject the platform fetch (or a stub in checks). */
export type FetchFn = (url: string) => Promise<{ status: number; json(): Promise<unknown> }>;

export interface HttpBarsConfig {
  /** Bar endpoint root, e.g. https://pinebox.local/api/bars */
  endpoint: string;
  fetchFn: FetchFn;
}

export function buildBarUrl(endpoint: string, asset: Asset, tf: BarTf, from: number, to: number): string {
  return `${endpoint}?asset=${encodeURIComponent(asset)}&tf=${encodeURIComponent(tf)}&from=${from}&to=${to}`;
}

/** HTTP range source. Refuses E1_BAR_SOURCE_FAILED on non-200, non-array, non-monotonic
 *  times, or OHLC shape violations. Never fabricates a missing bar. */
export function httpBars(config: HttpBarsConfig): RangeBarSource {
  return {
    load: async (asset: Asset, tf: BarTf, from: number, to: number): Promise<Bar[]> => {
      const url = buildBarUrl(config.endpoint, asset, tf, from, to);
      let res: { status: number; json(): Promise<unknown> };
      try {
        res = await config.fetchFn(url);
      } catch (e) {
        throw new Error(`E1_BAR_SOURCE_FAILED: GET ${url} threw (${(e as Error).message}) - the bar endpoint is unreachable; fetch the month or run for a covered week, never fabricate bars`);
      }
      if (res.status !== 200)
        throw new Error(`E1_BAR_SOURCE_FAILED: GET ${url} -> status ${res.status} (need 200) - the bar endpoint refused; fix the endpoint, never fabricate bars`);
      const rows = (await res.json()) as unknown;
      return validateBars(rows as Bar[], `${asset}/${tf} [${from},${to})`);
    },
  };
}
