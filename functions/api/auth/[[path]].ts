import type { PagesFunction } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { createD1Adapter } from "@/lib/storage/d1Adapter.stub";

export const onRequest: PagesFunction = async ({ request, env }) => {
  const auth = betterAuth({
    secret: env.AUTH_SECRET,
    trustedOrigins: [env.AUTH_TRUSTED_ORIGIN],
    database: createD1Adapter(env.PROVENAI_DB),
  });

  return auth.handler(request);
};
