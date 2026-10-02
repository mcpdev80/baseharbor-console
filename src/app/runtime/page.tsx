import { Filter, RefreshCw, TerminalSquare } from "lucide-react";
import { RuntimeResourceTable } from "@/components/runtime/runtime-resource-table";
import { Panel } from "@/components/ui/panel";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function RuntimePage() {
  const resources = await baseHarborData.runtimeResources();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Runtime Explorer</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Runtime resources</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            Provider-neutral runtime visibility with authoritative BaseHarbor ownership and relationships.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-slate-300"><Filter className="size-3.5" /> Filter</button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-slate-300"><RefreshCw className="size-3.5" /> Refresh</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["All resources", resources.length],
          ["Managed", resources.filter((r) => r.ownership === "managed").length],
          ["Platform", resources.filter((r) => r.ownership === "platform").length],
          ["Unmanaged", resources.filter((r) => r.ownership === "unmanaged").length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <Panel
        title="Resources"
        subtitle="Application → Deployment → Component/Provider → Runtime realization → Resource"
        action={<span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-slate-500"><TerminalSquare className="size-3" /> capability-driven actions</span>}
      >
        <RuntimeResourceTable resources={resources} />
      </Panel>
    </div>
  );
}
