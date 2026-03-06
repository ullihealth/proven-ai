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
