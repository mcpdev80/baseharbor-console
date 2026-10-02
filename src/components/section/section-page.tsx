import { Construction } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export function SectionPage({
  eyebrow,
  title,
  description,
  capabilities,
}: {
  eyebrow: string;
  title: string;
  description: string;
  capabilities: string[];
}) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      <Panel title="Planned Console surface" subtitle="UI structure is ready; behavior will bind to the shared BaseHarbor machine/HTTP contracts.">
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((capability) => (
            <div key={capability} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white/[.018] p-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--bh-signal-blue)]/10 text-[var(--bh-signal-blue)]">
                <Construction className="size-4" />
              </div>
              <span className="text-sm text-slate-300">{capability}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
