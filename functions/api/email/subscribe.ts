/**
 * Public Email Subscriber Proxy
 *
 * POST /api/email/subscribe
 * Body: { email, firstname, tags: { community: bool, provenai: bool } }
 *
 * Reads Sender.net credentials from site_settings in D1,
 * then proxies the request to Sender.net. The API token is
 * never exposed to the browser.
 */

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
  waitUntil: (promise: Promise<unknown>) => void;
}) => Response | Promise<Response>;

interface SubscribeBody {
  email?: string;
  firstname?: string;
  tags?: { community?: boolean; provenai?: boolean };
}

async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value || null;
}

export const onRequestPost: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({
  request,
  env,
  waitUntil,
}) => {
  try {
    const body = (await request.json()) as SubscribeBody;
    const email = body.email?.trim().toLowerCase();
    const firstname = body.firstname?.trim() || "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Valid email required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // Read credentials from D1
    const db = env.PROVENAI_DB;
    const [token, groupId, tagAi, tagPai] = await Promise.all([
      getSetting(db, "sender_api_token"),
      getSetting(db, "sender_group_id"),
      getSetting(db, "sender_tag_ai_group"),
      getSetting(db, "sender_tag_proven_ai"),
    ]);

    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email integration not configured" }),
        { status: 503, headers: JSON_HEADERS }
      );
    }

    // Build tags array
    const tags: string[] = [];
    if (body.tags?.community && tagAi) tags.push(tagAi);
    if (body.tags?.provenai && tagPai) tags.push(tagPai);

    // Proxy to Sender.net
    const senderPayload: Record<string, unknown> = {
      email,
      firstname,
      tags,
    };
    if (groupId) senderPayload.groups = [groupId];

    const senderRes = await fetch("https://api.sender.net/v2/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(senderPayload),
    });

    if (!senderRes.ok) {
      const errText = await senderRes.text().catch(() => "");
      console.error("[email/subscribe] Sender.net error:", senderRes.status, errText);
      return new Response(
        JSON.stringify({ ok: false, error: "Email service error" }),
        { status: 502, headers: JSON_HEADERS }
      );
    }

    // Mirror to D1 for local tracking (INSERT OR IGNORE so duplicates are harmless)
    try {
      await db
        .prepare("INSERT OR IGNORE INTO book_signups (email, firstname, source) VALUES (?, ?, 'book_page')")
        .bind(email, firstname)
        .run();
    } catch (dbErr) {
      // Non-fatal: Sender.net succeeded, just log the D1 error
      console.error("[email/subscribe] D1 mirror failed:", dbErr);
    }

    // Webhook to SaaSDesk — use waitUntil so the worker stays alive
    const saasPromise = fetch("https://saasdesk.dev/api/webhooks/subscriber", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "sk_provenai_7f3a9c2e1b4d8f6a0e5c3b9d7a2f1e4c",
      },
      body: JSON.stringify({
        email,
        firstname,
        source: "provenai-book",
        submitted_at: new Date().toISOString(),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("[email/subscribe] SaaSDesk webhook failed:", res.status, await res.text().catch(() => ""));
        }
      })
      .catch((err) => {
        console.error("[email/subscribe] SaaSDesk webhook error:", err);
      });
    waitUntil(saasPromise);

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[email/subscribe]", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
