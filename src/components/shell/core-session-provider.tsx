"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { BaseHarborHttpTransport, resolveCoreDestination } from "@/lib/baseharbor/client";
import { MachineSession } from "@/lib/baseharbor/machine-session";
import { beginAuthorization } from "@/lib/baseharbor/oidc";
import type { AuthorizationFlow, MemoryBearer } from "@/lib/baseharbor/oidc";

interface CoreSessionState {
  mode: "preview" | "live";
  showPreview(): void;
  status: "disconnected" | "authenticating" | "connected";
  machine: MachineSession | null;
  error: string | null;
  signIn(): Promise<void>;
  signOut(): void;
}
const CoreSessionContext = createContext<CoreSessionState | null>(null);

export function CoreSessionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"preview" | "live">("preview");
  const [status, setStatus] = useState<CoreSessionState["status"]>("disconnected");
  const [machine, setMachine] = useState<MachineSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  const signOut = useCallback(() => {
    cleanup.current?.(); cleanup.current = null;
    setMachine(null); setStatus("disconnected"); setError(null);
  }, []);
  useEffect(() => () => { cleanup.current?.(); cleanup.current = null; }, []);

  const signIn = useCallback(async () => {
    if (status === "authenticating") return;
    signOut();
    const issuer = process.env.NEXT_PUBLIC_BASEHARBOR_OIDC_ISSUER;
    const clientId = process.env.NEXT_PUBLIC_BASEHARBOR_OIDC_CLIENT_ID;
    if (!issuer || !clientId || window.location.protocol !== "https:") { setError("The Console connection is not configured."); return; }
    const coreOrigin = process.env.NEXT_PUBLIC_BASEHARBOR_API_URL || window.location.origin;
    try { resolveCoreDestination(coreOrigin, window.location.origin); }
    catch { setError("The Console and Core connection must share an HTTPS origin."); return; }
    // Open synchronously from the user's click, before metadata awaits.
    const popup = window.open("about:blank", "baseharbor-operator-login", "popup,width=520,height=720");
    if (!popup) { setError("Allow the sign-in window and try again."); return; }
    setStatus("authenticating"); setError(null);
    const controller = new AbortController();
    let flow: AuthorizationFlow | undefined, bearer: MemoryBearer | undefined, connected: MachineSession | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined, expiry: ReturnType<typeof setTimeout> | undefined, closed: ReturnType<typeof setInterval> | undefined;
    let removeMessage = () => {};
    const stopPopup = () => { if (timeout) clearTimeout(timeout); if (closed) clearInterval(closed); removeMessage(); popup.close(); };
    const stop = () => { controller.abort(); stopPopup(); flow?.close(); bearer?.clear(); connected?.close(); if (expiry) clearTimeout(expiry); };
    cleanup.current = stop;
    try {
      flow = await beginAuthorization({ issuer, clientId, consoleOrigin: window.location.origin }, controller.signal);
      if (controller.signal.aborted) { flow.close(); return; }
      const callback = await new Promise<{ state?: string; code?: string; issuer?: string; error?: string }>((resolve, reject) => {
        const onMessage = (event: MessageEvent<unknown>) => {
          if (event.origin !== window.location.origin || event.source !== popup || !event.data || typeof event.data !== "object") return;
          const value = event.data as Record<string, unknown>;
          if (value.kind !== "baseharbor.oidc-callback") return;
          const fields = ["state", "code", "issuer", "error"] as const;
          if (fields.some(key => value[key] !== undefined && typeof value[key] !== "string")) { reject(new Error("Invalid sign-in callback")); return; }
          const response = Object.fromEntries(fields.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
          stopPopup(); resolve(response);
        };
        window.addEventListener("message", onMessage);
        const onAbort = () => reject(new Error("Sign-in cancelled"));
        controller.signal.addEventListener("abort", onAbort, { once: true });
        removeMessage = () => { window.removeEventListener("message", onMessage); controller.signal.removeEventListener("abort", onAbort); };
        timeout = setTimeout(() => reject(new Error("Sign-in timed out")), 5 * 60 * 1000);
        closed = setInterval(() => { if (popup.closed) reject(new Error("Sign-in window closed")); }, 250);
        popup.location.href = flow!.authorizationUrl;
      });
      bearer = await flow.complete(callback, controller.signal);
      connected = await MachineSession.connect(new BaseHarborHttpTransport(coreOrigin, () => bearer?.accessToken()), coreOrigin, controller.signal);
      if (controller.signal.aborted) { stop(); return; }
      setMachine(connected); setStatus("connected"); setMode("live");
      expiry = setTimeout(() => { stop(); cleanup.current = null; setMachine(null); setStatus("disconnected"); setError("Your session ended. Sign in again."); }, Math.max(0, bearer.expiresAt - Date.now()));
    } catch {
      stop();
      if (cleanup.current === stop) { cleanup.current = null; setMachine(null); setStatus("disconnected"); setError("Sign-in did not complete. Check your connection and try again."); }
    }
  }, [signOut, status]);

  return <CoreSessionContext.Provider value={{ status, machine, error, signIn, signOut, mode, showPreview: () => { signOut(); setMode("preview"); } }}>{children}</CoreSessionContext.Provider>;
}

export function useCoreSession(): CoreSessionState {
  const context = useContext(CoreSessionContext);
  if (!context) throw new Error("Core session provider is required");
  return context;
}
