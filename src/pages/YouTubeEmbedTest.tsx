import { useState } from "react";
import { Play } from "lucide-react";

const VIDEO_ID = "0JI5R9hjdTw";

const YouTubeEmbedTest = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">YouTube Embed Test</h1>
        <p className="text-muted-foreground text-sm">
          All auto-loaded iframes triggered the bot wall. Tests below use click-to-play
          (iframe only loads after interaction) and a direct-link fallback.
        </p>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Important: open this page in a different browser (Safari, Firefox) or
            ask someone else to try it. If it works for them, the issue is specific
            to your browser's cookie/privacy state — your site visitors won't be affected.
          </p>
        </div>
      </div>

      {/* Test 1 — Click-to-play thumbnail (BEST APPROACH) */}
      <section className="space-y-2">
        <h2 className="font-semibold text-primary">1. Click-to-play thumbnail (recommended)</h2>
        <p className="text-xs text-muted-foreground">
          Shows a YouTube thumbnail. The iframe only loads when you click play —
          user-initiated loads are less likely to trigger bot detection.
        </p>
        <ClickToPlayEmbed videoId={VIDEO_ID} />
      </section>

      {/* Test 2 — Standard embed (auto-loaded, for comparison) */}
      <section className="space-y-2">
        <h2 className="font-semibold">2. Standard auto-loaded embed (comparison)</h2>
        <p className="text-xs text-muted-foreground">
          Loads immediately — if this works but previous tests didn't, a deployment cache was the issue.
        </p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${VIDEO_ID}?origin=${encodeURIComponent(window.location.origin)}&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </section>

      {/* Test 3 — Direct YouTube link (always works) */}
      <section className="space-y-2">
        <h2 className="font-semibold">3. Direct link to YouTube (fallback)</h2>
        <p className="text-xs text-muted-foreground">
          If embeds won't work on your machine, this approach shows a thumbnail with a link
          that opens YouTube directly. Always works regardless of bot detection.
        </p>
        <DirectLinkPlayer videoId={VIDEO_ID} />
      </section>

      <div className="text-sm space-y-3 pt-4 border-t border-border">
        <p className="font-medium">Key question to answer:</p>
        <p className="text-muted-foreground">
          Does variant <strong>1 (click-to-play)</strong> work? If yes → we'll use that for all lesson
          videos and your visitors will be fine. If no → try a different browser. If it works there,
          the problem is your browser only and won't affect visitors.
        </p>
        <p className="font-medium mt-4">Also verify in YouTube Studio:</p>
        <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
          <li>
            <strong>Content → Video → Details → Show more</strong> → "Allow embedding" is checked
          </li>
          <li>
            <strong>Visibility</strong> → Public or Unlisted (Private blocks all embeds)
          </li>
        </ol>
      </div>
    </div>
  );
};

/**
 * Click-to-play: renders a YouTube thumbnail with a play button.
 * The actual iframe is only injected AFTER the user clicks,
 * which means the embed request has a user-gesture context.
 */
function ClickToPlayEmbed({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black group cursor-pointer"
    >
      <img
        src={thumbnailUrl}
        alt="Video thumbnail"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          // Fall back to hqdefault if maxres doesn't exist
          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:bg-red-700 transition-colors">
          <Play className="h-7 w-7 text-white ml-1" fill="white" />
        </div>
      </div>
    </button>
  );
}

/**
 * Shows thumbnail with a direct link to YouTube — always works,
 * bypasses embed entirely. Good fallback.
 */
function DirectLinkPlayer({ videoId }: { videoId: string }) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black group block"
    >
      <img
        src={thumbnailUrl}
        alt="Video thumbnail"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }}
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:bg-red-700 transition-colors">
          <Play className="h-7 w-7 text-white ml-1" fill="white" />
        </div>
        <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
          Watch on YouTube ↗
        </span>
      </div>
    </a>
  );
}

export default YouTubeEmbedTest;
