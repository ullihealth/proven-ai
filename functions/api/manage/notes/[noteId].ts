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

async function getSessionUserId(request: Request): Promise<string | null> {
  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const res = await fetch(sessionUrl.toString(), { method: "GET", headers: request.headers, credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: { id?: string } };
    return data.user?.id || null;
  } catch { return null; }
}

// GET /api/manage/notes/:noteId
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const noteId = params.noteId;
  const note = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_notes WHERE id = ? AND user_id = ?")
    .bind(noteId, userId).first();
  if (!note) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ note });
};

// PATCH /api/manage/notes/:noteId — update title and/or content
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
  values.push(userId);

  await env.PROVENAI_DB
    .prepare(`UPDATE pm_notes SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...values).run();
  const note = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_notes WHERE id = ? AND user_id = ?")
    .bind(noteId, userId).first();
  return Response.json({ note });
};

// DELETE /api/manage/notes/:noteId
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const noteId = params.noteId;
  await env.PROVENAI_DB
    .prepare("DELETE FROM pm_notes WHERE id = ? AND user_id = ?")
    .bind(noteId, userId).run();
  return Response.json({ ok: true });
};
