import type { CSSProperties, ReactNode } from "react";
import { Loader2, Maximize, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { FALLBACK_ACCENT } from "@/lib/color";
import type { Song } from "@/lib/playlist";
import type { PlayerStatus } from "@/hooks/use-youtube-player";

type Props = {
  song: Song | null;
  index: number;
  count: number;
  status: PlayerStatus;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  muted: boolean;
  canFullscreen: boolean;
  note: { text: string; action?: { label: string; run: () => void } } | null;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolume: (volume: number) => void;
  onMute: () => void;
