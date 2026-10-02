import Link from "next/link";
import { Boxes, FolderTree, GitBranch, TriangleAlert } from "lucide-react";
import type { WorkspaceSummary } from "@/lib/baseharbor/types";

export function WorkspaceTable({ workspaces }: { workspaces: WorkspaceSummary[] }) {
  return <>
    <div className="divide-y divide-[var(--border)] md:hidden">
      {workspaces.map((workspace) => (
        <Link key={workspace.id} href={`/workspaces/${encodeURIComponent(workspace.id)}`} className="block px-4 py-4 hover:bg-white/[.02]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3"><FolderTree className="mt-0.5 size-4 text-slate-500" /><div><div className="font-medium text-slate-200">{workspace.name}</div><div className="mt-1 font-mono text-xs text-slate-600">{workspace.path}</div></div></div>
            {workspace.status === "attention" ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/[.06] px-2 py-0.5 text-[10px] text-amber-300"><TriangleAlert className="size-3" />attention</span> : <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-2 py-0.5 text-[10px] text-emerald-300">{workspace.status}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><GitBranch className="size-3.5" />{workspace.branch}</span><span>{workspace.sources} sources</span><span className="inline-flex items-center gap-1"><Boxes className="size-3.5" />{workspace.applications} apps</span>{workspace.dirty && <span className="text-amber-300">dirty</span>}</div>
        </Link>
      ))}
    </div>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3 font-medium">Workspace</th><th className="px-4 py-3 font-medium">Branch</th><th className="px-4 py-3 font-medium">Sources</th><th className="px-4 py-3 font-medium">Applications</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
        <tbody className="divide-y divide-[var(--border)]">
          {workspaces.map((workspace) => (
            <tr key={workspace.id} className="hover:bg-white/[.02]">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><FolderTree className="size-4 text-slate-500" /><div><Link href={`/workspaces/${encodeURIComponent(workspace.id)}`} className="font-medium text-slate-200 hover:text-[var(--bh-signal-blue)]">{workspace.name}</Link><div className="mt-1 font-mono text-xs text-slate-600">{workspace.path}</div></div></div></td>
              <td className="px-4 py-4 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><GitBranch className="size-3.5" />{workspace.branch}</span>{workspace.dirty && <div className="mt-1 text-[10px] text-amber-300">dirty</div>}</td>
              <td className="px-4 py-4 text-xs text-slate-400">{workspace.sources}</td>
              <td className="px-4 py-4 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><Boxes className="size-3.5" />{workspace.applications}</span></td>
              <td className="px-4 py-4">{workspace.status === "attention" ? <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[.06] px-2 py-0.5 text-[10px] text-amber-300"><TriangleAlert className="size-3" />attention</span> : <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-2 py-0.5 text-[10px] text-emerald-300">{workspace.status}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>;
}
