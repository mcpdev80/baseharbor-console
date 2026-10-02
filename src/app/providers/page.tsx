import Link from "next/link";
import { Plus } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export default function ProvidersPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Capabilities</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Providers</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Capability providers, placement, ownership, availability and trust through BaseHarbor Core.</p>
        </div>
        <Link href="/providers/new" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">
          <Plus className="size-4" /> Add provider
        </Link>
      </div>

      <Panel title="Provider inventory" subtitle="Live provider data will bind to the protected BaseHarbor HTTP contract.">
        <div className="p-8 text-center text-sm text-slate-500">Provider inventory adapter is the next data surface; the guided Add Provider flow is already available.</div>
      </Panel>
    </div>
  );
}
