import { VolumeInventoryTable } from "@/components/runtime/runtime-inventory-tables";
import { previewData } from "@/lib/baseharbor/data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function VolumesPage() {
  const volumes = await previewData.runtimeVolumes();
  return <div className="mx-auto max-w-[1500px] space-y-6"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Runtime</p><h1 className="text-2xl font-semibold tracking-tight text-white">Volumes & PVCs</h1><p className="mt-2 text-sm text-[var(--muted)]">Persistent runtime resources with ownership and attachment context.</p></div><div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">{volumes.length ? <VolumeInventoryTable volumes={volumes} /> : <EmptyState title="No volumes observed" description="Persistent runtime resources will appear when targets expose them through the runtime contract." />}</div></div>;
}
