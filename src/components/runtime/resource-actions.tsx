"use client";

import Link from "next/link";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, RotateCcw, ScrollText, Square, TerminalSquare, Trash2 } from "lucide-react";
import type { RuntimeResource } from "@/lib/baseharbor/types";
import { OperationConfirmation } from "@/components/operations/operation-confirmation";
import { ContractPendingButton } from "@/components/ui/contract-pending";

export function ResourceActions({ resource }: { resource: RuntimeResource }) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const caps = new Set(resource.capabilities ?? []);
  const button = "inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none hover:border-[var(--bh-signal-blue)]/35 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)] disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="flex flex-wrap gap-2">
      {caps.has("restart") ? <ContractPendingButton issue="#767/#770"><RotateCcw className="size-3.5" /> Restart</ContractPendingButton> : <button className={button} disabled><RotateCcw className="size-3.5" /> Restart</button>}
      <Link href="#logs" className={button}><ScrollText className="size-3.5" /> Logs</Link>
      <Link href="#terminal" aria-disabled={!caps.has("terminal")} className={`${button} ${!caps.has("terminal") ? "pointer-events-none opacity-35" : ""}`}>
        <TerminalSquare className="size-3.5" /> Terminal
      </Link>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className={button} aria-label="More runtime resource actions"><MoreHorizontal className="size-4" /></DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" className="z-40 min-w-52 rounded-md border border-[var(--border)] bg-[var(--panel)] p-1 shadow-2xl">
            <DropdownMenu.Item disabled className="flex min-h-9 cursor-not-allowed items-center gap-2 rounded px-2.5 text-xs text-slate-600 outline-none"><Square className="size-3.5" /> Stop · #767/#770</DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
            <DropdownMenu.Item onSelect={() => setRemoveOpen(true)} className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2.5 text-xs text-rose-300 outline-none focus:bg-rose-400/[.06]"><Trash2 className="size-3.5" /> Remove</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <OperationConfirmation
              open={removeOpen}
              onOpenChange={setRemoveOpen}
              title="Remove runtime resource?"
              operationId="runtime.remove"
              safety="destructive"
              resource={resource.displayName}
              target={resource.target}
              consequence={resource.ownership === "managed" || resource.ownership === "platform"
                ? "This resource is owned by BaseHarbor. Removal may be reconciled or rejected by Core according to desired state and ownership policy."
                : "This removes the selected runtime resource. BaseHarbor does not infer ownership for unmanaged resources."}
              confirmLabel="Remove resource"
            />
    </div>
  );
}
