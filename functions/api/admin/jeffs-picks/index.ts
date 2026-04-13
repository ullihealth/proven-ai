/**
 * Admin Jeff's Picks API
 *
 * GET    /api/admin/jeffs-picks  — returns all picks grouped by category
 * POST   /api/admin/jeffs-picks  — adds a pick { tool_id, category }
 * DELETE /api/admin/jeffs-picks  — removes a pick { tool_id, category }
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

type PickRow = { tool_id: string; category: string; sort_order: number };

function groupByCategory(rows: PickRow[]): { category: string; tools: string[] }[] {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    if (!map.has(row.category)) map.set(row.category, []);
    map.get(row.category)!.push(row.tool_id);
  }
  return Array.from(map.entries()).map(([category, tools]) => ({ category, tools }));
}

// GET — return all picks grouped by category
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare("SELECT tool_id, category, sort_order FROM jeffs_picks ORDER BY category, sort_order, added_at")
    .all<PickRow>();

  return new Response(
    JSON.stringify({ success: true, picks: groupByCategory(results ?? []) }),
    { headers: JSON_HEADERS }
  );
};

// POST — insert a pick (INSERT OR IGNORE to handle duplicates gracefully)
export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { tool_id?: string; category?: string };
  if (!body.tool_id || !body.category) {
    return new Response(
      JSON.stringify({ success: false, error: "tool_id and category are required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;
  await db
    .prepare("INSERT OR IGNORE INTO jeffs_picks (tool_id, category) VALUES (?, ?)")
    .bind(body.tool_id, body.category)
    .run();

  return new Response(
    JSON.stringify({ success: true }),
    { headers: JSON_HEADERS }
  );
};

// DELETE — remove a pick
export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { tool_id?: string; category?: string };
  if (!body.tool_id || !body.category) {
    return new Response(
      JSON.stringify({ success: false, error: "tool_id and category are required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;
  await db
    .prepare("DELETE FROM jeffs_picks WHERE tool_id = ? AND category = ?")
    .bind(body.tool_id, body.category)
    .run();

  return new Response(
    JSON.stringify({ success: true }),
    { headers: JSON_HEADERS }
  );
};
