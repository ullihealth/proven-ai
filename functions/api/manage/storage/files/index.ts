type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{ results: T[] }>;
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

// GET /api/manage/storage/files — all files (for browse picker)
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_storage_files ORDER BY created_at DESC")
    .all();
  return Response.json({ files: results });
};
