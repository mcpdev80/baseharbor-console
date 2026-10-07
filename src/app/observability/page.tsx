import { SignalTable } from "@/components/observability/signal-table";
import { previewData } from "@/lib/baseharbor/data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ObservabilityPage() {
  const signals = await previewData.observability();
  const degraded = signals.filter((s) => [s.metrics,s.logs,s.traces,s.otlp].includes("degraded")).length;
  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Observe</p><h1 className="text-2xl font-semibold tracking-tight text-white">Observability</h1><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Provider-neutral metrics, logs, traces and OTLP signal health.</p></div>
    {degraded > 0 && <div className="rounded-lg border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.035] px-4 py-3 text-sm text-orange-200">{degraded} subject{degraded===1?"":"s"} need observability attention.</div>}
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">{signals.length ? <SignalTable signals={signals} /> : <EmptyState title="No observability subjects" description="Enable metrics, logs or traces for an application or provider to populate this view." />}</div>
  </div>;
}
