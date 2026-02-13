/**
 * GET /api/briefing/:itemId
 *
 * Returns a single published briefing item by ID for the internal reader.
 */

import type { BriefingEnv, BriefingItem } from "./_helpers";
import { BRIEFING_CATEGORIES } from "./_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<BriefingEnv> = async ({ env, params }) => {
  try {
    const db = env.PROVENAI_DB;
    const itemId = params.itemId;

    if (!itemId) {
      return new Response(JSON.stringify({ error: "Missing item ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const item = await db
      .prepare(
        `SELECT bi.*, bs.name AS source_name, bs.url AS source_url
         FROM briefing_items bi
         LEFT JOIN briefing_sources bs ON bs.id = bi.source_id
         WHERE bi.id = ? AND bi.status = 'published'
         LIMIT 1`
      )
      .bind(itemId)
      .first<BriefingItem & { source_name: string | null; source_url: string | null }>();

    if (!item) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = {
      id: item.id,
      title: item.title,
      url: item.url,
      summary: item.summary,
      rawExcerpt: item.raw_excerpt,
      excerpt: item.excerpt_clean || item.raw_excerpt || null,
      category: item.category,
      categoryLabel: BRIEFING_CATEGORIES[item.category] || "Other",
      sourceName: item.source_name || "Unknown",
      sourceUrl: item.source_url || null,
      publishedAt: item.published_at,
      fetchedAt: item.fetched_at,
      imageUrl: item.image_url || null,
      contentHtml: item.content_html || null,
      contentText: item.content_text || null,
      author: item.author || null,
      wordCount: item.word_count || null,
      readingTimeMin: item.reading_time_min || null,
      readingStatus: item.reading_status || 'rss_only',
      blockedReason: item.blocked_reason || null,
      // Structured summary
      summaryWhatChanged: item.summary_what_changed || null,
      summaryWhyMatters: item.summary_why_matters || null,
      summaryTakeaway: item.summary_takeaway || null,
    };

    return new Response(JSON.stringify({ item: response }), {
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
