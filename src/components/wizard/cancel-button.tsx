"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function WizardCancelButton() {
  const router = useRouter();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="min-h-10 rounded-md px-3 text-xs text-slate-500 outline-none hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]">
          Cancel
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-2xl outline-none">
          <div className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-amber-300"><TriangleAlert className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold text-white">Leave this workflow?</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-slate-500">
                Choices made in this preview flow will be discarded. Secret material is never persisted in the browser.
              </Dialog.Description>
            </div>
            <Dialog.Close className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]" aria-label="Close dialog"><X className="size-4" /></Dialog.Close>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4">
            <Dialog.Close className="min-h-10 rounded-md px-4 text-xs text-slate-300">Continue editing</Dialog.Close>
            <button type="button" onClick={() => router.back()} className="min-h-10 rounded-md border border-amber-400/20 bg-amber-400/[.08] px-4 text-xs font-medium text-amber-200 hover:bg-amber-400/[.12]">
              Leave workflow
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
