import { betterAuth } from "better-auth";
import { d1Adapter } from "better-auth/adapters/d1";
import type { D1Database } from "../../../src/lib/storage/d1Adapter.stub";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface Env {
  PROVENAI_DB: D1Database;
  AUTH_SECRET: string;
  AUTH_TRUSTED_ORIGIN?: string;
}

let cachedAuth: ReturnType<typeof betterAuth> | null = null;

function getAuth(env: Env) {
  if (cachedAuth) return cachedAuth;

  cachedAuth = betterAuth({
    secret: env.AUTH_SECRET,
    database: d1Adapter(env.PROVENAI_DB),
    trustedOrigins: env.AUTH_TRUSTED_ORIGIN ? [env.AUTH_TRUSTED_ORIGIN] : [],
    emailAndPassword: {
      enabled: true,
    },
  });

  return cachedAuth;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const auth = getAuth(env);
  return auth.handler(request);
};
