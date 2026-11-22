import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Library, ListMusic } from "lucide-react";
import { SongDeck, type SongDeckHandle } from "@/components/ui/song-deck";
import { AddSongForm, type AddSong } from "@/components/add-song-form";
import { PlayerBar } from "@/components/player-bar";
import { PlaylistsDialog } from "@/components/playlists-dialog";
import { SongsDialog } from "@/components/songs-dialog";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { addLink } from "@/lib/add-link";
import { accentFromThumb } from "@/lib/color";
import { SEED_SONGS, loadSaved, newPlaylistId, sameSongs, saveState, type SavedPlaylist, type Song } from "@/lib/playlist";
import { describePlayError } from "@/lib/youtube";

const GROUND = "#E7E8EA";

const headerButton =
  "inline-flex h-11 shrink-0 items-center gap-2 rounded-[14px] border border-[#111318]/15 bg-white px-3.5 text-[15px] font-medium text-[#111318] hover:border-[#111318]/30 active:bg-[#F3F4F5] sm:px-4";

export default function App() {
  const [initial] = useState(loadSaved);
  const [songs, setSongs] = useState<Song[]>(initial.songs);
  const [activeId, setActiveId] = useState<string | null>(initial.current);
  const [volume, setVolume] = useState(initial.volume);
  const [muted, setMuted] = useState(initial.muted);
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>(initial.playlists);
  const [linked, setLinked] = useState<string | null>(initial.linked);
  const [notice, setNotice] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);

  const found = songs.findIndex((s) => s.id === activeId);
  const active = found >= 0 ? found : 0;
  const song = songs[active] ?? null;
  const linkedPlaylist = playlists.find((p) => p.id === linked) ?? null;
  // the saved playlist holding exactly what the deck holds now, the opened one first
  const savedAs = songs.length
    ? (linkedPlaylist && sameSongs(linkedPlaylist.songs, songs) ? linkedPlaylist : playlists.find((p) => sameSongs(p.songs, songs))) ?? null
    : null;

  const deck = useRef<SongDeckHandle>(null);
  const slot = useRef<HTMLDivElement>(null);
  const addSection = useRef<HTMLElement>(null);
  // the latest list for callbacks that YouTube or a timer calls later
  const live = useRef({ songs, active });
  useLayoutEffect(() => {
    live.current = { songs, active };
  });

  const player = useYouTubePlayer(slot, {
    enabled: songs.length > 0,
    initialId: song?.id ?? null,
    volume,
    muted,
    onEnded: () => {
      const { songs: list, active: at } = live.current;
      if (at < list.length - 1) goTo(at + 1, true);
      else setNotice("Daftar putar selesai.");
    },
    onError: (code, id, wasPlaying) => {
      const { songs: list } = live.current;
      const at = list.findIndex((s) => s.id === id);
      const failed = list[at];
      if (!failed) return;
      const reason = describePlayError(code);
      if (code === 100 || code === 101 || code === 150) {
        setSongs((all) => all.map((s) => (s.id === failed.id ? { ...s, problem: reason } : s)));
      }
      const next = list[at + 1];
      if (wasPlaying && next) {
        setNotice(`${failed.title} dilewati: ${reason}.`);
        window.setTimeout(() => {
          if (live.current.songs[live.current.active]?.id === failed.id) goTo(live.current.active + 1, true);
        }, 1400);
      } else {
        setNotice(`${failed.title} tidak bisa diputar: ${reason}.`);
      }
    },
  });
  const { load, toggle, seek, intentRef, timeRef } = player;

  /** Moves to song `index`: its card is dealt onto the deck while the player loads it. */
  const goTo = useCallback(
    (index: number, autoplay: boolean) => {
      const target = live.current.songs[index];
      if (!target) return;
      setActiveId(target.id);
      load(target.id, autoplay);
      deck.current?.scrollToSong(index);
    },
    [load],
  );

  // the scroll came to rest on another card: that song is picked, and keeps playing if music was on
  const settle = useCallback(
    (index: number) => {
      const { songs: list, active: at } = live.current;
      if (index === at || !list[index]) return;
      setActiveId(list[index].id);
      load(list[index].id, intentRef.current);
    },
    [load, intentRef],
  );

  const toggleCard = useCallback(
    (index: number) => (index === live.current.active ? toggle() : goTo(index, true)),
    [toggle, goTo],
  );

  const prev = () => {
    if (timeRef.current > 3 || active === 0) seek(0);
    else goTo(active - 1, intentRef.current);
  };
  const next = () => {
    if (active < songs.length - 1) goTo(active + 1, intentRef.current);
  };

  // Adding or removing a song changes the deck's height. Keep the add section where the eye is
  // when it is on screen; otherwise, after a removal, put the playing song's card back on top.
  const anchor = useRef<{ addTop: number } | "deck" | null>(null);
  const changeSongs = useCallback((nextSongs: Song[], kind: "first" | "add" | "remove", nextActive?: string | null) => {
    const addTop = addSection.current?.getBoundingClientRect().top ?? Infinity;
    // the first songs into an empty list: show their deck from the top
    if (kind === "first") anchor.current = "deck";
    else anchor.current = addTop < window.innerHeight ? { addTop } : kind === "remove" ? "deck" : null;
    setSongs(nextSongs);
    if (nextActive !== undefined) setActiveId(nextActive);
  }, []);

  useLayoutEffect(() => {
    const a = anchor.current;
    anchor.current = null;
    if (a === "deck") {
      if (deck.current) deck.current.scrollToSong(active, false);
      else window.scrollTo({ top: 0, behavior: "instant" }); // the deck is gone: the empty page starts at the top
    } else if (a) {
      const now = addSection.current?.getBoundingClientRect().top;
      if (now !== undefined) window.scrollBy({ top: now - a.addTop, behavior: "instant" });
    }
  }, [songs]); // only a change of the list moves the page

  const add: AddSong = useCallback(
    async (raw, onProgress) => {
      const result = await addLink(raw, live.current.songs.map((s) => s.id), onProgress);
      if (result.songs.length) {
        const before = live.current.songs;
        const first = result.songs[0];
        changeSongs([...before, ...result.songs], before.length === 0 ? "first" : "add", before.length === 0 ? first.id : undefined);
        if (before.length === 0) load(first.id, false);
      }
      return result;
    },
    [changeSongs, load],
  );

  const remove = useCallback(
    (id: string) => {
      const { songs: list, active: at } = live.current;
      const index = list.findIndex((s) => s.id === id);
      if (index < 0) return;
      const rest = list.filter((s) => s.id !== id);
      if (id !== list[at]?.id) return changeSongs(rest, "remove");
      const replacement = rest[Math.min(index, rest.length - 1)] ?? null;
      if (replacement) load(replacement.id, intentRef.current);
      changeSongs(rest, "remove", replacement?.id ?? null);
    },
    [changeSongs, load, intentRef],
  );

  const restoreSeeds = () => {
    changeSongs(SEED_SONGS, "first", SEED_SONGS[0].id);
    setLinked(null);
    load(SEED_SONGS[0].id, false);
  };

  // "Kosongkan daftar": the deck is emptied, saved playlists stay as they are
  const clearSongs = () => {
    player.pause();
    changeSongs([], "remove", null);
    setLinked(null);
    setListOpen(false);
  };

  /** The deck as it is now, kept under a name in the Playlist menu. */
  const savePlaylist = (name: string) => {
    const saved: SavedPlaylist = { id: newPlaylistId(), name, songs, savedAt: Date.now() };
    setPlaylists((all) => [saved, ...all]);
    setLinked(saved.id);
  };

  const updatePlaylist = (id: string) => {
    setPlaylists((all) => all.map((p) => (p.id === id ? { ...p, songs, savedAt: Date.now() } : p)));
  };

  /** A saved playlist replaces the deck, and its first song starts playing. */
  const openPlaylist = (id: string) => {
    const chosen = playlists.find((p) => p.id === id);
    const first = chosen?.songs[0];
    if (!chosen || !first) return;
    setPlaylistsOpen(false);
    changeSongs(chosen.songs, "first", first.id);
    setLinked(chosen.id);
    load(first.id, true);
  };

  const deletePlaylist = (id: string) => {
    setPlaylists((all) => all.filter((p) => p.id !== id));
    if (linked === id) setLinked(null);
  };

  // "Hapus semua playlist": every saved list goes, the deck keeps playing what it holds
  const clearPlaylists = () => {
    setPlaylists([]);
    setLinked(null);
  };

  // open on the song that was playing last time, without dealing every card on the way
  useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    deck.current?.scrollToSong(active, false);
  }, []);

  useEffect(() => {
    saveState({ songs, current: song?.id ?? null, volume, muted, playlists, linked });
  }, [songs, song?.id, volume, muted, playlists, linked]);

