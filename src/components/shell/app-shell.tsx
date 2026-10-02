import { Bell, CircleUserRound } from "lucide-react";
import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { PreviewModeBadge } from "./preview-mode-badge";
import { CommandSearch } from "./command-search";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bh-harbor-navy)]/92 px-3 backdrop-blur-xl sm:px-4 lg:px-6">
          <div className="mr-2 lg:hidden"><MobileNavigation /></div>
          <CommandSearch />
          <div className="ml-6 flex items-center gap-2">
            <PreviewModeBadge />
            <div className="hidden rounded-md border border-[var(--border)] bg-white/[.02] px-2.5 py-1.5 text-xs text-slate-400 xl:block">
              Target <span className="ml-1 font-medium text-slate-200">local</span>
            </div>
            <button disabled title="Live notifications require #767" className="min-h-10 min-w-10 cursor-not-allowed rounded-md p-2 text-slate-700" aria-label="Notifications unavailable until Core event binding is available">
              <Bell className="mx-auto size-4" />
            </button>
            <button disabled title="Operator session requires #770" className="min-h-10 min-w-10 cursor-not-allowed rounded-md p-2 text-slate-700" aria-label="Account unavailable until operator identity binding is available">
              <CircleUserRound className="mx-auto size-5" />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="console-grid min-h-[calc(100vh-4rem)] p-6 outline-none">{children}</main>
      </div>
    </div>
  );
}
