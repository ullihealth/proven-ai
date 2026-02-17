/**
 * Public Courses API (read-only)
 *
 * GET /api/courses — list all courses
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimated_time: string;
  course_type: string;
  lifecycle_state: string;
  difficulty: string | null;
  capability_tags: string;
  last_updated: string | null;
  href: string;
  sections: string;
  tools_used: string;
  release_date: string | null;
  order: number;
}

function mapCourseRow(row: Record<string, unknown>) {
  const r = row as unknown as CourseRow;
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description || '',
    estimatedTime: r.estimated_time || '',
    courseType: r.course_type || 'short',
    lifecycleState: r.lifecycle_state || 'current',
    difficulty: r.difficulty || undefined,
    capabilityTags: safeJsonParse(r.capability_tags, []),
    lastUpdated: r.last_updated || '',
    href: r.href,
    sections: safeJsonParse(r.sections, []),
    toolsUsed: safeJsonParse(r.tools_used, []),
    releaseDate: r.release_date || undefined,
    order: r.order ?? 0,
  };
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
      first: <T = Record<string, unknown>>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
    all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  };
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
    .prepare(
      'SELECT id, slug, title, description, estimated_time, course_type, lifecycle_state, difficulty, capability_tags, last_updated, href, sections, tools_used, release_date, "order" FROM courses ORDER BY "order", title'
    )
    .all();

  const courses = (results || []).map((row) =>
    mapCourseRow(row as Record<string, unknown>)
  );

  return new Response(JSON.stringify({ ok: true, courses }), {
    headers: JSON_HEADERS,
  });
};
