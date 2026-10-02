"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, ChevronRight } from "lucide-react";
import { navigation } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-[var(--border)] bg-[#0a0e15]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
        <div className="flex size-9 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300">
          <Anchor className="size-5" />
        </div>
        <div>
          <div className="font-semibold tracking-tight">BaseHarbor</div>
          <div className="text-xs text-[var(--muted)]">Console</div>
        </div>
      </div>

      <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-sky-400/10 text-sky-200 ring-1 ring-inset ring-sky-400/15"
                      : "text-slate-400 hover:bg-white/[.035] hover:text-slate-100",
                  ].join(" ")}
                >
                  <Icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {"children" in item && <ChevronRight className="size-3.5 opacity-50" />}
                </Link>
                {"children" in item && active && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-2 py-1.5 text-xs text-slate-500 hover:text-slate-200"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
