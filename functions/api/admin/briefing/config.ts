/**
 * GET /api/admin/briefing/config  – return all BRIEFING_* config keys
 * PUT /api/admin/briefing/config  – update one or more config keys
 *
 * Body for PUT: { settings: { key: value, ... } }
 */

import type { BriefingEnv } from "../../briefing/_helpers";
import { isAdminRequest } from "../../briefing/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const ALLOWED_KEYS = [
  "BRIEFING_REFRESH_MODE",
  "BRIEFING_MAX_ITEMS_VISIBLE",
  "BRIEFING_MAX_ITEMS_STORED",
  "BRIEFING_MIN_HOURS_BETWEEN_RUNS",
  "BRIEFING_3X_WEEK_DAYS",
];

export const onRequestGet: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  if (!isAdminRequest(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = env.PROVENAI_DB;
    const { results } = await db
      .prepare("SELECT key, value, description, updated_at FROM app_config WHERE key LIKE 'BRIEFING_%'")
      .all<{ key: string; value: string; description: string | null; updated_at: string }>();

    const settings: Record<string, string> = {};
    for (const row of results || []) {
      settings[row.key] = row.value;
    }

    return new Response(JSON.stringify({ settings }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestPut: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  if (!isAdminRequest(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = env.PROVENAI_DB;
    const body = (await request.json()) as { settings: Record<string, string> };

    if (!body.settings || typeof body.settings !== "object") {
      return new Response(JSON.stringify({ error: "settings object required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const updated: string[] = [];

    for (const [key, value] of Object.entries(body.settings)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      await db
        .prepare(
          `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        )
        .bind(key, String(value), now)
        .run();
      updated.push(key);
    }

    return new Response(JSON.stringify({ updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
