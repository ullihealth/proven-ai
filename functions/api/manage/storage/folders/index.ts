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

// GET /api/manage/storage/folders — all folders
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_storage_folders ORDER BY position ASC, created_at ASC")
    .all();
  return Response.json({ folders: results });
};

// POST /api/manage/storage/folders — create folder
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { name, parent_id } = await request.json() as { name: string; parent_id?: string | null };
  const id = crypto.randomUUID();
  // Get max position for siblings
  const maxRow = await env.PROVENAI_DB
    .prepare("SELECT MAX(position) as mx FROM pm_storage_folders WHERE parent_id IS ?")
    .bind(parent_id ?? null).first<{ mx: number | null }>();
  const position = (maxRow?.mx ?? -1) + 1;
  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_storage_folders (id, name, parent_id, position) VALUES (?, ?, ?, ?)")
    .bind(id, name, parent_id ?? null, position).run();
  const folder = await env.PROVENAI_DB.prepare("SELECT * FROM pm_storage_folders WHERE id = ?").bind(id).first();
  return Response.json({ folder });
};
