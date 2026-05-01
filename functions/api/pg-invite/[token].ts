/**
 * GET /api/pg-invite/:token
 *
 * Activates a personalised invite link for the prompt generator.
 * On success: inserts the email into pg_leads, creates a guest token,
 * syncs to SaasDesk (fire-and-forget), and redirects to the generator.
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";

interface InviteEnv extends LessonApiEnv {
  SAASDESK_BASE_URL?: string;
  SAASDESK_WEBHOOK_API_KEY?: string;
}

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

function redirect(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url } });
}

export const onRequestGet: PagesFunction<InviteEnv> = async ({ request, env, params }) => {
  const inviteToken = params.token ?? "";

  if (!inviteToken) {
    return redirect("/promptgenerator?error=invalid_invite");
  }

  const db = env.PROVENAI_DB;
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    // 1. Look up the invite token
    const invite = await db
      .prepare("SELECT id, email, activated FROM pg_invite_tokens WHERE token = ? LIMIT 1")
      .bind(inviteToken)
      .first<{ id: number; email: string; activated: number }>();

    if (!invite) {
      return redirect("/promptgenerator?error=invalid_invite");
    }

    const email = invite.email;

    // 2. Already activated — try to reuse an existing guest token
    if (invite.activated) {
      const existingGuestToken = await db
        .prepare(
          "SELECT token FROM pg_guest_tokens WHERE email = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
        )
        .bind(email, nowIso)
        .first<{ token: string }>();

      if (existingGuestToken) {
        return redirect(
          `/promptgenerator?token=${encodeURIComponent(existingGuestToken.token)}&activated=true`
        );
      }

      return new Response("This invite link has already been used.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 3. Valid and not yet activated — proceed with activation
    const dateBucket = nowIso.slice(0, 7); // YYYY-MM

    // a. Insert into pg_leads if not already there
    const existingLead = await db
      .prepare("SELECT id FROM pg_leads WHERE email = ? LIMIT 1")
      .bind(email)
      .first<{ id: number }>();

    if (!existingLead) {
      await db
        .prepare(
          "INSERT INTO pg_leads (email, captured_at, date_bucket, prompts_used_before_signup, saasdesk_synced) VALUES (?, ?, ?, 0, 0)"
        )
        .bind(email, nowIso, dateBucket)
        .run();
    }

    // b. Create a guest token for this email (Tier 4 access, 90-day expiry)
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const guestToken = crypto.randomUUID();
    const guestTokenId = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO pg_guest_tokens (id, email, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(guestTokenId, email, guestToken, nowIso, expiresAt)
      .run();

    // c. Mark invite token as activated
    await db
      .prepare(
        "UPDATE pg_invite_tokens SET activated = 1, activated_at = ? WHERE id = ?"
      )
      .bind(nowIso, invite.id)
      .run();

    // d. Sync to SaasDesk (fire and forget)
    const saasBase = (env.SAASDESK_BASE_URL ?? "https://saasdesk.dev").replace(/\/$/, "");
    const saasKey = env.SAASDESK_WEBHOOK_API_KEY;
    const inviteLink = `https://provenai.app/api/pg-invite/${encodeURIComponent(inviteToken)}`;
    if (saasKey) {
      fetch(`${saasBase}/api/webhooks/subscriber`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": saasKey,
        },
        body: JSON.stringify({
          email,
          firstname: "",
          source: "prompt-generator-invite",
          submitted_at: nowIso,
          invite_link: inviteLink,
        }),
      })
        .then(async (res) => {
          if (res.ok && !existingLead) {
            await db
              .prepare("UPDATE pg_leads SET saasdesk_synced = 1 WHERE email = ?")
              .bind(email)
              .run();
          }
        })
        .catch(() => {
          // silently ignore — lead is already captured
        });
    }

    // e. Redirect to the generator with the guest token + activation flag
    return redirect(
      `/promptgenerator?token=${encodeURIComponent(guestToken)}&activated=true`
    );
  } catch (err) {
    console.error("[pg-invite] error:", err);
    return redirect("/promptgenerator?error=invalid_invite");
  }
};
