import { useId, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AddResult } from "@/lib/add-link";

type Status = { kind: "idle" } | { kind: "busy"; text: string } | { kind: "done" | "error"; text: string };

export type AddSong = (raw: string, onProgress: (text: string) => void) => Promise<AddResult>;

