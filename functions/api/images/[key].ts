/**
 * GET    /api/images/:key  — retrieve an image as binary (real image response)
 * DELETE /api/images/:key  — remove an image
 */

interface Env {
  PROVENAI_DB: D1Database;
}

type PagesFunction<E = unknown> = (ctx: {
  request: Request;
  env: E;
  params: Record<string, string>;
}) => Response | Promise<Response>;

/**
 * Decode a data-URL into binary + content-type.
 * e.g. "data:image/jpeg;base64,/9j/4AAQ..." → { contentType: "image/jpeg", bytes: Uint8Array }
 */
function decodeDataUrl(dataUrl: string): { contentType: string; bytes: Uint8Array } | null {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  const contentType = match[1];
  const raw = atob(match[2]);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return { contentType, bytes };
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const key = params.key;
  if (!key) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const row = await env.PROVENAI_DB.prepare(
      "SELECT data FROM images WHERE key = ?"
    )
      .bind(key)
      .first<{ data: string }>();

    if (!row) {
      return new Response("Not Found", { status: 404 });
    }

    // Decode base64 data-URL → binary image response
    const decoded = decodeDataUrl(row.data);
    if (!decoded) {
      // Fallback: return the raw data-URL as JSON
      return new Response(JSON.stringify({ key, data: row.data }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(decoded.bytes, {
      headers: {
        "Content-Type": decoded.contentType,
        "Cache-Control": "public, max-age=86400", // 24h cache
      },
    });
  } catch (err) {
    console.error("[images/[key] GET]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const key = params.key;
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await env.PROVENAI_DB.prepare("DELETE FROM images WHERE key = ?")
      .bind(key)
      .run();

    return new Response(JSON.stringify({ ok: true, key }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[images/[key] DELETE]", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete image" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
