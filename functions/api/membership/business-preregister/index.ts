/**
 * POST /api/membership/business-preregister
 *
 * Public endpoint — no auth required.
 * Accepts { email } and saves to business_preregistrations table.
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
  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid request body" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !email.includes("@")) {
    return new Response(
      JSON.stringify({ ok: false, error: "A valid email address is required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    await env.PROVENAI_DB
      .prepare("INSERT INTO business_preregistrations (email) VALUES (?)")
      .bind(email)
      .run();

    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to save. Please try again." }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
