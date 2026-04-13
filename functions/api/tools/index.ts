/**
 * GET /api/tools — Public endpoint returning all D1-added tools (non-archived).
 *
 * Used by toolsStore to merge with the static directoryToolsData.
 */

import { JSON_HEADERS } from "../admin/lessons/_helpers";
import type { LessonApiEnv } from "../admin/lessons/_helpers";

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
  };
}

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ env }) => {
  try {
    const { results } = await env.PROVENAI_DB
      .prepare("SELECT * FROM added_tools WHERE trust_level != 'archived' ORDER BY name ASC")
      .all<ToolRow>();
    return new Response(
      JSON.stringify({ success: true, tools: results.map(rowToTool) }),
      { headers: JSON_HEADERS }
    );
  } catch {
    // Table may not exist yet — return empty gracefully
    return new Response(
      JSON.stringify({ success: true, tools: [] }),
      { headers: JSON_HEADERS }
    );
  }
};
