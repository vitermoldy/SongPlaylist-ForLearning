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
