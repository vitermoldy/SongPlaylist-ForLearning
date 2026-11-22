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
