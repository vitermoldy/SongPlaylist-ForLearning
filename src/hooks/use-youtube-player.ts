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
