import Link from "next/link";
import { MoreHorizontal, RotateCcw, ScrollText, TerminalSquare } from "lucide-react";
import type { RuntimeResource } from "@/lib/baseharbor/types";

export function ResourceActions({ resource }: { resource: RuntimeResource }) {
  const caps = new Set(resource.capabilities ?? []);
  const button = "inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none hover:border-[var(--bh-signal-blue)]/35 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)] disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={!caps.has("restart")}><RotateCcw className="size-3.5" /> Restart</button>
      <Link href="#logs" className={button}><ScrollText className="size-3.5" /> Logs</Link>
      <Link href="#terminal" aria-disabled={!caps.has("terminal")} className={`${button} ${!caps.has("terminal") ? "pointer-events-none opacity-35" : ""}`}>
        <TerminalSquare className="size-3.5" /> Terminal
      </Link>
      <button className={button} aria-label="More runtime resource actions"><MoreHorizontal className="size-4" /></button>
    </div>
  );
}
