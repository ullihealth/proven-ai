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

interface SessionResponse {
  data?: { user?: { id?: string } };
  user?: { id?: string };
}

async function getSessionUserId(request: Request): Promise<string | null> {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/auth/get-session`, {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as SessionResponse;
  return data.data?.user?.id || data.user?.id || null;
}

// GET /api/manage/notes — all notes for the current user, ordered by date desc, optional ?search=
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  if (search) {
    const { results } = await env.PROVENAI_DB
      .prepare("SELECT * FROM pm_notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY date DESC")
      .bind(userId, `%${search}%`, `%${search}%`).all();
    return Response.json({ notes: results });
  }
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_notes WHERE user_id = ? ORDER BY date DESC")
    .bind(userId).all();
  return Response.json({ notes: results });
};

// POST /api/manage/notes — create a note, 409 if date already exists for this user
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Record<string, unknown>;
    const { date, title, content } = body as { date: string; title: string; content?: string };

    const existing = await env.PROVENAI_DB
      .prepare("SELECT id FROM pm_notes WHERE user_id = ? AND date = ?")
      .bind(userId, date).first();
    if (existing) {
      return Response.json({ error: "A note for this date already exists" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.PROVENAI_DB.prepare(
      "INSERT INTO pm_notes (id, user_id, date, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, date, title, content ?? "", now, now).run();
    const note = await env.PROVENAI_DB.prepare("SELECT * FROM pm_notes WHERE id = ?").bind(id).first();
    return Response.json({ note });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), stack: err instanceof Error ? err.stack : undefined }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};