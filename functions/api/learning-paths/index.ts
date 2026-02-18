/**
 * Public Learning Paths API (read-only)
 *
 * GET /api/learning-paths — list all learning paths
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    courseIds: safeJsonParse(row.course_ids, []),
    order: (row.order as number) ?? 0,
  };
}

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
      run: () => Promise<{ success: boolean }>;
    };
    all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  };
  batch: (stmts: unknown[]) => Promise<unknown[]>;
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({
  env,
}) => {
  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare('SELECT id, title, description, course_ids, "order" FROM learning_paths ORDER BY "order", title')
    .all();

  const paths = (results || []).map((row) => mapRow(row as Record<string, unknown>));
  return new Response(JSON.stringify({ ok: true, paths }), { headers: JSON_HEADERS });
};
