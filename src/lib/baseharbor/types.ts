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

export interface ProviderSummary {
  id: string;
  name: string;
  capability: string;
  implementation: string;
  scope: "shared" | "app-scoped" | "external";
  target: string;
  ownership: OwnershipClass;
  availability: "single" | "ha" | "external";
  health: HealthState;
  readiness: ReadinessState;
  tls: boolean;
  credentialLifecycle: "managed" | "external";
  applications: string[];
}

export interface EvidenceEntry {
  id: string;
  category: "lifecycle" | "policy" | "verification" | "recovery" | "security";
  resource: string;
  actor: string;
  operation?: string;
  outcome: "passed" | "failed" | "recorded";
  observedAt: string;
  summary: string;
}

export interface ObservabilitySignal {
  id: string;
  subject: string;
  target: string;
  metrics: HealthState;
  logs: HealthState;
  traces: HealthState;
  otlp: HealthState;
  lastSeen: string;
}

export interface RuntimeImageSummary {
  id: string;
  reference: string;
  digest?: string;
  runtime: string;
  target: string;
  ownership: OwnershipClass;
  inUse: boolean;
  sizeBytes?: number;
  relationships: number;
}

export interface RuntimeVolumeSummary {
  id: string;
  name: string;
  runtime: string;
  target: string;
  ownership: OwnershipClass;
  driver?: string;
  inUse: boolean;
  attachedResources: number;
  capacityBytes?: number;
}

export interface RuntimeNetworkSummary {
  id: string;
  name: string;
  runtime: string;
  target: string;
  ownership: OwnershipClass;
  driver?: string;
  connectedResources: number;
}

export interface RuntimeEvent {
  id: string;
  category: "application" | "operation" | "runtime" | "provider" | "target";
  severity: "info" | "warning" | "error";
  subject: string;
  target?: string;
  message: string;
  observedAt: string;
}

export interface PlatformSetting {
  key: string;
  value: string;
  source: "default" | "organization" | "environment" | "workspace" | "policy";
  locked?: boolean;
  description: string;
}

export interface BackupSummary {
  id: string;
  application: string;
  target: string;
  createdAt: string;
  sizeBytes?: number;
  verification: "passed" | "failed" | "pending";
  encrypted: boolean;
  scope: string;
}

export interface SecurityMaterialSummary {
  id: string;
  kind: "credential" | "client-cert" | "ca";
  subject: string;
  target?: string;
  state: "active" | "rotation_due" | "retiring" | "revoked";
  managed: boolean;
  expiresAt?: string;
  dependents: number;
  lastRotatedAt?: string;
}
