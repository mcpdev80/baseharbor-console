import { ContractPendingButton } from "@/components/ui/contract-pending";
import { WizardCancelButton } from "./cancel-button";
"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Play, Search } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";

const steps: WizardStep[] = [
  { id: "source", label: "Source" },
  { id: "application", label: "Application" },
  { id: "environment", label: "Environment" },
  { id: "providers", label: "Providers" },
  { id: "observability", label: "Observability" },
  { id: "target", label: "Target" },
  { id: "review", label: "Review" },
];

export function ApplicationInitWizard() {
  const [step, setStep] = useState(0);
  const [repository, setRepository] = useState("~/src/new-service");
  const [name, setName] = useState("new-service");
  const [environment, setEnvironment] = useState("dev");
  const [database, setDatabase] = useState("shared");
  const [observability, setObservability] = useState({ metrics: true, logs: true, traces: true });
  const [target, setTarget] = useState("local");
  const [error, setError] = useState("");

  const reviewChanges = useMemo(() => [
    `+ create application ${name}`,
    `+ bind PostgreSQL (${database})`,
    ...(observability.metrics ? ["+ enable metrics"] : []),
    ...(observability.logs ? ["+ enable logs"] : []),
    ...(observability.traces ? ["+ enable traces"] : []),
    `+ target ${target}`,
  ], [name, database, observability, target]);

  function next() {
    setError("");
    if (step === 0 && !repository.trim()) return setError("Select or enter a repository before continuing.");
    if (step === 1 && !name.trim()) return setError("Application name is required.");
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  const inputClass = "min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";

  return (
    <WizardShell
      title="Create application"
      description="Adopt source and produce a reviewable BaseHarbor plan before anything is mutated."
      steps={steps}
      currentStep={step}
      footer={
        <>
          <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs text-slate-400 disabled:opacity-30">
            <ArrowLeft className="size-3.5" /> Back
          </button>
          <div className="flex gap-2">
            <WizardCancelButton />
            {step < steps.length - 1 ? (
              <button onClick={next} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs font-medium text-white hover:bg-[var(--bh-signal-blue)]">
                Continue <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <>
                <ContractPendingButton issue="#767/#770"><Search className="size-3.5" /> Plan</ContractPendingButton>
                <ContractPendingButton issue="#767/#770"><Play className="size-3.5" /> Apply</ContractPendingButton>
              </>
            )}
          </div>
        </>
      }
    >
      {step === 0 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Source</h2><p className="mt-1 text-sm text-slate-500">Choose the existing source BaseHarbor should inspect and adopt.</p></div>
          <WizardField label="Repository" provenance="detected" error={error} hint="Console registers source context; it does not become a Git server.">
            <input value={repository} onChange={(event) => setRepository(event.target.value)} className={inputClass} aria-invalid={Boolean(error)} />
          </WizardField>
          <div className="rounded-md border border-[var(--border)] bg-white/[.018] p-4 text-sm text-slate-400">
            <div className="font-medium text-slate-200">Inspection preview</div>
            <div className="mt-3 grid gap-2 text-xs">
              <span>✓ Dockerfile detected</span><span>✓ PostgreSQL usage detected</span><span>✓ OTLP configuration detected</span>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Application</h2><p className="mt-1 text-sm text-slate-500">Define the portable BaseHarbor application identity.</p></div>
          <WizardField label="Application name" provenance="recommended" error={error} hint="Derived from the repository name; you can change it.">
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </WizardField>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Environment</h2><p className="mt-1 text-sm text-slate-500">Environment changes security, policy and available target defaults.</p></div>
          <WizardField label="Environment" provenance="workspace default">
            <select value={environment} onChange={(event) => setEnvironment(event.target.value)} className={inputClass}>
              <option value="dev">dev</option><option value="test">test</option><option value="prod">prod</option>
            </select>
          </WizardField>
          {environment === "prod" && <div className="flex gap-3 rounded-md border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.035] p-4 text-xs text-orange-200"><Info className="size-4 shrink-0" />Prod policy will require managed authentication, TLS and eligible production targets.</div>}
        </div>
      )}

      {step === 3 && (
        <div className="max-w-3xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Providers</h2><p className="mt-1 text-sm text-slate-500">Choose capability semantics, scope and availability — not product-native switches.</p></div>
          <div className="rounded-md border border-[var(--border)] p-4">
            <div className="mb-4"><div className="text-sm font-medium text-slate-200">Database</div><div className="mt-1 text-xs text-slate-600">PostgreSQL detected from source inspection.</div></div>
            <WizardField label="PostgreSQL scope" provenance="recommended">
              <select value={database} onChange={(event) => setDatabase(event.target.value)} className={inputClass}>
                <option value="shared">Shared managed PostgreSQL</option>
                <option value="app-scoped">Application-scoped PostgreSQL</option>
                <option value="external">External PostgreSQL</option>
              </select>
            </WizardField>
            <div className="mt-4 rounded-md bg-white/[.018] p-3 text-xs text-slate-500">Availability: Single instance for dev. HA choices become available on eligible test/prod targets.</div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Observability</h2><p className="mt-1 text-sm text-slate-500">Enable provider-neutral signals for this application.</p></div>
          <div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
            {(["metrics","logs","traces"] as const).map((key) => (
              <label key={key} className="flex min-h-14 items-center gap-3 px-4">
                <input type="checkbox" checked={observability[key]} onChange={(event) => setObservability((value) => ({ ...value, [key]: event.target.checked }))} />
                <span className="capitalize text-sm text-slate-200">{key}</span>
                <span className="ml-auto text-xs text-slate-600">recommended</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="max-w-2xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Target</h2><p className="mt-1 text-sm text-slate-500">Choose where this application should be realized. Runtime and access remain separate.</p></div>
          <WizardField label="Target" provenance={environment === "dev" ? "workspace default" : "eligible target"}>
            <select value={target} onChange={(event) => setTarget(event.target.value)} className={inputClass}>
              <option value="local">local — Docker / local access</option>
              <option value="lab">lab — Podman / Node Connector</option>
            </select>
          </WizardField>
          <div className="rounded-md border border-[var(--border)] p-4 text-xs text-slate-500">
            <div className="grid grid-cols-2 gap-3"><span>Connectivity</span><span className="text-emerald-300">✓ reachable</span><span>Runtime capability</span><span className="text-slate-300">{target === "local" ? "Docker + Compose" : "Podman + Compose + Quadlet"}</span></div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="max-w-3xl space-y-6">
          <div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Review effective state and planned BaseHarbor changes before mutation.</p></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
              {[
                ["Application", name],["Environment", environment],["Target", target],["Database", database],["Runtime", target === "local" ? "docker" : "podman"],
              ].map(([label,value]) => <div key={label}><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">{label}</div><div className="mt-1 text-sm text-slate-200">{value}</div></div>)}
            </div>
            <div className="rounded-md border border-[var(--border)] p-4">
              <div className="mb-3 text-sm font-medium text-slate-200">Planned changes</div>
              <div className="space-y-2 font-mono text-xs text-slate-400">{reviewChanges.map((change) => <div key={change} className="text-emerald-300/80">{change}</div>)}</div>
            </div>
          </div>
          <div className="flex gap-3 rounded-md border border-[var(--bh-signal-blue)]/20 bg-[var(--bh-signal-blue)]/[.035] p-4 text-xs text-slate-400">
            <CheckCircle2 className="size-4 shrink-0 text-[var(--bh-signal-blue)]" />
            No destructive changes detected. Apply will create a BaseHarbor machine-operation execution with policy and audit context.
          </div>
        </div>
      )}
    </WizardShell>
  );
}
