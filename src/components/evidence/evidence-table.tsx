import { CheckCircle2, FileKey2, ShieldAlert, XCircle } from "lucide-react";
import type { EvidenceEntry } from "@/lib/baseharbor/types";

function Outcome({ value }: { value: EvidenceEntry["outcome"] }) {
  if (value === "passed") return <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="size-3.5" />passed</span>;
  if (value === "failed") return <span className="inline-flex items-center gap-1 text-rose-300"><XCircle className="size-3.5" />failed</span>;
  return <span className="inline-flex items-center gap-1 text-sky-300"><ShieldAlert className="size-3.5" />recorded</span>;
}

export function EvidenceTable({ entries }: { entries: EvidenceEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
          <tr><th className="px-5 py-3">Evidence</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3">Observed</th></tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-white/[.02]">
              <td className="px-5 py-4"><div className="flex gap-3"><FileKey2 className="mt-0.5 size-4 text-slate-600" /><div><div className="text-sm text-slate-200">{entry.summary}</div><div className="mt-1 font-mono text-[10px] text-slate-700">{entry.id} · {entry.category}{entry.operation ? ` · ${entry.operation}` : ""}</div></div></div></td>
              <td className="px-4 py-4 text-xs text-slate-400">{entry.resource}</td>
              <td className="px-4 py-4 text-xs text-slate-400">{entry.actor}</td>
              <td className="px-4 py-4 text-xs"><Outcome value={entry.outcome} /></td>
              <td className="px-4 py-4 text-xs text-slate-500">{new Date(entry.observedAt).toLocaleString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
