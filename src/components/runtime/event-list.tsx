import { AlertTriangle, CircleInfo, XCircle } from "lucide-react";
import type { RuntimeEvent } from "@/lib/baseharbor/types";

function Icon({ severity }: { severity: RuntimeEvent["severity"] }) {
  if (severity === "error") return <XCircle className="size-4 text-rose-300" />;
  if (severity === "warning") return <AlertTriangle className="size-4 text-amber-300" />;
  return <CircleInfo className="size-4 text-sky-300" />;
}

export function EventList({ events }: { events: RuntimeEvent[] }) {
  return <div className="divide-y divide-[var(--border)]">{events.map((event)=><div key={event.id} className="flex gap-3 px-5 py-4"><Icon severity={event.severity} /><div className="min-w-0 flex-1"><div className="text-sm text-slate-200">{event.message}</div><div className="mt-1 text-xs text-slate-600">{event.category} · {event.subject}{event.target ? ` · ${event.target}` : ""}</div></div><time className="text-xs text-slate-600">{new Date(event.observedAt).toLocaleTimeString("en-GB")}</time></div>)}</div>;
}
