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
