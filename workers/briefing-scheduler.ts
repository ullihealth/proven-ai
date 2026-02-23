/**
 * Briefing Scheduler — standalone Cloudflare Worker with cron trigger.
 *
 * Runs on a schedule (default: daily at 06:00 UTC).
 * Self-skip logic in the briefing run endpoint handles cadence
 * (daily / 3x_week / weekly / manual) — this worker just fires the POST.
 *
 * Deploy: npx wrangler deploy --config wrangler.scheduled.toml
 */

interface Env {
  APP_URL: string;
  CRON_SECRET?: string;
}

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const appUrl = env.APP_URL || "https://provenai.app";
    const url = `${appUrl}/api/admin/briefing/run`;

    console.log(`[BriefingScheduler] Triggering ${url}`);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      // Include shared secret if configured (for future auth hardening)
      if (env.CRON_SECRET) {
        headers["X-Cron-Secret"] = env.CRON_SECRET;
      }

      const resp = await fetch(url, { method: "POST", headers });
      const body = await resp.text();
      console.log(`[BriefingScheduler] ${resp.status}: ${body.slice(0, 500)}`);
    } catch (err) {
      console.error(`[BriefingScheduler] Failed:`, err);
    }
  },

  // GET handler for manual test / health check
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response(
      JSON.stringify({
        worker: "proven-ai-briefing-scheduler",
        targetUrl: `${env.APP_URL || "https://provenai.app"}/api/admin/briefing/run`,
        hint: "This worker fires on a cron schedule. GET is a health check only.",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
};
