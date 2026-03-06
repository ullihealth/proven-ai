type R2Bucket = {
  get: (key: string) => Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
  } | null>;
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_ATTACHMENTS: R2Bucket;
}

// GET /api/manage/attachments/file/attachments/:cardId/:filename
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  // [[path]] catch-all gives us the full path after /file/
  const key = Array.isArray(params.path) ? params.path.join("/") : params.path;

  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  const object = await env.PROVENAI_ATTACHMENTS.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body as ReadableStream, { headers });
};
