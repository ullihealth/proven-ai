/**
 * Admin Book Signups API
 *
 * GET /api/admin/book-signups
 *   → { success, total, signups: [{ id, email, firstname, source, created_at }] }
 *
 * Query params:
 *   limit  — max rows (default 50)
 *   offset — pagination offset (default 0)
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  const db = env.PROVENAI_DB;

  // Total count
  const countRow = await db
    .prepare("SELECT COUNT(*) as total FROM book_signups")
    .first<{ total: number }>();
  const total = countRow?.total ?? 0;

  // Recent signups
  const { results } = await db
    .prepare("SELECT id, email, firstname, source, created_at FROM book_signups ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .bind(limit, offset)
    .all<{ id: number; email: string; firstname: string; source: string; created_at: string }>();

  return new Response(
    JSON.stringify({ success: true, total, signups: results || [] }),
    { headers: JSON_HEADERS }
  );
};
