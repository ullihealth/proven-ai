/**
 * Scheduled Briefing Worker
 *
 * This file implements the cron-triggered briefing refresh logic.
 * It is designed to be deployed as a Cloudflare Worker (not Pages Function)
 * with a cron trigger, OR invoked via the admin /api/admin/briefing/run endpoint.
 *
 * Self-skip logic:
 *   - daily       → run if last successful run > BRIEFING_MIN_HOURS_BETWEEN_RUNS ago
 *   - 3x_week     → run only on configured days (default Mon/Wed/Fri)
 *   - weekly       → run only on Monday
 *   - manual       → never run on schedule; only via admin endpoint
 *
 * DEPLOYMENT NOTE:
 *   For Cloudflare Pages projects, scheduled triggers are not directly supported
 *   in the functions/ directory. Two options:
 *
 *   Option A (recommended): Use a separate Worker that calls the admin endpoint
 *     - Deploy a tiny Worker with a cron trigger that POSTs to /api/admin/briefing/run
 *
 *   Option B: Use Cloudflare Cron Trigger via wrangler.toml on a separate Worker
 *     - See wrangler.scheduled.toml example below
 *
 *   This file contains the core logic for both approaches.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ScheduledEnv {
  PROVENAI_DB: D1Database;
  BRIEFING_REFRESH_MODE?: string;
  BRIEFING_MIN_HOURS_BETWEEN_RUNS?: string;
  BRIEFING_MAX_ITEMS_STORED?: string;
  BRIEFING_MAX_ITEMS_VISIBLE?: string;
  BRIEFING_3X_WEEK_DAYS?: string;
  ADMIN_EMAILS?: string;
  APP_URL?: string;
}

// ---------------------------------------------------------------------------
// Self-skip logic
// ---------------------------------------------------------------------------
async function shouldRun(db: D1Database, env: ScheduledEnv): Promise<{ run: boolean; reason: string }> {
  // Read config
  const refreshMode = await getDbConfig(db, "BRIEFING_REFRESH_MODE", env.BRIEFING_REFRESH_MODE || "daily");
  const minHours = parseInt(
    await getDbConfig(db, "BRIEFING_MIN_HOURS_BETWEEN_RUNS", env.BRIEFING_MIN_HOURS_BETWEEN_RUNS || "18"),
    10
  );

  // Manual mode → never run on schedule
  if (refreshMode === "manual") {
    return { run: false, reason: "Mode is 'manual'; skipping scheduled run." };
  }

  // Check last successful run
  const lastRun = await db
    .prepare(
      "SELECT finished_at FROM briefing_runs WHERE status = 'success' ORDER BY finished_at DESC LIMIT 1"
    )
    .first<{ finished_at: string }>();

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Weekly → only Monday (1)
  if (refreshMode === "weekly") {
    if (dayOfWeek !== 1) {
      return { run: false, reason: `Mode is 'weekly'; today is not Monday (day ${dayOfWeek}).` };
    }
  }

  // 3x_week → only configured days
  if (refreshMode === "3x_week") {
    const daysStr = await getDbConfig(db, "BRIEFING_3X_WEEK_DAYS", env.BRIEFING_3X_WEEK_DAYS || "1,3,5");
    const allowedDays = daysStr.split(",").map((d) => parseInt(d.trim(), 10));
    if (!allowedDays.includes(dayOfWeek)) {
      return { run: false, reason: `Mode is '3x_week'; today (day ${dayOfWeek}) not in [${allowedDays}].` };
    }
  }

  // Throttle: check minimum hours since last run
  if (lastRun?.finished_at) {
    const lastTime = new Date(lastRun.finished_at).getTime();
    const hoursSince = (now.getTime() - lastTime) / (1000 * 60 * 60);
    if (hoursSince < minHours) {
      return {
        run: false,
        reason: `Throttled: last run was ${hoursSince.toFixed(1)}h ago (min: ${minHours}h).`,
      };
    }
  }

  return { run: true, reason: `Mode '${refreshMode}'; conditions met.` };
}

async function getDbConfig(db: D1Database, key: string, fallback: string): Promise<string> {
  const row = await db
    .prepare("SELECT value FROM app_config WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? fallback;
}

// ---------------------------------------------------------------------------
// Exported scheduled handler (for standalone Worker deployment)
// ---------------------------------------------------------------------------
export default {
  async scheduled(
    _event: ScheduledEvent,
    env: ScheduledEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    const db = env.PROVENAI_DB;

    const { run, reason } = await shouldRun(db, env);
    if (!run) {
      console.log(`[Briefing Scheduled] SKIP: ${reason}`);
      return;
    }

    console.log(`[Briefing Scheduled] RUN: ${reason}`);

    // Trigger the run via internal HTTP call or directly
    // If APP_URL is set, call the admin endpoint
    const appUrl = env.APP_URL || "https://provenai.app";
    try {
      const resp = await fetch(`${appUrl}/api/admin/briefing/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await resp.text();
      console.log(`[Briefing Scheduled] Result: ${result}`);
    } catch (error) {
      console.error(`[Briefing Scheduled] Error: ${error}`);
    }
  },

  // Also support fetch for testing
  async fetch(request: Request, env: ScheduledEnv): Promise<Response> {
    const db = env.PROVENAI_DB;
    const { run, reason } = await shouldRun(db, env);
    return new Response(
      JSON.stringify({ wouldRun: run, reason }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
};

/*
 * =========================================================================
 * DEPLOYMENT NOTES
 * =========================================================================
 *
 * To deploy this as a separate Cloudflare Worker with a cron trigger,
 * create a file called wrangler.scheduled.toml:
 *
 *   name = "proven-ai-briefing-scheduler"
 *   main = "functions/api/briefing/_scheduled.ts"
 *   compatibility_date = "2026-02-08"
 *   compatibility_flags = ["nodejs_compat"]
 *
 *   [[d1_databases]]
 *   binding = "PROVENAI_DB"
 *   database_name = "provenai-db"
 *   database_id = "131feed4-ed0e-4896-b403-2c8d941d9"
 *
 *   [vars]
 *   APP_URL = "https://provenai.app"
 *
 *   [triggers]
 *   crons = ["0 6 * * *"]   # Run daily at 06:00 UTC; self-skip logic handles cadence
 *
 * Deploy with:
 *   npx wrangler deploy --config wrangler.scheduled.toml
 *
 * The Worker runs daily at 06:00 UTC but the self-skip logic inside
 * shouldRun() respects the BRIEFING_REFRESH_MODE config:
 *   - "daily"    → runs every day (if min hours have passed)
 *   - "3x_week"  → runs only Mon/Wed/Fri
 *   - "weekly"   → runs only Monday
 *   - "manual"   → never runs on schedule
 *
 * To change cadence: update the app_config table value for
 * BRIEFING_REFRESH_MODE — no redeploy needed.
 * =========================================================================
 */
