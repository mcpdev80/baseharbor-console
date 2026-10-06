import Link from "next/link";
import { Plus } from "lucide-react";
import { ProviderTable } from "@/components/providers/provider-table";
import { previewData } from "@/lib/baseharbor/data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProvidersPage() {
  const providers = await previewData.providers();
  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div className="flex items-end justify-between gap-6"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Operate</p><h1 className="text-2xl font-semibold tracking-tight text-white">Providers</h1><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Capability providers, ownership, availability and trust projected from BaseHarbor Core.</p></div><Link href="/providers/new" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white"><Plus className="size-4" /> Add provider</Link></div>
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">{providers.length ? <ProviderTable providers={providers} /> : <EmptyState title="No providers configured" description="Add a capability provider or bind an external provider to make it available to BaseHarbor applications." action={<Link href="/providers/new" className="text-xs text-[var(--bh-signal-blue)]">Add provider</Link>} />}</div>
  </div>;
}
