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

// GET /api/manage/focus-log — all entries for the current user, ordered by date DESC
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_focus_log WHERE user_id = ? ORDER BY date DESC")
    .bind(userId).all();
  return Response.json({ entries: results });
};

// POST /api/manage/focus-log — upsert { date, minutes } for the current user
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const { date, minutes } = body as { date: string; minutes: number };

  if (!date || typeof minutes !== "number") {
    return Response.json({ error: "date and minutes are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.PROVENAI_DB.prepare(
    `INSERT INTO pm_focus_log (id, user_id, date, minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET minutes = excluded.minutes, updated_at = excluded.updated_at`
  ).bind(id, userId, date, minutes, now, now).run();

  const entry = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_focus_log WHERE user_id = ? AND date = ?")
    .bind(userId, date).first();
  return Response.json({ entry });
};
