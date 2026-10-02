import { ContractPendingButton } from "@/components/ui/contract-pending";
import { WizardCancelButton } from "./cancel-button";
"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Search, TriangleAlert } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";

const steps: WizardStep[] = [
  { id: "backup", label: "Backup" },
  { id: "destination", label: "Destination" },
  { id: "scope", label: "Restore scope" },
  { id: "conflicts", label: "Conflicts" },
  { id: "preflight", label: "Preflight" },
  { id: "review", label: "Review" },
  { id: "restore", label: "Restore" },
  { id: "verify", label: "Verification" },
];

export function RestoreWizard() {
  const [step, setStep] = useState(0);
  const [backup, setBackup] = useState("backup-demo-2026-10-02");
  const [destination, setDestination] = useState("local");
  const [scope, setScope] = useState("application");
  const [conflict, setConflict] = useState("replace-managed");

  const inputClass = "min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";

  return (
    <WizardShell
      title="Restore backup"
      description="Preflight destination, conflicts and security implications before any restore mutation."
      steps={steps}
      currentStep={step}
      footer={
        <>
          <button onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs text-slate-400 disabled:opacity-30"><ArrowLeft className="size-3.5" /> Back</button>
          <div className="flex gap-2">
            <WizardCancelButton />
            {step < 5 && <button onClick={() => setStep((v) => v + 1)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs font-medium text-white">Continue <ArrowRight className="size-3.5" /></button>}
            {step === 5 && <>
              <ContractPendingButton issue="#767"><Search className="size-3.5" /> Re-run preflight</ContractPendingButton>
              <button onClick={() => setStep(6)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-harbor-orange)] px-4 text-xs font-medium text-white"><Play className="size-3.5" /> Preview restore execution</button>
            </>}
            {step === 6 && <button onClick={() => setStep(7)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs font-medium text-white">View verification <ArrowRight className="size-3.5" /></button>}
          </div>
        </>
      }
    >
      {step === 0 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Backup</h2><p className="mt-1 text-sm text-slate-500">Select a verified BaseHarbor backup and inspect its source identity.</p></div><WizardField label="Backup" provenance="verified"><select value={backup} onChange={(e)=>setBackup(e.target.value)} className={inputClass}><option>backup-demo-2026-10-02</option><option>backup-demo-2026-10-01</option></select></WizardField><div className="rounded-md border border-[var(--border)] p-4 text-xs text-slate-500">Application demo · source target local · verification passed · recovery evidence available</div></div>}

      {step === 1 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Destination</h2><p className="mt-1 text-sm text-slate-500">Choose the target where restored state will be reconciled.</p></div><WizardField label="Destination target" provenance="eligible target"><select value={destination} onChange={(e)=>setDestination(e.target.value)} className={inputClass}><option value="local">local</option><option value="lab">lab</option></select></WizardField></div>}

      {step === 2 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Restore scope</h2><p className="mt-1 text-sm text-slate-500">Restore only the state required for this recovery goal.</p></div><WizardField label="Scope"><select value={scope} onChange={(e)=>setScope(e.target.value)} className={inputClass}><option value="application">Application + managed provider data</option><option value="providers">Managed provider data only</option><option value="configuration">Configuration only</option></select></WizardField></div>}

      {step === 3 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Conflict handling</h2><p className="mt-1 text-sm text-slate-500">Define what should happen when managed resources already exist.</p></div><WizardField label="Managed resource conflicts"><select value={conflict} onChange={(e)=>setConflict(e.target.value)} className={inputClass}><option value="replace-managed">Replace resources owned by this deployment</option><option value="fail">Fail if conflicts exist</option></select></WizardField><div className="flex gap-3 rounded-md border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.035] p-4 text-xs text-orange-200"><TriangleAlert className="size-4 shrink-0" />Unmanaged/external resources are never silently overwritten.</div></div>}

      {step === 4 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Preflight</h2><p className="mt-1 text-sm text-slate-500">Predictable restore failures should surface before mutation.</p></div><div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">{["Backup verification valid","Destination reachable","Provider versions compatible","Storage capacity sufficient","Credential/trust restore strategy valid"].map((item)=><div key={item} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300"><CheckCircle2 className="size-4 text-emerald-400" />{item}</div>)}</div></div>}

      {step === 5 && <div className="max-w-3xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Review what is overwritten, preserved and verified after restore.</p></div><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4 rounded-md border border-[var(--border)] p-4">{[["Backup",backup],["Destination",destination],["Scope",scope],["Conflict policy",conflict],["Expected downtime","application restart required"]].map(([l,v])=><div key={l}><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">{l}</div><div className="mt-1 text-sm text-slate-200">{v}</div></div>)}</div><div className="rounded-md border border-[var(--border)] p-4"><div className="mb-3 text-sm font-medium text-slate-200">Plan</div><div className="space-y-2 font-mono text-xs"><div className="text-amber-300">~ stop managed workload</div><div className="text-amber-300">~ replace managed provider data</div><div className="text-emerald-300">+ restore application state</div><div className="text-emerald-300">+ re-verify readiness and trust</div></div></div></div></div>}

      {step === 6 && <div className="flex min-h-[360px] max-w-2xl flex-col items-center justify-center text-center"><Play className="size-7 text-[var(--bh-signal-blue)]" /><h2 className="mt-4 text-lg font-semibold text-white">Restore execution</h2><p className="mt-2 text-sm text-slate-500">A real BaseHarbor execution will stream semantic progress, preserve its execution identity and remain recoverable on failure.</p><div className="mt-6 h-1.5 w-full max-w-md rounded-full bg-white/[.04]"><div className="h-full w-2/3 rounded-full bg-[var(--bh-signal-blue)]" /></div></div>}

      {step === 7 && <div className="flex min-h-[360px] max-w-2xl flex-col items-center justify-center text-center"><CheckCircle2 className="size-8 text-emerald-400" /><h2 className="mt-4 text-lg font-semibold text-white">Verification</h2><p className="mt-2 text-sm text-slate-500">Restore complete. Application readiness, provider data, credentials/trust and recovery evidence must be verified before completion is declared.</p><div className="mt-6 rounded-md border border-[var(--border)] p-4 text-left text-xs text-slate-400">✓ application READY<br/>✓ provider verification passed<br/>✓ trust/credential checks passed<br/>✓ restore evidence recorded</div></div>}
    </WizardShell>
  );
}
