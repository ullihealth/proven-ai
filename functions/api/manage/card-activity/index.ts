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

// GET /api/manage/card-activity
//   ?summary=true   → returns [{ date, count }] grouped by day
//   ?date=YYYY-MM-DD → returns full records for that day (for tooltip top-cards)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const summary = url.searchParams.get("summary");
  const date = url.searchParams.get("date");

  if (summary === "true") {
    const { results } = await env.PROVENAI_DB
      .prepare("SELECT date, COUNT(*) as count FROM pm_card_activity WHERE user_id = ? GROUP BY date ORDER BY date DESC")
      .bind(userId).all<{ date: string; count: number }>();
    return Response.json({ summary: results });
  }

  if (date) {
    const { results } = await env.PROVENAI_DB
      .prepare("SELECT card_id, card_title, board_name, event_type, occurred_at FROM pm_card_activity WHERE user_id = ? AND date = ? ORDER BY occurred_at ASC")
      .bind(userId, date).all();
    return Response.json({ events: results });
  }

  // Default: last 365 days of records
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_card_activity WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 1000")
    .bind(userId).all();
  return Response.json({ events: results });
};

// POST /api/manage/card-activity — log a single card event
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const { card_id, card_title, board_id, board_name, event_type } = body as {
    card_id: string;
    card_title: string;
    board_id: string;
    board_name: string;
    event_type: string;
  };

  if (!card_id || !event_type) {
    return Response.json({ error: "card_id and event_type are required" }, { status: 400 });
  }

  const validEvents = ["opened", "edited", "checklist", "moved"];
  if (!validEvents.includes(event_type)) {
    return Response.json({ error: "Invalid event_type" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const date = now.slice(0, 10);

  await env.PROVENAI_DB.prepare(
    `INSERT INTO pm_card_activity (id, user_id, card_id, card_title, board_id, board_name, event_type, occurred_at, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, userId,
    card_id || "",
    card_title || "",
    board_id || "",
    board_name || "",
    event_type,
    now,
    date
  ).run();

  return Response.json({ ok: true, id });
};
