/**
 * POST /api/admin/pg-leads/retry-sync
 *
 * Finds all pg_leads where saasdesk_synced = 0 and attempts
 * to push each one to SaasDesk again.
 *
 * Returns: { retried: N, succeeded: N, failed: N }
 */

import type { LessonApiEnv } from "../../../lessons/_helpers";
import { requireAdmin, JSON_HEADERS } from "../../../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const saasKey = env.SAASDESK_WEBHOOK_API_KEY;
  if (!saasKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "SAASDESK_WEBHOOK_API_KEY is not configured" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;
  const saasBase = (env.SAASDESK_BASE_URL ?? "https://saasdesk.dev").replace(/\/$/, "");

  const { results } = await db
    .prepare("SELECT id, email, captured_at FROM pg_leads WHERE saasdesk_synced = 0")
    .all<{ id: number; email: string; captured_at: string }>();

  const leads = results ?? [];
  let succeeded = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      const saasRes = await fetch(`${saasBase}/api/webhooks/subscriber`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": saasKey,
        },
        body: JSON.stringify({
          email: lead.email,
          firstname: "",
          source: "prompt-generator",
          submitted_at: lead.captured_at,
        }),
      });

      if (saasRes.ok) {
        await db
          .prepare("UPDATE pg_leads SET saasdesk_synced = 1 WHERE id = ?")
          .bind(lead.id)
          .run();
        succeeded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, retried: leads.length, succeeded, failed }),
    { headers: JSON_HEADERS }
  );
};
