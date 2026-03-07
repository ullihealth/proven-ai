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
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_DB: D1Database;
}

// GET /api/manage/boards
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.PROVENAI_DB.prepare("SELECT * FROM pm_boards ORDER BY sort_order").all();
  return Response.json({ boards: results });
};

// POST /api/manage/boards — create a new board
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { name, icon, color, sort_order } = (await request.json()) as {
    name: string;
    icon: string;
    color?: string;
    sort_order?: number;
  };
  const id = crypto.randomUUID();
  const order = sort_order ?? 999;
  await env.PROVENAI_DB.prepare(
    "INSERT INTO pm_boards (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, name, icon || "", color || "#00bcd4", order)
    .run();
  return Response.json({ board: { id, name, icon: icon || "", color: color || "#00bcd4", sort_order: order } });
};

// PUT /api/manage/boards — reorder boards
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const { order } = (await request.json()) as { order: string[] };
  for (let i = 0; i < order.length; i++) {
    await env.PROVENAI_DB.prepare("UPDATE pm_boards SET sort_order = ? WHERE id = ?")
      .bind(i + 1, order[i])
      .run();
  }
  return Response.json({ ok: true });
};
