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
