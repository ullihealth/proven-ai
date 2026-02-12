/**
 * GET /api/briefing?limit=4
 *
 * Returns the latest published briefing items for the dashboard.
 * Prefers one item per category, up to BRIEFING_MAX_ITEMS_VISIBLE.
 */

import type { BriefingEnv, BriefingItem } from "./_helpers";
import { getConfigInt, BRIEFING_CATEGORIES } from "./_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  try {
    const db = env.PROVENAI_DB;
    const url = new URL(request.url);

    const maxVisible = await getConfigInt(db, env, "BRIEFING_MAX_ITEMS_VISIBLE", 4);
    const requestedLimit = parseInt(url.searchParams.get("limit") || String(maxVisible), 10);
    const limit = Math.min(
      Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : maxVisible,
      20 // hard cap
    );

    // Strategy: pick the most recent published item per category, then fill
    // remaining slots with the most recent items regardless of category.
    const categoryKeys = Object.keys(BRIEFING_CATEGORIES);

    // 1. One per category (most recent published)
    const perCategoryItems: BriefingItem[] = [];
    for (const cat of categoryKeys) {
      if (perCategoryItems.length >= limit) break;
      const row = await db
        .prepare(
          `SELECT * FROM briefing_items
           WHERE status = 'published' AND category = ?
           ORDER BY fetched_at DESC
           LIMIT 1`
        )
        .bind(cat)
        .first<BriefingItem>();
      if (row) perCategoryItems.push(row);
    }

    // 2. If we still need more, fill with most recent published (skip dupes)
    let items = perCategoryItems;
    if (items.length < limit) {
      const existingIds = new Set(items.map((i) => i.id));
      const remaining = limit - items.length;
      const { results: extras } = await db
        .prepare(
          `SELECT * FROM briefing_items
           WHERE status = 'published'
           ORDER BY fetched_at DESC
           LIMIT ?`
        )
        .bind(remaining + items.length) // fetch enough to filter
        .all<BriefingItem>();

      for (const row of extras || []) {
        if (items.length >= limit) break;
        if (!existingIds.has(row.id)) {
          items.push(row);
          existingIds.add(row.id);
        }
      }
    }

    // Enrich with source name and category label
    const sourceIds = [...new Set(items.map((i) => i.source_id))];
    const sourceMap: Record<string, string> = {};
    for (const sid of sourceIds) {
      const src = await db
        .prepare("SELECT name FROM briefing_sources WHERE id = ?")
        .bind(sid)
        .first<{ name: string }>();
      if (src) sourceMap[sid] = src.name;
    }

    const response = items.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      summary: item.summary,
      category: item.category,
      categoryLabel: BRIEFING_CATEGORIES[item.category] || "Other",
      sourceName: sourceMap[item.source_id] || "Unknown",
      publishedAt: item.published_at,
      fetchedAt: item.fetched_at,
    }));

    return new Response(JSON.stringify({ items: response }), {
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
