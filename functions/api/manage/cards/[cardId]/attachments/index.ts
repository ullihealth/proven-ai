type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{ results: T[] }>;
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
    all: <T = unknown>() => Promise<{ results: T[] }>;
  };
};

type R2Bucket = {
  put: (key: string, body: ReadableStream | ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_DB: D1Database;
  PROVENAI_ATTACHMENTS: R2Bucket;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

// GET /api/manage/cards/:cardId/attachments
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT id, card_id, filename, file_type, file_url, r2_key, created_at FROM pm_card_attachments WHERE card_id = ? ORDER BY created_at ASC")
    .bind(params.cardId).all();
  return Response.json({ items: results });
};

// POST /api/manage/cards/:cardId/attachments  (multipart/form-data OR JSON from storage)
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const contentType = request.headers.get("content-type") || "";

  // Handle "from_storage" JSON attach (no re-upload)
  if (contentType.includes("application/json")) {
    const body = await request.json() as { filename: string; file_type: string; file_url: string; from_storage?: boolean };
    if (!body.from_storage || !body.file_url) {
      return new Response(JSON.stringify({ error: "Invalid storage attach request" }), { status: 400 });
    }
    const id = crypto.randomUUID();
    await env.PROVENAI_DB
      .prepare("INSERT INTO pm_card_attachments (id, card_id, filename, file_type, file_url, r2_key) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, params.cardId, body.filename, body.file_type, body.file_url, "").run();
    const item = await env.PROVENAI_DB.prepare("SELECT * FROM pm_card_attachments WHERE id = ?").bind(id).first();
    return Response.json({ item });
  }

  if (!contentType.includes("multipart/form-data")) {
    return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "File exceeds 50MB limit" }), { status: 413 });
  }

  const id = crypto.randomUUID();
  const ext = file.name.split(".").pop() || "bin";
  const r2Key = `attachments/${params.cardId}/${id}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await env.PROVENAI_ATTACHMENTS.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  // Build public URL — served via /api/manage/attachments/file/:key
  const fileUrl = `/api/manage/attachments/file/${r2Key}`;

  // Store metadata in D1
  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_card_attachments (id, card_id, filename, file_type, file_url, r2_key) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, params.cardId, file.name, file.type, fileUrl, r2Key).run();

  const item = await env.PROVENAI_DB.prepare("SELECT * FROM pm_card_attachments WHERE id = ?").bind(id).first();
  return Response.json({ item });
};
