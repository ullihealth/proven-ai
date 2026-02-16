import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Play } from "lucide-react";

interface StreamPlayerProps {
  /** The raw Cloudflare Stream video ID (32-char hex) */
  videoId: string;
  /** Lesson ID — used to call the signed-token API */
  lessonId?: string;
  /** Optional title for accessibility */
  title?: string;
  /** CSS class for the outer wrapper */
  className?: string;
}

/**
 * Cloudflare Stream video player.
 *
 * Attempts to fetch a short-lived signed token from /api/lessons/:id/video-token.
 * If the token endpoint fails (keys not configured, user not authed, etc.)
 * it falls back to an unsigned embed — which works for videos not set to
 * "require signed URLs" in the Cloudflare dashboard.
 */
export const StreamPlayer = ({
  videoId,
  lessonId,
  title = "Video",
  className,
}: StreamPlayerProps) => {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      // If we have a lessonId, try to get a signed token
      if (lessonId) {
        try {
          const res = await fetch(
            `/api/lessons/${lessonId}/video-token?videoId=${encodeURIComponent(videoId)}`
          );
          if (res.ok) {
            const data = (await res.json()) as { token?: string };
            if (data.token && !cancelled) {
              setEmbedUrl(`https://iframe.videodelivery.net/${data.token}`);
              setLoading(false);
              return;
            }
          }
          // Non-OK or no token — fall through to unsigned
        } catch {
          // Network error — fall through to unsigned
        }
      }

      // Fallback: unsigned embed (works for public videos)
      if (!cancelled) {
        setEmbedUrl(`https://iframe.videodelivery.net/${videoId}`);
        setLoading(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [videoId, lessonId]);

  if (loading) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center ${className ?? ""}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-2 ${className ?? ""}`}>
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted ${className ?? ""}`}>
      <iframe
        src={embedUrl!}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title}
      />
    </div>
  );
};
