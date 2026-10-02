export type SafetyClass = "read_only" | "mutating" | "destructive";
export type OwnershipClass = "managed" | "external" | "unmanaged" | "platform";
export type EnvironmentClass = "dev" | "test" | "prod";
export type HealthState = "healthy" | "degraded" | "unhealthy" | "unknown";
export type ReadinessState = "ready" | "not_ready" | "unknown";


export type OperationState = "pending" | "running" | "succeeded" | "failed" | "cancelled";
export type AuthorizationDecisionState = "allow" | "deny";

export interface MachineActorRef {
  subject: string;
  issuer?: string;
  displayName?: string;
  assurance?: string;
  authenticationMethods?: string[];
  trustedLocal?: boolean;
}

export interface OperationContext {
  applicationId?: string;
  deploymentId?: string;
  environment?: EnvironmentClass;
  targetId?: string;
  workspaceId?: string;
  providerId?: string;
  runtimeResourceId?: string;
}

export interface AuthorizationDecision {
  decision: AuthorizationDecisionState;
  actor: MachineActorRef;
  operationId: string;
  safety: SafetyClass;
  context: OperationContext;
  policy?: {
    id?: string;
    source?: string;
    provenance?: string;
  };
  reasonCode?: string;
  message?: string;
}

export interface ContractLink {
  rel: string;
  href: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface OperationProgress {
  phase?: string;
  current?: number;
  total?: number;
  percent?: number;
  message?: string;
}

export interface MachineEvent {
  id: string;
  type:
    | "operation.started"
    | "operation.progress"
    | "operation.completed"
    | "operation.failed"
    | "application.state.changed"
    | "provider.readiness.changed"
    | "target.connectivity.changed"
    | "runtime.resource.changed";
  observedAt: string;
  executionId?: string;
  operationId?: string;
  actor?: MachineActorRef;
  context?: OperationContext;
  resourceRef?: string;
  progress?: OperationProgress;
  problem?: BaseHarborProblem;
  payload?: Record<string, unknown>;
}

export interface TargetAccessSecurity {
  encrypted: boolean;
  mutuallyAuthenticated?: boolean;
  peerIdentity?: string;
  trustReference?: string;
  protocol?: string;
}

export interface TargetAccessCapabilitySet {
  connect?: boolean;
  stream?: boolean;
  execTransport?: boolean;
  portForward?: boolean;
  nativeContext?: boolean;
  peerIdentity?: boolean;
  realization?: string[];
}

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
  capabilities?: string[];
  links?: ContractLink[];
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
  accessCapabilities?: TargetAccessCapabilitySet;
  accessSecurity?: TargetAccessSecurity;
}

export interface OperationExecution {
  executionId: string;
  operationId: string;
  state: OperationState;
  safety: SafetyClass;
  actor: string;
  actorRef?: MachineActorRef;
  context?: OperationContext;
  authorization?: AuthorizationDecision;
  resource: string;
  startedAt: string;
  finishedAt?: string;
  progress?: number;
  progressDetail?: OperationProgress;
  message?: string;
  result?: Record<string, unknown>;
  problem?: BaseHarborProblem;
  links?: ContractLink[];
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
