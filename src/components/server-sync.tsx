import { useId, useState } from "react";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkAccount, signOut, type AuthState } from "@/lib/cloud";
import { forgetSaved } from "@/lib/playlist";
import type { SyncStatus } from "@/hooks/use-server-sync";

type Props = {
  auth: AuthState;
  status: SyncStatus;
  checkedAt: number | null;
  /** Sends the latest lists now; false when the server could not take them. */
  onFlush: () => Promise<boolean>;
};

const clock = (ms: number) => new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const joined = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

/** Where the lists are kept besides this browser, and the account they belong to. */
export function ServerSync({ auth, status, checkedAt, onFlush }: Props) {
  const titleId = useId();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  const line: Record<SyncStatus, string> = {
    "signed-out": "Belum masuk. Daftar putar dan playlist hanya tersimpan di browser ini.",
    checking: "Menghubungi server lokal…",
    saving: "Menyimpan ke akunmu di server lokal…",
    saved: checkedAt ? `Tersimpan juga di akunmu di server lokal (MySQL), dicek pukul ${clock(checkedAt)}.` : "Tersimpan juga di akunmu di server lokal (MySQL).",
    offline: "Server lokal tidak menyala. Semuanya tetap tersimpan di browser ini dan dikirim begitu server jalan (npm run server).",
    nodb: "Server lokal menyala, tapi MySQL belum terhubung. Periksa isi .env dan pastikan MySQL berjalan.",
    error: "Server lokal menolak data ini. Perubahan tetap tersimpan di browser ini.",
  };
  const trouble = status === "offline" || status === "nodb" || status === "error";
  const account = auth.status === "signed-in" ? auth.account : null;

  async function leave() {
    setError("");
    setLeaving(true);
    if (!(await onFlush())) {
      setError("Perubahan terakhir belum terkirim ke server. Coba lagi sebentar lagi.");
    }
  }

  function ask(event: FormEvent) {
    event.preventDefault();
    setResult(null);
    if (!entry.trim()) return setResult({ ok: false, text: "Ketik kode dari browser lain dulu." });
    setAsking(true);
  }

  async function take() {
    setAsking(false);
    setBusy(true);
    const r = await onSwitch(entry);
    setBusy(false);
    setResult(r);
    if (r.ok) setEntry("");
  }

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className="flex items-center gap-2 text-[15px] font-semibold">
        <Database aria-hidden className="size-4" />
        Server lokal
      </h3>
      <p role="status" className={cn("mt-1 text-[14px] leading-snug", trouble ? "text-[#8F1A1A]" : "text-[#3B3F48]")}>
        {line[status]}
      </p>

      <details className="group mt-1">
        <summary className="inline-flex h-11 list-none items-center gap-1.5 text-[14px] font-medium text-[#111318] underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
          <ChevronDown aria-hidden className="size-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
          Kode pemulihan dan pindah browser
        </summary>
        <div className="space-y-4 pb-1">
          <div>
            <p className="text-[14px] leading-snug text-[#3B3F48]">
              Kode browser ini. Ketik di browser lain untuk membawa daftar putar dan playlist ke sana.
            </p>
            <div className="mt-2 flex items-center gap-2">
              {/* monospace keeps look-alike characters apart in a code someone copies by hand */}
              <code className="rounded-[10px] bg-white px-3 py-2 font-mono text-[16px] tracking-[0.08em] text-[#111318]">{formatCode(code)}</code>
              <button
                type="button"
                onClick={copy}
                className="h-11 rounded-[12px] border border-[#111318]/15 bg-white px-4 text-[14px] font-medium text-[#111318] hover:border-[#111318]/30 active:bg-[#F3F4F5]"
              >
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
          </div>

          <form onSubmit={ask} noValidate>
            <label htmlFor={inputId} className="mb-2 block text-[14px] font-semibold">
              Kode dari browser lain
            </label>
            <div className="flex gap-2">
              <input
                id={inputId}
                type="text"
                value={entry}
                autoComplete="off"
                spellCheck={false}
                maxLength={20}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="ABCD EFGH JKLM"
                className="h-11 min-w-0 flex-1 rounded-[12px] border border-[#111318]/20 bg-white px-3 font-mono text-[16px] tracking-[0.06em] uppercase placeholder:text-[#6B707A] hover:border-[#111318]/35"
              />
              <button
                type="submit"
                disabled={busy}
                className="h-11 shrink-0 rounded-[12px] bg-[#111318] px-4 text-[14px] font-semibold text-white hover:bg-[#2A2E37] active:bg-black disabled:opacity-60"
              >
                {busy ? "Mengambil…" : "Pakai kode"}
              </button>
            </div>
          </form>

          {asking && (
            <Confirm
              text="Daftar putar dan playlist di browser ini akan diganti dengan data dari kode itu, dan browser ini ikut memakai kode itu."
              confirmLabel="Ganti data"
              onConfirm={take}
              onCancel={() => setAsking(false)}
            />
          )}
          {result && (
            <p role="status" className={cn("text-[14px] leading-snug", result.ok ? "text-[#1D5A3A]" : "text-[#8F1A1A]")}>
              {result.text}
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
