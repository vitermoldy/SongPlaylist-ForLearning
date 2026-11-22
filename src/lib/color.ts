// The play button's colour for a song, taken from its YouTube cover (i.ytimg.com allows canvas reads).

import { thumbUrl } from "@/lib/youtube";

export const FALLBACK_ACCENT = "#2B2F38";

type RGB = [number, number, number];

function rgbToHsl([r, g, b]: RGB): RGB {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
