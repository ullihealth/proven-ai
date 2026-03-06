type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{ results: T[] }>;
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
  };
};
type PagesFunction<Env = unknown> = (context: { request: Request; env: Env; params: Record<string, string> }) => Response | Promise<Response>;
interface Env { PROVENAI_DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const { results } = await env.PROVENAI_DB
    .prepare("SELECT * FROM pm_card_links WHERE card_id = ? ORDER BY created_at ASC")
    .bind(params.cardId).all();
  return Response.json({ items: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const { label, url } = await request.json() as Record<string, string>;
  const id = crypto.randomUUID();
  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_card_links (id, card_id, label, url) VALUES (?, ?, ?, ?)")
    .bind(id, params.cardId, label, url).run();
  const item = await env.PROVENAI_DB.prepare("SELECT * FROM pm_card_links WHERE id = ?").bind(id).first();
  return Response.json({ item });
};
