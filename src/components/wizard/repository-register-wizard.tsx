"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FolderGit2, Search } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";
import { ContractPendingButton } from "@/components/ui/contract-pending";

const steps: WizardStep[] = [
  { id: "source", label: "Source" },
  { id: "inspect", label: "Inspect" },
  { id: "workspace", label: "Workspace" },
  { id: "review", label: "Review" },
];

export function RepositoryRegisterWizard() {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState("~/src/new-service");
  const [workspace, setWorkspace] = useState("main");
  const input = "min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";

  return (
    <WizardShell
      title="Register repository"
      description="Register existing source context with BaseHarbor without turning Console into Git hosting or a browser IDE."
      steps={steps}
      currentStep={step}
      footer={
        <>
          <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs text-slate-400 disabled:opacity-30">
            <ArrowLeft className="size-3.5" /> Back
          </button>
          <div className="flex gap-2">
            <button className="min-h-10 px-3 text-xs text-slate-500">Cancel</button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((value) => value + 1)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs text-white">
                Continue <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <ContractPendingButton issue="#767/#770"><FolderGit2 className="size-3.5" /> Register repository</ContractPendingButton>
            )}
          </div>
        </>
      }
    >
      {step === 0 && <div className="max-w-2xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Source path</h2><p className="mt-1 text-sm text-slate-500">Choose an existing repository path known to the BaseHarbor host/workspace boundary.</p></div>
        <WizardField label="Repository path" provenance="host source"><input value={path} onChange={(event) => setPath(event.target.value)} className={input} /></WizardField>
      </div>}

      {step === 1 && <div className="max-w-2xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Inspect</h2><p className="mt-1 text-sm text-slate-500">Inspection identifies source metadata and BaseHarbor-relevant capabilities before registration.</p></div>
        <div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
          {["Git repository detected","Branch main","Dockerfile detected","PostgreSQL usage detected"].map((item) => <div key={item} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300"><CheckCircle2 className="size-4 text-emerald-400" />{item}</div>)}
        </div>
        <ContractPendingButton issue="#767"><Search className="size-3.5" /> Re-run inspection</ContractPendingButton>
      </div>}

      {step === 2 && <div className="max-w-2xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Workspace binding</h2><p className="mt-1 text-sm text-slate-500">Optionally bind the repository to an existing BaseHarbor workspace context.</p></div>
        <WizardField label="Workspace" provenance="existing workspace"><select value={workspace} onChange={(event) => setWorkspace(event.target.value)} className={input}><option>main</option><option>lab-work</option><option value="">No workspace binding</option></select></WizardField>
      </div>}

      {step === 3 && <div className="max-w-3xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Registration adds source context only; it does not create an application or deployment.</p></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
            <div><div className="text-[10px] uppercase text-slate-600">Path</div><div className="mt-1 font-mono text-xs text-slate-200">{path}</div></div>
            <div><div className="text-[10px] uppercase text-slate-600">Workspace</div><div className="mt-1 text-sm text-slate-200">{workspace || "none"}</div></div>
          </div>
          <div className="rounded-md border border-[var(--border)] p-4 font-mono text-xs">
            <div className="text-emerald-300">+ register source identity</div>
            <div className="mt-2 text-emerald-300">+ retain inspection metadata</div>
            <div className="mt-2 text-sky-300">= no deployment mutation</div>
          </div>
        </div>
      </div>}
    </WizardShell>
  );
}
