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

