import { useId, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AddResult } from "@/lib/add-link";

type Status = { kind: "idle" } | { kind: "busy"; text: string } | { kind: "done" | "error"; text: string };

export type AddSong = (raw: string, onProgress: (text: string) => void) => Promise<AddResult>;

export function AddSongForm({ onAdd, className, autoFocus = false }: { onAdd: AddSong; className?: string; autoFocus?: boolean }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = status.kind === "busy";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const playlist = /[?&]list=/.test(value) && !/[?&]v=|youtu\.be\//.test(value);
    setStatus({ kind: "busy", text: playlist ? "Mengambil isi playlist…" : "Mencari lagunya…" });
    const result = await onAdd(value, (text) => setStatus({ kind: "busy", text }));
    setStatus({ kind: result.ok ? "done" : "error", text: result.text });
    if (result.ok) setValue("");
  }

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <label htmlFor={id} className="mb-2 block text-[15px] font-semibold text-[#111318]">
        Link YouTube
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://youtu.be/..."
          aria-describedby={`${id}-hint ${id}-status`}
          aria-invalid={status.kind === "error"}
          className="h-12 min-w-0 flex-1 rounded-[14px] border border-[#111318]/20 bg-white px-4 text-[16px] text-[#111318] placeholder:text-[#6B707A] hover:border-[#111318]/35 aria-[invalid=true]:border-[#8F1A1A]"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[14px] bg-[#111318] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#2A2E37] active:bg-[#000] disabled:opacity-60"
        >
          {busy && <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" />}
