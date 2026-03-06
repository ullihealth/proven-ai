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
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_DB: D1Database;
}

// GET /api/manage/cards — all cards across all boards
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.PROVENAI_DB.prepare("SELECT * FROM pm_cards ORDER BY sort_order").all();
  return Response.json({ cards: results });
};

// POST /api/manage/cards — create a card
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as Record<string, unknown>;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.PROVENAI_DB.prepare(
    `INSERT INTO pm_cards (id, board_id, column_id, title, description, due_date, priority, assignee, content_type, platform, card_type, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.board_id || "",
    body.column_id || "",
    body.title || "",
    body.description || "",
    body.due_date || null,
    body.priority || "backlog",
    body.assignee || "jeff",
    body.content_type || "",
    body.platform || "",
    body.card_type || "",
    body.sort_order || 0,
    now,
    now,
  ).run();

  const card = await env.PROVENAI_DB.prepare("SELECT * FROM pm_cards WHERE id = ?").bind(id).first();
  return Response.json({ card });
};
