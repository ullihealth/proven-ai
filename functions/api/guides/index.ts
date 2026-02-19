/**
 * Public Guides API (read-only)
 *
 * GET /api/guides — list all guides
 * GET /api/guides?clusters=1 — list guides grouped by cluster
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";

const JSON_HEADERS = { "Content-Type": "application/json" };

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapGuideRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string) || "",
    whoFor: (row.who_for as string) || "",
    whyMatters: (row.why_matters as string) || "",
    lastUpdated: (row.last_updated as string) || "",
    lifecycleState: (row.lifecycle_state as string) || "current",
    difficulty: (row.difficulty as string) || "beginner",
    tags: safeJsonParse(row.tags, []),
    primaryClusterId: (row.primary_cluster_id as string) || null,
    orderInCluster: (row.order_in_cluster as number) ?? 0,
    showInCluster: row.show_in_cluster === 1 || row.show_in_cluster === true,
    showInDiscovery: row.show_in_discovery === 1 || row.show_in_discovery === true,
    thumbnailUrl: (row.thumbnail_url as string) || undefined,
    viewCount: (row.view_count as number) ?? 0,
    createdAt: (row.created_at as string) || "",
  };
}

function mapClusterRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    order: (row.order as number) ?? 0,
    maxGuides: (row.max_guides as number) ?? 5,
  };
}

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const db = env.PROVENAI_DB;

  const { results: guideRows } = await db
    .prepare(
      `SELECT id, slug, title, description, who_for, why_matters, last_updated,
              lifecycle_state, difficulty, tags, primary_cluster_id, order_in_cluster,
              show_in_cluster, show_in_discovery, thumbnail_url, view_count, created_at
       FROM guides ORDER BY created_at DESC`
    )
    .all();

  const { results: clusterRows } = await db
    .prepare(
      `SELECT id, title, description, "order", max_guides FROM guide_clusters ORDER BY "order"`
    )
    .all();

  const guides = (guideRows || []).map((r) =>
    mapGuideRow(r as Record<string, unknown>)
  );
  const clusters = (clusterRows || []).map((r) =>
    mapClusterRow(r as Record<string, unknown>)
  );

  return new Response(JSON.stringify({ ok: true, guides, clusters }), {
    headers: JSON_HEADERS,
  });
};
