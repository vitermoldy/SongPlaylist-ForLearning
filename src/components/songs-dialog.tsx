import { useState } from "react";
import { AudioLines, ExternalLink, ListPlus, ListX, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddSongForm, type AddSong } from "@/components/add-song-form";
import { Confirm, Sheet } from "@/components/sheet";
import { FALLBACK_ACCENT } from "@/lib/color";
import type { SavedPlaylist, Song } from "@/lib/playlist";
import { thumbUrl, watchUrl } from "@/lib/youtube";

type Props = {
  open: boolean;
  onClose: () => void;
  songs: Song[];
  active: number;
  playing: boolean;
  /** The saved playlist holding exactly these songs, if any. */
  savedAs: SavedPlaylist | null;
  onPick: (index: number) => void;
  onRemove: (id: string) => void;
  onAdd: AddSong;
  onSaveAsPlaylist: () => void;
  onClear: () => void;
};

/** The songs in the deck: add a link, jump to a song, open it on YouTube, take it out, or empty the deck. */
export function SongsDialog({ open, onClose, songs, active, playing, savedAs, onPick, onRemove, onAdd, onSaveAsPlaylist, onClear }: Props) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Sheet
      open={open}
      onClose={() => {
        setConfirmClear(false);
        onClose();
      }}
      title="Lagu di daftar putar"
    >
      <div className="border-b border-[#111318]/10 px-5 pb-3 sm:px-6">
        <AddSongForm onAdd={onAdd} />
      </div>

      {songs.length === 0 ? (
        <p className="flex-1 px-5 py-8 text-[15px] text-[#3B3F48] sm:px-6">Belum ada lagu. Tempel link YouTube di atas untuk menambah yang pertama.</p>
      ) : (
        <ol className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {songs.map((s, i) => {
            const current = i === active;
            return (
              <li key={s.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPick(i)}
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3 rounded-[12px] p-2 text-left hover:bg-white active:bg-[#E7E8EA]",
                    current && "bg-white",
                  )}
                >
                  <span className="grid w-6 shrink-0 place-items-center text-[13px] text-[#3B3F48] tabular-nums">
                    {current ? <AudioLines aria-hidden className="size-4" style={{ color: s.accent ?? FALLBACK_ACCENT }} strokeWidth={2.4} /> : i + 1}
                  </span>
                  <img src={thumbUrl(s.id, "mq")} alt="" width={64} height={36} loading="lazy" className="h-9 w-16 shrink-0 rounded-[6px] bg-[#D5D7DB] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{s.title}</span>
                    <span className={cn("block truncate text-[13px]", s.problem ? "text-[#8F1A1A]" : "text-[#3B3F48]")}>
                      {s.problem ? `Tidak bisa diputar: ${s.problem}` : s.artist}
                    </span>
                  </span>
                  {current && <span className="sr-only">{playing ? "(sedang diputar)" : "(dipilih)"}</span>}
                </button>
                <a
                  href={watchUrl(s.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Buka ${s.title} di YouTube (tab baru)`}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-[#3B3F48] hover:bg-white hover:text-[#111318] active:bg-[#E7E8EA]"
                >
                  <ExternalLink aria-hidden className="size-[18px]" />
                </a>
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  aria-label={`Hapus ${s.title} dari daftar`}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-[#3B3F48] hover:bg-white hover:text-[#8F1A1A] active:bg-[#E7E8EA]"
                >
                  <Trash2 aria-hidden className="size-[18px]" />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {songs.length > 0 && (
        <div className="border-t border-[#111318]/10 px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
