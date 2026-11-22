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
