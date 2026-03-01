interface Env {
  STRIPE_WEBHOOK_SECRET: string;
  SAASDESK_WEBHOOK_API_KEY: string;
}

async function verifyStripeSignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  // Parse t= and v1= from the Stripe-Signature header
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=")];
    })
  );

  const timestamp = parts["t"];
  const v1 = parts["v1"];

  if (!timestamp || !v1) return false;

  // Compute HMAC-SHA256 of "{timestamp}.{body}" using the webhook secret
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${timestamp}.${body}`);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (computedHex.length !== v1.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  return mismatch === 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("Stripe-Signature") ?? "";

  // Verify signature
  const isValid = await verifyStripeSignature(
    rawBody,
    signatureHeader,
    env.STRIPE_WEBHOOK_SECRET
  );

  if (!isValid) {
    console.error("Stripe webhook signature verification failed");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Failed to parse Stripe webhook body:", err);
    return new Response("Bad Request", { status: 400 });
  }

  // Only process checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return new Response("OK", { status: 200 });
  }

  const session = event.data.object as {
    customer_email?: string;
    customer_details?: { email?: string; name?: string };
    amount_total?: number;
    currency?: string;
    payment_intent?: string;
    metadata?: Record<string, string>;
  };

  console.log("checkout.session.completed", {
    customer_email: session.customer_email,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_intent: session.payment_intent,
    ref_code: session.metadata?.ref_code,
  });

  // Always send sale + contact data to SaaS Desk for CRM tracking
  try {
    const saasPayload: Record<string, unknown> = {
      email: session.customer_email || session.customer_details?.email,
      firstname: session.customer_details?.name?.split(" ")[0] || null,
      source: "ProvenAI",
      sale_amount: (session.amount_total || 0) / 100,
      currency: (session.currency || "USD").toUpperCase(),
      product_name: session.metadata?.product_name || "ProvenAI Course",
      stripe_payment_id: session.payment_intent,
    };

    // Include ref_code if present (affiliate tracking handled by SaaS Desk internally)
    if (session.metadata?.ref_code) {
      saasPayload.ref = session.metadata.ref_code;
    }

    const saasRes = await fetch("https://saas-desk.pages.dev/api/webhooks/subscriber", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.SAASDESK_WEBHOOK_API_KEY,
      },
      body: JSON.stringify(saasPayload),
    });

    const saasResult = await saasRes.json();
    console.log("[SaaS Desk] Contact/sale sync:", JSON.stringify(saasResult));
  } catch (saasErr) {
    console.error("[SaaS Desk] Sync failed (non-blocking):", saasErr);
  }

  // Always return 200 to Stripe
  return new Response("OK", { status: 200 });
};
