import { ContractPendingButton } from "@/components/ui/contract-pending";
"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Search, TriangleAlert } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";

const steps: WizardStep[] = [
  {id:"source",label:"Current provider"},
  {id:"replacement",label:"Replacement"},
  {id:"bindings",label:"Bindings"},
  {id:"cutover",label:"Cutover"},
  {id:"review",label:"Review"},
  {id:"replace",label:"Replace"},
  {id:"verify",label:"Verify"},
];

export function ProviderReplaceWizard() {
  const [step,setStep]=useState(0);
  const [current,setCurrent]=useState("SeaweedFS");
  const [replacement,setReplacement]=useState("External S3");
  const [cutover,setCutover]=useState("verify-first");
  const input="min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";
  return <WizardShell title="Replace provider" description="Replace a capability provider while preserving application intent, bindings and recovery semantics." steps={steps} currentStep={step} footer={<><button onClick={()=>setStep(v=>Math.max(0,v-1))} disabled={step===0} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs text-slate-400 disabled:opacity-30"><ArrowLeft className="size-3.5" /> Back</button><div className="flex gap-2"><button className="min-h-10 px-3 text-xs text-slate-500">Cancel</button>{step<4&&<button onClick={()=>setStep(v=>v+1)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs text-white">Continue <ArrowRight className="size-3.5" /></button>}{step===4&&<><ContractPendingButton issue="#767/#770"><Search className="size-3.5" /> Plan</ContractPendingButton><button onClick={()=>setStep(5)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-harbor-orange)] px-4 text-xs text-white"><Play className="size-3.5" /> Preview provider replacement</button></>}{step===5&&<button onClick={()=>setStep(6)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs text-white">Verify <ArrowRight className="size-3.5" /></button>}</div></>}>
    {step===0&&<div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Current provider</h2><p className="mt-1 text-sm text-slate-500">Select the managed or external binding to replace.</p></div><WizardField label="Current provider"><select value={current} onChange={e=>setCurrent(e.target.value)} className={input}><option>SeaweedFS</option><option>PostgreSQL</option><option>Valkey</option></select></WizardField></div>}
    {step===1&&<div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Replacement</h2><p className="mt-1 text-sm text-slate-500">Choose another implementation that satisfies the same capability contract.</p></div><WizardField label="Replacement provider"><select value={replacement} onChange={e=>setReplacement(e.target.value)} className={input}><option>External S3</option><option>SeaweedFS</option></select></WizardField></div>}
    {step===2&&<div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Bindings</h2><p className="mt-1 text-sm text-slate-500">Review applications, credentials and trust relationships that must be rebound.</p></div><div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">{["platform-tools","backup/recovery integration","observability integration"].map(v=><div key={v} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300"><CheckCircle2 className="size-4 text-emerald-400" />{v}</div>)}</div></div>}
    {step===3&&<div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Cutover</h2><p className="mt-1 text-sm text-slate-500">Do not retire the old provider until the replacement is verified.</p></div><WizardField label="Cutover strategy"><select value={cutover} onChange={e=>setCutover(e.target.value)} className={input}><option value="verify-first">Verify replacement before retirement</option><option value="maintenance">Maintenance-window cutover</option></select></WizardField></div>}
    {step===4&&<div className="max-w-3xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Review replacement, rebinding and old-provider retirement.</p></div><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4 rounded-md border border-[var(--border)] p-4">{[["Current",current],["Replacement",replacement],["Cutover",cutover]].map(([l,v])=><div key={l}><div className="text-[10px] uppercase text-slate-600">{l}</div><div className="mt-1 text-sm text-slate-200">{v}</div></div>)}</div><div className="rounded-md border border-[var(--border)] p-4 font-mono text-xs"><div className="text-emerald-300">+ provision/bind replacement</div><div className="mt-2 text-amber-300">~ rotate credentials/trust</div><div className="mt-2 text-amber-300">~ verify dependents</div><div className="mt-2 text-rose-300">- retire old provider after cutover</div></div></div><div className="flex gap-3 rounded-md border border-[var(--bh-harbor-orange)]/25 bg-[var(--bh-harbor-orange)]/[.035] p-4 text-xs text-orange-200"><TriangleAlert className="size-4 shrink-0" />Data migration semantics are capability/provider-specific and must be part of the Core plan before replacement can execute.</div></div>}
    {step===5&&<div className="flex min-h-[360px] flex-col items-center justify-center text-center"><Play className="size-8 text-[var(--bh-signal-blue)]" /><h2 className="mt-4 text-lg font-semibold text-white">Replacement execution</h2><p className="mt-2 max-w-xl text-sm text-slate-500">BaseHarbor will provision or bind the replacement, rebind dependents and cut over according to the reviewed plan.</p></div>}
    {step===6&&<div className="flex min-h-[360px] flex-col items-center justify-center text-center"><CheckCircle2 className="size-8 text-emerald-400" /><h2 className="mt-4 text-lg font-semibold text-white">Verification</h2><p className="mt-2 max-w-xl text-sm text-slate-500">Replacement healthy, dependents verified and old provider retired according to policy.</p></div>}
  </WizardShell>;
}
