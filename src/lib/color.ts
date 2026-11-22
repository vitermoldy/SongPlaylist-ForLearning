// The play button's colour for a song, taken from its YouTube cover (i.ytimg.com allows canvas reads).

import { thumbUrl } from "@/lib/youtube";

export const FALLBACK_ACCENT = "#2B2F38";

type RGB = [number, number, number];

function rgbToHsl([r, g, b]: RGB): RGB {
