/**
 * Intelligence Briefing – shared types & helpers
 * Used by both the API endpoints and the scheduled job.
 */

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const BRIEFING_CATEGORIES: Record<string, string> = {
  ai_software: "AI Software",
  ai_business: "AI & Business",
  ai_robotics: "AI & Robotics",
  ai_medicine: "AI & Medicine",
  ai_regulation: "AI Regulation",
  ai_research: "AI Research",
  other: "Other",
};

export type BriefingCategory = keyof typeof BRIEFING_CATEGORIES;

// ---------------------------------------------------------------------------
// DB row shapes (lightweight, no ORM)
// ---------------------------------------------------------------------------
export interface BriefingSource {
  id: string;
  name: string;
  url: string;
  category_hint: string | null;
  enabled: number; // 0 | 1
  created_at: string;
}

export interface BriefingItem {
  id: string;
  source_id: string;
  title: string;
  url: string;
  published_at: string | null;
  fetched_at: string;
  hash: string;
  category: string;
  summary: string | null;
  score: number | null;
  status: string;
  dedupe_group: string | null;
  raw_excerpt: string | null;
  notes: string | null;
  image_url: string | null;
  content_html: string | null;
}

export interface BriefingRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  items_fetched: number;
  items_created: number;
  items_updated: number;
  error_message: string | null;
}

export interface AppConfig {
  key: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Env bindings (Cloudflare Pages Functions)
// ---------------------------------------------------------------------------
export interface BriefingEnv {
  PROVENAI_DB: D1Database;
  ADMIN_EMAILS?: string;
  AUTH_SECRET?: string;
  // Optional env-level overrides (take priority over app_config)
  BRIEFING_REFRESH_MODE?: string;
  BRIEFING_MAX_ITEMS_VISIBLE?: string;
  BRIEFING_MAX_ITEMS_STORED?: string;
  BRIEFING_MIN_HOURS_BETWEEN_RUNS?: string;
}

// ---------------------------------------------------------------------------
// Config helpers – reads from env first, then app_config table
// ---------------------------------------------------------------------------
export async function getConfig(
  db: D1Database,
  env: BriefingEnv,
  key: string,
  fallback: string
): Promise<string> {
  // Env var wins
  const envVal = (env as Record<string, unknown>)[key];
  if (typeof envVal === "string" && envVal.length > 0) return envVal;

  // Then DB
  const row = await db
    .prepare("SELECT value FROM app_config WHERE key = ?")
    .bind(key)
    .first<AppConfig>();
  return row?.value ?? fallback;
}

export async function getConfigInt(
  db: D1Database,
  env: BriefingEnv,
  key: string,
  fallback: number
): Promise<number> {
  const val = await getConfig(db, env, key, String(fallback));
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ---------------------------------------------------------------------------
// Hash helper – deterministic dedup hash from title + url
// ---------------------------------------------------------------------------
export async function computeItemHash(title: string, url: string): Promise<string> {
  const normalized = `${title.trim().toLowerCase()}|${url.trim().toLowerCase()}`;
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Placeholder summariser
// ---------------------------------------------------------------------------
export function placeholderSummarise(
  title: string,
  excerpt: string | null
): string {
  const source = excerpt && excerpt.length > 10 ? excerpt : title;
  // Strip HTML tags
  const plain = source.replace(/<[^>]*>/g, "").trim();
  // Truncate to ~200 chars at a word boundary
  if (plain.length <= 200) return plain;
  const truncated = plain.slice(0, 200);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

// ---------------------------------------------------------------------------
// Category inference from hints and content
// ---------------------------------------------------------------------------
export function inferCategory(
  categoryHint: string | null,
  title: string
): BriefingCategory {
  const hint = (categoryHint || "").toLowerCase();
  const text = `${hint} ${title.toLowerCase()}`;

  if (/robot|automat|manufactur/.test(text)) return "ai_robotics";
  if (/medic|health|clinic|pharma|patient|diagnos/.test(text)) return "ai_medicine";
  if (/regulat|law|legislat|polic|govern|compliance|eu ai act/.test(text))
    return "ai_regulation";
  if (/business|enterprise|startup|funding|invest|revenue|market/.test(text))
    return "ai_business";
  if (/research|paper|arxiv|benchmark|model|dataset/.test(text))
    return "ai_research";
  if (/software|tool|app|platform|api|release|launch|update|feature/.test(text))
    return "ai_software";

  return "other";
}

// ---------------------------------------------------------------------------
// RSS fetch helper – safe fetcher with validation
// ---------------------------------------------------------------------------
export interface FetchRSSResult {
  ok: boolean;
  items: RSSItem[];
  error?: string;
}

export async function fetchRSS(url: string): Promise<FetchRSSResult> {
  try {
    const resp = await fetch(url, {
      headers: {
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "User-Agent": "ProvenAI-BriefingBot/1.0",
      },
      redirect: "follow",
    });

    if (!resp.ok) {
      return { ok: false, items: [], error: `HTTP ${resp.status} ${resp.statusText}` };
    }

    const text = await resp.text();

    // Detect HTML instead of RSS/Atom
    const trimmed = text.trimStart().toLowerCase();
    if (
      trimmed.startsWith("<!doctype html") ||
      trimmed.startsWith("<html") ||
      (trimmed.includes("<html") && !trimmed.includes("<rss") && !trimmed.includes("<feed"))
    ) {
      return { ok: false, items: [], error: "Non-RSS response (received HTML page)" };
    }

    // Require at least some XML-like content
    if (!trimmed.includes("<")) {
      return { ok: false, items: [], error: "Non-XML response body" };
    }

    const items = parseRSS(text);
    return { ok: true, items };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, items: [], error: msg };
  }
}

// ---------------------------------------------------------------------------
// Minimal RSS XML parser (runs in Workers without npm deps)
// ---------------------------------------------------------------------------
export interface RSSItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  contentEncoded: string | null;
  imageUrl: string | null;
}

export function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Handle both RSS <item> and Atom <entry> elements
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTag(block, "title") || "Untitled";
    const link =
      extractTag(block, "link") ||
      extractAtomLink(block) ||
      "";
    const pubDate =
      extractTag(block, "pubDate") ||
      extractTag(block, "published") ||
      extractTag(block, "updated") ||
      null;
    const description =
      extractTag(block, "description") ||
      extractTag(block, "summary") ||
      null;
    const contentEncoded =
      extractTag(block, "content:encoded") ||
      extractTag(block, "content") ||
      null;
    const imageUrl = extractMediaImage(block);

    if (link) {
      items.push({ title, link, pubDate, description, contentEncoded, imageUrl });
    }
  }

  return items;
}

function extractTag(block: string, tag: string): string | null {
  // Try CDATA first
  const cdataRegex = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i"
  );
  const cdataMatch = cdataRegex.exec(block);
  if (cdataMatch) return cdataMatch[1].trim();

  // Plain text
  const plainRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const plainMatch = plainRegex.exec(block);
  if (plainMatch) return plainMatch[1].trim();

  return null;
}

function extractAtomLink(block: string): string | null {
  // Atom <link href="..." />
  const atomRegex = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i;
  const atomMatch = atomRegex.exec(block);
  return atomMatch ? atomMatch[1] : null;
}

/**
 * Extract hero image from RSS item.
 * Checks: media:content, media:thumbnail, enclosure (image/*), og fallback from description img.
 */
function extractMediaImage(block: string): string | null {
  // media:content or media:thumbnail with url attribute
  const mediaRegex = /<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["'][^>]*\/?>/i;
  const mediaMatch = mediaRegex.exec(block);
  if (mediaMatch) return mediaMatch[1];

  // enclosure with image type
  const enclosureRegex = /<enclosure[^>]*type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["'][^>]*\/?>/i;
  const encMatch = enclosureRegex.exec(block);
  if (encMatch) return encMatch[1];

  // Also try enclosure with url first, type second
  const enclosureAlt = /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["'][^>]*\/?>/i;
  const encAltMatch = enclosureAlt.exec(block);
  if (encAltMatch) return encAltMatch[1];

  // Fallback: first <img src="..."> in description/content
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*\/?>/i;
  const imgMatch = imgRegex.exec(block);
  if (imgMatch) return imgMatch[1];

  return null;
}

/**
 * Strip HTML tags and decode common entities.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a rich excerpt (400-800 chars) from available RSS content.
 * Prefers content:encoded > description, strips HTML, truncates at word boundary.
 */
export function buildExcerpt(
  contentEncoded: string | null,
  description: string | null,
  maxLen = 800
): string | null {
  const source = contentEncoded || description;
  if (!source) return null;
  const plain = stripHtml(source);
  if (plain.length <= maxLen) return plain;
  const truncated = plain.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 200 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

// ---------------------------------------------------------------------------
// Admin auth placeholder
// ---------------------------------------------------------------------------
export function isAdminRequest(
  request: Request,
  _env: BriefingEnv
): boolean {
  // Placeholder: check for a header or cookie.
  // This will be replaced with Better Auth session validation later.
  // For now, rely on the session cookie being present (trust the gateway).
  // The actual admin check happens in the calling function after session validation.
  return true; // Stub – real auth swap later
}
