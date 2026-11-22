// The songs, the six the deck starts with, and what the browser remembers between visits.

import type { VideoInfo } from "@/lib/youtube";

export type Song = {
  /** The YouTube video ID; a song appears in the list once. */
  id: string;
  title: string;
  artist: string;
  /** The play button's colour, read from the cover the first time the song is shown. */
  accent?: string;
