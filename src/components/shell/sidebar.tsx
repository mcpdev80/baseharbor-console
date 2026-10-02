"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { navigationGroups } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--border)] bg-[#0B152A]/97 backdrop-blur-xl lg:block">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-4">
        <Image src="/baseharbor-icon-128.png" alt="BaseHarbor" width={36} height={36} priority className="size-9 rounded-lg" />
        <div>
          <div className="font-semibold tracking-tight text-[var(--bh-white)]">BaseHarbor</div>
          <div className="text-xs text-[var(--muted)]">Console</div>
        </div>
      </div>

      <nav aria-label="Primary" className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {navigationGroups.map((group) => (
            <section key={group.label} aria-labelledby={`nav-${group.label.toLowerCase()}`}>
              <div id={`nav-${group.label.toLowerCase()}`} className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-600">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bh-harbor-navy)]",
                          active
                            ? "bg-[var(--bh-signal-blue)]/10 text-white"
                            : "text-slate-400 hover:bg-white/[.035] hover:text-slate-100",
                        ].join(" ")}
                      >
                        <Icon className={active ? "size-4 text-[var(--bh-signal-blue)]" : "size-4"} />
                        <span className="flex-1">{item.label}</span>
                        {"children" in item && <ChevronRight className={active ? "size-3.5 rotate-90 opacity-60" : "size-3.5 opacity-40"} />}
                      </Link>
                      {"children" in item && active && (
                        <div className="ml-8 mt-1 space-y-0.5 border-l border-[var(--border)] pl-3">
                          {item.children.map((child) => {
                            const childActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                aria-current={childActive ? "page" : undefined}
                                className={[
                                  "block rounded-md px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]",
                                  childActive ? "text-sky-200" : "text-slate-500 hover:text-white",
                                ].join(" ")}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>
    </aside>
  );
}
