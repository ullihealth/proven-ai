/**
 * YouTube URL normalisation utility.
 *
 * Accepts any common YouTube URL format and extracts the video ID:
 *   - https://www.youtube.com/watch?v=XXXXXXXXXXX
 *   - https://youtu.be/XXXXXXXXXXX
 *   - https://www.youtube.com/embed/XXXXXXXXXXX
 *   - https://www.youtube.com/shorts/XXXXXXXXXXX
 *   - https://www.youtube.com/live/XXXXXXXXXXX
 *   - https://youtube-nocookie.com/embed/XXXXXXXXXXX
 *   - + variants with extra query params, www prefix, etc.
 *
 * Returns null for non-YouTube URLs.
 */

export interface YouTubeParseResult {
  provider: "youtube";
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}

/**
 * Extract YouTube video ID from any YouTube URL format.
 * Returns the 11-character video ID, or null if not a YouTube URL / invalid.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // Patterns that capture the video ID
  const patterns: RegExp[] = [
    // youtu.be/ID  (share URLs)
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/watch?v=ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/ID  or youtube-nocookie.com/embed/ID
    /(?:https?:\/\/)?(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/shorts/ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/live/ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/v/ID  (older format)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Parse any YouTube URL into a canonical result with embed + watch URLs.
 * Returns null if the URL is not a recognised YouTube URL.
 */
export function parseYouTubeUrl(url: string): YouTubeParseResult | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return {
    provider: "youtube",
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/**
 * Check whether a URL is a YouTube URL (any format).
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
