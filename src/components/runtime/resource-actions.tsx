import { Play, RotateCcw, Square, TerminalSquare, Trash2 } from "lucide-react";
import type { RuntimeResource } from "@/lib/baseharbor/types";

export function ResourceActions({ resource }: { resource: RuntimeResource }) {
  const caps = new Set(resource.capabilities ?? []);
  const button = "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-slate-300 hover:border-[var(--bh-signal-blue)]/35 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={!caps.has("restart")}><RotateCcw className="size-3.5" /> Restart</button>
      <button className={button}><Play className="size-3.5" /> Start</button>
      <button className={button}><Square className="size-3.5" /> Stop</button>
      <button className={button} disabled={!caps.has("terminal")}><TerminalSquare className="size-3.5" /> Terminal</button>
      <button className={button}><Trash2 className="size-3.5" /> Remove</button>
    </div>
  );
}
