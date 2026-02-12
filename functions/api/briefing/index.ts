/**
 * GET /api/briefing?limit=8
 *
 * Returns the latest published briefing items for the dashboard.
 * Prefers one item per category, up to the requested limit.
 *
 * Batched to use ≤3 DB round-trips (config, items, sources).
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

    const maxVisible = await getConfigInt(db, env, "BRIEFING_MAX_ITEMS_VISIBLE", 8);
    const requestedLimit = parseInt(url.searchParams.get("limit") || String(maxVisible), 10);
    const limit = Math.min(
      Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : maxVisible,
      20 // hard cap
    );

    // ── Single query: fetch recent published items (generous pool to pick from) ──
    const { results: pool } = await db
      .prepare(
        `SELECT * FROM briefing_items
         WHERE status = 'published'
         ORDER BY fetched_at DESC
         LIMIT 40`
      )
      .all<BriefingItem>();

    if (!pool || pool.length === 0) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Pick one per category first, then fill remaining slots ──
    const categoryKeys = Object.keys(BRIEFING_CATEGORIES);
    const usedIds = new Set<string>();
    const items: BriefingItem[] = [];

    // Pass 1: one per category (in category priority order)
    for (const cat of categoryKeys) {
      if (items.length >= limit) break;
      const match = pool.find((r) => r.category === cat && !usedIds.has(r.id));
      if (match) {
        items.push(match);
        usedIds.add(match.id);
      }
    }

    // Pass 2: fill remaining slots in recency order
    for (const row of pool) {
      if (items.length >= limit) break;
      if (!usedIds.has(row.id)) {
        items.push(row);
        usedIds.add(row.id);
      }
    }

    // ── Batch-fetch all source names in one query ──
    const sourceIds = [...new Set(items.map((i) => i.source_id))];
    const sourceMap: Record<string, string> = {};

    if (sourceIds.length > 0) {
      const placeholders = sourceIds.map(() => "?").join(",");
      const { results: sources } = await db
        .prepare(`SELECT id, name FROM briefing_sources WHERE id IN (${placeholders})`)
        .bind(...sourceIds)
        .all<{ id: string; name: string }>();

      for (const s of sources || []) {
        sourceMap[s.id] = s.name;
      }
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
