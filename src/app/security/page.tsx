import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Protect</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Security & access</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Machine authorization, credentials, certificates, trust and target access remain enforced by BaseHarbor Core.</p>
        </div>
        <Link href="/security/rotate" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">
          <KeyRound className="size-4" /> Rotate credentials / trust
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Machine authorization" subtitle="Shared #770 boundary for CLI, MCP, HTTP and Console.">
          <div className="flex gap-3 p-5 text-sm text-slate-400"><ShieldCheck className="size-4 shrink-0 text-emerald-400" />Console does not implement separate RBAC or safety decisions.</div>
        </Panel>
        <Panel title="Credential & trust lifecycle" subtitle="Password, credential, CA and client-certificate rotation.">
          <div className="p-5 text-sm text-slate-500">Guided rotation is available now as a contract-shaped workflow; live execution binds to BaseHarbor Core.</div>
        </Panel>
      </div>
    </div>
  );
}
