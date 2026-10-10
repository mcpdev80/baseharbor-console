import { LiveCoreView } from "@/components/live/live-core-view";
import { RuntimeExplorer } from "@/components/runtime/runtime-explorer";
import { previewData } from "@/lib/baseharbor/data";

export default async function RuntimePage() {
  const resources = await previewData.runtimeResources();

  return (
    <LiveCoreView view="runtime">
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Operate</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Runtime Explorer</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Provider-neutral runtime visibility with authoritative BaseHarbor ownership, health and relationships.
        </p>
      </div>

      <RuntimeExplorer resources={resources} />
    </div>
    </LiveCoreView>
  );
}
