import { ImageInventoryTable } from "@/components/runtime/runtime-inventory-tables";
import { previewData } from "@/lib/baseharbor/data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ImagesPage() {
  const images = await previewData.runtimeImages();
  return <div className="mx-auto max-w-[1500px] space-y-6"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Runtime</p><h1 className="text-2xl font-semibold tracking-tight text-white">Images</h1><p className="mt-2 text-sm text-[var(--muted)]">Image identity, ownership and usage relationships across runtimes and targets.</p></div><div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">{images.length ? <ImageInventoryTable images={images} /> : <EmptyState title="No images observed" description="Runtime image inventory will appear after targets expose image capability through BaseHarbor." />}</div></div>;
}
