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
