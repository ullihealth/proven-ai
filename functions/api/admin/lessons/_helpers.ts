/**
 * Shared helpers for lesson/module API endpoints
 */

export interface LessonApiEnv {
  PROVENAI_DB: D1Database;
  ADMIN_EMAILS?: string;
}

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>;
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  run: () => Promise<{ success: boolean }>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
};

type D1Result = {
  results?: unknown[];
  success: boolean;
};

export const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

/**
 * Check if the request is from an admin user via BetterAuth session
 */
export async function requireAdmin(
  request: Request,
  env: LessonApiEnv
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const res = await fetch(sessionUrl.toString(), {
      method: "GET",
      headers: request.headers,
      credentials: "include",
    });

    if (!res.ok) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: JSON_HEADERS,
        }),
      };
    }

    const data = (await res.json()) as {
      user?: { id?: string; email?: string; role?: string };
    };
    const user = data.user;

    if (!user?.id) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: JSON_HEADERS,
        }),
      };
    }

    // Check admin by role or email list
    const isAdmin =
      user.role === "admin" ||
      (env.ADMIN_EMAILS && user.email && env.ADMIN_EMAILS.split(",").map((e) => e.trim()).includes(user.email));

    if (!isAdmin) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: JSON_HEADERS,
        }),
      };
    }

    return { ok: true, userId: user.id };
  } catch {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Auth check failed" }), {
        status: 500,
        headers: JSON_HEADERS,
      }),
    };
  }
}

/**
 * Check if the request is from an authenticated user (any role)
 */
export async function requireAuth(
  request: Request
): Promise<{ ok: true; userId: string; role: string } | { ok: false; response: Response }> {
  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const res = await fetch(sessionUrl.toString(), {
      method: "GET",
      headers: request.headers,
      credentials: "include",
    });

    if (!res.ok) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: JSON_HEADERS,
        }),
      };
    }

    const data = (await res.json()) as {
      user?: { id?: string; role?: string };
    };

    if (!data.user?.id) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: JSON_HEADERS,
        }),
      };
    }

    return { ok: true, userId: data.user.id, role: data.user.role || "member" };
  } catch {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Auth check failed" }), {
        status: 500,
        headers: JSON_HEADERS,
      }),
    };
  }
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Map a D1 lesson row to the client-side Lesson shape */
export function mapLessonRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id ?? undefined,
    title: row.title,
    order: row.order,
    contentBlocks: parseJson(row.content_blocks as string | null, []),
    quiz: parseJson(row.quiz as string | null, undefined),
    chapterTitle: row.chapter_title ?? undefined,
    streamVideoId: row.stream_video_id ?? undefined,
  };
}

/** Map a D1 module row to the client-side Module shape */
export function mapModuleRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    order: row.order,
  };
}
