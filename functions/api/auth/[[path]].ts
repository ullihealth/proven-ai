
type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

let cachedAuth: { handler: (request: Request) => Promise<Response> } | null = null;

export const onRequest: PagesFunction<{
  PROVENAI_DB: D1Database;
  AUTH_SECRET: string;
  AUTH_TRUSTED_ORIGIN?: string;
}> = async ({ request, env }) => {
  try {
    if (!cachedAuth) {
      const [{ betterAuth }, { D1Dialect }] = await Promise.all([
        import("better-auth"),
        import("kysely-d1"),
      ]);

      cachedAuth = betterAuth({
        secret: env.AUTH_SECRET,
        trustedOrigins: env.AUTH_TRUSTED_ORIGIN ? [env.AUTH_TRUSTED_ORIGIN] : [],
        basePath: "/api/auth",
        emailAndPassword: {
          enabled: true,
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
