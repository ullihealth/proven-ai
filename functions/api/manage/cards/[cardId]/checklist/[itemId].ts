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

// PATCH /api/manage/cards/:cardId/checklist/:itemId
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const body = await request.json() as { done: boolean };
  await env.PROVENAI_DB
    .prepare("UPDATE pm_checklists SET done = ? WHERE id = ? AND card_id = ?")
    .bind(body.done ? 1 : 0, params.itemId, params.cardId)
    .run();
  return Response.json({ ok: true });
};

// DELETE /api/manage/cards/:cardId/checklist/:itemId
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  await env.PROVENAI_DB
    .prepare("DELETE FROM pm_checklists WHERE id = ? AND card_id = ?")
    .bind(params.itemId, params.cardId)
    .run();
  return Response.json({ ok: true });
};
