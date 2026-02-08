import { betterAuth } from "better-auth";
import { d1Adapter } from "better-auth/adapters/d1";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequest: PagesFunction<{
  PROVENAI_DB: unknown;
  AUTH_SECRET: string;
  AUTH_TRUSTED_ORIGIN?: string;
}> = async ({ request, env }) => {
  const auth = betterAuth({
    secret: env.AUTH_SECRET,
    trustedOrigins: env.AUTH_TRUSTED_ORIGIN ? [env.AUTH_TRUSTED_ORIGIN] : [],
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
    },
    database: d1Adapter(env.PROVENAI_DB),
  });

  return auth.handler(request);
};
