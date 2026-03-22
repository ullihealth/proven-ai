/**
 * Public Email Subscriber Proxy
 *
 * POST /api/email/subscribe
 * Body: { email, firstname, tags: { community: bool, provenai: bool } }
 *
 * Forwards the full payload to SaasDesk which handles the database write.
 * The SAASDESK_WEBHOOK_API_KEY env var is never exposed to the browser.
 */

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface SubscribeBody {
  email?: string;
  firstname?: string;
  tags?: { community?: boolean; provenai?: boolean };
}

export const onRequestPost: PagesFunction<{
  SAASDESK_WEBHOOK_API_KEY?: string;
}> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as SubscribeBody;
    const email = body.email?.trim().toLowerCase();
    const firstname = body.firstname?.trim() || "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Valid email required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const res = await fetch("https://saasdesk.dev/api/webhooks/subscriber", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.SAASDESK_WEBHOOK_API_KEY
          ? { "X-API-Key": env.SAASDESK_WEBHOOK_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        email,
        firstname,
        tags: body.tags ?? {},
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[email/subscribe] SaasDesk error:", res.status, errText);
      return new Response(
        JSON.stringify({ ok: false, error: "Subscription service error" }),
        { status: 502, headers: JSON_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[email/subscribe]", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
