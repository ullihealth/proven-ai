import {
  buildReferralCookie,
  clearReferralCookie,
  isValidReferralCode,
} from "../_services/referral";

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref")?.trim() || "";
  const isSecure = url.protocol === "https:";

  if (!isValidReferralCode(ref)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid referral code format" }),
      {
        status: 400,
        headers: {
          ...JSON_HEADERS,
          "Set-Cookie": clearReferralCookie(isSecure),
        },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true, ref }), {
    headers: {
      ...JSON_HEADERS,
      "Set-Cookie": buildReferralCookie(ref, isSecure),
    },
  });
};
