import { Link } from "react-router-dom";
import { BookOpen, Zap } from "lucide-react";
import { getCourseVisualSettings } from "@/lib/courses/coursesStore";
import { useCourses } from "@/hooks/use-courses";
import { directoryTools } from "@/data/directoryToolsData";

/**
 * EditorialTiles — Two side-by-side editorial media tiles.
 * BBC-style content promotion. No CTAs, no card chrome.
 * Uses admin-uploaded thumbnails when available, gradient placeholders otherwise.
 */

interface TileConfig {
  courseId: string;
  href: string;
  fallbackTitle: string;
  fallbackSubline?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentFrom: string;
  accentTo: string;
}

const TILE_CONFIGS: TileConfig[] = [
  {
    courseId: "ai-foundations",
    href: "/learn/courses/ai-foundations",
    fallbackTitle: "AI Foundations for Professionals",
    fallbackSubline: "Core concepts, tools and practical applications — start here.",
    icon: BookOpen,
    accentFrom: "#1E3A5F",
    accentTo: "#0F172A",
  },
  {
    courseId: "mastering-chatgpt",
    href: "/learn/courses/mastering-chatgpt",
    fallbackTitle: "Mastering ChatGPT",
    fallbackSubline: "From basic prompts to advanced techniques that deliver results.",
    icon: Zap,
    accentFrom: "#1E293B",
    accentTo: "#0F172A",
  },
];

const Tile = ({ config }: { config: TileConfig }) => {
  const vs = getCourseVisualSettings(config.courseId);
  const title = vs.cardTitle || config.fallbackTitle;
  const thumbnailUrl = vs.thumbnailUrl;

  return (
    <Link
      to={config.href}
      className="group block rounded-md overflow-hidden"
    >
      {/* 16:9 thumbnail */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: "56.25%" }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            style={{
              background: `linear-gradient(135deg, ${config.accentFrom} 0%, ${config.accentTo} 100%)`,
            }}
          >
            <config.icon className="h-10 w-10 text-white/20" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="pt-2 pb-0.5">
        <h3 className="text-[14px] font-semibold text-[#111827] leading-snug tracking-[-0.01em] group-hover:underline underline-offset-2 decoration-[#2563EB]/40">
          {title}
        </h3>
        {config.fallbackSubline && (
          <p className="mt-0.5 text-[12px] text-[#6B7280] leading-relaxed line-clamp-1">
            {config.fallbackSubline}
          </p>
        )}
      </div>
    </Link>
  );
};

export const CommandBlock = () => {
  const { courses } = useCourses();
  const courseCount = courses.length;
  const toolCount = directoryTools.length;

  // Count courses updated within the last 7 days
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const updatedThisWeek = courses.filter(
    (c) => c.lastUpdated && new Date(c.lastUpdated).getTime() > oneWeekAgo
  ).length;

  return (
    <section>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#1F2937] mb-1.5">
        Featured Courses
      </h2>
      <div className="h-px bg-[#E5E7EB] mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {TILE_CONFIGS.map((config) => (
          <Tile key={config.courseId} config={config} />
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-[#9CA3AF] tracking-[0.01em]">
        {courseCount} Courses{" · "}{toolCount} Tools{updatedThisWeek > 0 && <>{" · "}{updatedThisWeek} Updated This Week</>}
      </p>
    </section>
  );
};
