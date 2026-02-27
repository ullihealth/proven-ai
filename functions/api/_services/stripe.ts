export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

export interface CreateStripeCheckoutSessionInput {
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  metadata: Record<string, string>;
  stripePriceId?: string;
  amountCents?: number;
  currency?: string;
  productName?: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export interface StripeWebhookEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  data: {
    object: T;
  };
}

interface StripeSessionApiResponse {
  id?: string;
  url?: string;
}

function toFormData(input: Record<string, string>): string {
  return Object.entries(input)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function parseStripeSignatureHeader(value: string | null): { timestamp: string; signatures: string[] } | null {
  if (!value) return null;
  const parts = value.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

async function computeStripeHmac(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return hexEncode(new Uint8Array(signature));
}

export async function createStripeCheckoutSession(
  config: StripeConfig,
  input: CreateStripeCheckoutSessionInput
): Promise<StripeCheckoutSession> {
  const form: Record<string, string> = {
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
  };

  Object.entries(input.metadata).forEach(([key, value]) => {
    form[`metadata[${key}]`] = value;
  });

  if (input.stripePriceId) {
    form["line_items[0][price]"] = input.stripePriceId;
    form["line_items[0][quantity]"] = "1";
  } else {
    if (!input.amountCents || !input.currency || !input.productName) {
      throw new Error("invalid_checkout_payload");
    }
    form["line_items[0][price_data][currency]"] = input.currency.toLowerCase();
    form["line_items[0][price_data][product_data][name]"] = input.productName;
    form["line_items[0][price_data][unit_amount]"] = String(input.amountCents);
    form["line_items[0][quantity]"] = "1";
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toFormData(form),
  });

  const data = (await res.json().catch(() => ({}))) as StripeSessionApiResponse & { error?: { message?: string } };

  if (!res.ok || !data.id || !data.url) {
    throw new Error(`stripe_checkout_create_failed status=${res.status} message=${data.error?.message || "unknown"}`);
  }

  return { id: data.id, url: data.url };
}

export async function verifyStripeWebhookSignature(
  config: StripeConfig,
  rawBody: string,
  stripeSignatureHeader: string | null
): Promise<boolean> {
  const parsed = parseStripeSignatureHeader(stripeSignatureHeader);
  if (!parsed) return false;

  const payload = `${parsed.timestamp}.${rawBody}`;
  const expected = await computeStripeHmac(config.webhookSecret, payload);

  return parsed.signatures.some((signature) => timingSafeEqualHex(signature, expected));
}

export function parseStripeWebhookEvent<T = Record<string, unknown>>(rawBody: string): StripeWebhookEvent<T> {
  return JSON.parse(rawBody) as StripeWebhookEvent<T>;
}
