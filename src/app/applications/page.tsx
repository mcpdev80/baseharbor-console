import Link from "next/link";
import { Plus } from "lucide-react";
import { ApplicationExplorer } from "@/components/applications/application-explorer";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function ApplicationsPage() {
  const applications = await baseHarborData.applications();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Develop</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Applications</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Portable intent, deployments, components and provider relationships through BaseHarbor Core.</p>
        </div>
        <Link href="/applications/new" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white hover:bg-[var(--bh-signal-blue)]">
          <Plus className="size-4" /> New application
        </Link>
      </div>

      <ApplicationExplorer applications={applications} />
    </div>
  );
}
