import { Play } from "lucide-react";

/**
 * CommandBlock — Primary broadcast surface for the Control Centre.
 * Video-only. No text, no CTAs, no card styling.
 */

interface CommandBlockProps {
  /** Video embed URL or null for placeholder */
  videoUrl?: string | null;
}

export const CommandBlock = ({ videoUrl = null }: CommandBlockProps) => {
  return (
    <div className="rounded-md overflow-hidden bg-[#111827]">
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Play className="h-6 w-6 text-white/70 ml-0.5" />
              </div>
              <span className="text-[13px] text-white/50 font-medium">Video content coming soon</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
