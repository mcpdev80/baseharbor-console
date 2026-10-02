import Link from "next/link";

export interface ResourceTab {
  label: string;
  href: string;
  active?: boolean;
  disabled?: boolean;
}

export function ResourceTabs({ tabs, ariaLabel }: { tabs: ResourceTab[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel} className="border-b border-[var(--border)]">
      <div className="flex min-w-0 gap-5 overflow-x-auto">
        {tabs.map((tab) =>
          tab.disabled ? (
            <span key={tab.label} className="border-b-2 border-transparent px-0.5 py-3 text-sm text-slate-700" aria-disabled="true">
              {tab.label}
            </span>
          ) : (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={[
                "border-b-2 px-0.5 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]",
                tab.active
                  ? "border-[var(--bh-signal-blue)] text-white"
                  : "border-transparent text-slate-500 hover:text-slate-200",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
