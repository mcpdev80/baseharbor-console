export default function Loading() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-white/[.06]" />
        <div className="h-7 w-56 animate-pulse rounded bg-white/[.06]" />
        <div className="h-4 w-[min(520px,80%)] animate-pulse rounded bg-white/[.04]" />
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
        {[0,1,2,3,4].map((row) => (
          <div key={row} className="grid grid-cols-[1.2fr_.8fr_.6fr] gap-6 border-b border-[var(--border)] px-5 py-4 last:border-b-0">
            <div className="h-4 animate-pulse rounded bg-white/[.05]" />
            <div className="h-4 animate-pulse rounded bg-white/[.04]" />
            <div className="h-4 animate-pulse rounded bg-white/[.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
