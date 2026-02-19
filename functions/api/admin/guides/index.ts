/**
 * Admin Guides API — CRUD for guides
 *
 * GET    /api/admin/guides              — list all guides
 * POST   /api/admin/guides              — create a guide
 * PUT    /api/admin/guides              — update a guide
 * DELETE /api/admin/guides?id=xxx       — delete a guide
 * PATCH  /api/admin/guides              — reorder guides in a cluster
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

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

// GET — list all guides (admin gets all fields)
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare(
      `SELECT id, slug, title, description, who_for, why_matters, last_updated,
              lifecycle_state, difficulty, tags, primary_cluster_id, order_in_cluster,
              show_in_cluster, show_in_discovery, thumbnail_url, view_count, created_at, updated_at
       FROM guides ORDER BY created_at DESC`
    )
    .all();

  const guides = (results || []).map((r) =>
    mapGuideRow(r as Record<string, unknown>)
  );

  return new Response(JSON.stringify({ ok: true, guides }), {
    headers: JSON_HEADERS,
  });
};

// POST — create a new guide
export const onRequestPost: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = (body.id as string) || `guide-${Date.now()}`;
  const slug = (body.slug as string) || id;
  const title = (body.title as string) || "Untitled Guide";
  const description = (body.description as string) || "";
  const whoFor = (body.whoFor as string) || "";
  const whyMatters = (body.whyMatters as string) || "";
  const lastUpdated =
    (body.lastUpdated as string) || new Date().toISOString().split("T")[0];
  const lifecycleState = (body.lifecycleState as string) || "current";
  const difficulty = (body.difficulty as string) || "beginner";
  const tags = JSON.stringify(body.tags || []);
  const primaryClusterId = (body.primaryClusterId as string) || null;
  const orderInCluster = (body.orderInCluster as number) ?? 0;
  const showInCluster = body.showInCluster !== false ? 1 : 0;
  const showInDiscovery = body.showInDiscovery !== false ? 1 : 0;
  const thumbnailUrl = (body.thumbnailUrl as string) || "";
  const viewCount = (body.viewCount as number) ?? 0;
  const createdAt =
    (body.createdAt as string) || new Date().toISOString();

  const db = env.PROVENAI_DB;
  await db
    .prepare(
      `INSERT INTO guides (id, slug, title, description, who_for, why_matters, last_updated,
        lifecycle_state, difficulty, tags, primary_cluster_id, order_in_cluster,
        show_in_cluster, show_in_discovery, thumbnail_url, view_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      id, slug, title, description, whoFor, whyMatters, lastUpdated,
      lifecycleState, difficulty, tags, primaryClusterId, orderInCluster,
      showInCluster, showInDiscovery, thumbnailUrl, viewCount, createdAt
    )
    .run();

  return new Response(
    JSON.stringify({ ok: true, id }),
    { status: 201, headers: JSON_HEADERS }
  );
};

// PUT — update an existing guide
export const onRequestPut: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id as string;
  if (!id)
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });

  const db = env.PROVENAI_DB;
  await db
    .prepare(
      `UPDATE guides SET
        slug = ?, title = ?, description = ?, who_for = ?, why_matters = ?,
        last_updated = ?, lifecycle_state = ?, difficulty = ?, tags = ?,
        primary_cluster_id = ?, order_in_cluster = ?, show_in_cluster = ?,
        show_in_discovery = ?, thumbnail_url = ?, view_count = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      (body.slug as string) || id,
      (body.title as string) || "",
      (body.description as string) || "",
      (body.whoFor as string) || "",
      (body.whyMatters as string) || "",
      (body.lastUpdated as string) || "",
      (body.lifecycleState as string) || "current",
      (body.difficulty as string) || "beginner",
      JSON.stringify(body.tags || []),
      (body.primaryClusterId as string) || null,
      (body.orderInCluster as number) ?? 0,
      body.showInCluster !== false ? 1 : 0,
      body.showInDiscovery !== false ? 1 : 0,
      (body.thumbnailUrl as string) || "",
      (body.viewCount as number) ?? 0,
      id
    )
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// DELETE — remove a guide
export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });

  const db = env.PROVENAI_DB;
  await db.prepare("DELETE FROM guides WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// PATCH — reorder guides in a cluster
export const onRequestPatch: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    clusterId: string;
    guideIds: string[];
  };
  if (!body.clusterId || !body.guideIds) {
    return new Response(
      JSON.stringify({ error: "clusterId and guideIds required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;
  const stmts = body.guideIds.map((gid, idx) =>
    db
      .prepare(
        "UPDATE guides SET order_in_cluster = ?, updated_at = datetime('now') WHERE id = ? AND primary_cluster_id = ?"
      )
      .bind(idx, gid, body.clusterId)
  );

  await db.batch(stmts);

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
