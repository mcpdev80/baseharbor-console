import type { BaseHarborProblem } from "./types";

export class BaseHarborApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem?: BaseHarborProblem | unknown,
  ) {
    super(message);
    this.name = "BaseHarborApiError";
  }
}

export interface HttpRequestDescriptor {
  href: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
}

// Thin HTTP transport only.
//
// Important: endpoint paths, operation names and stream locations are discovered
// from the finalized BaseHarbor #767 machine contract. This transport deliberately
// does not invent /api/v1/... routes while that contract is still pending.
export class BaseHarborHttpTransport {
  constructor(private readonly baseUrl = process.env.NEXT_PUBLIC_BASEHARBOR_API_URL ?? "") {}

  async request<T>(descriptor: HttpRequestDescriptor): Promise<T> {
    const url = new URL(descriptor.href, this.baseUrl || window.location.origin);
    const response = await fetch(url, {
      method: descriptor.method ?? "GET",
      body: descriptor.body === undefined ? undefined : JSON.stringify(descriptor.body),
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(descriptor.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...descriptor.headers,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let detail: unknown;
      try {
        detail = await response.json();
      } catch {
        detail = await response.text();
      }
      throw new BaseHarborApiError(
        `BaseHarbor HTTP request failed: ${response.status} ${response.statusText}`,
        response.status,
        detail,
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}

export const baseHarborHttpTransport = new BaseHarborHttpTransport();
