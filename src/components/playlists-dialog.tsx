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
