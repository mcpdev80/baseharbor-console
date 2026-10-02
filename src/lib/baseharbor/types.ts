export type SafetyClass = "read_only" | "mutating" | "destructive";
export type OwnershipClass = "managed" | "external" | "unmanaged" | "platform";
export type EnvironmentClass = "dev" | "test" | "prod";
export type HealthState = "healthy" | "degraded" | "unhealthy" | "unknown";
export type ReadinessState = "ready" | "not_ready" | "unknown";

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
  health?: HealthState;
  readiness?: ReadinessState;
  createdAt?: string;
  image?: string;
  relationships: ResourceRelationship[];
  metrics?: {
    cpuPercent?: number;
    memoryBytes?: number;
    networkRxBytes?: number;
    networkTxBytes?: number;
    storageReadBytes?: number;
    storageWriteBytes?: number;
  };
  capabilities?: string[];
  runtimeDetails?: Record<string, unknown>;
}

export interface ApplicationSummary {
  id: string;
  name: string;
  environment: EnvironmentClass;
  target: string;
  source: string;
  revision: string;
  desiredState: string;
  observedState: string;
  health: HealthState;
  readiness: ReadinessState;
  components: number;
  providers: number;
  deploymentId: string;
  updatedAt: string;
}

export interface TargetSummary {
  id: string;
  name: string;
  isDefault: boolean;
  environment: EnvironmentClass;
  runtimeProvider: string;
  accessProvider: string;
  accessReference: string;
  scope: string;
  health: HealthState;
  readiness: ReadinessState;
  capabilities: string[];
  endpoint?: string;
}

export interface OperationExecution {
  executionId: string;
  operationId: string;
  state: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  safety: SafetyClass;
  actor: string;
  resource: string;
  startedAt: string;
  finishedAt?: string;
  progress?: number;
  message?: string;
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

export interface RepositorySummary {
  id: string;
  name: string;
  path: string;
  branch: string;
  revision: string;
  dirty: boolean;
  applicationId?: string;
  workspaceId?: string;
  inspectedAt?: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  path: string;
  repositoryId: string;
  branch: string;
  dirty: boolean;
  sources: number;
  applications: number;
  status: "ready" | "attention" | "unknown";
  updatedAt: string;
}
