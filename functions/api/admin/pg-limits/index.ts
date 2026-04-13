/**
 * GET  /api/admin/pg-limits  — list all tier limits
 * PUT  /api/admin/pg-limits  — update a single tier limit row
 */

import type { LessonApiEnv } from "../lessons/_helpers";
import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";

interface TierRow {
  id: number;
  tier: number;
  tier_name: string;
  monthly_credits: number;
  weight_groq: number;
  weight_gemini: number;
  weight_claude: number;
  updated_at: string;
}

interface PutBody {
  tier: number;
  tier_name?: string;
  monthly_credits: number;
  weight_groq: number;
  weight_gemini: number;
  weight_claude: number;
}

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const { results } = await env.PROVENAI_DB
    .prepare(
      "SELECT id, tier, tier_name, monthly_credits, weight_groq, weight_gemini, weight_claude, updated_at FROM pg_limits ORDER BY tier ASC"
    )
    .all<TierRow>();

  return new Response(JSON.stringify({ tiers: results }), { headers: JSON_HEADERS });
};

export const onRequestPut: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const { tier, tier_name, monthly_credits, weight_groq, weight_gemini, weight_claude } = body;

  if (tier === undefined || tier === null || !Number.isFinite(monthly_credits)) {
    return new Response(
      JSON.stringify({ error: "tier and monthly_credits are required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // Validate weights are positive numbers
  if (
    !Number.isFinite(weight_groq) || weight_groq <= 0 ||
    !Number.isFinite(weight_gemini) || weight_gemini <= 0 ||
    !Number.isFinite(weight_claude) || weight_claude <= 0
  ) {
    return new Response(
      JSON.stringify({ error: "All model weights must be positive numbers" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (monthly_credits < 0) {
    return new Response(
      JSON.stringify({ error: "monthly_credits must be non-negative" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const updatedAt = new Date().toISOString();

  const result = await env.PROVENAI_DB
    .prepare(
      `UPDATE pg_limits
       SET monthly_credits = ?,
           weight_groq = ?,
           weight_gemini = ?,
           weight_claude = ?,
           tier_name = COALESCE(?, tier_name),
           updated_at = ?
       WHERE tier = ?`
    )
    .bind(monthly_credits, weight_groq, weight_gemini, weight_claude, tier_name ?? null, updatedAt, tier)
    .run();

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Update failed" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
