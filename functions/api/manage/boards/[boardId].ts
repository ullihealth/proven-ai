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

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_DB: D1Database;
}

// GET /api/manage/boards/:boardId
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const boardId = params.boardId;
  const [cols, cards] = await Promise.all([
    env.PROVENAI_DB.prepare("SELECT * FROM pm_columns WHERE board_id = ? ORDER BY sort_order").bind(boardId).all(),
    env.PROVENAI_DB.prepare("SELECT * FROM pm_cards WHERE board_id = ? ORDER BY sort_order").bind(boardId).all(),
  ]);
  return Response.json({ columns: cols.results, cards: cards.results });
};

// PATCH /api/manage/boards/:boardId — update board
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const boardId = params.boardId;
  const updates = (await request.json()) as { name?: string; icon?: string; color?: string };
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (updates.name !== undefined) { sets.push("name = ?"); vals.push(updates.name); }
  if (updates.icon !== undefined) { sets.push("icon = ?"); vals.push(updates.icon); }
  if (updates.color !== undefined) { sets.push("color = ?"); vals.push(updates.color); }
  if (sets.length === 0) return Response.json({ ok: true });
  vals.push(boardId);
  await env.PROVENAI_DB.prepare(`UPDATE pm_boards SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...vals)
    .run();
  return Response.json({ ok: true });
};

// DELETE /api/manage/boards/:boardId
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const boardId = params.boardId;
  await env.PROVENAI_DB.prepare("DELETE FROM pm_boards WHERE id = ?").bind(boardId).run();
  return Response.json({ ok: true });
};
