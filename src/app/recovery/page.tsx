import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { BackupTable } from "@/components/recovery/backup-table";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function RecoveryPage() {
  const backups = await baseHarborData.backups();
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Protect</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Backup & recovery</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Verified backups and ownership-aware restore operations through BaseHarbor Core.</p>
        </div>
        <Link href="/recovery/restore" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">
          <RotateCcw className="size-4" /> Restore backup
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]"><BackupTable backups={backups} /></div>
    </div>
  );
}
