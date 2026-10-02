import { ContractPendingButton } from "@/components/ui/contract-pending";
"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Search, ShieldCheck } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";

const steps: WizardStep[] = [
  { id: "identity", label: "Identity" },
  { id: "runtime", label: "Runtime" },
  { id: "access", label: "Access" },
  { id: "security", label: "Security" },
  { id: "review", label: "Review" },
];

export function TargetCreateWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("lab");
  const [environment, setEnvironment] = useState("test");
  const [runtime, setRuntime] = useState("podman");
  const [access, setAccess] = useState("node-connector");
  const [reference, setReference] = useState("lab-node-01");
  const [error, setError] = useState("");

  const inputClass = "min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";

  const changes = useMemo(() => [
    `+ create target ${name}`,
    `+ runtime provider ${runtime}`,
    `+ target access provider ${access}`,
    `+ access reference ${reference || "local"}`,
  ], [name, runtime, access, reference]);

  function next() {
    setError("");
    if (step === 0 && !name.trim()) return setError("Target name is required.");
    if (step === 2 && access !== "local" && !reference.trim()) return setError("Access reference is required for non-local access.");
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  return (
    <WizardShell
      title="Create target"
      description="Define runtime and access independently, then review the effective BaseHarbor target before creation."
      steps={steps}
      currentStep={step}
      footer={
        <>
          <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs text-slate-400 disabled:opacity-30">
            <ArrowLeft className="size-3.5" /> Back
          </button>
          <div className="flex gap-2">
            <button className="min-h-10 rounded-md px-3 text-xs text-slate-500">Cancel</button>
            {step < steps.length - 1 ? (
              <button onClick={next} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs font-medium text-white">
                Continue <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <>
                <ContractPendingButton issue="#767/#770"><Search className="size-3.5" /> Validate</ContractPendingButton>
                <ContractPendingButton issue="#767/#770"><Play className="size-3.5" /> Create target</ContractPendingButton>
              </>
            )}
          </div>
        </>
      }
    >
      {step === 0 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Identity</h2><p className="mt-1 text-sm text-slate-500">Name the deployment context and select its environment class.</p></div>
          <WizardField label="Target name" error={error}><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></WizardField>
          <WizardField label="Environment" provenance="user-selected">
            <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className={inputClass}><option>dev</option><option>test</option><option>prod</option></select>
          </WizardField>
        </div>
      )}

      {step === 1 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Runtime Provider</h2><p className="mt-1 text-sm text-slate-500">Choose how BaseHarbor realizes runtime semantics. This does not define how Core reaches the target.</p></div>
          <WizardField label="Runtime Provider" provenance="capability">
            <select value={runtime} onChange={(e) => setRuntime(e.target.value)} className={inputClass}><option value="docker">Docker</option><option value="podman">Podman</option></select>
          </WizardField>
          <div className="rounded-md border border-[var(--border)] p-4 text-xs text-slate-500">Kubernetes/OpenShift will appear here when their Runtime Provider contracts are available; they do not require a Node Connector by definition.</div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Target Access Provider</h2><p className="mt-1 text-sm text-slate-500">Choose the bounded access path independently from the runtime.</p></div>
          <WizardField label="Access Provider">
            <select value={access} onChange={(e) => { setAccess(e.target.value); if (e.target.value === "local") setReference("local"); }} className={inputClass}>
              <option value="local">Local</option><option value="node-connector">BaseHarbor Node Connector</option>
            </select>
          </WizardField>
          <WizardField label="Access reference" error={error} provenance={access === "local" ? "fixed" : "configured target identity"}>
            <input value={reference} onChange={(e) => setReference(e.target.value)} disabled={access === "local"} className={inputClass} />
          </WizardField>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Security & capability preflight</h2><p className="mt-1 text-sm text-slate-500">Security requirements come from BaseHarbor policy and the selected access provider.</p></div>
          <div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
            <div className="flex items-center gap-3 px-4 py-3"><ShieldCheck className="size-4 text-emerald-400" /><span className="text-sm text-slate-200">{access === "local" ? "Trusted local operator boundary" : "Managed mTLS required"}</span></div>
            <div className="flex items-center justify-between px-4 py-3 text-xs"><span className="text-slate-500">Runtime capability</span><span className="text-slate-300">{runtime === "podman" ? "Compose + Quadlet" : "Compose"}</span></div>
            <div className="flex items-center justify-between px-4 py-3 text-xs"><span className="text-slate-500">Environment policy</span><span className="text-slate-300">{environment}</span></div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-3xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Validate effective runtime/access separation before creating the target.</p></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
              {[["Target",name],["Environment",environment],["Runtime Provider",runtime],["Target Access Provider",access],["Access Reference",reference]].map(([label,value]) => (
                <div key={label}><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">{label}</div><div className="mt-1 text-sm text-slate-200">{value}</div></div>
              ))}
            </div>
            <div className="rounded-md border border-[var(--border)] p-4">
              <div className="mb-3 text-sm font-medium text-slate-200">Planned changes</div>
              <div className="space-y-2 font-mono text-xs text-emerald-300/80">{changes.map((change) => <div key={change}>{change}</div>)}</div>
            </div>
          </div>
          <div className="flex gap-3 rounded-md border border-[var(--bh-signal-blue)]/20 bg-[var(--bh-signal-blue)]/[.035] p-4 text-xs text-slate-400"><CheckCircle2 className="size-4 shrink-0 text-[var(--bh-signal-blue)]" />Runtime Provider and Target Access Provider are explicitly independent in this target definition.</div>
        </div>
      )}
    </WizardShell>
  );
}
