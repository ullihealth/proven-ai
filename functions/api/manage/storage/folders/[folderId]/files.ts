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
  put: (key: string, body: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
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

const MAX_SIZE = 50 * 1024 * 1024;

// GET /api/manage/storage/folders/:folderId/files
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_storage_files WHERE folder_id = ? ORDER BY created_at ASC")
    .bind(params.folderId).all();
  return Response.json({ files: results });
};

// POST /api/manage/storage/folders/:folderId/files — multipart upload
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const uploadedBy = (formData.get("uploaded_by") as string) || "Jeff";
  if (!file) return new Response(JSON.stringify({ error: "No file" }), { status: 400 });
  if (file.size > MAX_SIZE) return new Response(JSON.stringify({ error: "File exceeds 50MB" }), { status: 413 });

  const id = crypto.randomUUID();
  const ext = file.name.split(".").pop() || "bin";
  const r2Key = `storage/${params.folderId}/${id}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  await env.PROVENAI_ATTACHMENTS.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  const fileUrl = `/api/manage/attachments/file/${r2Key}`;

  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_storage_files (id, folder_id, filename, file_type, file_url, r2_key, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, params.folderId, file.name, file.type, fileUrl, r2Key, file.size, uploadedBy).run();

  const item = await env.PROVENAI_DB.prepare("SELECT * FROM pm_storage_files WHERE id = ?").bind(id).first();
  return Response.json({ file: item });
};
