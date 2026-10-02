import { ImageInventoryTable } from "@/components/runtime/runtime-inventory-tables";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function ImagesPage() {
  const images = await baseHarborData.runtimeImages();
  return <div className="mx-auto max-w-[1500px] space-y-6"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Runtime</p><h1 className="text-2xl font-semibold tracking-tight text-white">Images</h1><p className="mt-2 text-sm text-[var(--muted)]">Image identity, ownership and usage relationships across runtimes and targets.</p></div><div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]"><ImageInventoryTable images={images} /></div></div>;
}
