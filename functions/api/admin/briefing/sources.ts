/**
 * POST /api/admin/briefing/sources
 *
 * Add or edit briefing sources.
 * Body: { name, url, category_hint?, enabled? }
 * Or for edit: { id, name?, url?, category_hint?, enabled? }
 *
 * Admin-protected (placeholder auth – swap to Better Auth later).
 */

import type { BriefingEnv, BriefingSource } from "../../briefing/_helpers";
import { isAdminRequest } from "../../briefing/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface SourcePayload {
  id?: string;
  name?: string;
  url?: string;
  category_hint?: string | null;
  enabled?: boolean;
}

export const onRequestPost: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  if (!isAdminRequest(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = env.PROVENAI_DB;
    const body = (await request.json()) as SourcePayload;

    // Edit existing source
    if (body.id) {
      const existing = await db
        .prepare("SELECT * FROM briefing_sources WHERE id = ?")
        .bind(body.id)
        .first<BriefingSource>();

      if (!existing) {
        return new Response(JSON.stringify({ error: "Source not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const name = body.name ?? existing.name;
      const url = body.url ?? existing.url;
      const categoryHint =
        body.category_hint !== undefined ? body.category_hint : existing.category_hint;
      const enabled =
        body.enabled !== undefined ? (body.enabled ? 1 : 0) : existing.enabled;

      await db
        .prepare(
          `UPDATE briefing_sources
           SET name = ?, url = ?, category_hint = ?, enabled = ?
           WHERE id = ?`
        )
        .bind(name, url, categoryHint, enabled, body.id)
        .run();

      return new Response(
        JSON.stringify({ id: body.id, name, url, category_hint: categoryHint, enabled }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Create new source
    if (!body.name || !body.url) {
      return new Response(
        JSON.stringify({ error: "name and url are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const newId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await db
      .prepare(
        `INSERT INTO briefing_sources (id, name, url, category_hint, enabled)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        newId,
        body.name,
        body.url,
        body.category_hint || null,
        body.enabled !== false ? 1 : 0
      )
      .run();

    return new Response(
      JSON.stringify({
        id: newId,
        name: body.name,
        url: body.url,
        category_hint: body.category_hint || null,
        enabled: body.enabled !== false,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// GET /api/admin/briefing/sources – list all sources
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
      .prepare("SELECT * FROM briefing_sources ORDER BY created_at DESC")
      .all<BriefingSource>();

    return new Response(JSON.stringify({ sources: results || [] }), {
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
