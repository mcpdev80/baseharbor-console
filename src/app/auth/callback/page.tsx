"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const allowed = ["code", "state", "iss", "error"];
    const invalid = allowed.some(key => params.getAll(key).length > 1) || Boolean(window.location.hash) || params.has("access_token") || params.has("id_token");
    const response = { kind: "baseharbor.oidc-callback", code: params.get("code") ?? undefined, state: params.get("state") ?? undefined, issuer: params.get("iss") ?? undefined, error: invalid ? "invalid_response" : params.get("error") ?? undefined };
    window.history.replaceState(null, "", window.location.pathname);
    if (window.opener && window.location.protocol === "https:") {
      window.opener.postMessage(response, window.location.origin);
      window.close();
    }
  }, []);
  return <p className="text-sm text-slate-300">Completing sign-in. You can close this window.</p>;
}
