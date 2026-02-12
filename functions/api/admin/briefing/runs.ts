/**
 * GET /api/admin/briefing/runs  – return recent run history
 *
 * Query: ?limit=5  (default 5, max 20)
 */

import type { BriefingEnv, BriefingRun } from "../../briefing/_helpers";
import { isAdminRequest } from "../../briefing/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  if (!isAdminRequest(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = env.PROVENAI_DB;
    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "5", 10) || 5,
      20
    );

    const { results } = await db
      .prepare("SELECT * FROM briefing_runs ORDER BY started_at DESC LIMIT ?")
      .bind(limit)
      .all<BriefingRun>();

    return new Response(JSON.stringify({ runs: results || [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
