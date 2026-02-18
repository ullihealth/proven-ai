/**
 * Public App Visual Config API (read-only)
 *
 * GET /api/visual-config?key=xxx — get a visual config value
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

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({
  request,
  env,
}) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  const db = env.PROVENAI_DB;

  if (key) {
    // Single key
    const row = await db
      .prepare("SELECT key, value FROM app_visual_config WHERE key = ?")
      .bind(key)
      .first<{ key: string; value: string }>();

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

  // All keys
  const { results } = await db
    .prepare("SELECT key, value FROM app_visual_config")
    .all<{ key: string; value: string }>();

  const config: Record<string, unknown> = {};
  for (const row of results || []) {
    try {
      config[row.key] = JSON.parse(row.value);
    } catch {
      config[row.key] = row.value;
    }
  }

  return new Response(JSON.stringify({ ok: true, config }), { headers: JSON_HEADERS });
};
