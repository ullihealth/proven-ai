type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => { run: () => Promise<{ success: boolean }> };
  };
};
type PagesFunction<Env = unknown> = (context: { request: Request; env: Env; params: Record<string, string> }) => Response | Promise<Response>;
interface Env { PROVENAI_DB: D1Database; }

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  await env.PROVENAI_DB.prepare("DELETE FROM pm_card_attachments WHERE id = ? AND card_id = ?")
    .bind(params.attachmentId, params.cardId).run();
  return Response.json({ ok: true });
};
