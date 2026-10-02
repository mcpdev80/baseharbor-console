export type SafetyClass = "read_only" | "mutating" | "destructive";

export type OwnershipClass = "managed" | "external" | "unmanaged" | "platform";

export type RuntimeKind =
  | "container"
  | "pod"
  | "image"
  | "volume"
  | "network"
  | "service"
  | "pvc"
  | "node"
  | "runtime-object";

export interface MachineOperation {
  id: string;
  description: string;
  safety: SafetyClass;
  confirmation_required: boolean;
  policy_required: boolean;
  contract_version: string;
}

export interface ResourceRelationship {
  kind: "application" | "deployment" | "component" | "provider" | "target" | "parent";
  id: string;
  name?: string;
}

export interface RuntimeResource {
  id: string;
  kind: RuntimeKind;
  runtime: string;
  target: string;
  displayName: string;
  nativeName?: string;
  ownership: OwnershipClass;
  desiredState?: string;
  observedState?: string;
  health?: "healthy" | "degraded" | "unhealthy" | "unknown";
  readiness?: "ready" | "not_ready" | "unknown";
  relationships: ResourceRelationship[];
  metrics?: {
    cpuPercent?: number;
    memoryBytes?: number;
    networkRxBytes?: number;
    networkTxBytes?: number;
    storageReadBytes?: number;
    storageWriteBytes?: number;
  };
  runtimeDetails?: Record<string, unknown>;
}

export interface ConsoleSummary {
  applications: number;
  targets: number;
  providers: number;
  runtimeResources: number;
  degraded: number;
}

export interface BaseHarborProblem {
  code: string;
  message: string;
  next?: string;
  retryable?: boolean;
  resource?: string;
  remediation_class?: string;
}
