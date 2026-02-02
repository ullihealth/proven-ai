import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

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
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  // Default to iframe for other embeds (HeyGen, etc.)
  return 'iframe';
};

// Extract YouTube video ID
const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Extract Vimeo video ID
const getVimeoId = (url: string): string | null => {
  const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export const VideoPlayer = ({ videoUrl, className }: VideoPlayerProps) => {
  const videoType = getVideoType(videoUrl);

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

  // YouTube embed
  if (videoType === 'youtube') {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) {
      return (
        <AspectRatio ratio={16 / 9} className={cn("bg-muted rounded-lg overflow-hidden", className)}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Invalid YouTube URL
          </div>
        </AspectRatio>
      );
    }
    
    return (
      <AspectRatio ratio={16 / 9} className={cn("bg-black rounded-lg overflow-hidden", className)}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </AspectRatio>
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
