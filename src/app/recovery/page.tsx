import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export default function RecoveryPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Protect</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Backup & recovery</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Recovery operations remain ownership-aware, preflighted and evidenced through BaseHarbor Core.</p>
        </div>
        <Link href="/recovery/restore" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">
          <RotateCcw className="size-4" /> Restore backup
        </Link>
      </div>

      <Panel title="Recovery inventory" subtitle="Verified backups and recovery evidence will appear here.">
        <div className="p-8 text-center text-sm text-slate-500">The Restore wizard is available now; live backup inventory waits for the Core recovery projection.</div>
      </Panel>
    </div>
  );
}
