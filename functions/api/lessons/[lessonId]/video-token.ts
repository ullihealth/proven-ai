type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: { lessonId?: string };
}) => Response | Promise<Response>;

const textEncoder = new TextEncoder();

function normalizeBase64(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return normalized + padding;
}

function decodeBase64ToString(input: string): string {
  const normalized = normalizeBase64(input.trim());
  return atob(normalized);
}

function looksLikePem(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.startsWith("-----BEGIN") || trimmed.startsWith("LS0tLS1CRUdJTi");
}

function base64UrlEncode(input: Uint8Array): string {
  let binary = "";
  for (const byte of input) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  keyId?: string
): Promise<string> {
  if (looksLikePem(secret)) {
    throw new Error("Stream signing key must be a JWK (JSON or base64-encoded JSON), not a PEM string.");
  }

  let jwk: JsonWebKey;
  const trimmedSecret = secret.trim();
  try {
    jwk = trimmedSecret.startsWith("{")
      ? (JSON.parse(trimmedSecret) as JsonWebKey)
      : (JSON.parse(decodeBase64ToString(trimmedSecret)) as JsonWebKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to parse JWK: ${message}`);
  }

  const header = keyId ? { alg: "RS256", typ: "JWT", kid: keyId } : { alg: "RS256", typ: "JWT" };
  const headerBytes = textEncoder.encode(JSON.stringify(header));
  const payloadBytes = textEncoder.encode(JSON.stringify(payload));
  const encodedHeader = base64UrlEncode(headerBytes);
  const encodedPayload = base64UrlEncode(payloadBytes);
  const data = textEncoder.encode(`${encodedHeader}.${encodedPayload}`);

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data);
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function getSessionFromAuth(request: Request): Promise<{ user?: { id?: string; role?: string } } | null> {
  const sessionUrl = new URL("/api/auth/get-session", request.url);
  const response = await fetch(sessionUrl.toString(), {
    method: "GET",
    headers: request.headers,
    credentials: "include",
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { data?: { user?: { id?: string; role?: string } } } &
    { user?: { id?: string; role?: string } };
  return data.data || data;
}

export const onRequest: PagesFunction<{
  PROVENAI_DB: D1Database;
  CF_STREAM_SIGNING_KEY: string;
  CF_STREAM_SIGNING_KEY_ID?: string;
}> = async ({ request, env, params }) => {
  const requestUrl = new URL(request.url);
  const debugEnabled = requestUrl.searchParams.get("debug") === "1";

  try {
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lessonId = params.lessonId;
    if (!lessonId) {
      return new Response(JSON.stringify({ error: "Lesson ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!env.CF_STREAM_SIGNING_KEY) {
      return new Response(JSON.stringify({ error: "Stream signing key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await getSessionFromAuth(request);
    const role = session?.user?.role;
    if (!role || (role !== "admin" && role !== "member")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lessonRow = await env.PROVENAI_DB.prepare(
      "SELECT id, course_id, stream_video_id FROM lessons WHERE id = ?"
    )
      .bind(lessonId)
      .first<{ id: string; course_id: string; stream_video_id: string | null }>();

    if (!lessonRow) {
      return new Response(JSON.stringify({ error: "Lesson not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!lessonRow.stream_video_id) {
      return new Response(JSON.stringify({ error: "No stream video configured" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = await signJwt(
      {
        sub: lessonRow.stream_video_id,
        exp: Math.floor(Date.now() / 1000) + 300,
      },
      env.CF_STREAM_SIGNING_KEY,
      env.CF_STREAM_SIGNING_KEY_ID
    );

    return new Response(
      JSON.stringify({ token, streamVideoId: lessonRow.stream_video_id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!debugEnabled) {
      return new Response(JSON.stringify({ error: "Worker exception" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: "Worker exception",
        message,
        lessonId: params.lessonId ?? null,
        hasSigningKey: Boolean(env.CF_STREAM_SIGNING_KEY),
        hasSigningKeyId: Boolean(env.CF_STREAM_SIGNING_KEY_ID),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
