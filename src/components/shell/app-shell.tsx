import { Bell, CircleUserRound, Command, Search } from "lucide-react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <div className="pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bh-harbor-navy)]/92 px-6 backdrop-blur-xl">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-md border border-[var(--border)] bg-white/[.02] px-3 py-2 text-sm text-slate-500">
            <Search className="size-4" />
            <span className="flex-1">Search applications, targets, runtime resources…</span>
            <kbd className="rounded border border-[var(--border)] bg-white/[.03] px-1.5 py-0.5 text-[10px]"><Command className="mr-1 inline size-3" />K</kbd>
          </div>
          <div className="ml-6 flex items-center gap-2">
            <div className="hidden rounded-md border border-[var(--border)] bg-white/[.02] px-2.5 py-1.5 text-xs text-slate-400 xl:block">
              Target <span className="ml-1 font-medium text-slate-200">local</span>
            </div>
            <button className="min-h-10 min-w-10 rounded-md p-2 text-slate-400 outline-none hover:bg-white/[.04] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]" aria-label="Notifications">
              <Bell className="mx-auto size-4" />
            </button>
            <button className="min-h-10 min-w-10 rounded-md p-2 text-slate-400 outline-none hover:bg-white/[.04] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]" aria-label="Account">
              <CircleUserRound className="mx-auto size-5" />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="console-grid min-h-[calc(100vh-4rem)] p-6 outline-none">{children}</main>
      </div>
    </div>
  );
}
