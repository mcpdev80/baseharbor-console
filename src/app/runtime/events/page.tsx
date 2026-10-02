import { EventList } from "@/components/runtime/event-list";
import { baseHarborData } from "@/lib/baseharbor/data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function EventsPage() {
  const events = await baseHarborData.runtimeEvents();
  return <div className="mx-auto max-w-[1500px] space-y-6"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Runtime</p><h1 className="text-2xl font-semibold tracking-tight text-white">Events</h1><p className="mt-2 text-sm text-[var(--muted)]">Semantic BaseHarbor events with runtime, provider, target and operation context.</p></div><div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">{events.length ? <EventList events={events} /> : <EmptyState title="No events available" description="Application, operation, provider, target and runtime events will appear as BaseHarbor emits them." />}</div></div>;
}
