/**
 * Public Waitlist API
 *
 * POST /api/waitlist — add email to waitlist
 * Body: { "email": "user@example.com" }
 */

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      run: () => Promise<{ success: boolean }>;
    };
  };
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({
  request,
  env,
}) => {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Valid email required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // INSERT OR IGNORE so duplicates don't error
    await env.PROVENAI_DB
      .prepare("INSERT OR IGNORE INTO waitlist (email) VALUES (?)")
      .bind(email)
      .run();

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: JSON_HEADERS }
    );
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
