/**
 * GET /api/briefing?limit=60
 *
 * Returns the latest published briefing items for the dashboard.
 * Guarantees proportional representation across all categories.
 *
 * Algorithm:
 * 1. Fetch generous pool per category (separate queries, parallel).
 * 2. Deduplicate by URL, fallback to title.
 * 3. Allocate ceil(limit/numCategories) items per category, sorted by pubDate desc.
 * 4. Fill remaining slots from leftover items by recency.
 *
 * Batched to use ≤4 DB round-trips (config, items per category, sources).
 */

import type { BriefingEnv, BriefingItem } from "./_helpers";
import { getConfigInt, BRIEFING_CATEGORIES, INTEL_CATEGORIES } from "./_helpers";

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
      60 // hard cap
    );

    const numCategories = INTEL_CATEGORIES.length; // 4
    const perCategoryLimit = Math.ceil(limit / numCategories); // e.g. 15 for limit=60
    const poolPerCategory = Math.max(perCategoryLimit * 2, 30); // generous fetch for dedup headroom

    // ── Fetch items per category in a single batch ──
    const categoryQueries = INTEL_CATEGORIES.map((cat) =>
      db
        .prepare(
          `SELECT * FROM briefing_items
           WHERE status = 'published' AND category = ?
           ORDER BY published_at DESC, fetched_at DESC
           LIMIT ?`
        )
        .bind(cat, poolPerCategory)
    );

    const batchResults = await db.batch<BriefingItem>(categoryQueries);

    // ── Merge all category pools ──
    const allItems: BriefingItem[] = [];
    for (const result of batchResults) {
      if (result.results) {
        allItems.push(...result.results);
      }
    }

    if (allItems.length === 0) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Deduplicate by URL (primary), then title fallback ──
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const deduped: BriefingItem[] = [];

    for (const item of allItems) {
      const normUrl = (item.url || "").trim().toLowerCase();
      const normTitle = (item.title || "").trim().toLowerCase();

      if (normUrl && seenUrls.has(normUrl)) continue;
      if (!normUrl && normTitle && seenTitles.has(normTitle)) continue;

      if (normUrl) seenUrls.add(normUrl);
      if (normTitle) seenTitles.add(normTitle);
      deduped.push(item);
    }

    // ── Sort each category by pubDate desc, allocate per-category quota ──
    const byCategory: Record<string, BriefingItem[]> = {};
    for (const cat of INTEL_CATEGORIES) {
      byCategory[cat] = [];
    }
    for (const item of deduped) {
      const cat = item.category;
      if (byCategory[cat]) {
        byCategory[cat].push(item);
      }
    }

    // Sort each category by published_at descending
    for (const cat of INTEL_CATEGORIES) {
      byCategory[cat].sort((a, b) => {
        const da = new Date(a.published_at || a.fetched_at).getTime();
        const db_ = new Date(b.published_at || b.fetched_at).getTime();
        return db_ - da;
      });
    }

    const items: BriefingItem[] = [];
    const usedIds = new Set<string>();
    const overflow: BriefingItem[] = [];

    // Pass 1: allocate up to perCategoryLimit per category
    for (const cat of INTEL_CATEGORIES) {
      const catItems = byCategory[cat];
      let taken = 0;
      for (const item of catItems) {
        if (taken >= perCategoryLimit) {
          overflow.push(item);
          continue;
        }
        items.push(item);
        usedIds.add(item.id);
        taken++;
      }
      // Push remaining to overflow
      if (taken < catItems.length) {
        for (let i = taken; i < catItems.length; i++) {
          if (!usedIds.has(catItems[i].id)) {
            overflow.push(catItems[i]);
          }
        }
      }
    }

    // Pass 2: fill remaining slots from overflow by recency
    overflow.sort((a, b) => {
      const da = new Date(a.published_at || a.fetched_at).getTime();
      const db_ = new Date(b.published_at || b.fetched_at).getTime();
      return db_ - da;
    });

    for (const item of overflow) {
      if (items.length >= limit) break;
      if (!usedIds.has(item.id)) {
        items.push(item);
        usedIds.add(item.id);
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
      commentary: item.commentary || null,
      category: item.category,
      categoryLabel: BRIEFING_CATEGORIES[item.category] || "Other",
      sourceName: sourceMap[item.source_id] || "Unknown",
      publishedAt: item.published_at,
      fetchedAt: item.fetched_at,
      imageUrl: item.image_url || null,
      excerpt: item.excerpt_clean || item.raw_excerpt || null,
      readingTimeMin: item.reading_time_min || null,
      // Structured summary fields
      summaryWhatChanged: item.summary_what_changed || null,
      summaryWhyMatters: item.summary_why_matters || null,
      summaryTakeaway: item.summary_takeaway || null,
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
