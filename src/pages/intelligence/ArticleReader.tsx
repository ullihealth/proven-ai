import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatRelativeDate } from "@/components/briefing/IntelligenceBriefing";

/* ─── Types ─── */

interface ArticleData {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  rawExcerpt: string | null;
  excerpt: string | null;
  category: string;
  categoryLabel: string;
  sourceName: string;
  sourceUrl: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  imageUrl: string | null;
  contentHtml: string | null;
  contentText: string | null;
  author: string | null;
  wordCount: number | null;
  readingTimeMin: number | null;
  readingStatus: string;
  blockedReason: string | null;
  // Structured summary
  summaryWhatChanged: string | null;
  summaryWhyMatters: string | null;
  summaryTakeaway: string | null;
}

interface ExtractedContent {
  title: string | null;
  author: string | null;
  publishedDate: string | null;
  heroImage: string | null;
  bodyHtml: string;
  bodyText: string;
  wordCount: number;
  extractionMethod: string;
}

type RenderTier = "reader" | "iframe" | "excerpt";

const CATEGORY_ACCENT: Record<string, string> = {
  ai_software: "#2563EB",
  ai_business: "#059669",
  ai_robotics: "#7C3AED",
  ai_medicine: "#DC2626",
  other: "#6B7280",
};

/* ─── Source link (used top + bottom) ─── */
const SourceLink = ({ url, sourceName }: { url: string; sourceName: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#374151] hover:text-[#2563EB] transition-colors"
  >
    Open original at {sourceName}
    <ExternalLink className="h-3 w-3 text-[#9CA3AF]" />
  </a>
);

/* ─── Tier 1: Reader View ─── */
const ReaderView = ({
  article,
  content,
  accent,
}: {
  article: ArticleData;
  content: ExtractedContent;
  accent: string;
}) => {
  const heroImg = content.heroImage || article.imageUrl;
  const readMin = Math.max(1, Math.round(content.wordCount / 230));

  return (
    <>
      {/* Hero image */}
      {heroImg && (
        <div className="mb-6 rounded-md overflow-hidden">
          <img
            src={heroImg}
            alt=""
            className="w-full h-auto max-h-[400px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Author / reading time */}
      <div className="flex items-center gap-3 text-[12px] text-[#9CA3AF] mb-6 pb-5 border-b border-[#E5E7EB]">
        {content.author && (
          <span className="font-medium text-[#6B7280]">{content.author}</span>
        )}
        <span>{readMin} min read</span>
        <span className="ml-auto">
          <SourceLink url={article.url} sourceName={article.sourceName} />
        </span>
      </div>

      {/* Article body */}
      <div
        className="prose prose-sm max-w-none text-[15px] text-[#1F2937] leading-[1.75] mb-8
          [&_p]:mb-4 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[#111827]
          [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[#111827]
          [&_a]:text-[#2563EB] [&_a]:underline [&_a]:underline-offset-2
          [&_blockquote]:border-l-2 [&_blockquote]:border-[#E5E7EB] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#6B7280]
          [&_img]:rounded-md [&_img]:my-4 [&_img]:max-w-full
          [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
          [&_li]:mb-1"
        dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
      />
    </>
  );
};

/* ─── Tier 2: iFrame embed ─── */
const IframeView = ({ url }: { url: string }) => {
  const [loadError, setLoadError] = useState(false);

  if (loadError) return null; // Will cause parent to fall through to Tier 3

  return (
    <div className="mb-8 rounded-md overflow-hidden border border-[#E5E7EB]">
      <iframe
        src={url}
        title="Article"
        className="w-full border-0"
        style={{ height: "70vh", minHeight: 500 }}
        sandbox="allow-scripts allow-same-origin allow-popups"
        onError={() => setLoadError(true)}
      />
    </div>
  );
};

/* ─── Tier 3: Excerpt fallback ─── */
const ExcerptView = ({ article }: { article: ArticleData }) => {
  const heroImg = article.imageUrl;
  const excerpt = article.rawExcerpt || article.summary || article.contentHtml;
  const displayText = excerpt
    ? excerpt.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim()
    : null;

  return (
    <>
      {heroImg && (
        <div className="mb-5 rounded-md overflow-hidden">
          <img
            src={heroImg}
            alt=""
            className="w-full h-auto max-h-[360px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {displayText ? (
        <div className="text-[15px] text-[#374151] leading-[1.75] whitespace-pre-line mb-6">
          {displayText}
        </div>
      ) : (
        <div className="text-[14px] text-[#9CA3AF] italic mb-6">
          Full article content is not available for preview.
        </div>
      )}

      <div className="flex items-center gap-3 text-[12px] text-[#9CA3AF] mb-2">
        <AlertTriangle className="h-3 w-3" />
        <span>This source does not allow inline reading. View the full article below.</span>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Main Article Reader
   ═══════════════════════════════════════════════════════════════════════ */

const ArticleReader = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tier resolution
  const [tier, setTier] = useState<RenderTier>("reader");
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [canEmbed, setCanEmbed] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);

  // 1. Fetch article metadata
  useEffect(() => {
    if (!itemId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/briefing/${itemId}`);
        if (!res.ok) throw new Error(res.status === 404 ? "Article not found" : `HTTP ${res.status}`);
        const data = await res.json();
        setArticle(data.item);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId]);

  // 2. Attempt content extraction once we have the article URL
  useEffect(() => {
    if (!article?.url) return;

    // If we already have stored content_html, try that first
    if (article.contentHtml && article.contentHtml.length > 300) {
      const stripped = article.contentHtml.replace(/<[^>]*>/g, "").trim();
      const wordCount = stripped.split(/\s+/).filter(Boolean).length;
      if (wordCount > 50) {
        setExtractedContent({
          title: article.title,
          author: null,
          publishedDate: article.publishedAt,
          heroImage: article.imageUrl,
          bodyHtml: article.contentHtml,
          bodyText: stripped,
          wordCount,
          extractionMethod: "rss-content",
        });
        setTier("reader");
        setContentLoading(false);
        return;
      }
    }

    // Otherwise, fetch + extract from original URL
    (async () => {
      try {
        setContentLoading(true);
        const res = await fetch(`/api/briefing/content?url=${encodeURIComponent(article.url)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.ok && data.content) {
          const c = data.content as ExtractedContent;
          setCanEmbed(!!data.canEmbed);

          // Quality gate: need at least 100 words for reader view
          if (c.wordCount >= 100) {
            setExtractedContent(c);
            setTier("reader");
          } else if (data.canEmbed) {
            setTier("iframe");
          } else {
            setTier("excerpt");
          }
        } else {
          // Extraction failed
          setTier("excerpt");
        }
      } catch {
        setTier("excerpt");
      } finally {
        setContentLoading(false);
      }
    })();
  }, [article]);

  /* ─── Loading states ─── */

  if (loading) {
    return (
      <AppLayout>
        <div className="py-16 text-center">
          <Loader2 className="h-4 w-4 text-[#9CA3AF] animate-spin mx-auto" />
        </div>
      </AppLayout>
    );
  }

  if (error || !article) {
    return (
      <AppLayout>
        <div className="py-16 text-center">
          <p className="text-[14px] text-[#6B7280] mb-4">{error || "Article not found"}</p>
          <Link
            to="/control-centre"
            className="text-[13px] font-medium text-[#2563EB] hover:underline"
          >
            ← Back to Control Centre
          </Link>
        </div>
      </AppLayout>
    );
  }

  const accent = CATEGORY_ACCENT[article.category] || CATEGORY_ACCENT.other;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          to="/control-centre"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          Control Centre
        </Link>

        {/* Category + date */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded"
            style={{ backgroundColor: `${accent}10`, color: accent }}
          >
            {article.categoryLabel}
          </span>
          {article.publishedAt && (
            <span className="text-[12px] text-[#9CA3AF]">
              {formatRelativeDate(article.publishedAt)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[24px] font-bold text-[#111827] leading-tight tracking-[-0.02em] mb-4">
          {article.title}
        </h1>

        {/* Source attribution */}
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6 pb-5 border-b border-[#E5E7EB]">
          <span>Source: <span className="font-medium text-[#374151]">{article.sourceName}</span></span>
        </div>

        {/* Our Briefing - Structured Summary (ALWAYS SHOW) */}
        {(article.summaryWhatChanged || article.summaryWhyMatters || article.summaryTakeaway) && (
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-4 mb-6">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#6B7280] mb-3">
              Our Briefing
            </h2>
            
            {article.summaryWhatChanged && (
              <div className="mb-3">
                <h3 className="text-[12px] font-semibold text-[#374151] mb-1">What changed</h3>
                <p className="text-[14px] text-[#1F2937] leading-relaxed">{article.summaryWhatChanged}</p>
              </div>
            )}
            
            {article.summaryWhyMatters && (
              <div className="mb-3">
                <h3 className="text-[12px] font-semibold text-[#374151] mb-1">Why it matters</h3>
                <p className="text-[14px] text-[#1F2937] leading-relaxed">{article.summaryWhyMatters}</p>
              </div>
            )}
            
            {article.summaryTakeaway && (
              <div>
                <h3 className="text-[12px] font-semibold text-[#374151] mb-1">Key takeaway</h3>
                <p className="text-[14px] text-[#1F2937] leading-relaxed">• {article.summaryTakeaway}</p>
              </div>
            )}
          </div>
        )}

        {/* Best Available Excerpt (if no full content) */}
        {!extractedContent && article.excerpt && article.excerpt.length > 100 && (
          <div className="mb-6">
            <h2 className="text-[13px] font-semibold text-[#6B7280] mb-2">Excerpt</h2>
            <div className="text-[15px] text-[#374151] leading-[1.75] whitespace-pre-line">
              {article.excerpt}
            </div>
          </div>
        )}

        {/* Content loading state */}
        {contentLoading && (
          <div className="py-10 text-center">
            <Loader2 className="h-4 w-4 text-[#D1D5DB] animate-spin mx-auto mb-2" />
            <p className="text-[12px] text-[#9CA3AF]">Loading article…</p>
          </div>
        )}

        {/* Tier 1: Reader */}
        {!contentLoading && tier === "reader" && extractedContent && (
          <ReaderView article={article} content={extractedContent} accent={accent} />
        )}

        {/* Tier 2: iFrame */}
        {!contentLoading && tier === "iframe" && (
          <IframeView url={article.url} />
        )}

        {/* Tier 3: Excerpt */}
        {!contentLoading && tier === "excerpt" && (
          <ExcerptView article={article} />
        )}

        {/* Footer: open original */}
        <div className="border-t border-[#E5E7EB] pt-5 pb-8">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-medium text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-colors"
          >
            Read original at {article.sourceName}
            <ExternalLink className="h-3.5 w-3.5 text-[#9CA3AF]" />
          </a>
        </div>
      </div>
    </AppLayout>
  );
};

export default ArticleReader;
