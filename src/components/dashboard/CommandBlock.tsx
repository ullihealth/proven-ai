import { Link } from "react-router-dom";
import { BookOpen, Zap } from "lucide-react";

/**
 * EditorialTiles — Two side-by-side editorial media tiles.
 * BBC-style content promotion. No CTAs, no card chrome.
 */

interface TileData {
  href: string;
  title: string;
  subline?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentFrom: string;
  accentTo: string;
}

const TILES: TileData[] = [
  {
    href: "/learn/courses/ai-foundations",
    title: "AI Foundations for Professionals",
    subline: "Core concepts, tools and practical applications — start here.",
    icon: BookOpen,
    accentFrom: "#1E3A5F",
    accentTo: "#0F172A",
  },
  {
    href: "/learn/courses/mastering-chatgpt",
    title: "Mastering ChatGPT",
    subline: "From basic prompts to advanced techniques that deliver results.",
    icon: Zap,
    accentFrom: "#1E293B",
    accentTo: "#0F172A",
  },
];

const Tile = ({ tile }: { tile: TileData }) => (
  <Link
    to={tile.href}
    className="group block rounded-md overflow-hidden"
  >
    {/* 16:9 thumbnail */}
    <div
      className="relative w-full overflow-hidden"
      style={{ paddingBottom: "56.25%" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        style={{
          background: `linear-gradient(135deg, ${tile.accentFrom} 0%, ${tile.accentTo} 100%)`,
        }}
      >
        <tile.icon className="h-10 w-10 text-white/20" />
      </div>
    </div>

    {/* Text */}
    <div className="pt-3 pb-1">
      <h3 className="text-[16px] font-semibold text-[#111827] leading-snug tracking-[-0.01em] group-hover:underline underline-offset-2 decoration-[#2563EB]/40">
        {tile.title}
      </h3>
      {tile.subline && (
        <p className="mt-1 text-[13px] text-[#6B7280] leading-relaxed line-clamp-1">
          {tile.subline}
        </p>
      )}
    </div>
  </Link>
);

export const CommandBlock = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {TILES.map((tile) => (
        <Tile key={tile.href} tile={tile} />
      ))}
    </div>
  );
};
