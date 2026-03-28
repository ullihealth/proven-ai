/**
 * POST /api/prompt-generator/request-access
 *
 * Called when a visitor submits their email on the landing page.
 * Creates or reuses a guest token and posts to SaasDesk webhook.
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyTurnstileToken(token: string, secretKey: string, ip: string): Promise<boolean> {
  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const result = await response.json() as { success: boolean };
  return result.success;
}

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as { email?: string; cf_turnstile_token?: string };
    const email = body.email?.trim().toLowerCase();
    const cfTurnstileToken = body.cf_turnstile_token;

    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // Verify Turnstile challenge
    if (!cfTurnstileToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Security check required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    const ip = request.headers.get("CF-Connecting-IP") ?? "";
    const secretKey = env.TURNSTILE_SECRET_KEY ?? "";
    const isHuman = await verifyTurnstileToken(cfTurnstileToken, secretKey, ip);
    if (!isHuman) {
      return new Response(
        JSON.stringify({ success: false, error: "Security check failed. Please try again." }),
        { status: 403, headers: JSON_HEADERS }
      );
    }

    const db = env.PROVENAI_DB;
    const now = new Date();
    const nowIso = now.toISOString();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Check for existing non-expired token for this email
    const existing = await db
      .prepare(
        "SELECT token FROM pg_guest_tokens WHERE email = ? AND expires_at > ? LIMIT 1"
      )
      .bind(email, nowIso)
      .first<{ token: string }>();

    const token = existing?.token ?? randomHex(16);

    if (!existing) {
      await db
        .prepare(
          `INSERT INTO pg_guest_tokens (id, email, token, created_at, expires_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(crypto.randomUUID(), email, token, nowIso, expires)
        .run();
    }

    // Read SaasDesk credentials from site_settings
    const sdUrl = await db
      .prepare("SELECT value FROM site_settings WHERE key = 'saasdesk_webhook_url'")
      .first<{ value: string }>();
    const sdKey = await db
      .prepare("SELECT value FROM site_settings WHERE key = 'saasdesk_api_key'")
      .first<{ value: string }>();

    if (sdUrl?.value && sdKey?.value) {
      const accessUrl = `https://provenai.app/promptgenerator?token=${token}`;
      try {
        await fetch(sdUrl.value, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sdKey.value}`,
          },
          body: JSON.stringify({
            email,
            source: "prompt_generator",
            access_token: token,
            access_url: accessUrl,
          }),
        });
      } catch {
        // Don't fail the request if SaasDesk is unavailable
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
