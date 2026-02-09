import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

let cachedAuth: ReturnType<typeof betterAuth> | null = null;

export const onRequest: PagesFunction<{
  PROVENAI_DB: D1Database;
  AUTH_SECRET: string;
  AUTH_TRUSTED_ORIGIN?: string;
}> = async ({ request, env }) => {
  if (!cachedAuth) {
    const db = new Kysely({
      dialect: new D1Dialect({ database: env.PROVENAI_DB }),
    });

    cachedAuth = betterAuth({
      secret: env.AUTH_SECRET,
      trustedOrigins: env.AUTH_TRUSTED_ORIGIN ? [env.AUTH_TRUSTED_ORIGIN] : [],
      basePath: "/api/auth",
      emailAndPassword: {
        enabled: true,
      },
      database: db,
    });
  }

  try {
    return await cachedAuth.handler(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
