type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      run: () => Promise<{ success: boolean }>;
    };
  };
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_DB: D1Database;
}

// DELETE /api/manage/cards/:cardId/labels/:labelId — unassign a label
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  await env.PROVENAI_DB
    .prepare("DELETE FROM pm_card_labels WHERE card_id = ? AND label_id = ?")
    .bind(params.cardId, params.labelId)
    .run();
  return Response.json({ ok: true });
};
