// The songs, the six the deck starts with, and what the browser remembers between visits.

import type { VideoInfo } from "@/lib/youtube";

export type Song = {
  /** The YouTube video ID; a song appears in the list once. */
  id: string;
  title: string;
  artist: string;
  /** The play button's colour, read from the cover the first time the song is shown. */
  accent?: string;
  /** Set when YouTube refused to play it here. */
  problem?: string;
};

/** Official videos, checked on 2026-11-22 to play outside YouTube. */
export const SEED_SONGS: Song[] = [
  { id: "9II3OGZETo4", title: "Hati-Hati di Jalan", artist: "Tulus" },
  { id: "dGcGbF4ex5o", title: "Dan", artist: "Sheila on 7" },
  { id: "wnAKxtEi78c", title: "Secukupnya", artist: "Hindia" },
  { id: "viW0M5R2BLo", title: "Akad", artist: "Payung Teduh" },
  { id: "yKNxeF4KMsY", title: "Yellow", artist: "Coldplay" },
  { id: "hLQl3WQQoQ0", title: "Someone Like You", artist: "Adele" },
];

const TAG = /\s*[([][^)\]]*\b(official|video|audio|lyrics?|lirik|mv|m\/v|visuali[sz]er|remaster(ed)?|4k|hd)\b[^)\]]*[)\]]/gi;

/**
 * "TULUS - Hati-Hati di Jalan (Official Music Video)" becomes the title "Hati-Hati di Jalan" by
 * "TULUS". A title without "Artist - Song" keeps the whole title and takes the channel as artist.
 */
export function splitTitle(raw: string, channel: string) {
  const cleaned = raw.replace(TAG, "").replace(/\s{2,}/g, " ").trim();
  const pair = cleaned.match(/^(.+?)\s+[-\u2013\u2014|]\s+(.+)$/);
  if (pair) return { artist: pair[1].trim(), title: pair[2].trim() };
  const artist = channel.replace(/\s*-\s*Topic$/i, "").replace(/VEVO$/i, "").trim();
  return { title: cleaned || raw, artist: artist || channel };
}

export const toSong = (id: string, info: VideoInfo): Song => ({ id, ...splitTitle(info.title, info.author) });

/** A list kept under a name in the Playlist menu: a copy of the deck at the moment it was saved. */
export type SavedPlaylist = { id: string; name: string; songs: Song[]; savedAt: number };

/** Same songs in the same order. */
export const sameSongs = (a: Song[], b: Song[]) => a.length === b.length && a.every((s, i) => s.id === b[i].id);

export const newPlaylistId = () => `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const KEY = "songplaylist-forlearning:v1";

export type Saved = {
  songs: Song[];
  current: string | null;
  volume: number;
  muted: boolean;
  playlists: SavedPlaylist[];
  /** The saved playlist the deck was opened from, offered first when saving again. */
  linked: string | null;
};

const isSong = (v: unknown): v is Song => {
  const s = v as Song;
  return !!s && typeof s.id === "string" && typeof s.title === "string" && typeof s.artist === "string";
};

const isPlaylist = (v: unknown): v is SavedPlaylist => {
  const p = v as SavedPlaylist;
  return !!p && typeof p.id === "string" && typeof p.name === "string" && Array.isArray(p.songs) && typeof p.savedAt === "number";
};

export function loadSaved(): Saved {
  const fallback: Saved = { songs: SEED_SONGS, current: SEED_SONGS[0].id, volume: 80, muted: false, playlists: [], linked: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<Saved>;
    if (!Array.isArray(data.songs)) return fallback;
    const songs = data.songs.filter(isSong);
    const current = typeof data.current === "string" && songs.some((s) => s.id === data.current) ? data.current : (songs[0]?.id ?? null);
    const volume = typeof data.volume === "number" && data.volume >= 0 && data.volume <= 100 ? data.volume : 80;
    const playlists = Array.isArray(data.playlists)
      ? data.playlists.filter(isPlaylist).map((p) => ({ ...p, songs: p.songs.filter(isSong) }))
      : [];
    const linked = typeof data.linked === "string" && playlists.some((p) => p.id === data.linked) ? data.linked : null;
    return { songs, current, volume, muted: data.muted === true, playlists, linked };
