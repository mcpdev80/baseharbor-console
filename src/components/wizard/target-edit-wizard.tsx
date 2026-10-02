import { ContractPendingButton } from "@/components/ui/contract-pending";
"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Search } from "lucide-react";
import { WizardShell, type WizardStep } from "./wizard-shell";
import { WizardField } from "./field";

const steps: WizardStep[] = [
  {id:"context",label:"Context"},
  {id:"runtime",label:"Runtime"},
  {id:"access",label:"Access"},
  {id:"review",label:"Review"},
];

export function TargetEditWizard() {
  const [step,setStep]=useState(0);
  const [environment,setEnvironment]=useState("test");
  const [runtime,setRuntime]=useState("podman");
  const [access,setAccess]=useState("node-connector");
  const [reference,setReference]=useState("lab-node-01");
  const input="min-h-10 w-full rounded-md border border-[var(--border)] bg-[#0b1323] px-3 text-sm text-slate-200 outline-none focus:border-[var(--bh-signal-blue)] focus:ring-2 focus:ring-[var(--bh-signal-blue)]/25";
  return <WizardShell title="Edit target" description="Change target context while keeping Runtime Provider and Target Access Provider explicitly separate." steps={steps} currentStep={step} footer={<><button onClick={()=>setStep(v=>Math.max(0,v-1))} disabled={step===0} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs text-slate-400 disabled:opacity-30"><ArrowLeft className="size-3.5" /> Back</button><div className="flex gap-2"><button className="min-h-10 px-3 text-xs text-slate-500">Cancel</button>{step<3?<button onClick={()=>setStep(v=>v+1)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--bh-ocean-blue)] px-4 text-xs text-white">Continue <ArrowRight className="size-3.5" /></button>:<><ContractPendingButton issue="#767/#770"><Search className="size-3.5" /> Validate</ContractPendingButton><ContractPendingButton issue="#767/#770"><Play className="size-3.5" /> Apply changes</ContractPendingButton></>}</div></>}>
    {step===0&&<div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Context</h2><p className="mt-1 text-sm text-slate-500">Target identity remains stable while environment/scope changes are reviewed.</p></div><WizardField label="Environment"><select value={environment} onChange={e=>setEnvironment(e.target.value)} className={input}><option>dev</option><option>test</option><option>prod</option></select></WizardField></div>}
    {step===1&&<div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Runtime Provider</h2><p className="mt-1 text-sm text-slate-500">Changing runtime semantics may invalidate existing deployments and requires review.</p></div><WizardField label="Runtime Provider"><select value={runtime} onChange={e=>setRuntime(e.target.value)} className={input}><option value="docker">Docker</option><option value="podman">Podman</option></select></WizardField></div>}
    {step===2&&<div className="max-w-2xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Target Access Provider</h2><p className="mt-1 text-sm text-slate-500">Access may change independently from the runtime implementation.</p></div><WizardField label="Access Provider"><select value={access} onChange={e=>setAccess(e.target.value)} className={input}><option value="local">Local</option><option value="node-connector">BaseHarbor Node Connector</option></select></WizardField><WizardField label="Access reference"><input value={reference} onChange={e=>setReference(e.target.value)} className={input} /></WizardField></div>}
    {step===3&&<div className="max-w-3xl space-y-6"><div><h2 className="text-lg font-semibold text-white">Review</h2><p className="mt-1 text-sm text-slate-500">Review effective changes and impacted contracts.</p></div><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4 rounded-md border border-[var(--border)] p-4">{[["Environment",environment],["Runtime Provider",runtime],["Target Access Provider",access],["Access Reference",reference]].map(([l,v])=><div key={l}><div className="text-[10px] uppercase text-slate-600">{l}</div><div className="mt-1 text-sm text-slate-200">{v}</div></div>)}</div><div className="rounded-md border border-[var(--border)] p-4 font-mono text-xs"><div className="text-amber-300">~ update target definition</div><div className="mt-2 text-amber-300">~ revalidate capabilities and access</div><div className="mt-2 text-emerald-300">+ preserve target identity</div></div></div><div className="flex gap-3 rounded-md border border-[var(--bh-signal-blue)]/20 bg-[var(--bh-signal-blue)]/[.035] p-4 text-xs text-slate-400"><CheckCircle2 className="size-4 shrink-0 text-[var(--bh-signal-blue)]" />Existing deployments will be revalidated against the changed target contract before mutation.</div></div>}
  </WizardShell>;
}
