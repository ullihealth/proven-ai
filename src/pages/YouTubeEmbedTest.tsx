const YouTubeEmbedTest = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">YouTube Embed Test</h1>
        <p className="text-muted-foreground text-sm">
          Testing whether YouTube embeds load correctly for site visitors (no bot / login wall).
        </p>
      </div>

      {/* Test 1 — exact embed code from YouTube (youtube-nocookie) */}
      <section className="space-y-2">
        <h2 className="font-semibold">1. YouTube-provided embed (youtube-nocookie.com)</h2>
        <p className="text-xs text-muted-foreground">Exact iframe from YouTube share → Embed.</p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube-nocookie.com/embed/0JI5R9hjdTw?si=Tudw6qPt6J87TgAF"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </section>

      {/* Test 2 — standard youtube.com/embed */}
      <section className="space-y-2">
        <h2 className="font-semibold">2. Standard embed (youtube.com)</h2>
        <p className="text-xs text-muted-foreground">Same video ID via youtube.com/embed/ — for comparison.</p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src="https://www.youtube.com/embed/0JI5R9hjdTw"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </section>

      {/* Test 3 — nocookie with no extra params */}
      <section className="space-y-2">
        <h2 className="font-semibold">3. Nocookie, no tracking params</h2>
        <p className="text-xs text-muted-foreground">youtube-nocookie.com/embed/ without ?si= param.</p>
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

      <p className="text-xs text-muted-foreground pt-4 border-t border-border">
        If all three play without a login wall, your site visitors will be fine. 
        Variant 1 (nocookie) is recommended — it avoids setting YouTube cookies on your domain.
      </p>
    </div>
  );
};

export default YouTubeEmbedTest;
