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
