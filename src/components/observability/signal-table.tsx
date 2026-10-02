import type { ObservabilitySignal } from "@/lib/baseharbor/types";
import { HealthBadge } from "@/components/ui/badge";

export function SignalTable({ signals }: { signals: ObservabilitySignal[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500">
          <tr><th className="px-5 py-3">Subject</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Metrics</th><th className="px-4 py-3">Logs</th><th className="px-4 py-3">Traces</th><th className="px-4 py-3">OTLP</th><th className="px-4 py-3">Last seen</th></tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {signals.map((signal) => (
            <tr key={signal.id} className="hover:bg-white/[.02]">
              <td className="px-5 py-4 font-medium text-slate-200">{signal.subject}</td>
              <td className="px-4 py-4 text-xs text-slate-400">{signal.target}</td>
              <td className="px-4 py-4"><HealthBadge value={signal.metrics} /></td>
              <td className="px-4 py-4"><HealthBadge value={signal.logs} /></td>
              <td className="px-4 py-4"><HealthBadge value={signal.traces} /></td>
              <td className="px-4 py-4"><HealthBadge value={signal.otlp} /></td>
              <td className="px-4 py-4 text-xs text-slate-500">{new Date(signal.lastSeen).toLocaleTimeString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
