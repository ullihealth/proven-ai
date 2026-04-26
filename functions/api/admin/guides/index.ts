/**
 * Admin Guides API — CRUD
 *
 * GET    /api/admin/guides         — list all guides (all statuses)
 * POST   /api/admin/guides         — create a guide
 * PUT    /api/admin/guides         — update a guide
 * DELETE /api/admin/guides?id=xxx  — delete a guide
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const SELECT_COLS =
  "id, title, description, image_url, pdf_url, sort_order, is_active, created_at";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS guides_new (
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

/**
 * Ensure the guides table has the correct schema.
 * If the existing table is the old guide-clusters schema (no image_url column),
 * rename it to guides_legacy and create the new one.
 */
async function ensureSchema(db: LessonApiEnv["PROVENAI_DB"]): Promise<void> {
  let schemaOk = false;
  try {
    await db.prepare("SELECT image_url FROM guides LIMIT 1").all();
    schemaOk = true;
  } catch {
    schemaOk = false;
  }

  if (!schemaOk) {
    try {
      await db.prepare("ALTER TABLE guides RENAME TO guides_legacy").run();
    } catch {
      // Table didn't exist — that's fine
    }
    await db.prepare(CREATE_TABLE_SQL.replace("guides_new", "guides")).run();
  }
}

// GET — list all guides
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  try {
    await ensureSchema(env.PROVENAI_DB);

    const { results } = await env.PROVENAI_DB
      .prepare(
        `SELECT ${SELECT_COLS} FROM guides ORDER BY sort_order ASC, id ASC`
      )
      .all();

    return new Response(JSON.stringify({ ok: true, guides: results || [] }), {
      headers: JSON_HEADERS,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};

// POST — create a new guide
export const onRequestPost: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    image_url?: string;
    pdf_url?: string;
    sort_order?: number;
    is_active?: boolean;
  };

  if (!body.title?.trim() || !body.image_url?.trim() || !body.pdf_url?.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: "title, image_url, and pdf_url are required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    await env.PROVENAI_DB
      .prepare(
        `INSERT INTO guides (title, description, image_url, pdf_url, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.title.trim(),
        body.description?.trim() || "",
        body.image_url.trim(),
        body.pdf_url.trim(),
        body.sort_order ?? 0,
        body.is_active !== false ? 1 : 0
      )
      .run();

    const row = await env.PROVENAI_DB
      .prepare(`SELECT ${SELECT_COLS} FROM guides ORDER BY id DESC LIMIT 1`)
      .first();

    return new Response(JSON.stringify({ ok: true, guide: row }), {
      status: 201,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};

// PUT — update an existing guide
export const onRequestPut: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    id?: number;
    title?: string;
    description?: string;
    image_url?: string;
    pdf_url?: string;
    sort_order?: number;
    is_active?: boolean;
  };

  if (!body.id || !body.title?.trim() || !body.image_url?.trim() || !body.pdf_url?.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: "id, title, image_url, and pdf_url are required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    await env.PROVENAI_DB
      .prepare(
        `UPDATE guides
         SET title = ?, description = ?, image_url = ?, pdf_url = ?, sort_order = ?, is_active = ?
         WHERE id = ?`
      )
      .bind(
        body.title.trim(),
        body.description?.trim() || "",
        body.image_url.trim(),
        body.pdf_url.trim(),
        body.sort_order ?? 0,
        body.is_active !== false ? 1 : 0,
        body.id
      )
      .run();

    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};

// DELETE — remove a guide by id
export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ ok: false, error: "valid id query param is required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    await env.PROVENAI_DB
      .prepare("DELETE FROM guides WHERE id = ?")
      .bind(Number(id))
      .run();

    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
