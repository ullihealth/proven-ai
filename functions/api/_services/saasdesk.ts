export interface SaasDeskConfig {
  baseUrl: string;
  webhookApiKey: string;
  appId: string;
}

export interface SaasDeskSubscriberPayload {
  email: string;
  firstname?: string;
  source: string;
  ref?: string;
  submitted_at: string;
}

export interface SaasDeskCommissionByRefPayload {
  ref_code: string;
  sale_amount: number;
  currency: string;
  stripe_payment_id: string;
  app_id?: string;
  product_id: string | null;
  contact_id: string | null;
  notes: string;
}

export interface SaasDeskCommissionResponse {
  id?: string;
  action?: "created" | "existing" | string;
  [key: string]: unknown;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function buildConfig(config: SaasDeskConfig): SaasDeskConfig {
  return {
    baseUrl: normalizeBaseUrl(config.baseUrl),
    webhookApiKey: config.webhookApiKey,
    appId: config.appId,
  };
}

export async function postSubscriberToSaasDesk(
  config: SaasDeskConfig,
  payload: SaasDeskSubscriberPayload
): Promise<void> {
  const safeConfig = buildConfig(config);
  const res = await fetch(`${safeConfig.baseUrl}/api/webhooks/subscriber`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": safeConfig.webhookApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`subscriber_sync_failed status=${res.status} body=${body}`);
  }
}

export async function postCommissionByRefToSaasDesk(
  config: SaasDeskConfig,
  payload: SaasDeskCommissionByRefPayload
): Promise<SaasDeskCommissionResponse> {
  const safeConfig = buildConfig(config);
  const endpoint = "https://saas-desk.pages.dev/api/commissions/by-ref";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": safeConfig.webhookApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`commission_by_ref_failed status=${res.status} body=${body}`);
  }

  return (await res.json().catch(() => ({}))) as SaasDeskCommissionResponse;
}
