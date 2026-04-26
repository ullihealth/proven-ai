/**
 * GET /api/admin/guides/migrate
 *
 * Creates the guides table if it does not already exist.
 * Admin-only. Run once after deployment.
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )
`;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;

  // Check whether the existing guides table has the new schema.
  // The old guide-clusters table used TEXT ids and had no image_url column.
  // If the probe query fails, the table either doesn't exist or has the old
  // schema — rename it to guides_legacy and create the new one.
  let schemaOk = false;
  try {
    await db.prepare("SELECT image_url FROM guides LIMIT 1").all();
    schemaOk = true;
  } catch {
    schemaOk = false;
  }

  if (!schemaOk) {
    // Rename old table if it exists (ignore error if it doesn't)
    try {
      await db.prepare("ALTER TABLE guides RENAME TO guides_legacy").run();
    } catch {
      // Table didn't exist — that's fine
    }
    // Create the new simple table
    await db.prepare(CREATE_SQL).run();
  }

  return new Response(
    JSON.stringify({ ok: true, message: "guides table ready" }),
    { headers: JSON_HEADERS }
  );
};
