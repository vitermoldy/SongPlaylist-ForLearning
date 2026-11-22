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
              </div>
            )}
            <form onSubmit={save} noValidate>
              <label htmlFor={nameId} className="mb-2 block text-[15px] font-semibold">
                {linked ? "Atau simpan sebagai playlist baru" : `Simpan daftar putar sekarang (${songs.length} lagu)`}
              </label>
              <div className="flex gap-2">
                <input
                  ref={nameInput}
                  id={nameId}
                  type="text"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-12 min-w-0 flex-1 rounded-[14px] border border-[#111318]/20 bg-white px-4 text-[16px] hover:border-[#111318]/35"
                />
                <button
                  type="submit"
                  className={`h-12 shrink-0 rounded-[14px] px-5 text-[15px] font-semibold ${
                    linked
                      ? "border border-[#111318]/15 bg-white text-[#111318] hover:border-[#111318]/30 active:bg-[#F3F4F5]"
                      : "bg-[#111318] text-white hover:bg-[#2A2E37] active:bg-black"
                  }`}
                >
                  Simpan
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">
        {playlists.length === 0 ? (
          <p className="px-2 py-5 text-[15px] leading-snug text-[#3B3F48]">
            Belum ada playlist. Simpan daftar putar sekarang di atas untuk membuat yang pertama.
          </p>
        ) : (
          <ul>
            {playlists.map((p) => {
              const asking = ask && ask.kind !== "clear" && ask.id === p.id ? ask.kind : null;
              const isOpen = savedAs?.id === p.id;
              return (
                <li key={p.id} className="rounded-[14px] p-2 hover:bg-white/70">
                  <div className="flex items-center gap-3">
                    <Mosaic songs={p.songs} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{p.name}</span>
                      <span className="block truncate text-[13px] text-[#3B3F48]">
                        {isOpen ? `${p.songs.length} lagu, sedang dibuka` : `${p.songs.length} lagu, disimpan ${savedDate(p.savedAt)}`}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={p.songs.length === 0}
                      onClick={() => (unsaved ? setAsk({ kind: "open", id: p.id }) : onOpen(p.id))}
                      aria-label={`Putar playlist ${p.name}`}
                      className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] border border-[#111318]/15 bg-white px-3.5 text-[14px] font-semibold hover:border-[#111318]/35 active:bg-[#F3F4F5] disabled:opacity-40"
                    >
                      <Play aria-hidden className="size-4" fill="currentColor" />
                      Putar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsk({ kind: "delete", id: p.id })}
                      aria-label={`Hapus playlist ${p.name}`}
                      className="grid size-11 shrink-0 place-items-center rounded-full text-[#3B3F48] hover:bg-white hover:text-[#8F1A1A] active:bg-[#E7E8EA]"
                    >
                      <Trash2 aria-hidden className="size-[18px]" />
                    </button>
                  </div>
                  {asking === "open" && (
                    <Confirm
                      className="mt-2"
                      text={`Daftar putar sekarang (${songs.length} lagu) belum disimpan dan akan diganti dengan ${p.name}.`}
