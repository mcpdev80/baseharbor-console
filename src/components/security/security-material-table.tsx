import { KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";
import type { SecurityMaterialSummary } from "@/lib/baseharbor/types";

function expiryText(item: SecurityMaterialSummary) {
  if (item.expiresAt) return new Date(item.expiresAt).toLocaleDateString("en-GB");
  if (item.lastRotatedAt) return "rotated "+new Date(item.lastRotatedAt).toLocaleDateString("en-GB");
  return "—";
}

export function SecurityMaterialTable({ items }: { items: SecurityMaterialSummary[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Material</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Dependents</th><th className="px-4 py-3">Expiry / rotation</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{items.map((item)=><tr key={item.id}><td className="px-5 py-4"><div className="flex items-center gap-3">{item.kind==="ca"?<ShieldCheck className="size-4 text-slate-500" />:<KeyRound className="size-4 text-slate-500" />}<div><div className="font-medium text-slate-200">{item.subject}</div><div className="mt-1 text-xs text-slate-600">{item.kind} · {item.managed?"managed":"external"}</div></div></div></td><td className="px-4 py-4 text-xs text-slate-400">{item.target ?? "—"}</td><td className="px-4 py-4 text-xs">{item.state==="rotation_due"?<span className="inline-flex items-center gap-1 text-amber-300"><TriangleAlert className="size-3.5" />rotation due</span>:<span className="text-emerald-300">{item.state}</span>}</td><td className="px-4 py-4 text-xs text-slate-400">{item.dependents}</td><td className="px-4 py-4 text-xs text-slate-500">{expiryText(item)}</td></tr>)}</tbody></table></div>;
}
