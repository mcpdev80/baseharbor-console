import { Monitor, PlugZap, TerminalSquare } from "lucide-react";

export default function SettingsPage() {
  return <div className="mx-auto max-w-[1200px] space-y-6">
    <div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Console</p><h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Presentation and connection diagnostics only. Operational truth, credentials and policy do not live in the Console.</p></div>
    <div className="grid gap-4">
      {[["Appearance","Dark technical surface · BaseHarbor brand tokens",Monitor],["Core endpoint","Protected BaseHarbor HTTP endpoint from #767",PlugZap],["Terminal integration","@xterm/xterm · session binding through Core only",TerminalSquare]].map(([title,description,Icon])=><section key={String(title)} className="flex items-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5"><Icon className="mt-0.5 size-4 text-slate-500" /><div><h2 className="text-sm font-semibold text-slate-100">{String(title)}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{String(description)}</p></div></section>)}
    </div>
  </div>;
}
