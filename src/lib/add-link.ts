// Turns a pasted YouTube link into songs for the list, with a sentence saying what happened.

import { toSong, type Song } from "@/lib/playlist";
import { InfoError, PLAYLIST_LIMIT, expandPlaylist, fetchInfo, parseYouTube } from "@/lib/youtube";

export type AddResult = { ok: boolean; text: string; songs: Song[] };

const fail = (text: string): AddResult => ({ ok: false, text, songs: [] });

