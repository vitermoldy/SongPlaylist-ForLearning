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
