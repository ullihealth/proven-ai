/**
 * /api/admin/tools — Admin CRUD for the added_tools D1 table.
 *
 * GET  → returns all tools (sorted newest first)
 * POST → inserts a new tool
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

type ToolRow = {
  id: string;
  name: string;
  best_for: string;
  primary_category: string;
  secondary_categories: string;
  intent_tags: string;
  platforms: string;
  pricing_model: string;
  skill_level: string;
  trust_level: string;
  official_url: string;
  last_reviewed: string;
  notes: string;
  added_at: string;
};

function rowToTool(row: ToolRow) {
  return {
    id: row.id,
    name: row.name,
    bestFor: row.best_for,
    primaryCategory: row.primary_category,
    secondaryCategories: JSON.parse(row.secondary_categories || "[]"),
    intentTags: JSON.parse(row.intent_tags || "[]"),
    platforms: JSON.parse(row.platforms || '["web"]'),
    pricingModel: row.pricing_model,
    skillLevel: row.skill_level,
    trustLevel: row.trust_level,
    officialUrl: row.official_url,
    lastReviewed: row.last_reviewed,
    notes: row.notes,
    addedAt: row.added_at,
  };
}

export const onRequest: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;

  // ── GET all tools ──────────────────────────────────────────────────────────
  if (request.method === "GET") {
    const { results } = await db
      .prepare("SELECT * FROM added_tools ORDER BY added_at DESC")
      .all<ToolRow>();
    return new Response(
      JSON.stringify({ success: true, tools: results.map(rowToTool) }),
      { headers: JSON_HEADERS }
    );
  }

  // ── POST new tool ──────────────────────────────────────────────────────────
  if (request.method === "POST") {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      bestFor?: string;
      primaryCategory?: string;
      secondaryCategories?: string[];
      intentTags?: string[];
      platforms?: string[];
      pricingModel?: string;
      skillLevel?: string;
      officialUrl?: string;
      notes?: string;
    };

    const { id, name, primaryCategory, officialUrl } = body;
    if (!id || !name || !primaryCategory || !officialUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: id, name, primaryCategory, officialUrl" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // Check for duplicate id
    const existing = await db
      .prepare("SELECT id FROM added_tools WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, error: `A tool with id "${id}" already exists` }),
        { status: 409, headers: JSON_HEADERS }
      );
    }

    await db
      .prepare(
        `INSERT INTO added_tools
         (id, name, best_for, primary_category, secondary_categories,
          intent_tags, platforms, pricing_model, skill_level, official_url, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        name,
        body.bestFor ?? "",
        primaryCategory,
        JSON.stringify(body.secondaryCategories ?? []),
        JSON.stringify(body.intentTags ?? []),
        JSON.stringify(body.platforms ?? ["web"]),
        body.pricingModel ?? "freemium",
        body.skillLevel ?? "beginner",
        officialUrl,
        body.notes ?? ""
      )
      .run();

    return new Response(
      JSON.stringify({ success: true, id }),
      { headers: JSON_HEADERS }
    );
  }

  return new Response(
    JSON.stringify({ success: false, error: "Method not allowed" }),
    { status: 405, headers: JSON_HEADERS }
  );
};
