/**
 * GET/POST /api/admin/briefing/settings
 * 
 * Manage global intelligence layer settings.
 * Allows admins to configure display options, summary behavior, excerpt lengths, etc.
 */

import type { BriefingEnv } from "../../briefing/_helpers";
import { isAdminRequest } from "../../briefing/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface IntelligenceSettings {
  // Display settings
  itemsPerCategory: number;
  showThumbnails: boolean;
  showReadingTime: boolean;
  
  // Content settings
  summaryLength: 'short' | 'medium' | 'long';
  excerptLength: number;
  
  // Feature flags
  articleView: 'on' | 'off';
  commentary: 'on' | 'off';
}

const SETTING_KEYS = {
  itemsPerCategory: 'INTEL_ITEMS_PER_CATEGORY',
  showThumbnails: 'INTEL_SHOW_THUMBNAILS',
  showReadingTime: 'INTEL_SHOW_READING_TIME',
  summaryLength: 'INTEL_SUMMARY_LENGTH',
  excerptLength: 'INTEL_EXCERPT_LENGTH',
  articleView: 'INTEL_ARTICLE_VIEW',
  commentary: 'INTEL_COMMENTARY',
} as const;

// ── GET: Return current settings ──
export const onRequestGet: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  try {
    if (!await isAdminRequest(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = env.PROVENAI_DB;
    
    // Fetch all settings in one query
    const { results } = await db
      .prepare(`SELECT key, value FROM app_config WHERE key IN (?, ?, ?, ?, ?, ?, ?)`)
      .bind(...Object.values(SETTING_KEYS))
      .all<{ key: string; value: string }>();
    
    const configMap: Record<string, string> = {};
    for (const row of results || []) {
      configMap[row.key] = row.value;
    }
    
    const settings: IntelligenceSettings = {
      itemsPerCategory: parseInt(configMap[SETTING_KEYS.itemsPerCategory] || '2', 10),
      showThumbnails: configMap[SETTING_KEYS.showThumbnails] === 'true',
      showReadingTime: configMap[SETTING_KEYS.showReadingTime] === 'true',
      summaryLength: (configMap[SETTING_KEYS.summaryLength] || 'medium') as 'short' | 'medium' | 'long',
      excerptLength: parseInt(configMap[SETTING_KEYS.excerptLength] || '400', 10),
      articleView: (configMap[SETTING_KEYS.articleView] || 'on') as 'on' | 'off',
      commentary: (configMap[SETTING_KEYS.commentary] || 'off') as 'on' | 'off',
    };
    
    return new Response(JSON.stringify({ settings }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// ── POST: Update settings ──
export const onRequestPost: PagesFunction<BriefingEnv> = async ({ request, env }) => {
  try {
    if (!await isAdminRequest(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = env.PROVENAI_DB;
    const body = await request.json() as Partial<IntelligenceSettings>;
    
    const updates: { key: string; value: string }[] = [];
    
    if (body.itemsPerCategory !== undefined) {
      const val = Math.max(1, Math.min(5, body.itemsPerCategory));
      updates.push({ key: SETTING_KEYS.itemsPerCategory, value: String(val) });
    }
    
    if (body.showThumbnails !== undefined) {
      updates.push({ key: SETTING_KEYS.showThumbnails, value: String(body.showThumbnails) });
    }
    
    if (body.showReadingTime !== undefined) {
      updates.push({ key: SETTING_KEYS.showReadingTime, value: String(body.showReadingTime) });
    }
    
    if (body.summaryLength !== undefined) {
      updates.push({ key: SETTING_KEYS.summaryLength, value: body.summaryLength });
    }
    
    if (body.excerptLength !== undefined) {
      const val = Math.max(300, Math.min(900, body.excerptLength));
      updates.push({ key: SETTING_KEYS.excerptLength, value: String(val) });
    }
    
    if (body.articleView !== undefined) {
      updates.push({ key: SETTING_KEYS.articleView, value: body.articleView });
    }
    
    if (body.commentary !== undefined) {
      updates.push({ key: SETTING_KEYS.commentary, value: body.commentary });
    }
    
    if (updates.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "No valid updates" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Batch update all settings
    const statements = updates.map(({ key, value }) =>
      db.prepare(`
        INSERT INTO app_config (key, value, updated_at) 
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).bind(key, value)
    );
    
    await db.batch(statements);
    
    return new Response(JSON.stringify({ ok: true, updated: updates.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
