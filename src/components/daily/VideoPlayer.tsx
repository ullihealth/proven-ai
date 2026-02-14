import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { extractYouTubeId } from "@/lib/video/youtubeParser";
import { ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  className?: string;
}

// Detect video URL type
const getVideoType = (url: string): 'mp4' | 'youtube' | 'vimeo' | 'iframe' => {
  if (!url) return 'mp4';
  
  // Check for direct MP4 or base64 video
  if (url.endsWith('.mp4') || url.startsWith('data:video/')) {
    return 'mp4';
  }
  
  // YouTube — use the robust parser
  if (extractYouTubeId(url)) {
    return 'youtube';
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  // Default to iframe for other embeds (HeyGen, etc.)
  return 'iframe';
};

// Extract Vimeo video ID
const getVimeoId = (url: string): string | null => {
  const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export const VideoPlayer = ({ videoUrl, className }: VideoPlayerProps) => {
  const videoType = getVideoType(videoUrl);
  const [embedFailed, setEmbedFailed] = useState(false);

  if (!videoUrl) {
    return (
      <AspectRatio ratio={16 / 9} className={cn("bg-muted rounded-lg overflow-hidden", className)}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No video available
        </div>
      </AspectRatio>
    );
  }

  // Native HTML5 video player for MP4
  if (videoType === 'mp4') {
    return (
      <AspectRatio ratio={16 / 9} className={cn("bg-black rounded-lg overflow-hidden", className)}>
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </AspectRatio>
    );
  }

  // YouTube embed — youtube-nocookie.com + fallback
  if (videoType === 'youtube') {
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      return (
        <AspectRatio ratio={16 / 9} className={cn("bg-muted rounded-lg overflow-hidden", className)}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Invalid YouTube URL
          </div>
        </AspectRatio>
      );
    }

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    if (embedFailed) {
      return (
        <AspectRatio ratio={16 / 9} className={cn("bg-[#111827] rounded-lg overflow-hidden", className)}>
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <p className="text-sm text-[#9CA3AF]">
              Video could not be embedded due to your browser privacy settings.
            </p>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#111827] rounded-md text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Watch on YouTube
            </a>
          </div>
        </AspectRatio>
      );
    }
    
    return (
      <div className="relative">
        <AspectRatio ratio={16 / 9} className={cn("bg-black rounded-lg overflow-hidden", className)}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
            onError={() => setEmbedFailed(true)}
          />
        </AspectRatio>
        {/* Persistent fallback link beneath embed */}
        <div className="flex justify-end mt-1.5">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open on YouTube
          </a>
        </div>
      </div>
    );
  }

  // Vimeo embed
  if (videoType === 'vimeo') {
    const videoId = getVimeoId(videoUrl);
    if (!videoId) {
      return (
        <AspectRatio ratio={16 / 9} className={cn("bg-muted rounded-lg overflow-hidden", className)}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Invalid Vimeo URL
          </div>
        </AspectRatio>
      );
    }
    
    return (
      <AspectRatio ratio={16 / 9} className={cn("bg-black rounded-lg overflow-hidden", className)}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          title="Vimeo video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </AspectRatio>
    );
  }

  // Generic iframe for other embeds (HeyGen, etc.)
  return (
    <AspectRatio ratio={16 / 9} className={cn("bg-black rounded-lg overflow-hidden", className)}>
      <iframe
        src={videoUrl}
        title="Video player"
        allow="autoplay; fullscreen"
        allowFullScreen
        className="w-full h-full"
      />
    </AspectRatio>
  );
};
