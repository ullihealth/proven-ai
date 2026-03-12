/**
 * Admin Book Signups — single-record operations
 *
 * DELETE /api/admin/book-signups/:id
 *   → { success: true, deleted: 1 }
 *   Permanently deletes one signup by its primary-key ID (GDPR erasure).
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid ID" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  await env.PROVENAI_DB
    .prepare("DELETE FROM book_signups WHERE id = ?")
    .bind(id)
    .run();

  return new Response(
    JSON.stringify({ success: true, deleted: 1 }),
    { headers: JSON_HEADERS }
  );
};
