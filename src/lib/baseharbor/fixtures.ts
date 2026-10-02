import type {
  ApplicationSummary,
  ConsoleSummary,
  MachineOperation,
  OperationExecution,
  RuntimeResource,
  TargetSummary,
  RepositorySummary,
  WorkspaceSummary,
  ProviderSummary,
  EvidenceEntry,
  ObservabilitySignal,
  RuntimeImageSummary,
  RuntimeVolumeSummary,
  RuntimeNetworkSummary,
  RuntimeEvent,
  PlatformSetting,
} from "./types";

export const fixtureSummary: ConsoleSummary = {
  applications: 3,
  targets: 2,
  providers: 8,
  runtimeResources: 14,
  degraded: 1,
};

export const fixtureApplications: ApplicationSummary[] = [
  {
    id: "app-demo",
    name: "demo",
    environment: "dev",
    target: "local",
    source: "~/src/baseharbor-demo",
    revision: "main@7f2d1ac",
    desiredState: "running",
    observedState: "running",
    health: "healthy",
    readiness: "ready",
    components: 2,
    providers: 5,
    deploymentId: "dep-demo-local",
    updatedAt: "2026-10-02T20:42:00Z",
  },
  {
    id: "app-platform",
    name: "platform-tools",
    environment: "test",
    target: "lab",
    source: "~/src/platform-tools",
    revision: "main@aa73c91",
    desiredState: "running",
    observedState: "degraded",
    health: "degraded",
    readiness: "not_ready",
    components: 4,
    providers: 3,
    deploymentId: "dep-platform-lab",
    updatedAt: "2026-10-02T20:31:00Z",
  },
  {
    id: "app-docs",
    name: "docs",
    environment: "dev",
    target: "local",
    source: "~/src/baseharbor-docs",
    revision: "develop@3ad44bd",
    desiredState: "stopped",
    observedState: "stopped",
    health: "unknown",
    readiness: "unknown",
    components: 1,
    providers: 0,
    deploymentId: "dep-docs-local",
    updatedAt: "2026-10-02T19:58:00Z",
  },
];

export const fixtureTargets: TargetSummary[] = [
  {
    id: "target-local",
    name: "local",
    isDefault: true,
    environment: "dev",
    runtimeProvider: "docker",
    accessProvider: "local",
    accessReference: "local",
    scope: "developer",
    health: "healthy",
    readiness: "ready",
    capabilities: ["container", "compose", "logs", "exec", "metrics"],
    endpoint: "local",
  },
  {
    id: "target-lab",
    name: "lab",
    isDefault: false,
    environment: "test",
    runtimeProvider: "podman",
    accessProvider: "baseharbor-node-connector",
    accessReference: "lab-node-01",
    scope: "shared-lab",
    health: "healthy",
    readiness: "ready",
    capabilities: ["container", "compose", "quadlet", "logs", "exec", "metrics"],
    endpoint: "connector://lab-node-01",
  },
];

export const fixtureRuntimeResources: RuntimeResource[] = [
  {
    id: "runtime-local-demo-api",
    kind: "container",
    runtime: "docker",
    target: "local",
    displayName: "demo-api",
    nativeName: "baseharbor-demo-api-1",
    ownership: "managed",
    desiredState: "running",
    observedState: "running",
    health: "healthy",
    readiness: "ready",
    image: "ghcr.io/mcpdev80/demo-api:dev",
    createdAt: "2026-10-02T20:14:00Z",
    relationships: [
      { kind: "application", id: "app-demo", name: "demo" },
      { kind: "deployment", id: "dep-demo-local", name: "local" },
      { kind: "component", id: "api", name: "api" },
      { kind: "target", id: "target-local", name: "local" },
    ],
    metrics: {
      cpuPercent: 2.8,
      memoryBytes: 184_549_376,
      networkRxBytes: 12_382_443,
      networkTxBytes: 4_931_144,
    },
    capabilities: ["logs", "inspect", "restart", "exec", "terminal", "metrics"],
    runtimeDetails: {
      restartPolicy: "unless-stopped",
      networkMode: "baseharbor-demo",
      imageDigest: "sha256:2d8e...a9f1",
    },
  },
  {
    id: "runtime-local-postgresql",
    kind: "container",
    runtime: "docker",
    target: "local",
    displayName: "shared-postgresql",
    nativeName: "baseharbor-shared-postgresql",
    ownership: "platform",
    desiredState: "running",
    observedState: "running",
    health: "healthy",
    readiness: "ready",
    image: "postgres:18",
    createdAt: "2026-10-02T18:03:00Z",
    relationships: [
      { kind: "provider", id: "baseharbor/postgresql", name: "PostgreSQL" },
      { kind: "target", id: "target-local", name: "local" },
    ],
    metrics: { cpuPercent: 1.3, memoryBytes: 289_406_976 },
    capabilities: ["logs", "inspect", "restart", "exec", "metrics"],
  },
  {
    id: "runtime-local-nginx",
    kind: "container",
    runtime: "docker",
    target: "local",
    displayName: "manual-nginx",
    nativeName: "manual-nginx",
    ownership: "unmanaged",
    observedState: "running",
    health: "unknown",
    readiness: "unknown",
    image: "nginx:1.29",
    relationships: [{ kind: "target", id: "target-local", name: "local" }],
    metrics: { cpuPercent: 0.1, memoryBytes: 19_398_656 },
    capabilities: ["logs", "inspect", "restart", "exec"],
  },
  {
    id: "runtime-lab-worker",
    kind: "container",
    runtime: "podman",
    target: "lab",
    displayName: "platform-worker",
    nativeName: "platform-worker.service",
    ownership: "managed",
    desiredState: "running",
    observedState: "running",
    health: "healthy",
    readiness: "ready",
    image: "ghcr.io/mcpdev80/platform-worker:test",
    relationships: [
      { kind: "application", id: "app-platform", name: "platform-tools" },
      { kind: "target", id: "target-lab", name: "lab" },
    ],
    metrics: { cpuPercent: 7.2, memoryBytes: 412_876_800 },
    capabilities: ["logs", "inspect", "restart", "exec", "terminal", "metrics"],
    runtimeDetails: { quadletUnit: "platform-worker.service" },
  },
];

export const fixtureOperations: MachineOperation[] = [
  {
    id: "application.apply",
    description: "Apply application plan",
    safety: "mutating",
    confirmation_required: false,
    policy_required: true,
    contract_version: "v1",
  },
  {
    id: "application.destroy",
    description: "Destroy application deployment",
    safety: "destructive",
    confirmation_required: true,
    policy_required: true,
    contract_version: "v1",
  },
  {
    id: "runtime.restart",
    description: "Restart runtime resource",
    safety: "mutating",
    confirmation_required: false,
    policy_required: true,
    contract_version: "v1",
  },
];

export const fixtureExecutions: OperationExecution[] = [
  {
    executionId: "exec-01HZX2",
    operationId: "application.apply",
    state: "succeeded",
    safety: "mutating",
    actor: "developer",
    resource: "app/demo@local",
    startedAt: "2026-10-02T20:13:48Z",
    finishedAt: "2026-10-02T20:14:03Z",
    progress: 100,
    message: "Deployment converged",
  },
  {
    executionId: "exec-01HZX3",
    operationId: "runtime.restart",
    state: "running",
    safety: "mutating",
    actor: "developer",
    resource: "runtime/platform-worker",
    startedAt: "2026-10-02T20:44:10Z",
    progress: 72,
    message: "Waiting for readiness",
  },
];

export const fixtureRepositories: RepositorySummary[] = [
  {
    id: "repo-baseharbor-demo",
    name: "baseharbor-demo",
    path: "~/src/baseharbor-demo",
    branch: "main",
    revision: "7f2d1ac",
    dirty: false,
    applicationId: "app-demo",
    workspaceId: "workspace-main",
    inspectedAt: "2026-10-02T20:40:00Z",
  },
  {
    id: "repo-platform-tools",
    name: "platform-tools",
    path: "~/src/platform-tools",
    branch: "main",
    revision: "aa73c91",
    dirty: true,
    applicationId: "app-platform",
    workspaceId: "workspace-lab",
    inspectedAt: "2026-10-02T20:28:00Z",
  },
  {
    id: "repo-new-service",
    name: "new-service",
    path: "~/src/new-service",
    branch: "feature/api",
    revision: "f98ac17",
    dirty: false,
    inspectedAt: "2026-10-02T20:51:00Z",
  },
];

export const fixtureWorkspaces: WorkspaceSummary[] = [
  {
    id: "workspace-main",
    name: "main",
    path: "~/src",
    repositoryId: "repo-baseharbor-demo",
    branch: "main",
    dirty: false,
    sources: 3,
    applications: 2,
    status: "ready",
    updatedAt: "2026-10-02T20:42:00Z",
  },
  {
    id: "workspace-lab",
    name: "lab-work",
    path: "~/work/lab",
    repositoryId: "repo-platform-tools",
    branch: "main",
    dirty: true,
    sources: 2,
    applications: 1,
    status: "attention",
    updatedAt: "2026-10-02T20:31:00Z",
  },
];

export const fixtureProviders: ProviderSummary[] = [
  { id:"provider-postgresql", name:"PostgreSQL", capability:"database", implementation:"PostgreSQL", scope:"shared", target:"local", ownership:"platform", availability:"single", health:"healthy", readiness:"ready", tls:true, credentialLifecycle:"managed", applications:["demo","platform-tools"] },
  { id:"provider-valkey", name:"Valkey", capability:"cache", implementation:"Valkey", scope:"shared", target:"local", ownership:"platform", availability:"single", health:"healthy", readiness:"ready", tls:true, credentialLifecycle:"managed", applications:["demo"] },
  { id:"provider-openbao", name:"OpenBao", capability:"secrets", implementation:"OpenBao", scope:"shared", target:"local", ownership:"platform", availability:"single", health:"healthy", readiness:"ready", tls:true, credentialLifecycle:"managed", applications:["demo","platform-tools"] },
  { id:"provider-object-storage", name:"Object storage", capability:"object-storage", implementation:"SeaweedFS", scope:"shared", target:"lab", ownership:"platform", availability:"ha", health:"degraded", readiness:"not_ready", tls:true, credentialLifecycle:"managed", applications:["platform-tools"] },
];

export const fixtureEvidence: EvidenceEntry[] = [
  { id:"ev-001", category:"lifecycle", resource:"app/demo@local", actor:"developer", operation:"application.apply", outcome:"passed", observedAt:"2026-10-02T20:14:03Z", summary:"Deployment converged and reached READY." },
  { id:"ev-002", category:"verification", resource:"provider/postgresql", actor:"baseharbor", outcome:"passed", observedAt:"2026-10-02T20:13:58Z", summary:"TLS, credential binding and readiness verification passed." },
  { id:"ev-003", category:"policy", resource:"app/platform-tools@lab", actor:"developer", operation:"application.apply", outcome:"recorded", observedAt:"2026-10-02T20:31:02Z", summary:"Test environment policy required authenticated target access and TLS." },
  { id:"ev-004", category:"recovery", resource:"backup/demo/2026-10-02", actor:"developer", operation:"backup.create", outcome:"passed", observedAt:"2026-10-02T19:44:00Z", summary:"Backup verification completed successfully." },
];

export const fixtureObservability: ObservabilitySignal[] = [
  { id:"obs-demo", subject:"demo", target:"local", metrics:"healthy", logs:"healthy", traces:"healthy", otlp:"healthy", lastSeen:"2026-10-02T20:51:40Z" },
  { id:"obs-platform", subject:"platform-tools", target:"lab", metrics:"healthy", logs:"healthy", traces:"degraded", otlp:"healthy", lastSeen:"2026-10-02T20:51:32Z" },
  { id:"obs-postgresql", subject:"shared-postgresql", target:"local", metrics:"healthy", logs:"healthy", traces:"unknown", otlp:"unknown", lastSeen:"2026-10-02T20:51:38Z" },
];

export const fixtureRuntimeImages: RuntimeImageSummary[] = [
  { id:"img-demo", reference:"ghcr.io/mcpdev80/demo-api:dev", digest:"sha256:2d8e...a9f1", runtime:"docker", target:"local", ownership:"managed", inUse:true, sizeBytes:214000000, relationships:1 },
  { id:"img-postgres", reference:"postgres:18", runtime:"docker", target:"local", ownership:"platform", inUse:true, sizeBytes:438000000, relationships:2 },
  { id:"img-nginx", reference:"nginx:1.29", runtime:"docker", target:"local", ownership:"unmanaged", inUse:true, sizeBytes:192000000, relationships:1 },
];

export const fixtureRuntimeVolumes: RuntimeVolumeSummary[] = [
  { id:"vol-pg", name:"baseharbor-postgresql-data", runtime:"docker", target:"local", ownership:"platform", driver:"local", inUse:true, attachedResources:1, capacityBytes:21474836480 },
  { id:"vol-demo", name:"demo-state", runtime:"docker", target:"local", ownership:"managed", driver:"local", inUse:true, attachedResources:1, capacityBytes:5368709120 },
  { id:"vol-old", name:"legacy-cache", runtime:"docker", target:"local", ownership:"unmanaged", driver:"local", inUse:false, attachedResources:0 },
];

export const fixtureRuntimeNetworks: RuntimeNetworkSummary[] = [
  { id:"net-demo", name:"baseharbor-demo", runtime:"docker", target:"local", ownership:"managed", driver:"bridge", connectedResources:2 },
  { id:"net-shared", name:"baseharbor-shared", runtime:"docker", target:"local", ownership:"platform", driver:"bridge", connectedResources:3 },
  { id:"net-lab", name:"baseharbor-lab", runtime:"podman", target:"lab", ownership:"managed", driver:"bridge", connectedResources:1 },
];

export const fixtureRuntimeEvents: RuntimeEvent[] = [
  { id:"evt-01", category:"operation", severity:"info", subject:"application.apply", target:"local", message:"demo deployment converged", observedAt:"2026-10-02T20:14:03Z" },
  { id:"evt-02", category:"provider", severity:"warning", subject:"object-storage", target:"lab", message:"readiness degraded: replica unavailable", observedAt:"2026-10-02T20:31:18Z" },
  { id:"evt-03", category:"runtime", severity:"info", subject:"platform-worker", target:"lab", message:"container restarted", observedAt:"2026-10-02T20:44:11Z" },
  { id:"evt-04", category:"target", severity:"info", subject:"lab", target:"lab", message:"Node Connector capability negotiation completed", observedAt:"2026-10-02T20:43:52Z" },
];

export const fixturePlatformSettings: PlatformSetting[] = [
  { key:"dev.domain", value:"baseharbor.localhost", source:"organization", description:"Default development domain." },
  { key:"security.tls", value:"required", source:"policy", locked:true, description:"TLS requirement for managed platform access." },
  { key:"target.default", value:"local", source:"workspace", description:"Default target for the current workspace." },
  { key:"provider.postgresql.scope", value:"shared", source:"organization", description:"Default PostgreSQL placement semantics." },
];
