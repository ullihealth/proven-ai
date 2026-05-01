/**
 * POST /api/pg-signup
 *
 * Captures an email lead from the anonymous prompt generator.
 * On success:
 *  - Inserts into pg_leads (or skips if email already exists)
 *  - Creates/returns a guest token giving the user Tier 4 (Free Member) access
 *  - Syncs the lead to SaasDesk via the subscriber webhook
 *
 * Returns: { ok: true, status: "new"|"existing", token: string }
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";
import { JSON_HEADERS } from "../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as { email?: string; anon_id?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "A valid email address is required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const db = env.PROVENAI_DB;
    const now = new Date();
    const nowIso = now.toISOString();
    const dateBucket = nowIso.slice(0, 7); // YYYY-MM

    // Check if lead already exists
    const existing = await db
      .prepare("SELECT id, saasdesk_synced FROM pg_leads WHERE email = ? LIMIT 1")
      .bind(email)
      .first<{ id: number; saasdesk_synced: number }>();

    // If existing lead never synced to SaasDesk, retry now
    if (existing && existing.saasdesk_synced === 0) {
      const saasBase = (env.SAASDESK_BASE_URL ?? "https://saasdesk.dev").replace(/\/$/, "");
      const saasKey = env.SAASDESK_WEBHOOK_API_KEY;
      if (saasKey) {
        try {
          const saasRes = await fetch(`${saasBase}/api/webhooks/subscriber`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-API-Key": saasKey },
            body: JSON.stringify({ email, firstname: "", source: "prompt-generator", submitted_at: nowIso }),
          });
          if (saasRes.ok) {
            await db.prepare("UPDATE pg_leads SET saasdesk_synced = 1 WHERE email = ?").bind(email).run();
          }
        } catch { /* silent */ }
      }
    }

    if (!existing) {
      // Count prompts used before signup from anonymous usage
      let promptsUsed = 0;
      const anonId = body.anon_id;
      if (anonId && UUID_RE.test(anonId)) {
        const usageRow = await db
          .prepare("SELECT COUNT(*) as count FROM pg_usage WHERE user_identifier = ?")
          .bind(`anon:${anonId}`)
          .first<{ count: number }>();
        promptsUsed = usageRow?.count ?? 0;
      }

      // Insert lead
      await db
        .prepare(
          "INSERT INTO pg_leads (email, captured_at, date_bucket, prompts_used_before_signup, saasdesk_synced) VALUES (?, ?, ?, ?, 0)"
        )
        .bind(email, nowIso, dateBucket, promptsUsed)
        .run();

      // Sync to SaasDesk (fire and forget — lead captured regardless)
      const saasBase = (env.SAASDESK_BASE_URL ?? "https://saasdesk.dev").replace(/\/$/, "");
      const saasKey = env.SAASDESK_WEBHOOK_API_KEY;
      if (saasKey) {
        try {
          const saasRes = await fetch(`${saasBase}/api/webhooks/subscriber`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": saasKey,
            },
            body: JSON.stringify({
              email,
              firstname: "",
              source: "prompt-generator",
              submitted_at: nowIso,
            }),
          });
          if (saasRes.ok) {
            await db
              .prepare("UPDATE pg_leads SET saasdesk_synced = 1 WHERE email = ?")
              .bind(email)
              .run();
          } else {
            console.error("[pg-signup] SaasDesk returned non-ok:", saasRes.status);
          }
        } catch (err) {
          console.error("[pg-signup] SaasDesk sync failed:", err);
          // saasdesk_synced stays 0 — admin can retry later
        }
      }
    }

    // Create or reuse a valid guest token for this email (Tier 4 access)
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

    const existingToken = await db
      .prepare(
        "SELECT token FROM pg_guest_tokens WHERE email = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
      )
      .bind(email, nowIso)
      .first<{ token: string }>();

    let token: string;
    if (existingToken) {
      token = existingToken.token;
    } else {
      token = crypto.randomUUID();
      const tokenId = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO pg_guest_tokens (id, email, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(tokenId, email, token, nowIso, expiresAt)
        .run();
    }

    return new Response(
      JSON.stringify({ ok: true, status: existing ? "existing" : "new", token }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[pg-signup] error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error. Please try again." }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
