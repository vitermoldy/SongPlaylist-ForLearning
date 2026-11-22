// YouTube links, video info and the IFrame player script. The link rules follow SongPlay's player.

const VIDEO_ID = /^[\w-]{11}$/;
const LIST_ID = /^[\w-]{12,}$/;
const HOSTS = new Set(["youtube.com", "youtu.be", "youtube-nocookie.com"]);

export const YOUTUBE_HOST = "https://www.youtube-nocookie.com";
/** A playlist link brings at most this many songs, so the deck stays scrollable. */
export const PLAYLIST_LIMIT = 50;

export type YouTubeLink =
  | { kind: "video"; id: string }
  | { kind: "playlist"; list: string }
  | { kind: "mix" };

/**
 * What a pasted link points at. A link that names a video adds that video alone, even when it was
 * opened from a playlist; only a link without a video (youtube.com/playlist?list=...) brings the
 * whole list. YouTube's own mixes, Watch later and Liked videos never play outside YouTube.
 */
export function parseYouTube(raw: string): YouTubeLink | null {
  const text = raw.trim();
  if (VIDEO_ID.test(text)) return { kind: "video", id: text };

  let url: URL;
  try {
