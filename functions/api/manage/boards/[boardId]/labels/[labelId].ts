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

// PATCH /api/manage/boards/:boardId/labels/:labelId
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const body = await request.json() as { name?: string; color?: string };
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (body.name !== undefined) { sets.push("name = ?"); vals.push(body.name); }
  if (body.color !== undefined) { sets.push("color = ?"); vals.push(body.color); }
  if (sets.length === 0) return Response.json({ ok: true });
  vals.push(params.labelId, params.boardId);
  await env.PROVENAI_DB
    .prepare(`UPDATE pm_labels SET ${sets.join(", ")} WHERE id = ? AND board_id = ?`)
    .bind(...vals)
    .run();
  return Response.json({ ok: true });
};

// DELETE /api/manage/boards/:boardId/labels/:labelId
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  await env.PROVENAI_DB
    .prepare("DELETE FROM pm_labels WHERE id = ? AND board_id = ?")
    .bind(params.labelId, params.boardId)
    .run();
  return Response.json({ ok: true });
};
