"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { navigationGroups } from "@/lib/navigation";

const destinations = navigationGroups.flatMap((group) =>
  group.items.flatMap((item) => [
    { label: item.label, group: group.label, href: item.href },
    ...("children" in item ? item.children.map((child) => ({ label: child.label, group: item.label, href: child.href })) : []),
  ]),
);

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((item) =>
      item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q),
    );
  }, [query]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex min-h-10 w-full max-w-xl items-center gap-2 rounded-md border border-[var(--border)] bg-white/[.02] px-3 text-left text-sm text-slate-500 outline-none hover:border-[var(--bh-signal-blue)]/30 hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]"
        >
          <Search className="size-4" />
          <span className="flex-1 truncate">Search Console destinations…</span>
          <kbd className="rounded border border-[var(--border)] bg-white/[.03] px-1.5 py-0.5 text-[10px]"><Command className="mr-1 inline size-3" />K</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-[12vh] z-50 w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-2xl outline-none">
          <Dialog.Title className="sr-only">Search Console destinations</Dialog.Title>
          <Dialog.Description className="sr-only">Search and navigate BaseHarbor Console sections. Resource search will bind to the Core contract later.</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
            <Search className="size-4 text-slate-600" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Applications, Targets, Runtime, Security…"
              className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-700"
            />
            <Dialog.Close className="inline-flex size-9 items-center justify-center rounded-md text-slate-500 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]" aria-label="Close search">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="max-h-[55vh] overflow-y-auto p-2">
            {results.length ? results.map((item) => (
              <button
                key={`${item.group}-${item.href}`}
                type="button"
                onClick={() => navigate(item.href)}
                className="flex min-h-12 w-full items-center gap-4 rounded-md px-3 text-left outline-none hover:bg-white/[.035] focus-visible:bg-white/[.035]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-200">{item.label}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[.12em] text-slate-600">{item.group}</div>
                </div>
                <span className="font-mono text-[10px] text-slate-700">{item.href}</span>
              </button>
            )) : (
              <div className="p-8 text-center">
                <div className="text-sm text-slate-300">No Console destination matches.</div>
                <div className="mt-2 text-xs text-slate-600">Live application/resource search will use the protected Core discovery contract from #767.</div>
              </div>
            )}
          </div>
          <div className="border-t border-[var(--border)] px-4 py-3 text-[10px] text-slate-600">
            Navigation search is local. Live resource search remains blocked until #767.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
