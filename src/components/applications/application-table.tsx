import Link from "next/link";
import { GitBranch, Layers3, PackageSearch } from "lucide-react";
import type { ApplicationSummary } from "@/lib/baseharbor/types";
import { HealthBadge } from "@/components/ui/badge";

export function ApplicationTable({ applications }: { applications: ApplicationSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Application</th>
            <th className="px-4 py-3 font-medium">Environment / Target</th>
            <th className="px-4 py-3 font-medium">Revision</th>
            <th className="px-4 py-3 font-medium">State</th>
            <th className="px-4 py-3 font-medium">Topology</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-white/[.02]">
              <td className="px-5 py-4">
                <Link href={`/applications/${encodeURIComponent(app.id)}`} className="font-medium text-white hover:text-[var(--bh-signal-blue)]">
                  {app.name}
                </Link>
                <div className="mt-1 text-xs text-slate-600">{app.deploymentId}</div>
              </td>
              <td className="px-4 py-4">
                <div className="text-slate-300">{app.environment}</div>
                <div className="text-xs text-slate-600">{app.target}</div>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <GitBranch className="size-3.5" /> {app.revision}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <HealthBadge value={app.health} />
                  <span className="text-xs text-slate-500">{app.observedState}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Layers3 className="size-3.5" />{app.components}</span>
                  <span className="inline-flex items-center gap-1"><PackageSearch className="size-3.5" />{app.providers}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-xs text-slate-500">{new Date(app.updatedAt).toLocaleString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
