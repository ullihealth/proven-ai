import { getReferralCodeFromCookie } from "../_services/referral";

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
  };
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

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

export const onRequestPost: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({ request, env }) => {
  try {
    const refCode = getReferralCodeFromCookie(request.headers.get("cookie"));
    if (!refCode) {
      return new Response(JSON.stringify({ ok: true, attached: false, reason: "missing_ref" }), {
        headers: JSON_HEADERS,
      });
    }

    const userId = await getSessionUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const existing = await env.PROVENAI_DB
      .prepare("SELECT referred_by_code FROM user WHERE id = ?")
      .bind(userId)
      .first<{ referred_by_code: string | null }>();

    if (existing?.referred_by_code) {
      return new Response(JSON.stringify({ ok: true, attached: false, reason: "already_set" }), {
        headers: JSON_HEADERS,
      });
    }

    await env.PROVENAI_DB
      .prepare(
        "UPDATE user SET referred_by_code = ?, referral_captured_at = COALESCE(referral_captured_at, ?) WHERE id = ?"
      )
      .bind(refCode, new Date().toISOString(), userId)
      .run();

    return new Response(JSON.stringify({ ok: true, attached: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error("[ref.attach]", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};
