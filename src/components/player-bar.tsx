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
  onFullscreen: () => void;
};

const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
};

const spoken = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)} menit ${s % 60} detik`;
};

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full text-[#111318] hover:bg-[#111318]/[0.07] active:bg-[#111318]/[0.13] disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Progress({ time, duration, onSeek, className }: { time: number; duration: number; onSeek: (s: number) => void; className?: string }) {
  const fill = duration ? Math.min(100, (time / duration) * 100) : 0;
  return (
    <div className={cn("min-w-0 items-center gap-3", className)}>
      <span className="w-10 shrink-0 text-right text-[12px] text-[#3B3F48] tabular-nums">{clock(time)}</span>
      <input
        type="range"
        className="range min-w-0 flex-1"
        min={0}
        max={Math.max(1, Math.floor(duration))}
        step={1}
        value={Math.min(Math.floor(time), Math.floor(duration))}
        disabled={!duration}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Posisi lagu"
        aria-valuetext={`${spoken(time)} dari ${spoken(duration)}`}
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
      <span className="w-10 shrink-0 text-[12px] text-[#3B3F48] tabular-nums">{duration ? clock(duration) : "0:00"}</span>
    </div>
  );
