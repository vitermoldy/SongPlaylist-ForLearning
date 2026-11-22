import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** A panel from the right edge (full width on a phone), built on <dialog>: Escape and focus come free. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // a click on the dimmed page outside the panel
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[460px] bg-[#F3F4F5] p-0 text-[#111318] backdrop:bg-[#0A0C14]/45"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-2 sm:px-6">
          <h2 id={titleId} className="text-[20px] font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-11 place-items-center rounded-full hover:bg-[#111318]/[0.07] active:bg-[#111318]/[0.12]"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/** A question asked in place of the button that raised it, with the safe answer focused. */
export function Confirm({
  text,
  confirmLabel,
  onConfirm,
  onCancel,
