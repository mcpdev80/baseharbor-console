import { GitBranch, GitCommitHorizontal, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { previewData } from "@/lib/baseharbor/data";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function RepositoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repository = await previewData.repository(decodeURIComponent(id));
  if (!repository) notFound();

  return (
    <div className="mx-auto max-w-[1300px] space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Repositories", href: "/repositories" }, { label: repository.name }]} />
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{repository.name}</h1>
            <p className="mt-2 font-mono text-xs text-slate-600">{repository.path}</p>
          </div>
          {!repository.applicationId && (
            <Link href="/applications/new" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">
              <Sparkles className="size-4" /> Adopt / Init
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Git state</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-300"><GitBranch className="size-4 text-slate-500" />{repository.branch}</div>
            <div className="flex items-center gap-2 text-sm text-slate-300"><GitCommitHorizontal className="size-4 text-slate-500" />{repository.revision}</div>
            <div className={repository.dirty ? "text-xs text-amber-300" : "text-xs text-emerald-300"}>{repository.dirty ? "Working tree dirty" : "Working tree clean"}</div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-sm font-semibold text-slate-100">BaseHarbor relationships</h2>
          <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-xs">
            <dt className="text-slate-600">Application</dt><dd className="text-slate-300">{repository.applicationId ?? "not adopted"}</dd>
            <dt className="text-slate-600">Workspace</dt><dd className="text-slate-300">{repository.workspaceId ?? "—"}</dd>
            <dt className="text-slate-600">Inspected</dt><dd className="text-slate-300">{repository.inspectedAt ? new Date(repository.inspectedAt).toLocaleString("en-GB") : "never"}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
