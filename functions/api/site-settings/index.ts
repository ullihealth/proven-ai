/**
 * Public Site Settings API (read-only, no auth required)
 *
 * GET /api/site-settings?key=auth_mode
 */

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
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

  if (!key) {
    return new Response(
      JSON.stringify({ error: "key query param required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const row = await env.PROVENAI_DB
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();

  return new Response(
    JSON.stringify({ ok: true, value: row?.value ?? null }),
    { headers: JSON_HEADERS }
  );
};
