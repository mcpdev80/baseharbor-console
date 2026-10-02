import { Plus } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { RepositoryTable } from "@/components/repositories/repository-table";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function RepositoriesPage() {
  const repositories = await baseHarborData.repositories();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Source</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Repositories</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            Register existing local repositories, inspect source identity and enter the BaseHarbor adoption/init flow without turning Console into a Git server.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--bh-ocean-blue)] px-3.5 py-2 text-xs font-medium text-white">
          <Plus className="size-4" /> Register repository
        </button>
      </div>

      <Panel title="Known repositories" subtitle="Repository state is source context; BaseHarbor application state remains separate.">
        <RepositoryTable repositories={repositories} />
      </Panel>
    </div>
  );
}
