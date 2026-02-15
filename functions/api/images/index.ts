/**
 * POST /api/images  — upload / upsert an image
 *
 * Body JSON: { key: string, data: string }   (data = base64 data-URL)
 * Returns:   { ok: true, key: string }
 *
 * GET /api/images   — list all image keys (admin convenience)
 * Returns:   { images: [{ key, updated_at }] }
 */

interface Env {
  PROVENAI_DB: D1Database;
}

type PagesFunction<E = unknown> = (ctx: {
  request: Request;
  env: E;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as { key?: string; data?: string };
    const { key, data } = body;

    if (!key || typeof key !== "string" || !data || typeof data !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required fields: key (string), data (string)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate key format — alphanumeric + hyphens, max 64 chars
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(key)) {
      return new Response(
        JSON.stringify({ error: "Invalid key format. Use alphanumeric, hyphens, underscores (max 64 chars)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate it looks like a data-URL (basic check)
    if (!data.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ error: "Data must be a base64 image data-URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await env.PROVENAI_DB.prepare(
      `INSERT INTO images (key, data, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
      .bind(key, data)
      .run();

    return new Response(JSON.stringify({ ok: true, key }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[images/index POST]", err);
    return new Response(
      JSON.stringify({ error: "Failed to save image" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.PROVENAI_DB.prepare(
      "SELECT key, updated_at FROM images ORDER BY updated_at DESC"
    ).all<{ key: string; updated_at: string }>();

    return new Response(JSON.stringify({ images: results || [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[images/index GET]", err);
    return new Response(
      JSON.stringify({ error: "Failed to list images" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
