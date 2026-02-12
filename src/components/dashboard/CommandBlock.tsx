import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

/**
 * CommandBlock — Hero section for the Control Centre.
 * Manually controlled content, not RSS.
 * 16:9 video placeholder + title + description + CTAs.
 */

interface CommandBlockProps {
  /** Video embed URL or null for placeholder */
  videoUrl?: string | null;
  title?: string;
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string } | null;
}

const DEFAULTS: Required<Omit<CommandBlockProps, "secondaryCta">> & { secondaryCta: CommandBlockProps["secondaryCta"] } = {
  videoUrl: null,
  title: "Welcome to Your AI Command Centre",
  description:
    "Your daily intelligence briefing — curated AI signals, course progress, and platform updates in one structured view.",
  primaryCta: { label: "Start AI Foundations", href: "/learn/courses/ai-foundations" },
  secondaryCta: { label: "Browse Tools", href: "/tools/directory" },
};

export const CommandBlock = ({
  videoUrl = DEFAULTS.videoUrl,
  title = DEFAULTS.title,
  description = DEFAULTS.description,
  primaryCta = DEFAULTS.primaryCta,
  secondaryCta = DEFAULTS.secondaryCta,
}: CommandBlockProps) => {
  return (
    <div className="rounded-md overflow-hidden border border-[#E5E7EB] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* 16:9 Video area */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 bg-[#111827] flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Play className="h-6 w-6 text-white/70 ml-0.5" />
              </div>
              <span className="text-[13px] text-white/50 font-medium">Video content coming soon</span>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-5">
        <h2 className="text-[20px] font-bold text-[#111827] tracking-[-0.015em] leading-tight">
          {title}
        </h2>
        <p className="mt-1.5 text-[14px] text-[#4B5563] leading-relaxed line-clamp-2">
          {description}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            to={primaryCta.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1D4ED8] transition-colors"
          >
            {primaryCta.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {secondaryCta && (
            <Link
              to={secondaryCta.href}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              {secondaryCta.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
