/**
 * POST /api/admin/briefing/run
 *
 * Triggers an immediate briefing run (for manual mode or forced refresh).
 * Admin-protected (placeholder auth – swap to Better Auth later).
 */

import type { BriefingEnv, BriefingSource, BriefingRun } from "../../briefing/_helpers";
import {
  getConfig,
  getConfigInt,
  computeItemHash,
  placeholderSummarise,
  inferCategory,
  fetchRSS,
  isAdminRequest,
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

    // Create a run record
    const runId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const startedAt = new Date().toISOString();
    await db
      .prepare(
        "INSERT INTO briefing_runs (id, started_at, status) VALUES (?, ?, 'running')"
      )
      .bind(runId, startedAt)
      .run();

    let totalFetched = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    const sourceErrors: { source: string; error: string }[] = [];

    // Fetch all enabled sources
    const { results: sources } = await db
      .prepare("SELECT * FROM briefing_sources WHERE enabled = 1")
      .all<BriefingSource>();

    if (!sources || sources.length === 0) {
      await finaliseRun(db, runId, "success", 0, 0, 0, "No enabled sources.");
      return new Response(
        JSON.stringify({ ok: true, runId, status: "success", message: "No enabled sources." }),
        { headers: jsonHeaders }
      );
    }

    // Process each source
    for (const source of sources) {
      const rssResult = await fetchRSS(source.url);

      if (!rssResult.ok) {
        sourceErrors.push({ source: source.name, error: rssResult.error || "Unknown fetch error" });
        continue;
      }

      const rssItems = rssResult.items;
      totalFetched += rssItems.length;

      for (const rssItem of rssItems) {
        try {
          const hash = await computeItemHash(rssItem.title, rssItem.link);
          const category = inferCategory(source.category_hint, rssItem.title);
          const summary = placeholderSummarise(rssItem.title, rssItem.description);

          const existing = await db
            .prepare("SELECT id FROM briefing_items WHERE hash = ?")
            .bind(hash)
            .first<{ id: string }>();

          if (!existing) {
            const itemId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
            await db
              .prepare(
                `INSERT INTO briefing_items
                 (id, source_id, title, url, published_at, hash, category, summary, raw_excerpt, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
              )
              .bind(
                itemId,
                source.id,
                rssItem.title,
                rssItem.link,
                rssItem.pubDate || null,
                hash,
                category,
                summary,
                rssItem.description?.slice(0, 500) || null
              )
              .run();
            totalCreated++;
          } else {
            totalUpdated++;
          }
        } catch (itemErr) {
          // Single item failure shouldn't abort the whole source
          const msg = itemErr instanceof Error ? itemErr.message : String(itemErr);
          sourceErrors.push({ source: source.name, error: `Item error: ${msg}` });
        }
      }
    }

    // Auto-publish drafts (for now, since we don't have review flow yet)
    await db
      .prepare("UPDATE briefing_items SET status = 'published' WHERE status = 'draft'")
      .run();

    // Prune old items
    const maxStored = await getConfigInt(db, env, "BRIEFING_MAX_ITEMS_STORED", 200);
    await db
      .prepare(
        `DELETE FROM briefing_items
         WHERE id NOT IN (
           SELECT id FROM briefing_items ORDER BY fetched_at DESC LIMIT ?
         )`
      )
      .bind(maxStored)
      .run();

    const status = sourceErrors.length > 0 ? "partial" : "success";
    const errorMsg = sourceErrors.length > 0
      ? sourceErrors.map((e) => `${e.source}: ${e.error}`).join("; ")
      : null;
    await finaliseRun(db, runId, status, totalFetched, totalCreated, totalUpdated, errorMsg);

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

async function finaliseRun(
  db: D1Database,
  runId: string,
  status: string,
  fetched: number,
  created: number,
  updated: number,
  errorMessage: string | null
) {
  await db
    .prepare(
      `UPDATE briefing_runs
       SET finished_at = ?, status = ?, items_fetched = ?, items_created = ?, items_updated = ?, error_message = ?
       WHERE id = ?`
    )
    .bind(
      new Date().toISOString(),
      status,
      fetched,
      created,
      updated,
      errorMessage,
      runId
    )
    .run();
}
