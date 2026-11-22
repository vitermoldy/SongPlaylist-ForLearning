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
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h /= 6;
  return [h, s, l];
}

function hslToRgb([h, s, l]: RGB): RGB {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
