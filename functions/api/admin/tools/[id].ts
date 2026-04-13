/**
 * /api/admin/tools/:id — Update or delete a single added tool.
 *
 * PATCH → update fields (trustLevel, lastReviewed, notes, bestFor)
 * DELETE → permanently remove the tool
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown, Params extends string = string> = (context: {
  request: Request;
  env: Env;
  params: Record<Params, string>;
}) => Response | Promise<Response>;

export const onRequest: PagesFunction<LessonApiEnv, "id"> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const { id } = params;
  const db = env.PROVENAI_DB;

  // ── PATCH (partial update) ─────────────────────────────────────────────────
  if (request.method === "PATCH") {
    const body = (await request.json()) as Record<string, unknown>;

    const fieldMap: Record<string, string> = {
      trustLevel: "trust_level",
      lastReviewed: "last_reviewed",
      notes: "notes",
      bestFor: "best_for",
      pricingModel: "pricing_model",
      skillLevel: "skill_level",
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (body[jsKey] !== undefined) {
        setClauses.push(`${dbCol} = ?`);
        values.push(body[jsKey]);
      }
    }

    if (setClauses.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No recognised fields to update" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    values.push(id);
    await db
      .prepare(`UPDATE added_tools SET ${setClauses.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    await db.prepare("DELETE FROM added_tools WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  }

  return new Response(
    JSON.stringify({ success: false, error: "Method not allowed" }),
    { status: 405, headers: JSON_HEADERS }
  );
};
