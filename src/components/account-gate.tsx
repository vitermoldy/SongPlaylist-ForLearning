import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { checkAccount, signIn, signUp, type AuthState } from "@/lib/cloud";

/**
 * The sign-in screen. While the server runs nobody uses the lists without an account; when it
 * cannot be reached the page still works and keeps everything in this browser, as before
 * accounts. The side panel's look (panel grey, 14px inputs, ink button) so it reads as part of
 * the page; centred because it comes before everything else.
 */
export function AccountGate({ auth }: { auth: AuthState }) {
  const ref = useRef<HTMLDialogElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<"user" | "pass" | null>(null);
  const [busy, setBusy] = useState(false);
  // "Pakai tanpa akun" holds until the page reloads or the listener asks to sign in.
  const [skipped, setSkipped] = useState(false);
  const shown = useRef<string | null>(null);

  const offline = auth.status === "unavailable";
  const signedOut = auth.status === "signed-out";

  // Once per page: who is signed in on this browser.
  useEffect(() => {
    void checkAccount();
  }, []);

  // Asking to sign in again (from the playlist panel) lifts "Pakai tanpa akun".
  useEffect(() => {
    if (auth.status === "checking") setSkipped(false);
  }, [auth.status]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // The first check is not shown: a signed-in listener should not see the screen flash by.
    const wanted = signedOut || (offline && !skipped) || (auth.status === "checking" && d.open);
    if (wanted && !d.open) d.showModal();
    else if (!wanted && d.open) d.close();
    // Focus moves only when what the screen asks for changes, never on every update.
    if (d.open && shown.current !== auth.status) {
