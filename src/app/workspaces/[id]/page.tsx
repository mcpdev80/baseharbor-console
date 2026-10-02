import { GitBranch, FolderTree } from "lucide-react";
import { notFound } from "next/navigation";
import { baseHarborData } from "@/lib/baseharbor/data";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await baseHarborData.workspace(decodeURIComponent(id));
  if (!workspace) notFound();

  const repositories = await baseHarborData.repositories();
  const repository = repositories.find((item) => item.id === workspace.repositoryId);

  return (
    <div className="mx-auto max-w-[1300px] space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: workspace.name }]} />
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)]"><FolderTree className="size-4 text-slate-500" /></div>
          <div><h1 className="text-2xl font-semibold tracking-tight text-white">{workspace.name}</h1><p className="mt-1 font-mono text-xs text-slate-600">{workspace.path}</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Workspace state</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">Branch</div><div className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-200"><GitBranch className="size-3.5" />{workspace.branch}</div></div>
            <div><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">Status</div><div className="mt-1 text-sm text-slate-200">{workspace.status}</div></div>
            <div><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">Sources</div><div className="mt-1 text-sm text-slate-200">{workspace.sources}</div></div>
            <div><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">Applications</div><div className="mt-1 text-sm text-slate-200">{workspace.applications}</div></div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Source binding</h2>
          {repository ? <div className="mt-4"><div className="text-sm font-medium text-slate-200">{repository.name}</div><div className="mt-1 font-mono text-xs text-slate-600">{repository.path}</div></div> : <div className="mt-4 text-sm text-slate-500">Repository binding unavailable.</div>}
        </section>
      </div>
    </div>
  );
}
