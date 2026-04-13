/**
 * Public Prompt Packs API (read-only, no auth required)
 *
 * GET /api/prompt-packs — returns all active packs ordered by sort_order
 */

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type D1Database = {
  prepare: (query: string) => {
    all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  };
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({
  env,
}) => {
  const { results } = await env.PROVENAI_DB
    .prepare(
      `SELECT id, title, image_url, pdf_url, sort_order
       FROM prompt_packs
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    )
    .all();

  return new Response(JSON.stringify({ ok: true, packs: results || [] }), {
    headers: JSON_HEADERS,
  });
};
