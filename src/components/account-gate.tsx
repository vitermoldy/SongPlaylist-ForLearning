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

