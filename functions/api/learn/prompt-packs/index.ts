/**
 * Public Prompt Packs API (read-only)
 *
 * GET /api/learn/prompt-packs — list all active prompt packs
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

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
  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare(
      "SELECT id, title, description, image_url, pdf_url, sort_order FROM prompt_packs WHERE is_active = 1 ORDER BY sort_order ASC"
    )
    .all();

  return new Response(JSON.stringify({ ok: true, packs: results || [] }), {
    headers: JSON_HEADERS,
  });
};
