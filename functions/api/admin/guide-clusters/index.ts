/**
 * Admin Guide Clusters API — CRUD for guide clusters
 *
 * GET    /api/admin/guide-clusters              — list all clusters
 * POST   /api/admin/guide-clusters              — create a cluster
 * PUT    /api/admin/guide-clusters              — update a cluster
 * DELETE /api/admin/guide-clusters?id=xxx       — delete a cluster
 * PATCH  /api/admin/guide-clusters              — reorder clusters
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

function mapClusterRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    order: (row.order as number) ?? 0,
    maxGuides: (row.max_guides as number) ?? 5,
  };
}

// GET — list all clusters
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare(
      `SELECT id, title, description, "order", max_guides FROM guide_clusters ORDER BY "order"`
    )
    .all();

  const clusters = (results || []).map((r) =>
    mapClusterRow(r as Record<string, unknown>)
  );

  return new Response(JSON.stringify({ ok: true, clusters }), {
    headers: JSON_HEADERS,
  });
};

// POST — create a new cluster
export const onRequestPost: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = (body.id as string) || `cluster-${Date.now()}`;
  const title = (body.title as string) || "Untitled Cluster";
  const description = (body.description as string) || "";
  const order = (body.order as number) ?? 0;
  const maxGuides = (body.maxGuides as number) ?? 5;

  const db = env.PROVENAI_DB;
  await db
    .prepare(
      `INSERT INTO guide_clusters (id, title, description, "order", max_guides, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
    .bind(id, title, description, order, maxGuides)
    .run();

  return new Response(
    JSON.stringify({ ok: true, id }),
    { status: 201, headers: JSON_HEADERS }
  );
};

// PUT — update a cluster
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
      `UPDATE guide_clusters SET
        title = ?, description = ?, "order" = ?, max_guides = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      (body.title as string) || "",
      (body.description as string) || "",
      (body.order as number) ?? 0,
      (body.maxGuides as number) ?? 5,
      id
    )
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// DELETE — remove a cluster (nullifies guide assignments)
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
  // Nullify cluster on assigned guides first
  await db
    .prepare(
      "UPDATE guides SET primary_cluster_id = NULL, updated_at = datetime('now') WHERE primary_cluster_id = ?"
    )
    .bind(id)
    .run();
  await db.prepare("DELETE FROM guide_clusters WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// PATCH — reorder clusters
export const onRequestPatch: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { clusterIds: string[] };
  if (!body.clusterIds) {
    return new Response(
      JSON.stringify({ error: "clusterIds required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;
  const stmts = body.clusterIds.map((cid, idx) =>
    db
      .prepare(
        `UPDATE guide_clusters SET "order" = ?, updated_at = datetime('now') WHERE id = ?`
      )
      .bind(idx, cid)
  );

  await db.batch(stmts);

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
