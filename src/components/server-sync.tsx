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
      setLeaving(false);
      return;
    }
    await signOut();
    forgetSaved();
    window.location.reload();
  }

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className="flex items-center gap-2 text-[15px] font-semibold">
        <Database aria-hidden className="size-4" />
        Akun dan server lokal
      </h3>
      <p role="status" className={cn("mt-1 text-[14px] leading-snug", trouble ? "text-[#8F1A1A]" : "text-[#3B3F48]")}>
        {line[status]}
      </p>

      {account ? (
        <div id="account-in" className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        </div>
      </details>
    </section>
  );
}
