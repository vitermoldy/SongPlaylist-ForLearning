// Keeps the local server's copy (MySQL) in step with this browser. The browser stays the first
// place everything is saved; the server gets a copy and hands it to another browser that knows the code.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ServerError, cleanCode, getState, isCode, loadCode, putState, saveCode } from "@/lib/cloud";
import type { Saved } from "@/lib/playlist";

export type SyncStatus = "checking" | "saving" | "saved" | "offline" | "nodb" | "error";

export type SwitchResult = { ok: boolean; text: string };

/**
 * After a change (once the listener pauses), on opening the page and on coming back to the tab,
 * the server's copy is compared with this one: a newer copy there is taken, an older one replaced.
 * With the server off the page goes on alone and tries again every 10 seconds.
 */
export function useServerSync(snapshot: Saved, apply: (state: Saved) => void) {
  const [code, setCode] = useState(loadCode);
  const [status, setStatus] = useState<SyncStatus>("checking");
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  const snap = useRef(snapshot);
  const applyRef = useRef(apply);
  const codeRef = useRef(code);
  useLayoutEffect(() => {
    snap.current = snapshot;
    applyRef.current = apply;
    codeRef.current = code;
  });

  const busy = useRef(false);
  const again = useRef(false);
  const retry = useRef(0);
  const debounce = useRef(0);
  // the change time the server is known to agree with; a snapshot at this time needs no call
  const agreed = useRef<number | null>(null);

  const sync = useCallback(async function run() {
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    window.clearTimeout(retry.current);
    try {
      const local = snap.current;
      const remote = await getState(codeRef.current);
