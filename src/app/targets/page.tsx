import Link from "next/link";
import { Plus } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { TargetTable } from "@/components/targets/target-table";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function TargetsPage() {
  const targets = await baseHarborData.targets();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Deployment context</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Targets</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Runtime Provider and Target Access Provider remain independent. The Console shows both but never talks to either directly.</p>
        </div>
        <Link href="/targets/new" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white hover:bg-[var(--bh-signal-blue)]">
          <Plus className="size-4" /> Create target
        </Link>
      </div>

      <Panel title="Configured targets" subtitle="Effective runtime, access path, scope, connectivity and negotiated capabilities.">
        <TargetTable targets={targets} />
      </Panel>
    </div>
  );
}
