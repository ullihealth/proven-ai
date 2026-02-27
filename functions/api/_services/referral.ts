export const REFERRAL_COOKIE_NAME = "provenai_ref";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const REFERRAL_CODE_REGEX = /^[A-Za-z0-9]{4,16}$/;

export function isValidReferralCode(value: string | null | undefined): value is string {
  return !!value && REFERRAL_CODE_REGEX.test(value);
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const idx = part.indexOf("=");
      if (idx === -1) return acc;
      const key = decodeURIComponent(part.slice(0, idx).trim());
      const value = decodeURIComponent(part.slice(idx + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}

export function getReferralCodeFromCookie(cookieHeader: string | null): string | null {
  const value = parseCookies(cookieHeader)[REFERRAL_COOKIE_NAME];
  return isValidReferralCode(value) ? value : null;
}

export function buildReferralCookie(refCode: string, secure: boolean): string {
  return [
    `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(refCode)}`,
    "Path=/",
    `Max-Age=${REFERRAL_COOKIE_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearReferralCookie(secure: boolean): string {
  return [
    `${REFERRAL_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
