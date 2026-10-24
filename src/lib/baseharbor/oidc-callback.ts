interface CallbackWindow {
  readonly location: { readonly search: string; readonly hash: string; readonly pathname: string; readonly protocol: string; readonly origin: string };
  readonly history: { replaceState(data: unknown, unused: string, url: string): void };
  readonly opener: { postMessage(message: unknown, targetOrigin: string): void } | null;
}

// The opener validates the exact message origin/source, state and issuer before
// exchanging the one-time PKCE code. It alone closes this popup after receiving
// the queued callback; self-closing can race its user-cancellation observer.
export function deliverAuthorizationCallback(popup: CallbackWindow): void {
  const params = new URLSearchParams(popup.location.search);
  const allowed = ["code", "state", "iss", "error"];
  const invalid = allowed.some(key => params.getAll(key).length > 1) || Boolean(popup.location.hash) || params.has("access_token") || params.has("id_token");
  const response = { kind: "baseharbor.oidc-callback", code: params.get("code") ?? undefined, state: params.get("state") ?? undefined,
    issuer: params.get("iss") ?? undefined, error: invalid ? "invalid_response" : params.get("error") ?? undefined };
  popup.history.replaceState(null, "", popup.location.pathname);
  if (popup.opener && popup.location.protocol === "https:") {
    popup.opener.postMessage(response, popup.location.origin);
  }
}
