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

// PATCH /api/manage/storage/folders/:folderId
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const updates = await request.json() as { name?: string; parent_id?: string | null; position?: number };
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (updates.name !== undefined) { sets.push("name = ?"); vals.push(updates.name); }
  if (updates.parent_id !== undefined) { sets.push("parent_id = ?"); vals.push(updates.parent_id); }
  if (updates.position !== undefined) { sets.push("position = ?"); vals.push(updates.position); }
  if (sets.length === 0) return Response.json({ ok: true });
  vals.push(params.folderId);
  await env.PROVENAI_DB
    .prepare(`UPDATE pm_storage_folders SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...vals).run();
  return Response.json({ ok: true });
};

// DELETE /api/manage/storage/folders/:folderId — recursive delete
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  // Collect all descendant folder IDs
  const allIds: string[] = [params.folderId];
  const queue = [params.folderId];
  while (queue.length > 0) {
    const pid = queue.shift()!;
    const { results } = await env.PROVENAI_DB
      .prepare("SELECT id FROM pm_storage_folders WHERE parent_id = ?")
      .bind(pid).all<{ id: string }>();
    for (const r of results) { allIds.push(r.id); queue.push(r.id); }
  }

  // Delete R2 files in those folders
  for (const fid of allIds) {
    const { results: files } = await env.PROVENAI_DB
      .prepare("SELECT r2_key FROM pm_storage_files WHERE folder_id = ?")
      .bind(fid).all<{ r2_key: string }>();
    for (const f of files) {
      try { await env.PROVENAI_ATTACHMENTS.delete(f.r2_key); } catch {}
    }
    await env.PROVENAI_DB.prepare("DELETE FROM pm_storage_files WHERE folder_id = ?").bind(fid).run();
  }

  // Delete folders
  for (const fid of allIds) {
    await env.PROVENAI_DB.prepare("DELETE FROM pm_storage_folders WHERE id = ?").bind(fid).run();
  }

  return Response.json({ ok: true });
};
