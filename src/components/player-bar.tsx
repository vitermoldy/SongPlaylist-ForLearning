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
}

/** The transport under the deck: what is playing, back, play or pause, next, position and volume. */
export function PlayerBar(p: Props) {
  const accent = p.song?.accent ?? FALLBACK_ACCENT;
  const loading = p.status === "loading";

  return (
    <section aria-label="Pemutar" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
      <div
        className="mx-auto max-w-[980px] rounded-[20px] border border-[#111318]/10 bg-white px-3 py-2 shadow-[0_18px_40px_-22px_rgba(10,12,20,0.45)] sm:px-4"
        style={{ "--accent": accent } as CSSProperties}
      >
        {p.note && (
          <div className="flex items-center justify-between gap-3 border-b border-[#111318]/10 px-1 pt-0.5 pb-2">
            <p role="status" className="text-[14px] leading-snug text-[#111318]">
              {p.note.text}
            </p>
            {p.note.action && (
              <button
                type="button"
                onClick={p.note.action.run}
                className="h-11 shrink-0 rounded-[12px] bg-[#111318] px-4 text-[14px] font-semibold text-white hover:bg-[#2A2E37]"
              >
                {p.note.action.label}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-0.5 sm:gap-4">
          <div className="min-w-0 flex-1 px-1 sm:w-[200px] sm:flex-none">
            <p className="truncate text-[15px] leading-tight font-semibold text-[#111318]">{p.song?.title}</p>
            <p className="truncate text-[13px] leading-tight text-[#3B3F48]">
              {p.song?.artist}
              <span className="sr-only">, lagu {p.index + 1} dari {p.count}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <IconButton label="Lagu sebelumnya" onClick={p.onPrev}>
              <SkipBack aria-hidden className="size-5" fill="currentColor" />
            </IconButton>
            <button
              type="button"
              onClick={p.onToggle}
              aria-label={loading ? "Memuat pemutar YouTube" : p.playing ? "Jeda" : "Putar"}
              aria-busy={loading}
              className="grid size-12 shrink-0 place-items-center rounded-full text-white transition-transform duration-150 hover:scale-[1.05] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: accent, outlineColor: accent }}
            >
              {loading ? (
                <Loader2 aria-hidden className="size-5 motion-safe:animate-spin" />
              ) : p.playing ? (
                <Pause aria-hidden className="size-5" fill="currentColor" />
              ) : (
                <Play aria-hidden className="size-5 translate-x-[1px]" fill="currentColor" />
              )}
            </button>
            <IconButton label="Lagu berikutnya" onClick={p.onNext} disabled={p.index >= p.count - 1}>
              <SkipForward aria-hidden className="size-5" fill="currentColor" />
            </IconButton>
          </div>

          <Progress time={p.time} duration={p.duration} onSeek={p.onSeek} className="hidden flex-1 sm:flex" />

          <div className="hidden shrink-0 items-center gap-1 md:flex">
            <IconButton label={p.muted ? "Nyalakan suara" : "Bisukan"} onClick={p.onMute}>
              {p.muted || p.volume === 0 ? <VolumeX aria-hidden className="size-5" /> : <Volume2 aria-hidden className="size-5" />}
            </IconButton>
            <input
              type="range"
              className="range w-24"
              min={0}
              max={100}
