const YouTubeEmbedTest = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">YouTube Embed Test</h1>
        <p className="text-muted-foreground text-sm">
          Testing which embed approach avoids the "Sign in to confirm you're not a bot" wall.
        </p>
      </div>

      {/* Test 1 — standard youtube.com with origin param (MOST LIKELY TO WORK) */}
      <section className="space-y-2">
        <h2 className="font-semibold text-primary">1. Standard embed + origin param (recommended)</h2>
        <p className="text-xs text-muted-foreground">
          Uses youtube.com/embed/ with <code>origin</code> set to your domain. This lets YouTube
          set its session cookies and verify the request origin — the most reliable approach.
        </p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/0JI5R9hjdTw?origin=${encodeURIComponent(window.location.origin)}&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </section>

      {/* Test 2 — standard embed, no origin */}
      <section className="space-y-2">
        <h2 className="font-semibold">2. Standard embed, no origin param</h2>
        <p className="text-xs text-muted-foreground">
          Plain youtube.com/embed/ with no extra params — baseline test.
        </p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src="https://www.youtube.com/embed/0JI5R9hjdTw?rel=0"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </section>

      {/* Test 3 — nocookie (previously failed) */}
      <section className="space-y-2">
        <h2 className="font-semibold">3. Nocookie domain (likely blocked)</h2>
        <p className="text-xs text-muted-foreground">
          youtube-nocookie.com blocks cookies YouTube needs for bot detection — 
          this is paradoxically <em>more</em> likely to trigger the sign-in wall.
        </p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src="https://www.youtube-nocookie.com/embed/0JI5R9hjdTw"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </section>

      {/* Test 4 — YouTube IFrame API (JS-loaded) */}
      <section className="space-y-2">
        <h2 className="font-semibold">4. YouTube IFrame Player API</h2>
        <p className="text-xs text-muted-foreground">
          Uses YouTube's official JS API to create the player — gives YouTube full control
          over how the iframe is constructed.
        </p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <YouTubeAPIPlayer videoId="0JI5R9hjdTw" />
        </div>
      </section>

      <div className="text-sm space-y-3 pt-4 border-t border-border">
        <p className="font-medium">Troubleshooting checklist:</p>
        <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
          <li>
            <strong>YouTube Studio → Content → Video → Details → Show more</strong> — 
            ensure "Allow embedding" is checked.
          </li>
          <li>
            <strong>Video visibility</strong> — must be <em>Public</em> or <em>Unlisted</em>. 
            Private videos always block embeds.
          </li>
          <li>
            <strong>Browser test</strong> — try in an incognito window logged into Google. 
            If it works there, the issue is cookie/session state.
          </li>
          <li>
            <strong>Different browser</strong> — privacy extensions (uBlock, Privacy Badger) 
            can block YouTube's anti-bot cookies.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Video ownership doesn't matter — any public YouTube video can be embedded by any website.
          The bot check is YouTube's own anti-abuse measure on the embed player.
        </p>
      </div>
    </div>
  );
};

/**
 * Uses YouTube's official IFrame Player API to construct the embed.
 * This gives YouTube full control over cookie/session handling.
 */
function YouTubeAPIPlayer({ videoId }: { videoId: string }) {
  const containerId = `yt-player-${videoId}`;

  // Load the API script once, then create the player
  const ref = (node: HTMLDivElement | null) => {
    if (!node) return;
    // Avoid re-initialising
    if (node.dataset.ready === "1") return;
    node.dataset.ready = "1";

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    // The API calls this global when ready
    (window as any).onYouTubeIframeAPIReady = () => {
      new (window as any).YT.Player(containerId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
      });
    };

    // If the API is already loaded (e.g. navigated back), call directly
    if ((window as any).YT?.Player) {
      (window as any).onYouTubeIframeAPIReady();
    } else {
      document.head.appendChild(tag);
    }
  };

  return <div ref={ref} id={containerId} className="absolute inset-0 h-full w-full" />;
}

export default YouTubeEmbedTest;
