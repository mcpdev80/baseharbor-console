"use client";

import type { ReactNode } from "react";
import { Check, Circle } from "lucide-react";

export interface WizardStep {
  id: string;
  label: string;
}

export function WizardShell({
  title,
  description,
  steps,
  currentStep,
  children,
  footer,
}: {
  title: string;
  description: string;
  steps: WizardStep[];
  currentStep: number;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1250px]">
      <div className="mb-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--bh-signal-blue)]">Guided workflow</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <nav aria-label="Wizard progress">
          <ol className="space-y-1">
            {steps.map((step, index) => {
              const complete = index < currentStep;
              const active = index === currentStep;
              return (
                <li key={step.id}>
                  <div
                    aria-current={active ? "step" : undefined}
                    className={[
                      "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
                      active ? "bg-[var(--bh-signal-blue)]/10 text-white" : "text-slate-500",
                    ].join(" ")}
                  >
                    <span className={[
                      "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                      complete ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" :
                      active ? "border-[var(--bh-signal-blue)]/40 bg-[var(--bh-signal-blue)]/10 text-sky-200" :
                      "border-[var(--border)] text-slate-600",
                    ].join(" ")}>
                      {complete ? <Check className="size-3" /> : active ? <Circle className="size-2 fill-current" /> : index + 1}
                    </span>
                    <span>{step.label}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
          <div className="min-h-[460px] p-6">{children}</div>
          <div className="flex items-center justify-between border-t border-[var(--border)] bg-white/[.012] px-6 py-4">
            {footer}
          </div>
        </section>
      </div>
    </div>
  );
}
