import { CheckCircle2, LockKeyhole, XCircle } from "lucide-react";
import type { BackupSummary } from "@/lib/baseharbor/types";

function bytes(value?: number) {
  if (value == null) return "—";
  const units=["B","KB","MB","GB","TB"]; let n=value,i=0;
  while(n>=1024&&i<units.length-1){n/=1024;i++;}
  return String(n.toFixed(i>1?1:0))+" "+units[i];
}

export function BackupTable({ backups }: { backups: BackupSummary[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Backup</th><th className="px-4 py-3">Application / Target</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Protection</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{backups.map((backup)=><tr key={backup.id}><td className="px-5 py-4"><div className="font-medium text-slate-200">{backup.id}</div><div className="mt-1 text-xs text-slate-600">{backup.scope}</div></td><td className="px-4 py-4 text-xs text-slate-400">{backup.application} / {backup.target}</td><td className="px-4 py-4 text-xs">{backup.verification==="passed"?<span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="size-3.5" />passed</span>:<span className="inline-flex items-center gap-1 text-rose-300"><XCircle className="size-3.5" />{backup.verification}</span>}</td><td className="px-4 py-4 text-xs text-slate-400">{backup.encrypted?<span className="inline-flex items-center gap-1"><LockKeyhole className="size-3.5" />encrypted</span>:"—"}</td><td className="px-4 py-4 text-xs text-slate-400">{bytes(backup.sizeBytes)}</td><td className="px-4 py-4 text-xs text-slate-500">{new Date(backup.createdAt).toLocaleString("en-GB")}</td></tr>)}</tbody></table></div>;
}
