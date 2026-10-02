import { EvidenceTable } from "@/components/evidence/evidence-table";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function EvidencePage() {
  const evidence = await baseHarborData.evidence();
  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Observe</p><h1 className="text-2xl font-semibold tracking-tight text-white">Evidence & audit</h1><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Secret-safe lifecycle, policy, verification and recovery evidence with stable actor/resource identity.</p></div>
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]"><EvidenceTable entries={evidence} /></div>
  </div>;
}
