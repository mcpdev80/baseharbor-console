import { Plus } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { WorkspaceTable } from "@/components/workspaces/workspace-table";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function WorkspacesPage() {
  const workspaces = await baseHarborData.workspaces();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Development</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Workspaces</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            BaseHarbor workspace declarations, repository/source mappings and application relationships in one place.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--bh-ocean-blue)] px-3.5 py-2 text-xs font-medium text-white">
          <Plus className="size-4" /> Create workspace
        </button>
      </div>

      <Panel title="Workspaces" subtitle="Dirty/source state is visible without inventing a separate Console workspace database.">
        <WorkspaceTable workspaces={workspaces} />
      </Panel>
    </div>
  );
}
