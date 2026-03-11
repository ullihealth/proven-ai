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

// GET /api/manage/columns — all columns across all boards
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_columns ORDER BY board_id, sort_order")
    .all();
  return Response.json({ columns: results });
};
