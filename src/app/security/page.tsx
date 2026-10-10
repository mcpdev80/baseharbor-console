import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { SecurityMaterialTable } from "@/components/security/security-material-table";
import { Panel } from "@/components/ui/panel";
import { previewData } from "@/lib/baseharbor/data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SecurityPage() {
  const materials = await previewData.securityMaterials();
  const due = materials.filter((item) => item.state === "rotation_due").length;
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Protect</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Security & access</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Machine authorization, credentials, certificates and trust projected from BaseHarbor Core.</p>
        </div>
        <Link href="/security/rotate" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">
          <KeyRound className="size-4" /> Rotate credentials / trust
        </Link>
      </div>

      {due > 0 && <div className="rounded-lg border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.035] px-4 py-3 text-sm text-orange-200">{due} managed trust item needs rotation attention.</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">{materials.length ? <SecurityMaterialTable items={materials} /> : <EmptyState title="No managed security material" description="Managed credentials, client certificates and CA generations will appear here when Core exposes them." />}</div>
        <Panel title="Machine authorization" subtitle="Shared #770 boundary for all clients.">
          <div className="flex gap-3 p-5 text-sm leading-6 text-slate-400"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />Console does not implement separate RBAC or safety decisions. Actor, operation, policy and target context are enforced by Core.</div>
        </Panel>
      </div>
    </div>
  );
}
