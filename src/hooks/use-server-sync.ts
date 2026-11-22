// Keeps the local server's copy (MySQL) in step with this browser for the signed-in account.
// The browser stays the first place everything is saved; the server keeps the account's copy
// and hands it to any browser the account signs in on.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { ServerError, authState, getState, onAuth, putState } from "@/lib/cloud";
import type { Saved } from "@/lib/playlist";

export type SyncStatus = "signed-out" | "checking" | "saving" | "saved" | "offline" | "nodb" | "error";

/** Who is signed in, re-rendering whenever it changes. */
export const useAuth = () => useSyncExternalStore(onAuth, authState);

/**
 * After a change (once the listener pauses), on opening the page and on coming back to the tab,
 * the server's copy is compared with this one: a newer copy there is taken, an older one replaced.
 * Signing in takes the account's copy over this browser's. Nothing is sent while nobody is
 * signed in. With the server off the page goes on alone and tries again every 10 seconds.
 */
export function useServerSync(snapshot: Saved, apply: (state: Saved) => void) {
  const auth = useAuth();
  const [status, setStatus] = useState<SyncStatus>("checking");
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  const snap = useRef(snapshot);
  const applyRef = useRef(apply);
  const signedIn = useRef(false);
  useLayoutEffect(() => {
    snap.current = snapshot;
    applyRef.current = apply;
    signedIn.current = auth.status === "signed-in";
  });

  const busy = useRef(false);
  const again = useRef(false);
  const retry = useRef(0);
  const debounce = useRef(0);
  // the change time the server is known to agree with; a snapshot at this time needs no call
  const agreed = useRef<number | null>(null);

  /** `preferServer`: right after signing in, the account's copy wins whatever its time. Resolves true once both agree. */
  const sync = useCallback(async function run(preferServer = false): Promise<boolean> {
    if (!signedIn.current) return false;
    if (busy.current) {
      again.current = true;
      return false;
    }
    busy.current = true;
    window.clearTimeout(retry.current);
    let ok = false;
    try {
      const local = snap.current;
      const remote = await getState();
      if (remote && (preferServer || remote.updatedAt > local.updatedAt)) {
        agreed.current = remote.updatedAt;
        applyRef.current(remote);
      } else if (!remote || remote.updatedAt < local.updatedAt) {
        setStatus("saving");
        try {
          await putState(local);
          agreed.current = local.updatedAt;
        } catch (error) {
          // another browser of this account saved in between: look again and take its copy
          if (error instanceof ServerError && error.status === 409) again.current = true;
          else throw error;
        }
      } else {
        agreed.current = local.updatedAt;
      }
      setStatus("saved");
      setCheckedAt(Date.now());
      ok = !again.current;
    } catch (error) {
      if (!signedIn.current) return false;
      const kind = error instanceof ServerError ? error.kind : "offline";
      setStatus(kind === "http" ? "error" : kind);
      retry.current = window.setTimeout(() => void run(), 10_000);
    } finally {
      busy.current = false;
      if (again.current) {
        again.current = false;
        void run();
      }
    }
    return ok;
  }, []);

  // on opening the page, and whenever someone signs in
  useEffect(() => {
    if (auth.status !== "signed-in") {
      window.clearTimeout(retry.current);
    return () => window.clearTimeout(retry.current);
  }, [code, sync]);

  // after a change, once the listener pauses
  useEffect(() => {
    if (snapshot.updatedAt === agreed.current) return;
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      if (snap.current.updatedAt !== agreed.current) void sync();
    }, 800);
    return () => window.clearTimeout(debounce.current);
  }, [snapshot.updatedAt, sync]);

  // back to the tab, or back online: another browser may have saved meanwhile
  useEffect(() => {
    const look = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", look);
    window.addEventListener("online", look);
    return () => {
      document.removeEventListener("visibilitychange", look);
      window.removeEventListener("online", look);
    };
  }, [sync]);

  /** Takes over the data saved under another browser's code; this browser then uses that code. */
  const switchCode = useCallback(async (raw: string): Promise<SwitchResult> => {
    const next = cleanCode(raw);
    if (!isCode(next)) return { ok: false, text: "Kode pemulihan terdiri dari 12 huruf dan angka." };
    if (next === codeRef.current) return { ok: false, text: "Itu kode browser ini sendiri." };
    try {
      const remote = await getState(next);
      if (!remote) return { ok: false, text: "Belum ada data tersimpan dengan kode ini." };
      agreed.current = remote.updatedAt;
      applyRef.current(remote);
      saveCode(next);
      codeRef.current = next;
      setCode(next);
      setStatus("saved");
      setCheckedAt(Date.now());
      return { ok: true, text: `Data dari kode ini dipakai: ${remote.songs.length} lagu di daftar putar, ${remote.playlists.length} playlist.` };
    } catch (error) {
      if (error instanceof ServerError && error.kind === "nodb") return { ok: false, text: "Server lokal menyala, tapi MySQL belum terhubung." };
      return { ok: false, text: "Server lokal tidak menyala. Jalankan npm run server, lalu coba lagi." };
    }
  }, []);

  return { code, status, checkedAt, switchCode };
}
