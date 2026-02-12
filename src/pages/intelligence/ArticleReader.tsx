import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatRelativeDate } from "@/components/briefing/IntelligenceBriefing";

interface ArticleData {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  rawExcerpt: string | null;
  category: string;
  categoryLabel: string;
  sourceName: string;
  sourceUrl: string | null;
  publishedAt: string | null;
  fetchedAt: string;
}

const CATEGORY_ACCENT: Record<string, string> = {
  ai_software: "#2563EB",
  ai_business: "#059669",
  ai_robotics: "#7C3AED",
  ai_medicine: "#DC2626",
  ai_regulation: "#D97706",
  ai_research: "#4338CA",
  other: "#6B7280",
};

const ArticleReader = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const bodyText = article.summary || article.rawExcerpt;

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
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6 pb-6 border-b border-[#E5E7EB]">
          <span>Source: <span className="font-medium text-[#374151]">{article.sourceName}</span></span>
        </div>

        {/* Body */}
        {bodyText ? (
          <div className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-line mb-8">
            {bodyText}
          </div>
        ) : (
          <div className="text-[14px] text-[#9CA3AF] italic mb-8">
            No summary available for this article.
          </div>
        )}

        {/* Footer: link to original */}
        <div className="border-t border-[#E5E7EB] pt-5 pb-8">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-colors"
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
