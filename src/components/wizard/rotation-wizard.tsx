"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Play, ShieldCheck, TriangleAlert } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";

const steps: WizardStep[] = [
  { id: "scope", label: "Scope" },
  { id: "material", label: "New material" },
  { id: "dependents", label: "Dependents" },
  { id: "cutover", label: "Cutover" },
  { id: "review", label: "Review" },
  { id: "rotate", label: "Rotate" },
  { id: "verify", label: "Verify" },
];

export function RotationWizard() {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState("credential");
  const [resource, setResource] = useState("shared-postgresql");
  const [strategy, setStrategy] = useState("overlap");
  const inputClass = "min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";

  return (
    <WizardShell
      title="Rotate trust or credentials"
      description="Rotate passwords, credentials, CAs or client certificates with explicit dependents, cutover and verification."
      steps={steps}
      currentStep={step}
      footer={
        <>
          <button onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs text-slate-400 disabled:opacity-30"><ArrowLeft className="size-3.5" /> Back</button>
          <div className="flex gap-2">
            <button className="min-h-10 rounded-md px-3 text-xs text-slate-500">Cancel</button>
            {step < 4 && <button onClick={() => setStep((v) => v + 1)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs font-medium text-white">Continue <ArrowRight className="size-3.5" /></button>}
            {step === 4 && <button onClick={() => setStep(5)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-harbor-orange)] px-4 text-xs font-medium text-white"><Play className="size-3.5" /> Preview rotation<//button>}
            {step === 5 && <button onClick={() => setStep(6)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs font-medium text-white">Verify <ArrowRight className="size-3.5" /></button>}
          </div>
        </>
      }
    >
      {step === 0 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Scope</h2><p className="mt-1 text-sm text-slate-500">Choose exactly which managed identity/trust material is being rotated.</p></div><WizardField label="Rotation type"><select value={kind} onChange={(e)=>setKind(e.target.value)} className={inputClass}><option value="credential">Password / credential</option><option value="client-cert">Client certificate</option><option value="ca">Certificate authority</option></select></WizardField><WizardField label="Resource"><select value={resource} onChange={(e)=>setResource(e.target.value)} className={inputClass}><option>shared-postgresql</option><option>openbao</option><option>keycloak</option><option>seaweedfs</option></select></WizardField></div>}

      {step === 1 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">New material</h2><p className="mt-1 text-sm text-slate-500">BaseHarbor generates or receives the replacement through the authoritative secret/trust boundary.</p></div><div className="flex gap-3 rounded-md border border-[var(--border)] p-4"><KeyRound className="size-4 text-[var(--bh-signal-blue)]" /><div><div className="text-sm text-slate-200">{kind === "credential" ? "Generate new managed credential" : kind === "client-cert" ? "Issue replacement client certificate" : "Create replacement CA generation"}</div><div className="mt-1 text-xs leading-5 text-slate-600">Secret/private material is never persisted in browser draft state and is not revealed again unless Core explicitly exposes a secure reveal operation.</div></div></div></div>}

      {step === 2 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Dependents</h2><p className="mt-1 text-sm text-slate-500">Review every application, provider and client that must accept the new material.</p></div><div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">{["demo / api","platform-tools / worker","pgAdmin management access"].map((item)=><div key={item} className="flex items-center justify-between px-4 py-3"><span className="text-sm text-slate-300">{item}</span><span className="text-[10px] text-emerald-300">eligible</span></div>)}</div></div>}

      {step === 3 && <div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Cutover strategy</h2><p className="mt-1 text-sm text-slate-500">Choose how old and new material overlap during transition.</p></div><WizardField label="Cutover"><select value={strategy} onChange={(e)=>setStrategy(e.target.value)} className={inputClass}><option value="overlap">Overlap old/new until dependents verify</option><option value="immediate">Immediate cutover after coordinated reload</option></select></WizardField>{kind === "ca" && <div className="flex gap-3 rounded-md border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.035] p-4 text-xs text-orange-200"><TriangleAlert className="size-4 shrink-0" />CA rotation may require a trust-overlap window. Revoking the old CA before all dependents accept the new chain can cause an outage.</div>}</div>}

      {step === 4 && <div className="max-w-3xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Confirm cutover, dependents and old-material retirement before mutation.</p></div><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4 rounded-md border border-[var(--border)] p-4">{[["Type",kind],["Resource",resource],["Dependents","3"],["Cutover",strategy],["Old material","retire after verification"]].map(([l,v])=><div key={l}><div className="text-[10px] uppercase tracking-[.12em] text-slate-600">{l}</div><div className="mt-1 text-sm text-slate-200">{v}</div></div>)}</div><div className="rounded-md border border-[var(--border)] p-4"><div className="mb-3 text-sm font-medium text-slate-200">Plan</div><div className="space-y-2 font-mono text-xs"><div className="text-emerald-300">+ issue replacement material</div><div className="text-amber-300">~ update dependents</div><div className="text-amber-300">~ verify reload/readiness</div><div className="text-rose-300">- revoke old material after verification</div></div></div></div></div>}

      {step === 5 && <div className="flex min-h-[360px] max-w-2xl flex-col items-center justify-center text-center"><ShieldCheck className="size-8 text-[var(--bh-signal-blue)]" /><h2 className="mt-4 text-lg font-semibold text-white">Rotation execution</h2><p className="mt-2 text-sm text-slate-500">Core will issue new material, rebind/reload dependents and keep the execution auditable. Old material is not retired until the selected cutover contract permits it.</p></div>}

      {step === 6 && <div className="flex min-h-[360px] max-w-2xl flex-col items-center justify-center text-center"><CheckCircle2 className="size-8 text-emerald-400" /><h2 className="mt-4 text-lg font-semibold text-white">Verification</h2><p className="mt-2 text-sm text-slate-500">All dependents accepted replacement material and readiness checks passed. Revocation/retirement can now complete according to policy.</p><div className="mt-6 rounded-md border border-[var(--border)] p-4 text-left text-xs text-slate-400">✓ replacement active<br/>✓ dependent reloads verified<br/>✓ readiness healthy<br/>✓ old material retired/revoked<br/>✓ evidence recorded</div></div>}
    </WizardShell>
  );
}
