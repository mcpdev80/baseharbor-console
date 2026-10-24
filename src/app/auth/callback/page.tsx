"use client";

import { useEffect } from "react";
import { deliverAuthorizationCallback } from "@/lib/baseharbor/oidc-callback";

export default function AuthCallbackPage() {
  useEffect(() => {
    deliverAuthorizationCallback(window);
  }, []);
  return <p className="text-sm text-slate-300">Completing sign-in. You can close this window.</p>;
}
