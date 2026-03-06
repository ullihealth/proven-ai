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

// GET /api/manage/strategy — list all strategy pulls
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_strategy_pulls ORDER BY created_at DESC")
    .all();
  return Response.json({ pulls: results });
};

// POST /api/manage/strategy — create a new strategy pull
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json()) as { content: string; summary?: string };
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.PROVENAI_DB
    .prepare(
      "INSERT INTO pm_strategy_pulls (id, content, summary, created_at) VALUES (?, ?, ?, ?)"
    )
    .bind(id, body.content, body.summary || "", now)
    .run();

  const pull = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_strategy_pulls WHERE id = ?")
    .bind(id)
    .first();

  return Response.json({ pull });
};
