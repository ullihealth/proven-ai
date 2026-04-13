/**
 * GET /api/jeffs-picks
 *
 * Public read-only endpoint. Returns all Jeff's Picks grouped by category.
 * No authentication required.
 */

import { JSON_HEADERS } from "../admin/lessons/_helpers";
import type { LessonApiEnv } from "../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

type PickRow = { tool_id: string; category: string; sort_order: number };

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ env }) => {
  try {
    const db = env.PROVENAI_DB;
    const { results } = await db
      .prepare("SELECT tool_id, category, sort_order FROM jeffs_picks ORDER BY category, sort_order, added_at")
      .all<PickRow>();

    const map = new Map<string, string[]>();
    for (const row of results ?? []) {
      if (!map.has(row.category)) map.set(row.category, []);
      map.get(row.category)!.push(row.tool_id);
    }
    const picks = Array.from(map.entries()).map(([category, tools]) => ({ category, tools }));

    return new Response(
      JSON.stringify({ success: true, picks }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
