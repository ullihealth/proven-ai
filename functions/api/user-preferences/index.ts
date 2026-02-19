/**
 * User Preferences API (authenticated users)
 *
 * GET /api/user-preferences?key=xxx — get a preference value for the current user
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
      all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
      run: () => Promise<{ success: boolean }>;
    };
  };
};

interface Env {
  PROVENAI_DB: D1Database;
}

type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
}) => Response | Promise<Response>;

async function getSessionUserId(request: Request): Promise<string | null> {
  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const res = await fetch(sessionUrl.toString(), {
      method: "GET",
      headers: request.headers,
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: { id?: string } };
    return data.user?.id || null;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const db = env.PROVENAI_DB;

  if (key) {
    const row = await db
      .prepare("SELECT value FROM user_preferences WHERE user_id = ? AND key = ?")
      .bind(userId, key)
      .first<{ value: string }>();

    if (!row) {
      return new Response(JSON.stringify({ ok: true, value: null }), { headers: JSON_HEADERS });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      parsed = row.value;
    }
    return new Response(JSON.stringify({ ok: true, value: parsed }), { headers: JSON_HEADERS });
  }

  // All keys for this user
  const { results } = await db
    .prepare("SELECT key, value FROM user_preferences WHERE user_id = ?")
    .bind(userId)
    .all<{ key: string; value: string }>();

  const prefs: Record<string, unknown> = {};
  for (const row of results || []) {
    try {
      prefs[row.key] = JSON.parse(row.value);
    } catch {
      prefs[row.key] = row.value;
    }
  }

  return new Response(JSON.stringify({ ok: true, preferences: prefs }), { headers: JSON_HEADERS });
};

// PUT — upsert a preference for the current user
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const body = (await request.json()) as { key: string; value: unknown };
  if (!body.key) {
    return new Response(JSON.stringify({ error: "key required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;
  const valueStr = typeof body.value === "string" ? body.value : JSON.stringify(body.value);

  await db
    .prepare(
      `INSERT INTO user_preferences (user_id, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, key) DO UPDATE SET value = ?, updated_at = datetime('now')`
    )
    .bind(userId, body.key, valueStr, valueStr)
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
