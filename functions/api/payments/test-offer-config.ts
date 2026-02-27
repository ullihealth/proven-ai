const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<{ ENABLE_STRIPE_TEST_OFFER?: string }> = async ({ env }) => {
  const enabled = String(env.ENABLE_STRIPE_TEST_OFFER || "").toLowerCase() === "true";
  return new Response(JSON.stringify({ ok: true, enabled }), {
    headers: JSON_HEADERS,
  });
};
