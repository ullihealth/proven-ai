type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{ results: T[] }>;
      run: () => Promise<{ success: boolean }>;
    };
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

// GET /api/manage/cards/:cardId/labels
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT l.* FROM pm_labels l JOIN pm_card_labels cl ON cl.label_id = l.id WHERE cl.card_id = ?")
    .bind(params.cardId)
    .all();
  return Response.json({ labels: results });
};

// POST /api/manage/cards/:cardId/labels  — assign a label
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const body = await request.json() as { label_id: string };
  await env.PROVENAI_DB
    .prepare("INSERT OR IGNORE INTO pm_card_labels (card_id, label_id) VALUES (?, ?)")
    .bind(params.cardId, body.label_id)
    .run();
  return Response.json({ ok: true });
};
