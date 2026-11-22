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
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  if (!HOSTS.has(host)) return null;

  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (url.pathname === "/watch") id = url.searchParams.get("v");
  else id = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1] ?? null;
  if (id && VIDEO_ID.test(id)) return { kind: "video", id };

  const list = url.searchParams.get("list");
  if (list && /^(RD|WL$|LL$|LM$)/.test(list)) return { kind: "mix" };
  if (list && LIST_ID.test(list)) return { kind: "playlist", list };
  return null;
}

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** maxres is 1280x720 but missing on some videos; hq (480x360) always exists, letterboxed to 4:3. */
export const thumbUrl = (id: string, size: "maxres" | "hq" | "mq") =>
  `https://i.ytimg.com/vi/${id}/${size}default.jpg`;

export type VideoInfo = { title: string; author: string };

export class InfoError extends Error {
  status: number;
  constructor(status: number) {
    super(`oEmbed ${status}`);
    this.status = status;
  }
}

/**
 * Title and channel from YouTube's oEmbed endpoint, which answers cross-origin. A 401 or 403 means
 * the owner turned embedding off; a 404 a private or removed video.
 */
export async function fetchInfo(id: string): Promise<VideoInfo> {
  const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl(id))}`);
  if (!res.ok) throw new InfoError(res.status);
  const data = (await res.json()) as { title?: string; author_name?: string };
  return { title: data.title ?? "", author: data.author_name ?? "" };
}

/** Why a video was refused, from the IFrame API error code, to follow "dilewati: ". */
export function describePlayError(code: number) {
  if (code === 100) return "videonya privat atau sudah dihapus";
  if (code === 101 || code === 150) return "pemiliknya tidak mengizinkan video ini diputar di situs lain";
  if (code === 2) return "ID videonya rusak";
  if (code === 5) return "browser ini tidak bisa memutar videonya";
  return "YouTube tidak bisa memutarnya";
}

export type YTPlayer = {
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  getIframe(): HTMLIFrameElement;
  getPlaylist?(): string[] | null;
  destroy(): void;
};

type YTEvent = { target: YTPlayer; data: number };

type YTPlayerOptions = {
  host?: string;
  width?: number | string;
  height?: number | string;
  videoId?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: YTEvent) => void;
    onStateChange?: (event: YTEvent) => void;
    onError?: (event: YTEvent) => void;
  };
};

export type YTNamespace = { Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer };

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** The IFrame API script, fetched on the first play rather than on page load. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("The YouTube player script did not load."));
    };
    document.head.append(script);
    window.setTimeout(() => {
      if (!window.YT?.Player) {
        apiPromise = null;
        reject(new Error("The YouTube player took too long to load."));
      }
    }, 15000);
  });
  return apiPromise;
}

/**
 * The video IDs of a public playlist. The IFrame API is the only way to read a list without an API
 * key, so a player is built off screen, asked for its list and taken down again.
 */
export async function expandPlaylist(list: string): Promise<string[]> {
  const YT = await loadYouTubeApi();
  return new Promise<string[]>((resolve, reject) => {
    const box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    box.style.cssText = "position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none;";
    const el = document.createElement("div");
    box.append(el);
    document.body.append(box);

