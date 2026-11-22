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
