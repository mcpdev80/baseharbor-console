"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { navigation } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-[var(--border)] bg-[#0B152A]/96 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-4">
        <Image
          src="/baseharbor-icon-128.png"
          alt="BaseHarbor"
          width={40}
          height={40}
          priority
          className="size-10 rounded-xl"
        />
        <div>
          <div className="font-semibold tracking-tight text-[var(--bh-white)]">BaseHarbor</div>
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
                      ? "bg-[var(--bh-signal-blue)]/12 text-white ring-1 ring-inset ring-[var(--bh-signal-blue)]/20"
                      : "text-slate-400 hover:bg-white/[.035] hover:text-slate-100",
                  ].join(" ")}
                >
                  <Icon className={active ? "size-4 text-[var(--bh-signal-blue)]" : "size-4"} />
                  <span className="flex-1">{item.label}</span>
                  {"children" in item && <ChevronRight className="size-3.5 opacity-50" />}
                </Link>
                {"children" in item && active && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-2 py-1.5 text-xs text-slate-500 hover:text-white"
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
