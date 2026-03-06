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

interface Env {
  PROVENAI_DB: D1Database;
}

// GET /api/manage/cards/:cardId/checklist
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_checklists WHERE card_id = ? ORDER BY sort_order")
    .bind(params.cardId)
    .all();
  return Response.json({ items: results });
};

// POST /api/manage/cards/:cardId/checklist
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const body = await request.json() as { text: string };
  const id = crypto.randomUUID();

  // Get next sort order
  const last = await env.PROVENAI_DB
    .prepare("SELECT MAX(sort_order) as max_order FROM pm_checklists WHERE card_id = ?")
    .bind(params.cardId)
    .first<{ max_order: number | null }>();
  const sortOrder = (last?.max_order ?? -1) + 1;

  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_checklists (id, card_id, text, done, sort_order) VALUES (?, ?, ?, 0, ?)")
    .bind(id, params.cardId, body.text, sortOrder)
    .run();

  const item = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_checklists WHERE id = ?")
    .bind(id)
    .first();
  return Response.json({ item });
};
