
type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
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
      salt,
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
      salt,
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
}> = async ({ request, env }) => {
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

    return await cachedAuth.handler(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
