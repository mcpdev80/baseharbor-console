import type { ConsoleSummary, MachineOperation, RuntimeResource } from "./types";

export class BaseHarborApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "BaseHarborApiError";
  }
}

export class BaseHarborClient {
  constructor(private readonly baseUrl = process.env.NEXT_PUBLIC_BASEHARBOR_API_URL ?? "") {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
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
        `BaseHarbor API request failed: ${response.status} ${response.statusText}`,
        response.status,
        detail,
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  operations(): Promise<MachineOperation[]> {
    return this.request("/api/v1/operations");
  }

  runtimeResources(target?: string): Promise<RuntimeResource[]> {
    const query = target ? `?target=${encodeURIComponent(target)}` : "";
    return this.request(`/api/v1/runtime/resources${query}`);
  }

  summary(): Promise<ConsoleSummary> {
    return this.request("/api/v1/console/summary");
  }
}

export const baseHarborClient = new BaseHarborClient();
