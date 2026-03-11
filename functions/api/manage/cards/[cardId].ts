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

// PATCH /api/manage/cards/:cardId
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const cardId = params.cardId;
  const body = await request.json() as Record<string, unknown>;

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ["title", "description", "due_date", "priority", "assignee", "column_id", "content_type", "platform", "card_type", "sort_order", "warning_hours", "start_date", "board_id", "color", "category", "category_order"]) {
    if (key in body) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) return Response.json({ card: null });

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(cardId);

  await env.PROVENAI_DB.prepare(`UPDATE pm_cards SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const card = await env.PROVENAI_DB.prepare("SELECT * FROM pm_cards WHERE id = ?").bind(cardId).first();
  return Response.json({ card });
};

// DELETE /api/manage/cards/:cardId
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const cardId = params.cardId;
  await env.PROVENAI_DB.prepare("DELETE FROM pm_cards WHERE id = ?").bind(cardId).run();
  return Response.json({ ok: true });
};
