type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{ results: T[] }>;
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
    all: <T = unknown>() => Promise<{ results: T[] }>;
  };
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

interface Env { PROVENAI_DB: D1Database; }

// GET /api/manage/cards/:cardId/attachments
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_card_attachments WHERE card_id = ? ORDER BY created_at ASC")
    .bind(params.cardId).all();
  return Response.json({ items: results });
};

// POST /api/manage/cards/:cardId/attachments
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const { filename, file_type, file_data } = await request.json() as Record<string, string>;
  const id = crypto.randomUUID();
  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_card_attachments (id, card_id, filename, file_type, file_data) VALUES (?, ?, ?, ?, ?)")
    .bind(id, params.cardId, filename, file_type, file_data).run();
  const item = await env.PROVENAI_DB.prepare("SELECT * FROM pm_card_attachments WHERE id = ?").bind(id).first();
  return Response.json({ item });
};
