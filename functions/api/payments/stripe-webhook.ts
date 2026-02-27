import {
  parseStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "../_services/stripe";
import {
  postCommissionByRefToSaasDesk,
} from "../_services/saasdesk";

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
  };
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface StripeCompletedSession {
  id: string;
  payment_status?: string;
  payment_intent?: string;
  amount_total?: number;
  currency?: string;
  metadata?: {
    user_id?: string;
    email?: string;
    ref_code?: string;
    product_id?: string;
    product_sku?: string;
  };
  customer_details?: {
    email?: string;
  };
  payment_method_types?: string[];
  charges?: {
    data?: Array<{ id?: string }>;
  };
}

async function markEventStatus(
  db: D1Database,
  eventId: string,
  status: string,
  error?: string
): Promise<void> {
  await db
    .prepare("UPDATE stripe_webhook_events SET processed_at = ?, status = ?, error = ? WHERE event_id = ?")
    .bind(new Date().toISOString(), status, error || null, eventId)
    .run();
}

export const onRequestPost: PagesFunction<{
  PROVENAI_DB: D1Database;
  STRIPE_WEBHOOK_SECRET?: string;
  SAASDESK_BASE_URL?: string;
  SAASDESK_WEBHOOK_API_KEY?: string;
  SAASDESK_APP_ID?: string;
}> = async ({ request, env }) => {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const isValid = await verifyStripeWebhookSignature(
    {
      secretKey: "",
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    rawBody,
    signature
  );

  if (!isValid) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const event = parseStripeWebhookEvent<StripeCompletedSession>(rawBody);
    const db = env.PROVENAI_DB;

    await db
      .prepare(
        "INSERT OR IGNORE INTO stripe_webhook_events (event_id, event_type, received_at, status) VALUES (?, ?, ?, 'received')"
      )
      .bind(event.id, event.type, new Date().toISOString())
      .run();

    const existingEvent = await db
      .prepare("SELECT processed_at FROM stripe_webhook_events WHERE event_id = ?")
      .bind(event.id)
      .first<{ processed_at: string | null }>();

    if (existingEvent?.processed_at) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), { headers: JSON_HEADERS });
    }

    if (event.type !== "checkout.session.completed") {
      await markEventStatus(db, event.id, "ignored");
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: JSON_HEADERS });
    }

    const session = event.data.object;
    const paymentStatus = session.payment_status || "";
    if (paymentStatus !== "paid") {
      await markEventStatus(db, event.id, "ignored", "payment_not_paid");
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: JSON_HEADERS });
    }

    const amountCents = session.amount_total || 0;
    const amountGross = amountCents / 100;
    const currency = (session.currency || "usd").toUpperCase();
    const userId = session.metadata?.user_id || null;
    const email = session.metadata?.email || session.customer_details?.email || null;
    const refCode = session.metadata?.ref_code || null;
    const productId = session.metadata?.product_id || null;
    const productSku = session.metadata?.product_sku || null;
    const paymentIntentId = session.payment_intent || null;
    const chargeId = session.charges?.data?.[0]?.id || null;
    const stripePaymentId = paymentIntentId || chargeId || session.id;

    const purchaseId = crypto.randomUUID();
    await db
      .prepare(
        "INSERT OR IGNORE INTO purchases (id, user_id, email, product_id, product_sku, amount_gross, currency, stripe_session_id, stripe_payment_intent_id, stripe_charge_id, stripe_event_id, ref_code, purchased_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        purchaseId,
        userId,
        email,
        productId,
        productSku,
        amountGross,
        currency,
        session.id,
        paymentIntentId,
        chargeId,
        event.id,
        refCode,
        new Date().toISOString()
      )
      .run();

    if (userId) {
      await db
        .prepare("UPDATE user SET role = CASE WHEN role = 'public' THEN 'member' ELSE role END WHERE id = ?")
        .bind(userId)
        .run();
    }

    if (refCode && env.SAASDESK_WEBHOOK_API_KEY) {
      const alreadySynced = await db
        .prepare("SELECT stripe_payment_id FROM saasdesk_commission_sync WHERE stripe_payment_id = ?")
        .bind(stripePaymentId)
        .first<{ stripe_payment_id: string }>();

      if (!alreadySynced) {
        const reservedPayload = JSON.stringify({
          event_id: event.id,
          ref_code: refCode,
          product_id: productId,
          sale_amount: amountGross,
          currency,
        });

        await db
          .prepare(
            "INSERT OR IGNORE INTO saasdesk_commission_sync (stripe_payment_id, purchase_id, payload) VALUES (?, ?, ?)"
          )
          .bind(stripePaymentId, purchaseId, reservedPayload)
          .run();

        const productMap = productId
          ? await db
              .prepare("SELECT saasdesk_product_id FROM saasdesk_product_map WHERE proven_product_id = ?")
              .bind(productId)
              .first<{ saasdesk_product_id: string }>()
          : null;

        try {
          const commissionResponse = await postCommissionByRefToSaasDesk(
            {
              baseUrl: env.SAASDESK_BASE_URL || "https://saas-desk.pages.dev",
              webhookApiKey: env.SAASDESK_WEBHOOK_API_KEY,
              appId: env.SAASDESK_APP_ID || "",
            },
            {
              ref_code: refCode,
              sale_amount: amountGross,
              currency,
              stripe_payment_id: stripePaymentId,
              app_id: env.SAASDESK_APP_ID || undefined,
              product_id: productMap?.saasdesk_product_id || null,
              contact_id: null,
              notes: "ProvenAI purchase sync",
            }
          );

          await db
            .prepare(
              "UPDATE saasdesk_commission_sync SET commission_id = ?, synced_at = ? WHERE stripe_payment_id = ?"
            )
            .bind(
              typeof commissionResponse.id === "string" ? commissionResponse.id : null,
              new Date().toISOString(),
              stripePaymentId
            )
            .run();

          if (commissionResponse.action === "existing") {
            console.info("[payments.stripe-webhook.commission]", {
              action: "existing",
              stripePaymentId,
              refCode,
            });
          }
        } catch (commissionError) {
          console.error("[payments.stripe-webhook.commission]", {
            error: commissionError instanceof Error ? commissionError.message : String(commissionError),
            stripePaymentId,
            refCode,
            amountGross,
            currency,
          });
        }
      }
    }

    await markEventStatus(db, event.id, "processed");
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  } catch (error) {
    const event = (() => {
      try {
        return parseStripeWebhookEvent(rawBody);
      } catch {
        return null;
      }
    })();

    if (event?.id) {
      await env.PROVENAI_DB
        .prepare("UPDATE stripe_webhook_events SET status = ?, error = ? WHERE event_id = ?")
        .bind(
          "error",
          error instanceof Error ? error.message : String(error),
          event.id
        )
        .run()
        .catch(() => null);
    }

    console.error("[payments.stripe-webhook]", {
      error: error instanceof Error ? error.message : String(error),
      eventId: event?.id,
    });

    return new Response(JSON.stringify({ ok: false, error: "Webhook processing failed" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};
