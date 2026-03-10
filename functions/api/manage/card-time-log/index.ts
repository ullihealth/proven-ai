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
    headers: { cookie: request.headers.get("cookie") || "" },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as SessionResponse;
  return data.data?.user?.id || data.user?.id || null;
}

// POST /api/manage/card-time-log
// Body: { card_id, card_title, board_id, board_name, date, seconds, started_at, ended_at? }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const { card_id, card_title, board_id, board_name, date, seconds, started_at, ended_at } = body as {
    card_id: string;
    card_title: string;
    board_id: string;
    board_name: string;
    date: string;
    seconds: number;
    started_at: string;
    ended_at?: string;
  };

  if (!card_id || !date || typeof seconds !== "number" || !started_at) {
    return Response.json({ error: "card_id, date, seconds, and started_at are required" }, { status: 400 });
  }

  if (seconds < 1) {
    // Don't bother storing sub-second entries
    return Response.json({ ok: true, skipped: true });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.PROVENAI_DB.prepare(
    `INSERT INTO pm_card_time_log (id, user_id, card_id, card_title, board_id, board_name, date, seconds, started_at, ended_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, userId,
    card_id,
    card_title || "",
    board_id || "",
    board_name || "",
    date,
    Math.round(seconds),
    started_at,
    ended_at || null,
    now
  ).run();

  return Response.json({ ok: true, id });
};

// GET /api/manage/card-time-log
//   ?summary=true  → [{ board_id, board_name, card_id, card_title, total_seconds }] ordered by total_seconds DESC
//   ?board_id=X    → [{ card_id, card_title, total_seconds }] for that board
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const summary = url.searchParams.get("summary");
  const boardId = url.searchParams.get("board_id");

  if (summary === "true") {
    const { results } = await env.PROVENAI_DB
      .prepare(
        `SELECT board_id, board_name, card_id, card_title, SUM(seconds) as total_seconds
         FROM pm_card_time_log
         WHERE user_id = ?
         GROUP BY card_id
         ORDER BY total_seconds DESC`
      )
      .bind(userId)
      .all<{ board_id: string; board_name: string; card_id: string; card_title: string; total_seconds: number }>();
    return Response.json({ summary: results });
  }

  if (boardId) {
    const { results } = await env.PROVENAI_DB
      .prepare(
        `SELECT card_id, card_title, SUM(seconds) as total_seconds
         FROM pm_card_time_log
         WHERE user_id = ? AND board_id = ?
         GROUP BY card_id
         ORDER BY total_seconds DESC`
      )
      .bind(userId, boardId)
      .all<{ card_id: string; card_title: string; total_seconds: number }>();
    return Response.json({ cards: results });
  }

  // Default: raw entries for user, latest first
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_card_time_log WHERE user_id = ? ORDER BY started_at DESC LIMIT 500")
    .bind(userId)
    .all();
  return Response.json({ entries: results });
};
