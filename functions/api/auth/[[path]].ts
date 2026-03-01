
import { getReferralCodeFromCookie } from "../_services/referral";
import { postSubscriberToSaasDesk } from "../_services/saasdesk";

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
  waitUntil: (promise: Promise<unknown>) => void;
}) => Response | Promise<Response>;

let cachedAuth: { handler: (request: Request) => Promise<Response> } | null = null;

const textEncoder = new TextEncoder();
const PBKDF2_ITERATIONS = 10000;

function toBase64(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: salt as unknown as BufferSource,
    },
    key,
    256
  );
  const hash = new Uint8Array(bits);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

async function verifyPassword(data: { hash: string; password: string }): Promise<boolean> {
  const [scheme, iterationsRaw, saltRaw, hashRaw] = data.hash.split("$");
  if (scheme !== "pbkdf2" || !iterationsRaw || !saltRaw || !hashRaw) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const salt = fromBase64(saltRaw);
  const expectedHash = fromBase64(hashRaw);
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(data.password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: salt as unknown as BufferSource,
    },
    key,
    expectedHash.length * 8
  );
  const actualHash = new Uint8Array(bits);
  return timingSafeEqual(actualHash, expectedHash);
}

export const onRequest: PagesFunction<{
  PROVENAI_DB: D1Database;
  AUTH_SECRET: string;
  AUTH_TRUSTED_ORIGIN?: string;
  ADMIN_EMAILS?: string;
  BETTER_AUTH_URL?: string;
  SAASDESK_BASE_URL?: string;
  SAASDESK_WEBHOOK_API_KEY?: string;
  SAASDESK_APP_ID?: string;
}> = async ({ request, env, waitUntil }) => {
  try {
    if (!cachedAuth) {
      const [{ betterAuth }, { D1Dialect }] = await Promise.all([
        import("better-auth"),
        import("kysely-d1"),
      ]);

      const adminEmails = (env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

      cachedAuth = betterAuth({
        secret: env.AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL || "https://provenai.app",
        trustedOrigins: env.AUTH_TRUSTED_ORIGIN ? [env.AUTH_TRUSTED_ORIGIN] : [],
        basePath: "/api/auth",
        emailAndPassword: {
          enabled: true,
          password: {
            hash: hashPassword,
            verify: verifyPassword,
          },
        },
        user: {
          additionalFields: {
            role: {
              type: ["public", "member", "admin"],
              required: false,
              defaultValue: "member",
              input: false,
            },
            referred_by_code: {
              type: "string",
              required: false,
              input: false,
            },
            referral_captured_at: {
              type: "string",
              required: false,
              input: false,
            },
          },
        },
        databaseHooks: {
          user: {
            create: {
              before: async (user) => {
                const isAdmin = adminEmails.includes(user.email.toLowerCase());
                return {
                  data: {
                    ...user,
                    role: isAdmin ? "admin" : (user as { role?: string }).role,
                  },
                };
              },
            },
          },
        },
        database: {
          dialect: new D1Dialect({ database: env.PROVENAI_DB }),
          type: "sqlite",
        },
      });
    }

    // Rate limiting: block brute-force login attempts (10 per IP per 15 min)
    const authPathname = new URL(request.url).pathname;
    if (request.method === "POST" && authPathname.endsWith("/sign-in/email")) {
      const ip =
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
        "unknown";
      const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      try {
        const row = await env.PROVENAI_DB
          .prepare("SELECT COUNT(*) as cnt FROM login_attempts WHERE ip = ? AND attempted_at >= ?")
          .bind(ip, cutoff)
          .first<{ cnt: number }>();
        if ((row?.cnt ?? 0) >= 10) {
          return new Response(
            JSON.stringify({ error: "Too many login attempts. Please try again in 15 minutes." }),
            { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "900" } }
          );
        }
        // Log attempt + prune old records (non-blocking)
        waitUntil(Promise.all([
          env.PROVENAI_DB.prepare("INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)").bind(ip, new Date().toISOString()).run(),
          env.PROVENAI_DB.prepare("DELETE FROM login_attempts WHERE attempted_at < ?").bind(cutoff).run(),
        ]));
      } catch {
        // If rate-limit check fails, allow through rather than blocking legitimate users
      }
    }

    const response = await cachedAuth.handler(request);
    const pathname = new URL(request.url).pathname;
    const refCode = getReferralCodeFromCookie(request.headers.get("cookie"));
    const isSignup = request.method === "POST" && pathname.endsWith("/sign-up/email");
    const isSignin = request.method === "POST" && pathname.endsWith("/sign-in/email");

    if (!response.ok || (!isSignup && !isSignin)) {
      return response;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return response;
    }

    const payload = (await response.clone().json().catch(() => ({}))) as {
      data?: { user?: { id?: string; email?: string; name?: string } };
      user?: { id?: string; email?: string; name?: string };
    };

    const authUser = payload.data?.user || payload.user;
    const userId = authUser?.id;
    const email = authUser?.email;

    if (userId && refCode) {
      waitUntil(
        env.PROVENAI_DB
          .prepare(
            "UPDATE user SET referred_by_code = COALESCE(NULLIF(referred_by_code, ''), ?), referral_captured_at = CASE WHEN (referred_by_code IS NULL OR referred_by_code = '') THEN COALESCE(referral_captured_at, ?) ELSE referral_captured_at END WHERE id = ?"
          )
          .bind(refCode, new Date().toISOString(), userId)
          .run()
          .catch((error: unknown) => {
            console.error("[auth.referral.attach]", {
              error: error instanceof Error ? error.message : String(error),
              userId,
            });
          })
      );
    }

    if (
      isSignup &&
      email &&
      env.SAASDESK_BASE_URL &&
      env.SAASDESK_WEBHOOK_API_KEY &&
      env.SAASDESK_APP_ID
    ) {
      const firstname = (authUser?.name || "").trim().split(/\s+/)[0] || "";
      waitUntil(
        postSubscriberToSaasDesk(
          {
            baseUrl: env.SAASDESK_BASE_URL,
            webhookApiKey: env.SAASDESK_WEBHOOK_API_KEY,
            appId: env.SAASDESK_APP_ID,
          },
          {
            email,
            firstname,
            source: "ProvenAI",
            ref: refCode || undefined,
            submitted_at: new Date().toISOString(),
          }
        ).catch((error) => {
          console.error("[auth.signup.saasdesk]", {
            error: error instanceof Error ? error.message : String(error),
            email,
            refCode,
          });
        })
      );
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
