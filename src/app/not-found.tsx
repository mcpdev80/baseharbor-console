import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <SearchX className="size-8 text-slate-600" />
      <h1 className="mt-4 text-xl font-semibold text-white">Resource not found</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">The requested BaseHarbor resource is unavailable, was removed, or is outside the current scope.</p>
      <Link href="/" className="mt-5 inline-flex min-h-10 items-center rounded-md border border-[var(--border)] px-4 text-xs text-slate-200 hover:border-[var(--bh-signal-blue)]/35">Return to overview</Link>
    </div>
  );
}
