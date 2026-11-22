/**
 * Song Deck: the card deal of Project Deck (scroll-stacking-cards.tsx, by Aakash Mehra) made into a
 * playlist. Each card is one song with its YouTube cover, and the card on top of the deck is the
 * song that plays: moving to another song deals its card onto the deck, and letting the scroll come
 * to rest on a card picks that song. The YouTube player rides on the active card, so the video
 * leans, blurs and sinks with it when the next card arrives.
 *
 * Same motion as the original (one spring-smoothed value drives every card, a still deck under
 * prefers-reduced-motion), measured in cards rather than in page progress, so adding or removing a
 * song never moves the card that is showing.
 */
import { memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref, type RefObject } from "react";
import { MotionConfig, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { FALLBACK_ACCENT } from "@/lib/color";
import type { Song } from "@/lib/playlist";
import { thumbUrl } from "@/lib/youtube";

export type SongDeckHandle = {
  /** Scrolls the page until card `index` lies on top of the deck. */
  scrollToSong: (index: number, smooth?: boolean) => void;
};

export type SongDeckProps = {
  songs: Song[];
  /** The song in the player. */
  active: number;
  playing: boolean;
  /** True once the active song has frames to show; until then its cover stays up. */
  showVideo: boolean;
  /** Where the YouTube player builds its iframe: an empty element on the active card. */
  playerSlot: RefObject<HTMLDivElement | null>;
  /** The scroll came to rest with card `index` on top. */
  onSettle: (index: number) => void;
  /** The play button in a card's corner. */
  onToggle: (index: number) => void;
  /** The page ground; the cut-out corner that holds the play button is filled with it. */
  ground?: string;
  className?: string;
  ref?: Ref<SongDeckHandle>;
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ENTER = 0.72; // share of each card's screen spent arriving; the rest it rests in place
const HALF_IN = ENTER * (1 - Math.cbrt(0.5)); // how far into its screen a card is half arrived
const REST = (1 - ENTER) / 2; // from the middle of a card's resting stretch to its end

/** How far card `j` has arrived (0 below the window, 1 landed) with the deck at `pos` cards. */
function arrived(j: number, pos: number) {
  if (j <= 0) return 1;
  return easeOut(clamp01((pos - (j - 1)) / ENTER));
}

/** The card lying on top of the deck at `pos`. */
const topCard = (pos: number, count: number) => Math.min(count - 1, Math.max(0, Math.floor(pos + 1 - HALF_IN)));

const CARD =
  "col-start-1 row-start-1 origin-[50%_25%] will-change-[transform,filter] w-[min(100%,calc((90svh-152px)*16/9),1400px)] max-sm:w-[min(100%,calc((93svh-204px)*4/5))]";

function useCardMotion(i: number, pos: MotionValue<number>) {
  // cards now lying on top of this one, counted smoothly
  const above = (v: number) => {
    let n = 0;
    for (let j = i + 1; j <= Math.floor(v) + 1; j++) n += arrived(j, v);
    return Math.min(3, n);
  };
  return {
    y: useTransform(pos, (v) => `${(1 - arrived(i, v)) * 108 - above(v) * 5}svh`), // covered cards lift so their edges show
    rotateX: useTransform(pos, (v) => -(1 - arrived(i, v)) * 30 + above(v) * 5),
    scale: useTransform(pos, (v) => 0.9 + 0.1 * arrived(i, v) - above(v) * 0.05),
    filter: useTransform(pos, (v) => `blur(${((1 - arrived(i, v)) ** 2 * 12 + above(v) * 1.1).toFixed(2)}px)`),
    dim: useTransform(pos, (v) => above(v) * 0.15),
    // reduced motion: no travel, each card simply appears in place when its turn comes
    stillY: useTransform(pos, (v) => (arrived(i, v) >= 0.5 ? "0svh" : "110svh")),
    // cards far below the window or buried under the stack are not painted at all
    visibility: useTransform(pos, (v) => (i > v + 1.6 || i < v - 4 ? "hidden" : "visible")),
  };
}

export const SongDeck = memo(function SongDeck({
  songs,
  active,
  playing,
  showVideo,
  playerSlot,
  onSettle,
  onToggle,
  ground = "#E7E8EA",
  className,
  ref,
}: SongDeckProps) {
  const deck = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion() ?? false;
  const count = songs.length;
  const pos = useMotionValue(0);
  // a light, critically damped smoothing: it follows the wheel closely and never overshoots
  const smooth = useSpring(pos, { stiffness: 380, damping: 48, mass: 0.35 });
  const [top, setTop] = useState(0);
  const settle = useRef(onSettle);
  useLayoutEffect(() => {
    settle.current = onSettle;
  });

  /** Where the page is in the deck, in cards; past count - 1 the page is below the deck. */
  const measure = useCallback(() => {
    const el = deck.current;
    if (!el || count === 0) return 0;
    const raw = -el.getBoundingClientRect().top / (el.offsetHeight / count);
    pos.set(Math.min(Math.max(0, raw), count - 1));
    return raw;
  }, [count, pos]);

  useLayoutEffect(() => {
    measure();
    smooth.jump(pos.get());
  }, [measure, pos, smooth]);

  useEffect(() => {
    let timer = 0;
    const onScroll = () => {
      measure();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const raw = measure();
        // reading the section below the deck is not choosing a song
        if (count > 0 && raw <= count - 1 + 0.4) settle.current(topCard(Math.max(0, raw), count));
      }, 180);
    };
    const onResize = () => measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [count, measure]);

  useMotionValueEvent(pos, "change", (v) => setTop(topCard(v, count)));

  useImperativeHandle(
    ref,
    () => ({
      scrollToSong(index, smoothly = true) {
        const el = deck.current;
        if (!el || count === 0) return;
        const step = el.offsetHeight / count;
        const start = el.getBoundingClientRect().top + window.scrollY;
        // land in the middle of the card's resting stretch, clear of the next card's arrival
        const at = index <= 0 ? 0 : index - REST;
        const instant = !smoothly || reduce;
        window.scrollTo({ top: Math.round(start + at * step), behavior: instant ? "instant" : "smooth" });
        if (instant) {
          measure();
          smooth.jump(pos.get());
        }
      },
    }),
    [count, reduce, measure, pos, smooth],
  );

  const current = songs[active];

  return (
    <MotionConfig reducedMotion="user">
      {/* one screen of scroll per song; the stage stays pinned while the cards are dealt onto it */}
      <section
        ref={deck}
        className={cn("relative w-full", className)}
        style={{ height: `${Math.max(1, count) * 100}svh` }}
        aria-label="Lagu di daftar putar"
      >
        <div className="sticky top-0 isolate grid h-[100svh] place-items-center overflow-hidden px-4 pt-[calc(64px+7svh)] pb-[140px] [perspective:1800px] sm:px-10 sm:pb-[calc(88px+3svh)] lg:px-14">
          {songs.map((s, i) => (
            <SongCard
              key={s.id}
              song={s}
              i={i}
              pos={smooth}
              still={reduce}
              ground={ground}
              playing={playing && i === active}
              interactive={i === top && i !== active}
              onToggle={onToggle}
            />
          ))}
          {current && (
            <PlayerCard
              song={current}
              i={active}
              pos={smooth}
              still={reduce}
              ground={ground}
              playing={playing}
              showVideo={showVideo}
              slot={playerSlot}
              interactive={active === top}
              onToggle={onToggle}
            />
          )}
        </div>
      </section>
    </MotionConfig>
  );
});

type CardProps = {
  song: Song;
  i: number;
  pos: MotionValue<number>;
  still: boolean;
  ground: string;
  playing: boolean;
  /** Only the card on top takes clicks and focus; the ones beneath are covered. */
  interactive: boolean;
  onToggle: (index: number) => void;
};

function SongCard({ song, i, pos, still, ground, playing, interactive, onToggle }: CardProps) {
  const m = useCardMotion(i, pos);
  return (
    <motion.article
      aria-label={`${song.title} oleh ${song.artist}`}
      inert={!interactive}
      className={CARD}
      style={{ zIndex: i + 1, visibility: m.visibility, ...(still ? { y: m.stillY } : { y: m.y, rotateX: m.rotateX, scale: m.scale, filter: m.filter }) }}
    >
      <div className="relative overflow-hidden rounded-[24px] shadow-[0_50px_90px_-35px_rgba(10,12,20,0.5)]" style={{ background: ground }}>
        <div className="relative aspect-[16/9] w-full overflow-hidden max-sm:aspect-[4/5]">
          <Cover id={song.id} alt={`Sampul video ${song.title}`} priority={i === 0} lazy={i > 1} className="absolute inset-0 size-full object-cover" />
        </div>
        <Corner song={song} i={i} ground={ground} playing={playing} onToggle={onToggle} />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0A0C14]" style={{ opacity: still ? 0 : m.dim }} />
      </div>
    </motion.article>
  );
}

/**
 * The active song's card, laid exactly over its deck card with the same motion. It holds the one
 * YouTube iframe, so moving to another song only changes which card it rides on.
 */
function PlayerCard({ song, i, pos, still, ground, playing, interactive, onToggle, showVideo, slot }: CardProps & {
  showVideo: boolean;
  slot: RefObject<HTMLDivElement | null>;
}) {
  const m = useCardMotion(i, pos);
  return (
    <motion.article
      aria-label={`Lagu yang dipilih: ${song.title} oleh ${song.artist}`}
      inert={!interactive}
      className={CARD}
      style={{ zIndex: i + 1, visibility: m.visibility, ...(still ? { y: m.stillY } : { y: m.y, rotateX: m.rotateX, scale: m.scale, filter: m.filter }) }}
    >
      <div className="relative overflow-hidden rounded-[24px] bg-[#0A0C14]">
        <div className="relative aspect-[16/9] w-full overflow-hidden max-sm:aspect-[4/5]">
          {/* on a phone the card is taller than the video: the cover, blurred, fills above and below */}
