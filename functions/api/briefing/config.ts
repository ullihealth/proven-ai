/**
 * GET /api/briefing/config
 *
 * Returns public-safe INTEL_* config keys for the frontend.
 * No auth required — these control UI behaviour only.
 */

import type { BriefingEnv } from "./_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const PUBLIC_KEYS = [
  "INTEL_SUMMARY_MODE",
  "INTEL_ARTICLE_VIEW",
  "INTEL_COMMENTARY",
];

const DEFAULTS: Record<string, string> = {
  INTEL_SUMMARY_MODE: "standard",
  INTEL_ARTICLE_VIEW: "on",
  INTEL_COMMENTARY: "off",
};

export const onRequestGet: PagesFunction<BriefingEnv> = async ({ env }) => {
  try {
    const db = env.PROVENAI_DB;
    const placeholders = PUBLIC_KEYS.map(() => "?").join(",");
    const { results } = await db
      .prepare(`SELECT key, value FROM app_config WHERE key IN (${placeholders})`)
      .bind(...PUBLIC_KEYS)
      .all<{ key: string; value: string }>();

    const config: Record<string, string> = { ...DEFAULTS };
    for (const row of results || []) {
      config[row.key] = row.value;
    }

    return new Response(JSON.stringify({ config }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message, config: DEFAULTS }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
