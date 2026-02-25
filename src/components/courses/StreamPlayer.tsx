import { useState, useEffect, useRef, useCallback } from "react";
import { Stream } from "@cloudflare/stream-react";
import { Loader2, AlertCircle, Volume2, VolumeX } from "lucide-react";

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
 * Cloudflare Stream video player with volume amplification.
 *
 * Uses the @cloudflare/stream-react SDK (inline player, not iframe) so we
 * can attach a Web Audio GainNode to boost volume beyond 100%.
 *
 * Attempts to fetch a short-lived signed token from /api/lessons/:id/video-token.
 * Falls back to unsigned embed when the token endpoint fails.
 */
export const StreamPlayer = ({
  videoId,
  lessonId,
  title = "Video",
  className,
}: StreamPlayerProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Volume boost: 1 = normal, up to 3 = 300%
  const [boostLevel, setBoostLevel] = useState(2);
  const [showBoost, setShowBoost] = useState(false);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedRef = useRef(false);

  // Resolve token on mount
  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (lessonId) {
        try {
          const res = await fetch(
            `/api/lessons/${lessonId}/video-token?videoId=${encodeURIComponent(videoId)}`
          );
          if (res.ok) {
            const data = (await res.json()) as { token?: string };
            if (data.token && !cancelled) {
              setToken(data.token);
              setLoading(false);
              return;
            }
          }
        } catch {
          // fall through
        }
      }
      if (!cancelled) {
        setToken(null);
        setLoading(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [videoId, lessonId]);

  // Attach Web Audio gain node once the video element is available
  const connectAudioBoost = useCallback((videoEl: HTMLVideoElement | null) => {
    if (!videoEl || connectedRef.current) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(videoEl);
      const gain = ctx.createGain();
      gain.gain.value = boostLevel;
      source.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      sourceRef.current = source;
      connectedRef.current = true;
    } catch (e) {
      console.warn("[StreamPlayer] Audio boost unavailable:", e);
    }
  }, []); // intentionally no deps — runs once per video element

  // Update gain when user changes the slider
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = boostLevel;
    }
  }, [boostLevel]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        connectedRef.current = false;
      }
    };
  }, []);

  // Handle the Stream SDK's onLoadedMetaData to grab the underlying <video> element
  const handlePlay = useCallback(() => {
    // Resume audio context (browsers require user gesture)
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }

    // If not yet connected, try to find the video element
    if (!connectedRef.current) {
      const wrapper = document.querySelector("[data-stream-boost]");
      const videoEl = wrapper?.querySelector("video");
      if (videoEl) connectAudioBoost(videoEl);
    }
  }, [connectAudioBoost]);

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

  const src = token || videoId;

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted group ${className ?? ""}`}
      data-stream-boost
    >
      <Stream
        src={src}
        controls
        responsive={false}
        className="absolute inset-0 h-full w-full"
        title={title}
        onPlay={handlePlay}
        preload="metadata"
      />

      {/* Volume boost control — appears on hover in top-right */}
      <div
        className={`absolute top-2 right-2 z-10 transition-opacity duration-200 ${
          showBoost ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <div className="flex items-center gap-2 bg-black/75 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs">
          {boostLevel <= 1 ? (
            <VolumeX className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={boostLevel}
            onChange={(e) => setBoostLevel(parseFloat(e.target.value))}
            onMouseDown={() => setShowBoost(true)}
            onMouseUp={() => setShowBoost(false)}
            onTouchStart={() => setShowBoost(true)}
            onTouchEnd={() => setShowBoost(false)}
            className="w-20 h-1 accent-white cursor-pointer"
            title={`Volume boost: ${Math.round(boostLevel * 100)}%`}
          />
          <span className="w-8 text-right tabular-nums">{Math.round(boostLevel * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
