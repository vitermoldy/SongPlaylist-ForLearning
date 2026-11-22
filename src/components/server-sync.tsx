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
