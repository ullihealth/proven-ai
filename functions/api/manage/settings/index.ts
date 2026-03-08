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

// GET /api/manage/settings
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.PROVENAI_DB.prepare("SELECT key, value FROM manager_settings").all<{ key: string; value: string }>();
  const settings: Record<string, string> = {};
  for (const row of results) {
    settings[row.key] = row.value;
  }
  return Response.json({ settings });
};

// PATCH /api/manage/settings
export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    await env.PROVENAI_DB.prepare(
      "INSERT INTO manager_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).bind(key, String(value)).run();
  }

  return Response.json({ ok: true });
};
