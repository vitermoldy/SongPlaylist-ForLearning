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
