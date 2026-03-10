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

// GET /api/manage/notes/:noteId
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const noteId = params.noteId;
  const note = await env.PROVENAI_DB.prepare("SELECT * FROM pm_notes WHERE id = ?").bind(noteId).first();
  if (!note) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ note });
};

// PATCH /api/manage/notes/:noteId — update title and/or content
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const noteId = params.noteId;
  const body = await request.json() as Record<string, unknown>;

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ["title", "content"]) {
    if (key in body) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) return Response.json({ note: null });

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(noteId);

  await env.PROVENAI_DB.prepare(`UPDATE pm_notes SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const note = await env.PROVENAI_DB.prepare("SELECT * FROM pm_notes WHERE id = ?").bind(noteId).first();
  return Response.json({ note });
};

// DELETE /api/manage/notes/:noteId
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const noteId = params.noteId;
  await env.PROVENAI_DB.prepare("DELETE FROM pm_notes WHERE id = ?").bind(noteId).run();
  return Response.json({ ok: true });
};
