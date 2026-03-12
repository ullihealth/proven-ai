/**
 * Admin Book Signups API
 *
 * GET /api/admin/book-signups
 *   → { success, total, signups: [{ id, email, firstname, source, created_at }] }
 *
 * Query params:
 *   limit  — max rows (default 50)
 *   offset — pagination offset (default 0)
 *
 * DELETE /api/admin/book-signups
 *   Body: { password: string }
 *   Verifies password against env.ADMIN_DELETE_PASSWORD, then wipes all records.
 *   → { success: true, deleted: number }
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

interface BookSignupsEnv extends LessonApiEnv {
  ADMIN_DELETE_PASSWORD?: string;
}

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<BookSignupsEnv> = async ({ request, env }) => {
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

export const onRequestDelete: PagesFunction<BookSignupsEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  let body: { password?: string } = {};
  try {
    body = await request.json() as { password?: string };
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request body" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const expectedPassword = env.ADMIN_DELETE_PASSWORD;
  if (!expectedPassword || body.password !== expectedPassword) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid password" }),
      { status: 403, headers: JSON_HEADERS }
    );
  }

  const countRow = await env.PROVENAI_DB
    .prepare("SELECT COUNT(*) as total FROM book_signups")
    .first<{ total: number }>();
  const total = countRow?.total ?? 0;

  await env.PROVENAI_DB.prepare("DELETE FROM book_signups").run();

  return new Response(
    JSON.stringify({ success: true, deleted: total }),
    { headers: JSON_HEADERS }
  );
};
