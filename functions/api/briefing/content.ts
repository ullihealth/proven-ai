/**
 * GET /api/briefing/content?url=<encoded_url>
 *
 * Server-side content proxy: fetches the original article URL,
 * extracts readable content, and returns it as JSON.
 *
 * Used by the Article Reader's Tier 1 (reader view).
 * Runs on Cloudflare Workers — no npm dependencies.
 */

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface ExtractedContent {
  title: string | null;
  author: string | null;
  publishedDate: string | null;
  heroImage: string | null;
  bodyHtml: string;
  bodyText: string;
  wordCount: number;
  extractionMethod: "article" | "og+body" | "raw";
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers,
      });
    }

    // Fetch the original page
    let html: string;
    try {
      const resp = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ProvenAI-Reader/1.0)",
          "Accept": "text/html,application/xhtml+xml,*/*",
        },
        redirect: "follow",
      });

      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: `Upstream HTTP ${resp.status}`, canEmbed: false }),
          { status: 502, headers }
        );
      }

      // Check if embedding is blocked (for the client's iframe fallback decision)
      const xfo = resp.headers.get("x-frame-options");
      const csp = resp.headers.get("content-security-policy");
      const embedBlocked = !!(
        xfo ||
        (csp && /frame-ancestors/i.test(csp) && !/frame-ancestors[^;]*\*/i.test(csp))
      );

      html = await resp.text();

      // Try to extract content
      const extracted = extractContent(html, targetUrl);

      return new Response(
        JSON.stringify({
          ok: true,
          canEmbed: !embedBlocked,
          content: extracted,
        }),
        { headers }
      );
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      return new Response(
        JSON.stringify({ error: `Fetch failed: ${msg}`, canEmbed: false }),
        { status: 502, headers }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
};

// ---------------------------------------------------------------------------
// Content extraction (lightweight, no npm deps — regex-based)
// ---------------------------------------------------------------------------

function extractContent(html: string, baseUrl: string): ExtractedContent {
  // Extract metadata from <head>
  const title = extractMetaContent(html, "og:title") || extractHtmlTitle(html);
  const author =
    extractMetaContent(html, "author") ||
    extractMetaName(html, "author") ||
    null;
  const publishedDate =
    extractMetaContent(html, "article:published_time") ||
    extractMetaName(html, "date") ||
    null;
  const heroImage =
    extractMetaContent(html, "og:image") || null;

  // Try to extract article body
  let bodyHtml = "";

  // Strategy 1: <article> tag
  const articleMatch = /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html);
  if (articleMatch) {
    bodyHtml = cleanArticleHtml(articleMatch[1]);
  }

  // Strategy 2: Common content containers
  if (!bodyHtml || bodyHtml.length < 200) {
    const contentSelectors = [
      /<div[^>]*class="[^"]*(?:post-content|entry-content|article-body|story-body|article__body|post__content|story__content|single-post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*(?:article-body|post-content|main-content|story-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];

    for (const regex of contentSelectors) {
      const m = regex.exec(html);
      if (m && m[1].length > (bodyHtml?.length || 0)) {
        bodyHtml = cleanArticleHtml(m[1]);
      }
    }
  }

  // Strategy 3: Collect all <p> tags from the body
  if (!bodyHtml || bodyHtml.length < 200) {
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(html)) !== null) {
      const text = stripTags(pMatch[1]).trim();
      if (text.length > 40) {
        paragraphs.push(`<p>${pMatch[1]}</p>`);
      }
    }
    if (paragraphs.length > 2) {
      bodyHtml = paragraphs.join("\n");
    }
  }

  const bodyText = stripTags(bodyHtml).trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  const method: ExtractedContent["extractionMethod"] =
    articleMatch ? "article" : bodyHtml.length > 200 ? "og+body" : "raw";

  return {
    title,
    author,
    publishedDate,
    heroImage: heroImage ? resolveUrl(heroImage, baseUrl) : null,
    bodyHtml: bodyHtml || "",
    bodyText: bodyText || "",
    wordCount,
    extractionMethod: method,
  };
}

function extractMetaContent(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const match = regex.exec(html);
  if (match) return match[1];

  // Also try content before property
  const altRegex = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
    "i"
  );
  const altMatch = altRegex.exec(html);
  return altMatch ? altMatch[1] : null;
}

function extractMetaName(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*name=["']${escapeRegex(name)}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const match = regex.exec(html);
  return match ? match[1] : null;
}

function extractHtmlTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? stripTags(match[1]).trim() : null;
}

function cleanArticleHtml(html: string): string {
  // Remove script, style, nav, aside, footer, ad elements
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  return cleaned.trim();
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

function resolveUrl(url: string, base: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
