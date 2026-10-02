import Link from "next/link";
import { LockKeyhole, Waypoints } from "lucide-react";
import { baseHarborData } from "@/lib/baseharbor/data";

export default async function PlatformPage() {
  const settings = await baseHarborData.platformSettings();
  return <div className="mx-auto max-w-[1450px] space-y-6">
    <div className="flex items-end justify-between gap-6"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Platform</p><h1 className="text-2xl font-semibold tracking-tight text-white">Organization & platform</h1><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Effective defaults, policy constraints and resolution provenance. Portable Application Intent remains separate.</p></div><Link href="/platform/onboarding" className="inline-flex min-h-10 items-center rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">Platform onboarding</Link></div>
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]"><div className="divide-y divide-[var(--border)]">{settings.map((setting)=><div key={setting.key} className="grid gap-3 px-5 py-4 md:grid-cols-[280px_1fr_160px]"><div><div className="font-mono text-xs text-slate-300">{setting.key}</div><div className="mt-1 text-xs text-slate-600">{setting.description}</div></div><div className="text-sm text-slate-200">{setting.value}</div><div className="flex items-center gap-2 text-xs text-slate-500">{setting.locked?<LockKeyhole className="size-3.5 text-amber-300" />:<Waypoints className="size-3.5" />}{setting.source}</div></div>)}</div></div>
  </div>;
}
