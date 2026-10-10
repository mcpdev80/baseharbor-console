"use client";

import { useCoreSession } from "./core-session-provider";

export function OperatorSession() {
  const { status, error, signIn, signOut } = useCoreSession();
  return <div className="relative flex items-center gap-2">
    <button type="button" onClick={status === "disconnected" ? () => void signIn() : signOut} className="min-h-10 rounded-md border border-[var(--border)] px-3 text-xs text-slate-200 hover:bg-white/[.04]">
      {status === "connected" ? "Sign out" : status === "authenticating" ? "Cancel sign-in" : "Sign in"}
    </button>
    {error && <p role="alert" className="absolute right-0 top-12 z-30 w-72 rounded-md border border-[var(--border)] bg-[var(--bh-harbor-navy)] p-3 text-xs text-amber-200">{error}</p>}
  </div>;
}
