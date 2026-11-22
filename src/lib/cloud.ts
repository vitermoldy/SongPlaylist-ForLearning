// The link to the local server (server/, npm run server): the account and the two calls.

import type { Saved } from "@/lib/playlist";

const CODE_KEY = "songplaylist-forlearning:code";
// no I, O, 0 or 1, so a code read aloud or typed from a phone is not misread
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE = /^[A-HJ-NP-Z2-9]{12}$/;

/** 12 random characters; 32 letters divide 256 evenly, so every character is equally likely. */
function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
}

/**
 * This browser's own code, made on the first visit. It is offered when signing up, so the
 * lists this browser already saved on the server become the new account's.
 */
function loadCode(): string {
  try {
    const saved = localStorage.getItem(CODE_KEY);
    if (saved && CODE.test(saved)) return saved;
    const code = newCode();
    localStorage.setItem(CODE_KEY, code);
    return code;
  } catch {
    return newCode();
  }
}

/**
 * Why a call failed: `offline` when nothing answered (the server is not running), `nodb` when the
 * server answered but MySQL is not connected, otherwise the HTTP status.
 */
export class ServerError extends Error {
  status: number;
  kind: "offline" | "nodb" | "http";
  updatedAt?: number;
  constructor(status: number, kind: ServerError["kind"], message: string, updatedAt?: number) {
    super(message);
    this.status = status;
    this.kind = kind;
    this.updatedAt = updatedAt;
  }
}

// ---------- who is signed in ----------

export type Account = { username: string; createdAt: string };
/** checking: asking the server. unavailable: the server or MySQL cannot be reached. */
export type AuthStatus = "checking" | "signed-in" | "signed-out" | "unavailable";
/** How the account was entered: the sync takes the account's copy first after `login`. */
export type Entry = "session" | "login" | "register";
export type AuthState = { status: AuthStatus; account: Account | null; entry: Entry | null };

let auth: AuthState = { status: "checking", account: null, entry: null };
const listeners = new Set<() => void>();
function setAuth(next: AuthState) {
  auth = next;
  listeners.forEach((fn) => fn());
}
export const authState = () => auth;
export function onAuth(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new ServerError(0, "offline", "Server lokal tidak menjawab.");
  }
  const body = (await res.json().catch(() => null)) as (T & { error?: string; updatedAt?: number }) | null;
  if (res.ok && body) return body;
  // with the server off, Vite's dev proxy answers by itself with an empty 5xx page
  if (!body) throw new ServerError(res.status, "offline", "Server lokal tidak menjawab.");
  if (res.status === 503) throw new ServerError(503, "nodb", body.error ?? "MySQL belum terhubung.");
  // the session ran out or was signed out elsewhere: ask for the password again
  if (res.status === 401 && !path.startsWith("/auth/") && auth.status === "signed-in") setAuth({ status: "signed-out", account: null, entry: null });
  throw new ServerError(res.status, "http", body.error ?? `HTTP ${res.status}`, body.updatedAt);
}

type EntryBody = { user: Account; device: string };

/** Asks the server who is signed in on this browser. */
export async function checkAccount() {
  setAuth({ ...auth, status: "checking" });
  try {
    const body = await call<EntryBody>("/auth/me");
    setAuth({ status: "signed-in", account: body.user, entry: "session" });
  } catch (error) {
    const out = error instanceof ServerError && error.status === 401;
    setAuth({ status: out ? "signed-out" : "unavailable", account: null, entry: null });
  }
}

async function enter(path: string, payload: unknown, entry: Entry) {
  if (!body.saved) return null;
  const { saved: _, ...state } = body;
  return state as Saved;
};

export const putState = (code: string, state: Saved) =>
  call<{ ok: true; updatedAt: number }>(`/state/${code}`, { method: "PUT", body: JSON.stringify(state) });
