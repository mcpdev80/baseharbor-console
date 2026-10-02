import { Bell, CircleUserRound, Command, Search } from "lucide-react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <Sidebar />
      <div className="pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[#080b11]/80 px-6 backdrop-blur-xl">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[.025] px-3 py-2 text-sm text-slate-500">
            <Search className="size-4" />
            <span className="flex-1">Search applications, targets, runtime resources…</span>
            <kbd className="rounded border border-[var(--border)] bg-white/[.03] px-1.5 py-0.5 text-[10px]">
              <Command className="mr-1 inline size-3" />K
            </kbd>
          </div>
          <div className="ml-6 flex items-center gap-3">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
              Core connected
            </div>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-white/[.04] hover:text-white" aria-label="Notifications">
              <Bell className="size-4" />
            </button>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-white/[.04] hover:text-white" aria-label="Account">
              <CircleUserRound className="size-5" />
            </button>
          </div>
        </header>
        <main className="console-grid min-h-[calc(100vh-4rem)] p-6">{children}</main>
      </div>
    </div>
  );
}
