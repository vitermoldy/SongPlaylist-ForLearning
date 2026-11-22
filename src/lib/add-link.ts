// Turns a pasted YouTube link into songs for the list, with a sentence saying what happened.

import { toSong, type Song } from "@/lib/playlist";
import { InfoError, PLAYLIST_LIMIT, expandPlaylist, fetchInfo, parseYouTube } from "@/lib/youtube";

export type AddResult = { ok: boolean; text: string; songs: Song[] };

const fail = (text: string): AddResult => ({ ok: false, text, songs: [] });

export function describeInfoError(error: unknown) {
  if (error instanceof InfoError) {
    if (error.status === 401 || error.status === 403) return "Pemilik video ini tidak mengizinkannya diputar di situs lain.";
    if (error.status === 404 || error.status === 400) return "Video ini privat, sudah dihapus, atau ID-nya salah.";
    return "YouTube tidak memberi info video ini. Coba lagi sebentar lagi.";
  }
  return "Tidak bisa menghubungi YouTube. Periksa koneksi internet, lalu coba lagi.";
}

async function mapLimit<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
