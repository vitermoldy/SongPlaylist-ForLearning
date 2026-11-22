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
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

const luminance = ([r, g, b]: RGB) => {
  const c = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

/** Contrast of white against a colour, as WCAG computes it. */
export const contrastWithWhite = (rgb: RGB) => 1.05 / (luminance(rgb) + 0.05);

const toHex = (rgb: RGB) => `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

/**
 * The strongest hue in the cover, deepened until a white icon on it reads at 4.5:1 or better.
 * Grey or near-black covers fall back to a dark slate.
 */
export function pickAccent(pixels: Uint8ClampedArray): string {
  const buckets = Array.from({ length: 12 }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
