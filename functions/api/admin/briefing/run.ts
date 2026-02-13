/**
 * POST /api/admin/briefing/run
 *
 * Triggers an immediate briefing run (for manual mode or forced refresh).
 * Admin-protected (placeholder auth – swap to Better Auth later).
 */

import type { BriefingEnv, BriefingSource } from "../../briefing/_helpers";
import {
  computeItemHash,
  placeholderSummarise,
  inferCategory,
  fetchRSS,
  isAdminRequest,
  buildExcerpt,
  stripHtml,
  generateStructuredSummary,
  computeReadingTime,
} from "../../briefing/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    if (!isAdminRequest(request, env)) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const db = env.PROVENAI_DB;

    // ---- 1. Create run record + fetch sources + existing hashes in one batch (3 subrequests → 1) ----
    const runId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const startedAt = new Date().toISOString();

    const [, sourcesResult, hashesResult] = await db.batch([
      db.prepare("INSERT INTO briefing_runs (id, started_at, status) VALUES (?, ?, 'running')").bind(runId, startedAt),
      db.prepare("SELECT * FROM briefing_sources WHERE enabled = 1"),
      db.prepare("SELECT hash FROM briefing_items"),
    ]);

    const sources = (sourcesResult.results || []) as unknown as BriefingSource[];
    const existingHashes = new Set(
      ((hashesResult.results || []) as unknown as { hash: string }[]).map((r) => r.hash)
    );

    if (sources.length === 0) {
      await db.prepare(
        `UPDATE briefing_runs SET finished_at = ?, status = 'success', items_fetched = 0, items_created = 0, items_updated = 0, error_message = 'No enabled sources.' WHERE id = ?`
      ).bind(new Date().toISOString(), runId).run();
      return new Response(
        JSON.stringify({ ok: true, runId, status: "success", message: "No enabled sources." }),
        { headers: jsonHeaders }
      );
    }

    let totalFetched = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    const sourceErrors: { source: string; error: string }[] = [];

    // ---- 2. Fetch all RSS feeds (N subrequests — unavoidable, but no DB calls in this phase) ----
    // Collect all candidate items first, then batch-insert at the end.
    interface CandidateItem {
      sourceId: string;
      title: string;
      link: string;
      pubDate: string | null;
      hash: string;
      category: string;
      summary: string;
      rawExcerpt: string | null;
      excerptClean: string | null;
      imageUrl: string | null;
      contentHtml: string | null;
      contentText: string | null;
      initialStatus: string; // 'draft' → auto-publish later, 'pending' → manual approval
      // Structured summary
      summaryWhatChanged: string | null;
      summaryWhyMatters: string | null;
      summaryTakeaway: string | null;
      // Metadata
      wordCount: number | null;
      readingTimeMin: number | null;
      readingStatus: string;
    }
    const candidates: CandidateItem[] = [];

    for (const source of sources) {
      const rssResult = await fetchRSS(source.url);

      if (!rssResult.ok) {
        sourceErrors.push({ source: source.name, error: rssResult.error || "Unknown fetch error" });
        continue;
      }

      totalFetched += rssResult.items.length;
      const isManual = source.publishing_mode === "manual";

      for (const rssItem of rssResult.items) {
        try {
          const hash = await computeItemHash(rssItem.title, rssItem.link);

          if (existingHashes.has(hash)) {
            totalUpdated++;
            continue;
          }

          // Mark as seen so we don't insert duplicates within this batch
          existingHashes.add(hash);

          // Build excerpt from best available content
          const excerptRaw = buildExcerpt(rssItem.contentEncoded, rssItem.description) || (rssItem.description ? stripHtml(rssItem.description).slice(0, 500) : null);
          const excerptClean = excerptRaw ? stripHtml(excerptRaw) : null;
          
          // Extract content text for word count
          const contentText = rssItem.contentEncoded ? stripHtml(rssItem.contentEncoded) : (rssItem.description ? stripHtml(rssItem.description) : null);
          const wordCount = contentText ? contentText.split(/\s+/).filter(Boolean).length : null;
          
          // Generate structured summary (placeholder logic - swap with LLM later)
          const shouldGenerateSummary = source.summary_mode_v2 !== 'off';
          const structured = shouldGenerateSummary 
            ? generateStructuredSummary(rssItem.title, excerptClean, rssItem.contentEncoded)
            : { what_changed: null, why_matters: null, takeaway: null };

          candidates.push({
            sourceId: source.id,
            title: rssItem.title,
            link: rssItem.link,
            pubDate: rssItem.pubDate || null,
            hash,
            category: inferCategory(source.category_hint, rssItem.title),
            summary: placeholderSummarise(rssItem.title, rssItem.contentEncoded || rssItem.description),
            rawExcerpt: excerptRaw,
            excerptClean: excerptClean,
            imageUrl: rssItem.imageUrl || null,
            contentHtml: rssItem.contentEncoded || null,
            contentText: contentText,
            initialStatus: isManual ? "pending" : "draft",
            // Structured summary
            summaryWhatChanged: structured.what_changed,
            summaryWhyMatters: structured.why_matters,
            summaryTakeaway: structured.takeaway,
            // Metadata
            wordCount: wordCount,
            readingTimeMin: wordCount ? computeReadingTime(wordCount) : null,
            readingStatus: 'rss_only', // Default - can be upgraded by readability fetch later
          });
        } catch (itemErr) {
          const msg = itemErr instanceof Error ? itemErr.message : String(itemErr);
          sourceErrors.push({ source: source.name, error: `Item error: ${msg}` });
        }
      }
    }

    // ---- 3. Batch-insert all new items + publish + prune + finalise (1 batch call) ----
    const maxStored = 200; // avoid extra DB read; env/config can override later

    const batchStatements: any[] = [];

    for (const c of candidates) {
      const itemId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      batchStatements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO briefing_items
             (id, source_id, title, url, published_at, hash, category, summary, raw_excerpt, excerpt_clean, 
              image_url, content_html, content_text, status, 
              summary_what_changed, summary_why_matters, summary_takeaway,
              word_count, reading_time_min, reading_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            itemId,
            c.sourceId,
            c.title,
            c.link,
            c.pubDate,
            c.hash,
            c.category,
            c.summary,
            c.rawExcerpt,
            c.excerptClean,
            c.imageUrl,
            c.contentHtml,
            c.contentText,
            c.initialStatus,
            c.summaryWhatChanged,
            c.summaryWhyMatters,
            c.summaryTakeaway,
            c.wordCount,
            c.readingTimeMin,
            c.readingStatus
          )
      );
    }
    totalCreated = candidates.length;

    // Append publish, prune, and run-finalise in the same batch
    batchStatements.push(
      db.prepare("UPDATE briefing_items SET status = 'published' WHERE status = 'draft'")
    );
    batchStatements.push(
      db
        .prepare(
          `DELETE FROM briefing_items
           WHERE id NOT IN (
             SELECT id FROM briefing_items ORDER BY fetched_at DESC LIMIT ?
           )`
        )
        .bind(maxStored)
    );

    const status = sourceErrors.length > 0 ? "partial" : "success";
    const errorMsg = sourceErrors.length > 0
      ? sourceErrors.map((e) => `${e.source}: ${e.error}`).join("; ")
      : null;

    batchStatements.push(
      db
        .prepare(
          `UPDATE briefing_runs
           SET finished_at = ?, status = ?, items_fetched = ?, items_created = ?, items_updated = ?, error_message = ?
           WHERE id = ?`
        )
        .bind(new Date().toISOString(), status, totalFetched, totalCreated, totalUpdated, errorMsg, runId)
    );

    await db.batch(batchStatements);

    return new Response(
      JSON.stringify({
        ok: true,
        runId,
        status,
        itemsFetched: totalFetched,
        itemsCreated: totalCreated,
        itemsUpdated: totalUpdated,
        sourceErrors: sourceErrors.length > 0 ? sourceErrors : undefined,
      }),
      { headers: jsonHeaders }
    );
  } catch (error) {
    // Top-level safety net – ALWAYS return JSON
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: jsonHeaders }
    );
  }
};

