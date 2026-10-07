"use client";

import { WizardCancelButton } from "./cancel-button";
import { useState } from "react";
import { ArrowLeft, ArrowRight, FolderTree, Target } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";
import { ContractPendingButton } from "@/components/ui/contract-pending";

const steps: WizardStep[] = [
  { id: "identity", label: "Identity" },
  { id: "source", label: "Source" },
  { id: "defaults", label: "Defaults" },
  { id: "review", label: "Review" },
];

export function WorkspaceCreateWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("new-workspace");
  const [path, setPath] = useState("~/work/new-workspace");
  const [repository, setRepository] = useState("new-service");
  const [target, setTarget] = useState("local");
  const input = "min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";

  return (
    <WizardShell
      title="Create workspace"
      description="Create a BaseHarbor development workspace that binds source context and inherited defaults without creating separate Console state."
      steps={steps}
      currentStep={step}
      footer={
        <>
          <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs text-slate-400 disabled:opacity-30">
            <ArrowLeft className="size-3.5" /> Back
          </button>
          <div className="flex gap-2">
            <WizardCancelButton />
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((value) => value + 1)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs text-white">
                Continue <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <ContractPendingButton issue="#767/#770"><FolderTree className="size-3.5" /> Create workspace</ContractPendingButton>
            )}
          </div>
        </>
      }
    >
      {step === 0 && <div className="max-w-2xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Identity</h2><p className="mt-1 text-sm text-slate-500">Define the stable workspace identity and local source root.</p></div>
        <WizardField label="Workspace name"><input value={name} onChange={(event) => setName(event.target.value)} className={input} /></WizardField>
        <WizardField label="Workspace path"><input value={path} onChange={(event) => setPath(event.target.value)} className={input} /></WizardField>
      </div>}

      {step === 1 && <div className="max-w-2xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Source binding</h2><p className="mt-1 text-sm text-slate-500">Bind one registered repository as the initial source context.</p></div>
        <WizardField label="Repository"><select value={repository} onChange={(event) => setRepository(event.target.value)} className={input}><option>new-service</option><option>baseharbor-demo</option><option>platform-tools</option></select></WizardField>
      </div>}

      {step === 2 && <div className="max-w-2xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Inherited defaults</h2><p className="mt-1 text-sm text-slate-500">Workspace defaults remain provenance-aware and do not become portable Application Intent.</p></div>
        <WizardField label="Default target" provenance="workspace default"><select value={target} onChange={(event) => setTarget(event.target.value)} className={input}><option>local</option><option>lab</option></select></WizardField>
        <div className="flex gap-3 rounded-md border border-[var(--border)] p-4 text-xs text-slate-500"><Target className="size-4 shrink-0" />Applications may override the workspace default where policy allows.</div>
      </div>}

      {step === 3 && <div className="max-w-3xl space-y-6">
        <div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Review source binding and effective defaults before workspace creation.</p></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
            {[["Workspace", name],["Path", path],["Repository", repository],["Default target", target]].map(([label,value]) => <div key={label}><div className="text-[10px] uppercase text-slate-600">{label}</div><div className="mt-1 text-sm text-slate-200">{value}</div></div>)}
          </div>
          <div className="rounded-md border border-[var(--border)] p-4 font-mono text-xs">
            <div className="text-emerald-300">+ create workspace identity</div>
            <div className="mt-2 text-emerald-300">+ bind repository source</div>
            <div className="mt-2 text-emerald-300">+ set default target provenance</div>
          </div>
        </div>
      </div>}
    </WizardShell>
  );
}

