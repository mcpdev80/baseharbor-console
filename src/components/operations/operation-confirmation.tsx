"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { SafetyClass } from "@/lib/baseharbor/types";

export function OperationConfirmation({
  trigger,
  open,
  onOpenChange,
  title,
  operationId,
  safety,
  resource,
  environment,
  target,
  consequence,
  confirmLabel,
  typedConfirmation,
}: {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  operationId: string;
  safety: SafetyClass;
  resource: string;
  environment?: string;
  target?: string;
  consequence: string;
  confirmLabel: string;
  typedConfirmation?: string;
}) {
  const destructive = safety === "destructive";
  const [confirmation, setConfirmation] = useState("");
  const confirmationSatisfied = !typedConfirmation || confirmation === typedConfirmation;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setConfirmation("");
    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-2xl outline-none">
          <div className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4">
            <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${destructive ? "bg-rose-400/10 text-rose-300" : "bg-[var(--bh-signal-blue)]/10 text-sky-300"}`}>
              {destructive ? <AlertTriangle className="size-4" /> : <ShieldCheck className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold text-white">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-slate-500">
                This action will be submitted as a BaseHarbor machine operation.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1.5 text-slate-500 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]" aria-label="Close confirmation">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-5 p-5">
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-xs">
              <dt className="text-slate-600">Operation</dt><dd className="font-mono text-slate-300">{operationId}</dd>
              <dt className="text-slate-600">Safety</dt><dd className={destructive ? "text-rose-300" : "text-slate-300"}>{safety}</dd>
              <dt className="text-slate-600">Resource</dt><dd className="text-slate-300">{resource}</dd>
              {environment && <><dt className="text-slate-600">Environment</dt><dd className="text-slate-300">{environment}</dd></>}
              {target && <><dt className="text-slate-600">Target</dt><dd className="text-slate-300">{target}</dd></>}
            </dl>

            <div className={`rounded-md border p-4 text-sm leading-6 ${destructive ? "border-rose-400/20 bg-rose-400/[.035] text-rose-100" : "border-[var(--border)] text-slate-400"}`}>
              {consequence}
            </div>

            {typedConfirmation && (
              <label className="block">
                <span className="text-xs font-medium text-slate-300">Type <span className="font-mono text-white">{typedConfirmation}</span> to confirm</span>
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} className="mt-2 min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25" />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
            <Dialog.Close className="min-h-10 rounded-md px-4 text-xs text-slate-400 hover:text-white">Cancel</Dialog.Close>
            <button disabled={!confirmationSatisfied} className={`min-h-10 rounded-md px-4 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${destructive ? "bg-rose-600 hover:bg-rose-500" : "bg-[var(--bh-ocean-blue)] hover:bg-[var(--bh-signal-blue)]"}`}>
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
