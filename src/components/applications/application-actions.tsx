"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Play, RotateCcw, Square, Stethoscope, Trash2 } from "lucide-react";
import type { ApplicationSummary } from "@/lib/baseharbor/types";
import { OperationConfirmation } from "@/components/operations/operation-confirmation";

export function ApplicationActions({ application }: { application: ApplicationSummary }) {
  const button="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none hover:border-[var(--bh-signal-blue)]/35 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]";
  return (
    <div className="flex flex-wrap gap-2">
      <button className={button}><Play className="size-3.5" /> Apply</button>
      <button className={button}><RotateCcw className="size-3.5" /> Repair</button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className={button} aria-label="More application actions"><MoreHorizontal className="size-4" /></DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" className="z-40 min-w-52 rounded-md border border-[var(--border)] bg-[var(--panel)] p-1 shadow-2xl">
            <DropdownMenu.Item className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2.5 text-xs text-slate-300 outline-none focus:bg-white/[.04]"><Stethoscope className="size-3.5" /> Doctor</DropdownMenu.Item>
            <DropdownMenu.Item className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2.5 text-xs text-slate-300 outline-none focus:bg-white/[.04]"><Square className="size-3.5" /> Stop</DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
            <OperationConfirmation
              trigger={<DropdownMenu.Item onSelect={(event)=>event.preventDefault()} className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2.5 text-xs text-rose-300 outline-none focus:bg-rose-400/[.06]"><Trash2 className="size-3.5" /> Destroy</DropdownMenu.Item>}
              title="Destroy application?"
              operationId="application.destroy"
              safety="destructive"
              resource={application.name}
              environment={application.environment}
              target={application.target}
              consequence="Managed runtime resources owned by this deployment will be removed according to the BaseHarbor destroy plan. Persistent resources follow their explicit retention semantics."
              confirmLabel="Destroy application"
              typedConfirmation={application.environment === "prod" ? application.name : undefined}
            />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
