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

// PUT /api/manage/cards/:cardId/checklist/reorder
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const body = await request.json() as { order: string[] };
  for (let i = 0; i < body.order.length; i++) {
    await env.PROVENAI_DB
      .prepare("UPDATE pm_checklists SET sort_order = ? WHERE id = ? AND card_id = ?")
      .bind(i, body.order[i], params.cardId)
      .run();
  }
  return Response.json({ ok: true });
};
