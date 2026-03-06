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
    .prepare(`SELECT r.*, c.title AS related_title, c.board_id AS related_board_id, b.name AS related_board_name
      FROM pm_card_relations r
      JOIN pm_cards c ON c.id = r.related_card_id
      JOIN pm_boards b ON b.id = c.board_id
      WHERE r.card_id = ?
      ORDER BY r.created_at ASC`)
    .bind(params.cardId).all();
  return Response.json({ items: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const { related_card_id } = await request.json() as { related_card_id: string };
  if (related_card_id === params.cardId) return Response.json({ error: "Cannot relate card to itself" }, { status: 400 });
  const id = crypto.randomUUID();
  await env.PROVENAI_DB
    .prepare("INSERT INTO pm_card_relations (id, card_id, related_card_id) VALUES (?, ?, ?)")
    .bind(id, params.cardId, related_card_id).run();
  const item = await env.PROVENAI_DB
    .prepare(`SELECT r.*, c.title AS related_title, c.board_id AS related_board_id, b.name AS related_board_name
      FROM pm_card_relations r
      JOIN pm_cards c ON c.id = r.related_card_id
      JOIN pm_boards b ON b.id = c.board_id
      WHERE r.id = ?`)
    .bind(id).first();
  return Response.json({ item });
};
