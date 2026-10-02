import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3 text-slate-700" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="rounded-sm hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bh-signal-blue)]">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-slate-400">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
