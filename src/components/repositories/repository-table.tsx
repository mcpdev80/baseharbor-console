import Link from "next/link";
import { GitBranch, GitCommitHorizontal, FolderGit2, Sparkles } from "lucide-react";
import type { RepositorySummary } from "@/lib/baseharbor/types";

export function RepositoryTable({ repositories }: { repositories: RepositorySummary[] }) {
  return <>
    <div className="divide-y divide-[var(--border)] md:hidden">
      {repositories.map((repo) => (
        <div key={repo.id} className="px-4 py-4">
          <div className="flex items-start gap-3">
            <FolderGit2 className="mt-0.5 size-4 text-slate-500" />
            <div className="min-w-0 flex-1">
              <Link href={`/repositories/${encodeURIComponent(repo.id)}`} className="font-medium text-slate-200 hover:text-[var(--bh-signal-blue)]">{repo.name}</Link>
              <div className="mt-1 truncate font-mono text-xs text-slate-600">{repo.path}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><GitBranch className="size-3.5" />{repo.branch}</span>
            <span className="inline-flex items-center gap-1"><GitCommitHorizontal className="size-3.5" />{repo.revision}</span>
            {repo.dirty && <span className="text-amber-300">dirty</span>}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600">{repo.workspaceId ?? "No workspace"}</div>
            {repo.applicationId ? (
              <Link href={`/applications/${encodeURIComponent(repo.applicationId)}`} className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-slate-400">Inspect</Link>
            ) : (
              <Link href="/applications/new" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[var(--bh-ocean-blue)] px-2.5 text-xs text-white"><Sparkles className="size-3.5" /> Adopt / Init</Link>
            )}
          </div>
        </div>
      ))}
    </div>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
          <tr><th className="px-5 py-3 font-medium">Repository</th><th className="px-4 py-3 font-medium">Git</th><th className="px-4 py-3 font-medium">Application</th><th className="px-4 py-3 font-medium">Workspace</th><th className="px-4 py-3 font-medium">Action</th></tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {repositories.map((repo) => (
            <tr key={repo.id} className="hover:bg-white/[.02]">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white/[.025] text-slate-500"><FolderGit2 className="size-4" /></div><div><Link href={`/repositories/${encodeURIComponent(repo.id)}`} className="font-medium text-slate-200 hover:text-[var(--bh-signal-blue)]">{repo.name}</Link><div className="mt-1 font-mono text-xs text-slate-600">{repo.path}</div></div></div></td>
              <td className="px-4 py-4"><div className="inline-flex items-center gap-1.5 text-xs text-slate-300"><GitBranch className="size-3.5" />{repo.branch}</div><div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-slate-600"><GitCommitHorizontal className="size-3" />{repo.revision}</div>{repo.dirty && <div className="mt-1 text-[10px] text-amber-300">working tree dirty</div>}</td>
              <td className="px-4 py-4 text-xs text-slate-400">{repo.applicationId ?? "not adopted"}</td>
              <td className="px-4 py-4 text-xs text-slate-400">{repo.workspaceId ?? "—"}</td>
              <td className="px-4 py-4">{repo.applicationId ? <Link href={`/applications/${encodeURIComponent(repo.applicationId)}`} className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-slate-400 hover:text-white">Inspect</Link> : <Link href="/applications/new" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[var(--bh-ocean-blue)] px-2.5 text-xs text-white"><Sparkles className="size-3.5" /> Adopt / Init</Link>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>;
}
