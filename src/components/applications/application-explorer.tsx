"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import type { ApplicationSummary } from "@/lib/baseharbor/types";
import { ApplicationTable } from "./application-table";

export function ApplicationExplorer({ applications }: { applications: ApplicationSummary[] }) {
  const [search, setSearch] = useState("");
  const [environment, setEnvironment] = useState("all");
  const [target, setTarget] = useState("all");
  const [health, setHealth] = useState("all");

  const targets = useMemo(() => [...new Set(applications.map((app) => app.target))].sort(), [applications]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (environment !== "all" && app.environment !== environment) return false;
      if (target !== "all" && app.target !== target) return false;
      if (health !== "all" && app.health !== health) return false;
      if (!query) return true;
      return [app.name, app.source, app.revision, app.deploymentId, app.target]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [applications, search, environment, target, health]);

  const dirty = search || environment !== "all" || target !== "all" || health !== "all";
  const control = "min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-slate-300 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/20";

  function reset() {
    setSearch("");
    setEnvironment("all");
    setTarget("all");
    setHealth("all");
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Search applications</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applications…" className={`${control} w-full pl-9`} />
          </label>
          <label><span className="sr-only">Environment</span><select value={environment} onChange={(e) => setEnvironment(e.target.value)} className={control}><option value="all">Environment: All</option><option value="dev">dev</option><option value="test">test</option><option value="prod">prod</option></select></label>
          <label><span className="sr-only">Target</span><select value={target} onChange={(e) => setTarget(e.target.value)} className={control}><option value="all">Target: All</option>{targets.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span className="sr-only">Health</span><select value={health} onChange={(e) => setHealth(e.target.value)} className={control}><option value="all">Health: All</option><option value="healthy">Healthy</option><option value="degraded">Degraded</option><option value="unhealthy">Unhealthy</option><option value="unknown">Unknown</option></select></label>
          {dirty && <button onClick={reset} className={`${control} inline-flex items-center gap-2 hover:text-white`}><RotateCcw className="size-3.5" /> Reset</button>}
        </div>
        <div className="mt-3 text-xs text-slate-600">{filtered.length} of {applications.length} applications</div>
      </div>

      {filtered.length > 0 ? <ApplicationTable applications={filtered} /> : (
        <div className="p-10 text-center">
          <div className="text-sm text-slate-300">No applications match these filters.</div>
          <button onClick={reset} className="mt-3 text-xs text-[var(--bh-signal-blue)] hover:text-white">Reset filters</button>
        </div>
      )}
    </div>
  );
}
