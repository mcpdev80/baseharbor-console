"use client";

import { ContractPendingButton } from "@/components/ui/contract-pending";
import { WizardCancelButton } from "./cancel-button";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Search, ShieldCheck } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";

const steps: WizardStep[] = [
  { id: "capability", label: "Capability" },
  { id: "scope", label: "Scope" },
  { id: "availability", label: "Availability" },
  { id: "security", label: "Security" },
  { id: "target", label: "Target" },
  { id: "review", label: "Review" },
];

const capabilityOptions = {
  database: ["PostgreSQL"],
  cache: ["Valkey"],
  "object-storage": ["SeaweedFS", "External S3"],
  secrets: ["OpenBao", "External secrets provider"],
} as const;

export function ProviderAddWizard() {
  const [step, setStep] = useState(0);
  const [capability, setCapability] = useState<keyof typeof capabilityOptions>("database");
  const [provider, setProvider] = useState("PostgreSQL");
  const [scope, setScope] = useState("shared");
  const [availability, setAvailability] = useState("single");
  const [target, setTarget] = useState("local");

  const inputClass = "min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";

  const plan = useMemo(() => [
    `+ add provider ${provider}`,
    `+ capability ${capability}`,
    `+ scope ${scope}`,
    `+ availability ${availability}`,
    `+ target ${target}`,
    "+ managed credential lifecycle",
    "+ TLS trust binding",
  ], [provider, capability, scope, availability, target]);

  function changeCapability(value: keyof typeof capabilityOptions) {
    setCapability(value);
    setProvider(capabilityOptions[value][0]);
  }

  return (
    <WizardShell
      title="Add provider"
      description="Choose capability, scope, availability and trust semantics before selecting implementation-specific details."
      steps={steps}
      currentStep={step}
      footer={
        <>
          <button onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs text-slate-400 disabled:opacity-30"><ArrowLeft className="size-3.5" /> Back</button>
          <div className="flex gap-2">
            <WizardCancelButton />
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((v) => Math.min(steps.length - 1, v + 1))} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs font-medium text-white">Continue <ArrowRight className="size-3.5" /></button>
            ) : (
              <>
                <ContractPendingButton issue="#767/#770"><Search className="size-3.5" /> Plan</ContractPendingButton>
                <ContractPendingButton issue="#767/#770"><Play className="size-3.5" /> Add provider</ContractPendingButton>
              </>
            )}
          </div>
        </>
      }
    >
      {step === 0 && (
        <div className="max-w-3xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Capability</h2><p className="mt-1 text-sm text-slate-500">Start from the application/platform capability, not a wall of product logos.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(capabilityOptions) as Array<keyof typeof capabilityOptions>).map((key) => (
              <button key={key} onClick={() => changeCapability(key)} className={`rounded-md border p-4 text-left ${capability === key ? "border-[var(--bh-signal-blue)] bg-[var(--bh-signal-blue)]/[.05]" : "border-[var(--border)]"}`}>
                <div className="text-sm font-medium text-slate-200">{key.replace("-", " ")}</div>
                <div className="mt-1 text-xs text-slate-600">{capabilityOptions[key].join(" / ")}</div>
              </button>
            ))}
          </div>
          <WizardField label="Provider implementation" provenance="eligible implementation">
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass}>
              {capabilityOptions[capability].map((option) => <option key={option}>{option}</option>)}
            </select>
          </WizardField>
        </div>
      )}

      {step === 1 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Scope</h2><p className="mt-1 text-sm text-slate-500">Choose ownership and sharing semantics.</p></div>
          <WizardField label="Provider scope" provenance="semantic choice">
            <select value={scope} onChange={(e) => setScope(e.target.value)} className={inputClass}>
              <option value="shared">Shared managed</option>
              <option value="app-scoped">Application-scoped managed</option>
              <option value="external">External</option>
            </select>
          </WizardField>
          <div className="rounded-md border border-[var(--border)] p-4 text-xs leading-5 text-slate-500">
            {scope === "shared" && "BaseHarbor manages one provider realization and creates isolated application credentials/bindings."}
            {scope === "app-scoped" && "BaseHarbor realizes and owns a provider instance scoped to one application."}
            {scope === "external" && "BaseHarbor binds an externally managed provider and does not own its lifecycle."}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Availability</h2><p className="mt-1 text-sm text-slate-500">Choose the semantic availability goal before low-level topology.</p></div>
          <div className="space-y-3">
            {[
              ["single","Single instance","Suitable for development or non-critical workloads."],
              ["ha","High availability","Use provider-supported HA/failover across eligible placement domains."],
            ].map(([value,title,description]) => (
              <label key={value} className={`flex cursor-pointer gap-3 rounded-md border p-4 ${availability === value ? "border-[var(--bh-signal-blue)] bg-[var(--bh-signal-blue)]/[.04]" : "border-[var(--border)]"}`}>
                <input type="radio" name="availability" value={value} checked={availability === value} onChange={() => setAvailability(value)} />
                <span><span className="block text-sm font-medium text-slate-200">{title}</span><span className="mt-1 block text-xs text-slate-600">{description}</span></span>
              </label>
            ))}
          </div>
          {availability === "ha" && <div className="rounded-md border border-[var(--border)] p-4 text-xs text-slate-500">Topology details will be resolved from provider capability, target eligibility and placement policy. Replica count is not the primary user decision.</div>}
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Security</h2><p className="mt-1 text-sm text-slate-500">Credential and trust lifecycle are part of the provider contract.</p></div>
          <div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
            <div className="flex items-center gap-3 px-4 py-3"><ShieldCheck className="size-4 text-emerald-400" /><span className="text-sm text-slate-200">TLS enabled</span><span className="ml-auto text-[10px] uppercase text-slate-600">required</span></div>
            <div className="flex items-center justify-between px-4 py-3 text-xs"><span className="text-slate-500">Credential lifecycle</span><span className="text-slate-300">managed / rotatable</span></div>
            <div className="flex items-center justify-between px-4 py-3 text-xs"><span className="text-slate-500">CA/client trust</span><span className="text-slate-300">managed binding</span></div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Target</h2><p className="mt-1 text-sm text-slate-500">Only targets eligible for this provider/scope/availability choice should be offered.</p></div>
          <WizardField label="Target" provenance="eligible target">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}><option value="local">local</option><option value="lab">lab</option></select>
          </WizardField>
          <div className="rounded-md border border-[var(--border)] p-4 text-xs text-slate-500">Compatibility preflight: provider supported · storage available · TLS capability available · placement policy satisfied.</div>
        </div>
      )}

      {step === 5 && (
        <div className="max-w-3xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Review effective provider semantics and planned managed changes.</p></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
              {[["Capability",capability],["Provider",provider],["Scope",scope],["Availability",availability],["Target",target]].map(([label,value]) => <div key={label}><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">{label}</div><div className="mt-1 text-sm text-slate-200">{value}</div></div>)}
            </div>
            <div className="rounded-md border border-[var(--border)] p-4">
              <div className="mb-3 text-sm font-medium text-slate-200">Planned changes</div>
              <div className="space-y-2 font-mono text-xs text-emerald-300/80">{plan.map((item) => <div key={item}>{item}</div>)}</div>
            </div>
          </div>
          <div className="flex gap-3 rounded-md border border-[var(--bh-signal-blue)]/20 bg-[var(--bh-signal-blue)]/[.035] p-4 text-xs text-slate-400"><CheckCircle2 className="size-4 shrink-0 text-[var(--bh-signal-blue)]" />No provider-native knobs are required for the primary decision. Advanced topology remains secondary.</div>
        </div>
      )}
    </WizardShell>
  );
}

