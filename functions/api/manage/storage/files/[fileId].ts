type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{ results: T[] }>;
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
  };
};

type R2Bucket = {
  delete: (key: string) => Promise<void>;
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_DB: D1Database;
  PROVENAI_ATTACHMENTS: R2Bucket;
}

// PATCH /api/manage/storage/files/:fileId — rename or move
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const updates = await request.json() as { filename?: string; folder_id?: string | null };
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (updates.filename !== undefined) { sets.push("filename = ?"); vals.push(updates.filename); }
  if (updates.folder_id !== undefined) { sets.push("folder_id = ?"); vals.push(updates.folder_id); }
  if (sets.length === 0) return Response.json({ ok: true });
  vals.push(params.fileId);
  await env.PROVENAI_DB
    .prepare(`UPDATE pm_storage_files SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...vals).run();
  return Response.json({ ok: true });
};

// DELETE /api/manage/storage/files/:fileId
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const file = await env.PROVENAI_DB
    .prepare("SELECT r2_key FROM pm_storage_files WHERE id = ?")
    .bind(params.fileId).first<{ r2_key: string }>();
  if (file) {
    try { await env.PROVENAI_ATTACHMENTS.delete(file.r2_key); } catch {}
  }
  await env.PROVENAI_DB
    .prepare("DELETE FROM pm_storage_files WHERE id = ?")
    .bind(params.fileId).run();
  return Response.json({ ok: true });
};
