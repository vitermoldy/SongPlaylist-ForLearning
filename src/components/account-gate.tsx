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
      if (signedOut) userRef.current?.focus();
      else if (offline) retryRef.current?.focus();
    }
    shown.current = d.open ? auth.status : null;
  }, [auth.status, signedOut, offline, skipped]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const name = username.trim();
    if (!name || !password) {
      setInvalid(!name ? "user" : "pass");
      setError(!name ? "Isi username dulu." : "Isi kata sandi dulu.");
      (!name ? userRef.current : document.getElementById("gate-pass"))?.focus();
      return;
    }
    setBusy(true);
    setError("");
    setInvalid(null);
    try {
      if (mode === "in") await signIn(name, password);
      else await signUp(name, password);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Belum bisa masuk. Coba lagi.");
      setInvalid("pass");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "h-12 w-full min-w-0 rounded-[14px] border border-[#111318]/20 bg-white px-3 text-[16px] text-[#111318] hover:border-[#111318]/35 aria-[invalid=true]:border-[#8F1A1A]";

  return (
    <dialog
      ref={ref}
      id="auth-gate"
      aria-labelledby={titleId}
      onCancel={(e) => {
        // A required sign-in has no "close": Escape does nothing while the server waits for a
        // password, and means "Pakai tanpa akun" when the server is down.
        e.preventDefault();
        if (offline) setSkipped(true);
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(420px,calc(100%-32px))] overflow-y-auto rounded-[24px] bg-[#F3F4F5] p-5 text-[#111318] backdrop:bg-[#0A0C14]/45 sm:p-6"
    >
      <h2 id={titleId} className="text-[20px] font-semibold tracking-[-0.02em]">
        {mode === "in" ? "Masuk ke Daftar putar" : "Buat akun Daftar putar"}
      </h2>

      {auth.status === "checking" && <p className="mt-3 text-[14px] text-[#3B3F48]">Menghubungi server lokal…</p>}

      {signedOut && (
        <>
          <p className="mt-1 text-[14px] leading-snug text-[#3B3F48]">
            {mode === "in"
              ? "Daftar putar dan playlist-mu tersimpan di akunmu, jadi bisa dibuka dari browser mana pun."
              : "Daftar putar dan playlist yang sudah ada di browser ini ikut masuk ke akun barumu."}
          </p>
          <form className="mt-5 grid gap-4" onSubmit={submit} noValidate>
            <div>
              <label htmlFor="gate-user" className="mb-2 block text-[14px] font-semibold">
                Username
              </label>
              <input
                ref={userRef}
                id="gate-user"
                className={input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={24}
                aria-invalid={invalid === "user" ? true : undefined}
                aria-describedby={error ? "gate-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="gate-pass" className="mb-2 block text-[14px] font-semibold">
                Kata sandi
              </label>
              <input
                id="gate-pass"
                type="password"
                className={input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                maxLength={128}
                aria-invalid={invalid === "pass" ? true : undefined}
                aria-describedby={[mode === "up" ? "gate-pass-hint" : "", error ? "gate-error" : ""].filter(Boolean).join(" ") || undefined}
              />
              {mode === "up" && (
                <p id="gate-pass-hint" className="mt-2 text-[14px] leading-snug text-[#3B3F48]">
                  Minimal 6 karakter. Username boleh berisi huruf, angka, titik, garis bawah, dan tanda minus.
                </p>
              )}
            </div>
            {error && (
              <p id="gate-error" role="alert" className="text-[14px] leading-snug text-[#8F1A1A]">
                {error}
              </p>
            )}
            <button
              id="gate-submit"
              type="submit"
              disabled={busy}
              className="h-12 rounded-[12px] bg-[#111318] px-4 text-[15px] font-semibold text-white hover:bg-[#2A2E37] active:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (mode === "in" ? "Memeriksa…" : "Membuat akun…") : mode === "in" ? "Masuk" : "Buat akun"}
            </button>
          </form>
          <p className="mt-2 flex flex-wrap items-center gap-x-1 text-[14px] text-[#3B3F48]">
            <span>{mode === "in" ? "Belum punya akun?" : "Sudah punya akun?"}</span>
            <button
              id="gate-switch"
              type="button"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setError("");
                setInvalid(null);
                userRef.current?.focus();
              }}
              className="h-11 px-1 font-semibold text-[#111318] underline underline-offset-4 decoration-[#111318]/30 hover:decoration-[#111318] active:text-black"
            >
              {mode === "in" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </>
      )}

      {offline && (
        <div id="gate-offline">
          <p className="mt-3 text-[15px] leading-snug">
            Server lokal belum bisa dihubungi, jadi akun belum bisa dipakai. Jalankan{" "}
            <code className="rounded-[6px] bg-white px-1.5 py-0.5 font-mono text-[14px]">npm run server</code>, lalu coba lagi.
          </p>
          <p className="mt-2 text-[14px] leading-snug text-[#3B3F48]">
            Tanpa akun, daftar putar tetap tersimpan di browser ini. Begitu kamu mendaftar, isinya ikut masuk ke akun.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              ref={retryRef}
              id="gate-retry"
              type="button"
