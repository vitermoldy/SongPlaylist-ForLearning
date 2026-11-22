// One YouTube player for the whole list. It is built inside `slot` on the first play (the IFrame
// script is not fetched before then) and loads each next song into the same iframe, which keeps
// playback going from one song to the next even in a background tab.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { YOUTUBE_HOST, loadYouTubeApi, type YTPlayer } from "@/lib/youtube";

const UNSTARTED = -1;
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
const CUED = 5;

export type PlayerStatus = "idle" | "loading" | "ready" | "error";

type Options = {
  /** False while the list is empty: the player is taken down. */
  enabled: boolean;
  initialId: string | null;
  volume: number;
  muted: boolean;
  onEnded: () => void;
  onError: (code: number, id: string | null, wasPlaying: boolean) => void;
};

export function useYouTubePlayer(slot: RefObject<HTMLDivElement | null>, options: Options) {
  const { enabled, volume, muted } = options;
  const handlers = useRef(options);
  useLayoutEffect(() => {
    handlers.current = options;
  });

  const player = useRef<YTPlayer | null>(null);
  const idRef = useRef(options.initialId);
  const pending = useRef<{ id: string; autoplay: boolean } | null>(null);
  const intentRef = useRef(false);
  const timeRef = useRef(0);
  const tapTimer = useRef(0);
  // between asking for a song and its first frame YouTube can report a passing pause or cue;
  // those are not the listener pausing, so they leave the play button alone
  const starting = useRef(false);

  const [armed, setArmed] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [state, setState] = useState(UNSTARTED);
  const [intent, setIntentState] = useState(false);
  const [started, setStarted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [time, setTimeState] = useState(0);
  const [duration, setDuration] = useState(0);

  /** Whether the listener wants music: true from a play press until a pause, an end or an error. */
  const setIntent = useCallback((value: boolean) => {
    intentRef.current = value;
    setIntentState(value);
  }, []);
  const setTime = useCallback((value: number) => {
    timeRef.current = value;
    setTimeState(value);
  }, []);

  // Some browsers (iOS Safari above all) refuse to start sound that a page asks for; the video
  // then waits for a tap of its own, so it is shown and the bar says so.
  const watchStart = useCallback(() => {
    window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => {
      const s = player.current?.getPlayerState();
      if (intentRef.current && s !== PLAYING && s !== BUFFERING) setNeedsTap(true);
    }, 4000);
  }, []);

  const start = useCallback(
    (id: string, autoplay: boolean) => {
      const p = player.current;
      if (!p) {
        pending.current = { id, autoplay };
        return;
      }
      starting.current = autoplay;
      if (autoplay) {
        p.loadVideoById(id);
