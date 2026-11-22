import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Play, Trash2 } from "lucide-react";
import { Confirm, Sheet } from "@/components/sheet";
import type { SavedPlaylist, Song } from "@/lib/playlist";
import { thumbUrl } from "@/lib/youtube";

type Props = {
  open: boolean;
  onClose: () => void;
  playlists: SavedPlaylist[];
  /** The deck as it is now. */
  songs: Song[];
  /** The playlist the deck was opened from. */
  linked: SavedPlaylist | null;
  /** The playlist holding exactly the deck's songs, if any. */
  savedAs: SavedPlaylist | null;
  onSave: (name: string) => void;
  onUpdate: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

/** "22 Nov", with the year only when it is not this year. */
const savedDate = (ms: number) => {
  const date = new Date(ms);
  const thisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", ...(thisYear ? {} : { year: "numeric" }) });
};

/** Up to four covers of the playlist's first songs, as one 16:9 tile. */
function Mosaic({ songs }: { songs: Song[] }) {
  const four = songs.length >= 4 ? songs.slice(0, 4) : songs.slice(0, 1);
  return (
    <span className={`grid h-[45px] w-20 shrink-0 overflow-hidden rounded-[8px] bg-[#D5D7DB] ${four.length === 4 ? "grid-cols-2" : ""}`}>
      {four.map((s) => (
        <img key={s.id} src={thumbUrl(s.id, "mq")} alt="" width={80} height={45} loading="lazy" className="size-full object-cover" />
      ))}
    </span>
  );
}

type Ask = { kind: "open" | "delete"; id: string } | { kind: "clear" } | null;

/** The Playlist menu: save the deck under a name, play a saved list, delete one or all of them. */
export function PlaylistsDialog({ open, onClose, playlists, songs, linked, savedAs, onSave, onUpdate, onOpen, onDelete, onClearAll }: Props) {
  const nameId = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [ask, setAsk] = useState<Ask>(null);
  const [done, setDone] = useState<string | null>(null);
  const unsaved = songs.length > 0 && !savedAs;

  // each time the menu opens: a fresh suggested name, no question left over (only on opening, so
  // saving inside the menu does not rewrite the name under the listener's eyes)
  const count = useRef(playlists.length);
  count.current = playlists.length;
  useEffect(() => {
    if (!open) return;
    setName(`Playlist ${count.current + 1}`);
    setAsk(null);
    setDone(null);
  }, [open]);

  function save(event: FormEvent) {
    event.preventDefault();
    const clean = name.trim() || `Playlist ${playlists.length + 1}`;
    onSave(clean);
    setDone(`Tersimpan sebagai ${clean}.`);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Playlist">
      <div className="border-b border-[#111318]/10 px-5 pb-4 sm:px-6">
        {songs.length === 0 ? (
          <p className="text-[15px] leading-snug text-[#3B3F48]">Daftar putar sekarang kosong, jadi belum ada yang bisa disimpan.</p>
        ) : savedAs ? (
          <p className="text-[15px] leading-snug text-[#3B3F48]" role="status">
            {done ?? (
              <>
                Daftar putar sekarang ({songs.length} lagu) sudah tersimpan sebagai <strong className="font-semibold text-[#111318]">{savedAs.name}</strong>.
              </>
            )}
          </p>
        ) : (
          <>
            {linked && (
              <div className="mb-4">
                <p className="text-[14px] leading-snug text-[#3B3F48]">
                  Daftar ini dibuka dari <strong className="font-semibold text-[#111318]">{linked.name}</strong> dan sudah berubah.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onUpdate(linked.id);
                    setDone(`${linked.name} diperbarui.`);
                  }}
                  className="mt-2 h-11 rounded-[12px] bg-[#111318] px-4 text-[14px] font-semibold text-white hover:bg-[#2A2E37] active:bg-black"
                >
                  Perbarui {linked.name}
                </button>
