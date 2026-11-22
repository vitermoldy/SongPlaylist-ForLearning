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
