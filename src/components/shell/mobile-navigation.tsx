"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { navigationGroups } from "@/lib/navigation";

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <Dialog.Root>
      <Dialog.Trigger className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 outline-none hover:bg-white/[.04] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)] lg:hidden" aria-label="Open navigation">
        <Menu className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(320px,88vw)] overflow-y-auto border-r border-[var(--border)] bg-[var(--bh-harbor-navy)] p-3 outline-none lg:hidden">
          <div className="mb-4 flex h-12 items-center gap-3 px-2">
            <Image src="/baseharbor-icon-128.png" alt="" width={32} height={32} className="size-8 rounded-md" />
            <Dialog.Title className="flex-1 text-sm font-semibold text-white">BaseHarbor Console</Dialog.Title>
            <Dialog.Close className="inline-flex size-9 items-center justify-center rounded-md text-slate-500 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]" aria-label="Close navigation"><X className="size-4" /></Dialog.Close>
          </div>

          <nav aria-label="Mobile primary navigation" className="space-y-5">
            {navigationGroups.map((group) => (
              <section key={group.label}>
                <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-600">{group.label}</div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Dialog.Close asChild key={item.href}>
                        <Link href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)] ${active ? "bg-[var(--bh-signal-blue)]/10 text-white" : "text-slate-400"}`}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </Dialog.Close>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
