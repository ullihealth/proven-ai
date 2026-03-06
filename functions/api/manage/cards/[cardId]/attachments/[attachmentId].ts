type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
  };
};

type R2Bucket = {
  delete: (key: string) => Promise<void>;
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

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  // Get the r2_key before deleting
  const row = await env.PROVENAI_DB
    .prepare("SELECT r2_key FROM pm_card_attachments WHERE id = ? AND card_id = ?")
    .bind(params.attachmentId, params.cardId).first<{ r2_key: string }>();

  if (row?.r2_key) {
    await env.PROVENAI_ATTACHMENTS.delete(row.r2_key);
  }

  await env.PROVENAI_DB
    .prepare("DELETE FROM pm_card_attachments WHERE id = ? AND card_id = ?")
    .bind(params.attachmentId, params.cardId).run();

  return Response.json({ ok: true });
};
