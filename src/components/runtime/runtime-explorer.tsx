"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import type { RuntimeResource } from "@/lib/baseharbor/types";
import { RuntimeResourceTable } from "./runtime-resource-table";

export function RuntimeExplorer({ resources }: { resources: RuntimeResource[] }) {
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState("all");
  const [runtime, setRuntime] = useState("all");
  const [ownership, setOwnership] = useState("all");
  const [health, setHealth] = useState("all");

  const targets = useMemo(() => [...new Set(resources.map((r) => r.target))].sort(), [resources]);
  const runtimes = useMemo(() => [...new Set(resources.map((r) => r.runtime))].sort(), [resources]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      if (target !== "all" && resource.target !== target) return false;
      if (runtime !== "all" && resource.runtime !== runtime) return false;
      if (ownership !== "all" && resource.ownership !== ownership) return false;
      if (health !== "all" && (resource.health ?? "unknown") !== health) return false;
      if (!query) return true;
      return [
        resource.displayName,
        resource.nativeName,
        resource.image,
        resource.kind,
        resource.runtime,
        resource.target,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [resources, search, target, runtime, ownership, health]);

  const dirty = search || target !== "all" || runtime !== "all" || ownership !== "all" || health !== "all";
  const control = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/20";

  function reset() {
    setSearch("");
    setTarget("all");
    setRuntime("all");
    setOwnership("all");
    setHealth("all");
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Search runtime resources</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources…" className={`${control} w-full pl-9`} />
          </label>
          <label><span className="sr-only">Target</span><select value={target} onChange={(e) => setTarget(e.target.value)} className={control}><option value="all">Target: All</option>{targets.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span className="sr-only">Runtime</span><select value={runtime} onChange={(e) => setRuntime(e.target.value)} className={control}><option value="all">Runtime: All</option>{runtimes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span className="sr-only">Ownership</span><select value={ownership} onChange={(e) => setOwnership(e.target.value)} className={control}><option value="all">Ownership: All</option><option value="managed">Managed</option><option value="platform">Platform</option><option value="external">External</option><option value="unmanaged">Unmanaged</option></select></label>
          <label><span className="sr-only">Health</span><select value={health} onChange={(e) => setHealth(e.target.value)} className={control}><option value="all">Health: All</option><option value="healthy">Healthy</option><option value="degraded">Degraded</option><option value="unhealthy">Unhealthy</option><option value="unknown">Unknown</option></select></label>
          {dirty && <button onClick={reset} className={`${control} inline-flex items-center gap-2 hover:text-white`}><RotateCcw className="size-3.5" /> Reset</button>}
        </div>
        <div className="mt-3 text-xs text-slate-600">{filtered.length} of {resources.length} resources</div>
      </div>

      {filtered.length > 0 ? (
        <RuntimeResourceTable resources={filtered} />
      ) : (
        <div className="p-10 text-center">
          <div className="text-sm text-slate-300">No runtime resources match these filters.</div>
          <button onClick={reset} className="mt-3 text-xs text-[var(--bh-signal-blue)] hover:text-white">Reset filters</button>
        </div>
      )}
    </div>
  );
}
