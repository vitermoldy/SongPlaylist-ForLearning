import { useId, useState, type FormEvent } from "react";
import { ChevronDown, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Confirm } from "@/components/sheet";
import { formatCode } from "@/lib/cloud";
import type { SwitchResult, SyncStatus } from "@/hooks/use-server-sync";

type Props = {
  code: string;
  status: SyncStatus;
  checkedAt: number | null;
  onSwitch: (code: string) => Promise<SwitchResult>;
};

const clock = (ms: number) => new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

/** Where the lists are kept besides this browser, the recovery code, and taking over another browser's data. */
export function ServerSync({ code, status, checkedAt, onSwitch }: Props) {
  const titleId = useId();
  const inputId = useId();
  const [copied, setCopied] = useState(false);
  const [entry, setEntry] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SwitchResult | null>(null);

  const line: Record<SyncStatus, string> = {
    checking: "Menghubungi server lokal…",
    saving: "Menyimpan ke server lokal…",
    saved: checkedAt ? `Tersimpan juga di server lokal (MySQL), dicek pukul ${clock(checkedAt)}.` : "Tersimpan juga di server lokal (MySQL).",
    offline: "Server lokal tidak menyala. Semuanya tetap tersimpan di browser ini dan dikirim begitu server jalan (npm run server).",
    nodb: "Server lokal menyala, tapi MySQL belum terhubung. Periksa isi .env dan pastikan MySQL berjalan.",
    error: "Server lokal menolak data ini. Perubahan tetap tersimpan di browser ini.",
  };
  const trouble = status === "offline" || status === "nodb" || status === "error";

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setResult({ ok: false, text: "Browser tidak mengizinkan menyalin. Pilih kodenya lalu salin manual." });
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
