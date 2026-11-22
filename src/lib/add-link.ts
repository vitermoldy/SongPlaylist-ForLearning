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
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const at = next++;
      out[at] = await run(items[at]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function addLink(raw: string, existing: string[], onProgress?: (text: string) => void): Promise<AddResult> {
  if (!raw.trim()) return fail("Tempel link YouTube dulu.");
  const link = parseYouTube(raw);
  if (!link) return fail("Itu bukan link video atau playlist YouTube.");
  if (link.kind === "mix") {
    return fail("Mix buatan YouTube, Tonton Nanti dan Video yang Disukai hanya bisa diputar di YouTube. Tempel link lagunya, atau link playlist biasa.");
  }

  if (link.kind === "video") {
    const at = existing.indexOf(link.id);
    if (at >= 0) return fail(`Lagu ini sudah ada di daftar, nomor ${at + 1}.`);
    try {
      const song = toSong(link.id, await fetchInfo(link.id));
      return { ok: true, text: `Ditambahkan: ${song.title}.`, songs: [song] };
    } catch (error) {
      return fail(describeInfoError(error));
    }
  }

  let ids: string[];
  try {
    ids = [...new Set(await expandPlaylist(link.list))];
  } catch {
    return fail("Playlist ini tidak bisa dibuka. Mungkin privat, atau YouTube hanya memutarnya di situsnya sendiri.");
  }
  const notYet = ids.filter((id) => !existing.includes(id));
  const already = ids.length - notYet.length;
  const fresh = notYet.slice(0, PLAYLIST_LIMIT);
  onProgress?.(`Membaca judul ${fresh.length} lagu…`);
  const found = await mapLimit(fresh, 6, async (id) => {
    try {
      return toSong(id, await fetchInfo(id));
    } catch {
      return null;
    }
  });
  const songs = found.filter((s): s is Song => s !== null);
