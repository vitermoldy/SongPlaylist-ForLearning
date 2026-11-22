// The link to the local server (server/, npm run server): the recovery code and the two calls.

import type { Saved } from "@/lib/playlist";

const CODE_KEY = "songplaylist-forlearning:code";
// no I, O, 0 or 1, so a code read aloud or typed from a phone is not misread
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE = /^[A-HJ-NP-Z2-9]{12}$/;

export const cleanCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const isCode = (code: string) => CODE.test(code);
export const formatCode = (code: string) => code.match(/.{1,4}/g)?.join(" ") ?? code;

/** 12 random characters; 32 letters divide 256 evenly, so every character is equally likely. */
function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
}

/** This browser's recovery code, made on the first visit. */
export function loadCode(): string {
  try {
    const saved = localStorage.getItem(CODE_KEY);
    if (saved && isCode(saved)) return saved;
    const code = newCode();
