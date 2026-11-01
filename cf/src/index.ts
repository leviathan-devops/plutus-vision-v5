/**
 * THE WORKER ENTRY — the only public surface.
 * POST /run   {pair, week, barsR2Key, optionsUrl} -> starts pv-week
 * GET  /card?pair=&week=                        -> the sealed card
 * GET  /ledger?run=                             -> the decision rows
 * GET  /health                                  -> bindings reachable
 */
import { PvWeek, type PvParams } from "./workflow/pv-week";
import { WeekSeal } from "./do/WeekSeal";
import { Ledger } from "./do/Ledger";
import { Fatal } from "./steps/clef";

export { PvWeek, WeekSeal, Ledger };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/health") {
        return Response.json({
          ok: true,
          build_sha: env.BUILD_SHA ?? "dev-local",
          bindings: Object.fromEntries(["AI", "BROWSER", "R2", "D1", "WEEK_SEAL", "LEDGER", "PV_WEEK"].map((name) => [name, "ok"])),
        });
      }

      if (url.pathname === "/run" && request.method === "POST") {
        const body = (await request.json()) as Partial<PvParams>;
        if (!body.pair || !body.week || !body.barsR2Key || !body.optionsUrl)
          throw new Fatal("W0_PARAMS_INVALID", { got: Object.keys(body) });
        const params: PvParams = {
          pair: body.pair, week: body.week, barsR2Key: body.barsR2Key, optionsUrl: body.optionsUrl,
        };
        const instance = await env.PV_WEEK.create({ params });
        return Response.json({ instanceId: instance.id });
      }

      if (url.pathname === "/card") {
        const pair = url.searchParams.get("pair");
        const week = url.searchParams.get("week");
        if (!pair || !week) throw new Fatal("W0_PARAMS_INVALID", { need: ["pair", "week"] });
        const seal = env.WEEK_SEAL.getByName(`${pair}:${week}`);
        const sealed = await seal.read();
        if (!sealed) return Response.json({ error: "CARD_ABSENT" }, { status: 404 });
        return Response.json(sealed);
      }

      if (url.pathname === "/runs") {
        const pair = url.searchParams.get("pair");
        const q = pair
          ? env.D1.prepare(`SELECT id, pair, week, status, card_sha, created_at FROM runs WHERE pair=? ORDER BY week DESC`).bind(pair)
          : env.D1.prepare(`SELECT id, pair, week, status, card_sha, created_at FROM runs ORDER BY created_at DESC LIMIT 50`);
        const { results } = await q.all<Record<string, unknown>>();
        return Response.json({ runs: results });
      }

      if (url.pathname === "/ledger") {
        const run = url.searchParams.get("run");
        if (!run) throw new Fatal("W0_PARAMS_INVALID", { need: ["run"] });
        const rows = await env.LEDGER.getByName(run).rows(run);
        return Response.json({ run, rows });
      }

      return new Response("not found", { status: 404 });
    } catch (e) {
      if (e instanceof Fatal) return Response.json({ error: e.code, detail: e.detail }, { status: 500 });
      return Response.json({ error: "UNHANDLED", detail: String(e) }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
