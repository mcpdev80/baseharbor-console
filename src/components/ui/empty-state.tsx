import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white/[.018] text-slate-600">{icon ?? <Inbox className="size-4" />}</div>
      <h2 className="mt-4 text-sm font-semibold text-slate-200">{title}</h2>
      <p className="mt-2 max-w-md text-xs leading-5 text-slate-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
