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
  parseRSS,
  isAdminRequest,
} from "../../briefing/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  if (!isAdminRequest(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
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
  const errors: string[] = [];

  try {
    // Fetch all enabled sources
    const { results: sources } = await db
      .prepare("SELECT * FROM briefing_sources WHERE enabled = 1")
      .all<BriefingSource>();

    if (!sources || sources.length === 0) {
      await finaliseRun(db, runId, "success", 0, 0, 0, "No enabled sources.");
      return new Response(
        JSON.stringify({ runId, status: "success", message: "No enabled sources." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Process each source
    for (const source of sources) {
      try {
        const resp = await fetch(source.url, {
          headers: { "User-Agent": "ProvenAI-Briefing/1.0" },
        });
        if (!resp.ok) {
          errors.push(`${source.name}: HTTP ${resp.status}`);
          continue;
        }

        const xml = await resp.text();
        const rssItems = parseRSS(xml);
        totalFetched += rssItems.length;

        for (const rssItem of rssItems) {
          const hash = await computeItemHash(rssItem.title, rssItem.link);
          const category = inferCategory(source.category_hint, rssItem.title);
          const summary = placeholderSummarise(rssItem.title, rssItem.description);

          // Upsert: skip if hash already exists
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
        }
      } catch (sourceError) {
        const msg =
          sourceError instanceof Error ? sourceError.message : String(sourceError);
        errors.push(`${source.name}: ${msg}`);
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

    const status = errors.length > 0 ? "success" : "success";
    const errorMsg = errors.length > 0 ? errors.join("; ") : null;
    await finaliseRun(db, runId, status, totalFetched, totalCreated, totalUpdated, errorMsg);

    return new Response(
      JSON.stringify({
        runId,
        status,
        itemsFetched: totalFetched,
        itemsCreated: totalCreated,
        itemsUpdated: totalUpdated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finaliseRun(db, runId, "error", totalFetched, totalCreated, totalUpdated, message);
    return new Response(JSON.stringify({ error: message, runId }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
