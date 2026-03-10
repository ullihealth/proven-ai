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

// GET /api/manage/notes — all notes ordered by date desc, optional ?search=keyword
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  if (search) {
    const { results } = await env.PROVENAI_DB
      .prepare("SELECT * FROM pm_notes WHERE title LIKE ? OR content LIKE ? ORDER BY date DESC")
      .bind(`%${search}%`, `%${search}%`).all();
    return Response.json({ notes: results });
  }
  const { results } = await env.PROVENAI_DB.prepare("SELECT * FROM pm_notes ORDER BY date DESC").all();
  return Response.json({ notes: results });
};

// POST /api/manage/notes — create a note, 409 if date already exists
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as Record<string, unknown>;
  const { date, title, content } = body as { date: string; title: string; content?: string };

  const existing = await env.PROVENAI_DB.prepare("SELECT id FROM pm_notes WHERE date = ?").bind(date).first();
  if (existing) {
    return Response.json({ error: "A note for this date already exists" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.PROVENAI_DB.prepare(
    "INSERT INTO pm_notes (id, date, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, date, title, content ?? "", now, now).run();

  const note = await env.PROVENAI_DB.prepare("SELECT * FROM pm_notes WHERE id = ?").bind(id).first();
  return Response.json({ note });
};
