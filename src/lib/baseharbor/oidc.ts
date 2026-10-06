import { IdentityHttpTransport, resolveCoreDestination } from "./client.ts";

export interface OidcConfig { readonly issuer: string; readonly clientId: string; readonly consoleOrigin: string; }
export interface AuthorizationFlow {
  readonly authorizationUrl: string;
  complete(response: { state?: string; code?: string; issuer?: string; error?: string }, signal?: AbortSignal): Promise<MemoryBearer>;
  close(): void;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid OIDC response");
  return value as Record<string, unknown>;
}
function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function nonce(): string { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
function pinnedEndpoint(value: unknown, issuer: string): string {
  if (typeof value !== "string" || value.length > 2048) throw new Error("OIDC endpoint is missing or unbounded");
  const url = resolveCoreDestination(value, issuer);
  if (url.search) throw new Error("OIDC endpoint includes unexpected parameters");
  return url.href;
}

// Opaque access tokens remain in this closure; Core validates their issuer,
// audience, signature, principal and permissions. ID tokens grant no Core access.
export class MemoryBearer {
  private token: string;
  readonly expiresAt: number;

  constructor(token: string, expiresAt: number) {
    this.token = token;
    this.expiresAt = expiresAt;
  }
  accessToken(): string | undefined { return Date.now() < this.expiresAt ? this.token || undefined : undefined; }
  clear(): void { this.token = ""; }
}

// Public browser client: code + S256 PKCE, one issuer, one exact callback,
// one-time state, no client secret and no persistent token/refresh-token storage.
export async function beginAuthorization(config: OidcConfig, signal?: AbortSignal): Promise<AuthorizationFlow> {
  const issuerUrl = resolveCoreDestination(config.issuer, config.issuer);
  if (issuerUrl.search || !config.clientId || config.clientId.length > 256 || /[\x00-\x1f\x7f]/.test(config.clientId)) throw new Error("Invalid OIDC configuration");
  const console = resolveCoreDestination(config.consoleOrigin, config.consoleOrigin);
  if (console.pathname !== "/" || console.search) throw new Error("The configured Console origin is required");
  const redirectUri = new URL("/auth/callback", console.origin).href;
  const transport = new IdentityHttpTransport(config.issuer);
  const metadata = object(await transport.request(config.issuer.replace(/\/$/, "") + "/.well-known/openid-configuration", undefined, signal));
  if (metadata.issuer !== config.issuer || !Array.isArray(metadata.response_types_supported) || !metadata.response_types_supported.includes("code") || !Array.isArray(metadata.code_challenge_methods_supported) || !metadata.code_challenge_methods_supported.includes("S256")) throw new Error("OIDC issuer does not support the required code/PKCE flow");
  const authorizationEndpoint = pinnedEndpoint(metadata.authorization_endpoint, config.issuer);
  const tokenEndpoint = pinnedEndpoint(metadata.token_endpoint, config.issuer);
  let verifier = nonce(), state = nonce();
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const deadline = Date.now() + 5 * 60 * 1000;
  const url = new URL(authorizationEndpoint);
  for (const [key, value] of Object.entries({ response_type: "code", response_mode: "query", client_id: config.clientId, redirect_uri: redirectUri, state, code_challenge: challenge, code_challenge_method: "S256" })) url.searchParams.set(key, value);
  let used = false;
  return {
    authorizationUrl: url.href,
    close() { used = true; verifier = ""; state = ""; },
    async complete(response, signal) {
      if (used || Date.now() >= deadline || response.state !== state || !state) throw new Error("OIDC callback state is invalid or expired");
      if ((metadata.authorization_response_iss_parameter_supported === true && response.issuer !== config.issuer) || (response.issuer !== undefined && response.issuer !== config.issuer)) throw new Error("OIDC callback issuer differs");
      used = true;
      const codeVerifier = verifier;
      verifier = ""; state = "";
      if (response.error || !response.code || response.code.length > 8192 || /[\x00-\x20\x7f]/.test(response.code)) throw new Error("OIDC authorization did not complete");
      const form = new URLSearchParams({ grant_type: "authorization_code", client_id: config.clientId, redirect_uri: redirectUri, code: response.code, code_verifier: codeVerifier });
      const token = object(await transport.request(tokenEndpoint, form, signal));
      if (typeof token.access_token !== "string" || !token.access_token || token.access_token.length > 65536 || /[\x00-\x20\x7f]/.test(token.access_token) || typeof token.token_type !== "string" || token.token_type.toLowerCase() !== "bearer") throw new Error("OIDC did not return a bearer access token");
      if (token.expires_in !== undefined && (typeof token.expires_in !== "number" || !Number.isSafeInteger(token.expires_in) || token.expires_in <= 0)) throw new Error("OIDC token expiry is invalid");
      const seconds = Math.min(typeof token.expires_in === "number" ? token.expires_in : 300, 900);
      return new MemoryBearer(token.access_token, Date.now() + seconds * 1000);
    },
  };
}
