/**
 * POST /api/admin/pg-invites/generate
 *
 * Generates invite tokens for a list of email addresses.
 * Skips silently if a token for that email already exists.
 *
 * Body: { emails: string[] }
 * Returns: { results: [ { email, token, link } ] }
 */

import { requireAdmin, JSON_HEADERS } from "../../lessons/_helpers";
import type { LessonApiEnv } from "../../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const BASE_URL = "https://provenai.app";

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as { emails?: unknown };
    if (!Array.isArray(body.emails)) {
      return new Response(
        JSON.stringify({ ok: false, error: "emails must be an array" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const emails: string[] = body.emails
      .filter((e): e is string => typeof e === "string")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No valid email addresses provided" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const db = env.PROVENAI_DB;
    const now = new Date().toISOString();
    const results: { email: string; token: string; link: string }[] = [];

    for (const email of emails) {
      // Check if a token already exists for this email
      const existing = await db
        .prepare("SELECT token FROM pg_invite_tokens WHERE email = ? LIMIT 1")
        .bind(email)
        .first<{ token: string }>();

      if (existing) {
        results.push({
          email,
          token: existing.token,
          link: `${BASE_URL}/api/pg-invite/${existing.token}`,
        });
        continue;
      }

      const token = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO pg_invite_tokens (token, email, created_at) VALUES (?, ?, ?)"
        )
        .bind(token, email, now)
        .run();

      results.push({
        email,
        token,
        link: `${BASE_URL}/api/pg-invite/${token}`,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, results }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[admin/pg-invites/generate] error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
