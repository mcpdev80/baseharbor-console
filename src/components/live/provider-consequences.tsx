"use client";

import type { ProviderAcknowledgements, ProviderImpactReview } from "@/lib/baseharbor/provider-consent";

export function ProviderConsequences({ review, acknowledgements, disabled, onChange }: {
  review: ProviderImpactReview; acknowledgements: ProviderAcknowledgements; disabled: boolean;
  onChange: (value: ProviderAcknowledgements) => void;
}) {
  const stagesComplete = acknowledgements.first && (review.confirmations === 1 || acknowledgements.second);
  return <fieldset disabled={disabled} aria-label="Provider consequences" className="space-y-3 rounded-md border border-amber-400/30 p-4">
    <legend className="text-sm text-amber-200">Review Core&apos;s provider consequences</legend>
    <p className="text-xs text-slate-300">These acknowledgements apply only to the displayed plan. Unknown effects remain unknown. Nothing runs until you explicitly submit again.</p>
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-black/20 p-3 text-xs">{JSON.stringify(review.details, null, 2)}</pre>
    <label className="flex items-center gap-2 text-sm text-amber-200"><input type="checkbox" checked={acknowledgements.first} onChange={event => onChange({ first: event.target.checked, second: false, deleteData: false })} />I acknowledge provider consequences (1/{review.confirmations}).</label>
    {review.confirmations === 2 && <label className="flex items-center gap-2 text-sm text-amber-200"><input type="checkbox" disabled={!acknowledgements.first} checked={acknowledgements.second} onChange={event => onChange({ ...acknowledgements, second: event.target.checked, deleteData: false })} />I acknowledge provider consequences (2/2).</label>}
    {review.destructive && <label className="flex items-center gap-2 text-sm text-amber-200"><input type="checkbox" disabled={!stagesComplete} checked={acknowledgements.deleteData} onChange={event => onChange({ ...acknowledgements, deleteData: event.target.checked })} />I separately authorize deletion of the displayed owned data.</label>}
  </fieldset>;
}
