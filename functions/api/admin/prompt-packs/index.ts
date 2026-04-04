/**
 * Admin Prompt Packs API — CRUD
 *
 * GET    /api/admin/prompt-packs         — list all packs (all statuses)
 * POST   /api/admin/prompt-packs         — create a pack
 * PUT    /api/admin/prompt-packs         — update a pack
 * DELETE /api/admin/prompt-packs?id=xxx  — delete a pack
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const SELECT_COLS =
  "id, title, description, image_url, pdf_url, sort_order, is_active, created_at";

// GET — list all packs
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const { results } = await env.PROVENAI_DB
    .prepare(
      `SELECT ${SELECT_COLS} FROM prompt_packs ORDER BY sort_order ASC, id ASC`
    )
    .all();

  return new Response(JSON.stringify({ ok: true, packs: results || [] }), {
    headers: JSON_HEADERS,
  });
};

// POST — create a new pack
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

  await env.PROVENAI_DB
    .prepare(
      `INSERT INTO prompt_packs (title, description, image_url, pdf_url, sort_order, is_active)
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
    .prepare(`SELECT ${SELECT_COLS} FROM prompt_packs ORDER BY id DESC LIMIT 1`)
    .first();

  return new Response(JSON.stringify({ ok: true, pack: row }), {
    status: 201,
    headers: JSON_HEADERS,
  });
};

// PUT — update an existing pack
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

  await env.PROVENAI_DB
    .prepare(
      `UPDATE prompt_packs
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
};

// DELETE — remove a pack by id
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

  await env.PROVENAI_DB
    .prepare("DELETE FROM prompt_packs WHERE id = ?")
    .bind(Number(id))
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
