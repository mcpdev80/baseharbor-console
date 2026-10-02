import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { ApplicationTable } from "@/components/applications/application-table";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function ApplicationsPage() {
  const applications = await baseHarborData.applications();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Applications</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Application lifecycle</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Portable intent, deployments, components and provider relationships through BaseHarbor Core.</p>
        </div>
        <Link href="/applications/new" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white hover:bg-[var(--bh-signal-blue)]">
          <Plus className="size-4" /> New application
        </Link>
      </div>

      <Panel
        title="Applications"
        subtitle="Desired and observed state from BaseHarbor, not reconstructed from runtime names."
        action={<div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-white/[.02] px-2.5 py-1.5 text-xs text-slate-500"><Search className="size-3.5" /> Filter applications</div>}
      >
        <ApplicationTable applications={applications} />
      </Panel>
    </div>
  );
}
