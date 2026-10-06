import type { BaseHarborProblem } from "./types";

export class BaseHarborApiError extends Error {
  readonly status: number;
  readonly problem?: BaseHarborProblem | unknown;

  constructor(message: string, status: number, problem?: unknown) {
    super(message);
    this.name = "BaseHarborApiError";
    this.status = status;
    this.problem = problem;
  }
}

export interface HttpRequestDescriptor {
  href: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type TokenProvider = () => string | undefined | Promise<string | undefined>;
export type WireDecoder<T> = (value: unknown) => T;

async function boundedJson(response: Response, maxBytes: number): Promise<unknown> {
  if (!response.body) throw new Error("HTTPS response has no JSON body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0, text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) return JSON.parse(text + decoder.decode());
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) throw new Error("HTTPS JSON response exceeds its bound");
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

// Bind credentials to one configured HTTPS origin before reading any token.
export function resolveCoreDestination(href: string, base: string): URL {
  const origin = new URL(base);
  const destination = new URL(href, origin);
  for (const candidate of [origin, destination]) {
    if (candidate.protocol !== "https:" || candidate.username || candidate.password || candidate.hash) {
      throw new Error("BaseHarbor requires a credential-free HTTPS destination");
    }
    for (const key of candidate.searchParams.keys()) {
      if (/token|secret|password|credential|authorization/i.test(key)) {
        throw new Error("BaseHarbor credentials cannot be sent in URL parameters");
      }
    }
  }
  if (destination.origin !== origin.origin) {
    throw new Error("BaseHarbor destination differs from the configured Core origin");
  }
  return destination;
}

// Memory-only bearer authentication; no assumed cookie authentication.
export class BaseHarborHttpTransport {
  private readonly baseUrl: string;
  private readonly tokenProvider?: TokenProvider;

  constructor(baseUrl = process.env.NEXT_PUBLIC_BASEHARBOR_API_URL ?? "", tokenProvider?: TokenProvider) {
    this.baseUrl = baseUrl;
    this.tokenProvider = tokenProvider;
  }

  async open(descriptor: HttpRequestDescriptor): Promise<Response> {
    const base = this.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    if (!base) throw new Error("The configured HTTPS Core origin is required");
    const destination = resolveCoreDestination(descriptor.href, base);
    const headers = new Headers(descriptor.headers);
    for (const forbidden of ["Authorization", "Cookie", "Proxy-Authorization", "Host"]) {
      if (headers.has(forbidden)) throw new Error("Request descriptors cannot override transport credentials");
    }
    const token = await this.tokenProvider?.();
    if (!token || /[\s\x00-\x1f\x7f]/.test(token)) {
      throw new BaseHarborApiError("Authenticate with the configured Core identity provider", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (descriptor.body !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(destination, {
      method: descriptor.method ?? "GET",
      body: descriptor.body === undefined ? undefined : JSON.stringify(descriptor.body),
      credentials: "omit",
      redirect: "error",
      headers,
      cache: "no-store",
      signal: descriptor.signal,
    });
    if (response.redirected || (response.url && new URL(response.url).origin !== destination.origin)) {
      await response.body?.cancel();
      throw new Error("BaseHarbor rejected a redirected response");
    }
    if (!response.ok) {
      let detail: unknown;
      try { detail = await boundedJson(response, 64 * 1024); } catch { detail = undefined; }
      throw new BaseHarborApiError(`BaseHarbor HTTP request failed: ${response.status}`, response.status, detail);
    }
    return response;
  }

  async request<T>(descriptor: HttpRequestDescriptor, decode: WireDecoder<T>): Promise<T> {
    const response = await this.open(descriptor);
    const value: unknown = response.status === 204 ? undefined : await boundedJson(response, 4 * 1024 * 1024);
    return decode(value);
  }
}

export const baseHarborHttpTransport = new BaseHarborHttpTransport();

// Identity-provider discovery and code exchange carry no Core credential.
// Both endpoints are pinned to the separately configured HTTPS issuer authority.
export class IdentityHttpTransport {
  private readonly issuer: string;

  constructor(issuer: string) {
    const url = resolveCoreDestination(issuer, issuer);
    if (url.search) throw new Error("OIDC issuer cannot contain query parameters");
    this.issuer = issuer;
  }

  async request(href: string, form?: URLSearchParams, signal?: AbortSignal): Promise<unknown> {
    const destination = resolveCoreDestination(href, this.issuer);
    if (destination.search) throw new Error("OIDC endpoint cannot contain query parameters");
    const response = await fetch(destination, {
      method: form ? "POST" : "GET", credentials: "omit", redirect: "error", cache: "no-store", signal,
      headers: form ? { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" } : { Accept: "application/json" },
      body: form?.toString(),
    });
    if (response.redirected || (response.url && new URL(response.url).origin !== destination.origin)) {
      await response.body?.cancel();
      throw new Error("OIDC response redirected outside the pinned endpoint");
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error("OIDC HTTPS request failed"); }
    return boundedJson(response, 256 * 1024);
  }
}
