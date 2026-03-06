type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = unknown>() => Promise<T | null>;
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

// PATCH /api/manage/strategy/:pullId — update summary
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const { pullId } = params;
  const body = (await request.json()) as { summary: string };

  await env.PROVENAI_DB
    .prepare("UPDATE pm_strategy_pulls SET summary = ? WHERE id = ?")
    .bind(body.summary, pullId)
    .run();

  return Response.json({ ok: true });
};

// DELETE /api/manage/strategy/:pullId
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const { pullId } = params;
  await env.PROVENAI_DB
    .prepare("DELETE FROM pm_strategy_pulls WHERE id = ?")
    .bind(pullId)
    .run();
  return Response.json({ ok: true });
};
