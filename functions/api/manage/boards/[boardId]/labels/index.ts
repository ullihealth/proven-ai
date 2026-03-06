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

// GET /api/manage/boards/:boardId/labels
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_labels WHERE board_id = ? ORDER BY name")
    .bind(params.boardId)
    .all();
  return Response.json({ labels: results });
};

// POST /api/manage/boards/:boardId/labels
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const body = await request.json() as { name: string; color: string };
  const id = crypto.randomUUID();
  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_labels (id, board_id, name, color) VALUES (?, ?, ?, ?)")
    .bind(id, params.boardId, body.name, body.color)
    .run();
  const label = await env.PROVENAI_DB.prepare("SELECT * FROM pm_labels WHERE id = ?").bind(id).first();
  return Response.json({ label });
};
