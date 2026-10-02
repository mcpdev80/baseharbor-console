import type { ConsoleSummary, RuntimeResource } from "./types";

export const mockSummary: ConsoleSummary = {
  applications: 3,
  targets: 2,
  providers: 8,
  runtimeResources: 14,
  degraded: 1,
};

export const mockRuntimeResources: RuntimeResource[] = [
  {
    id: "runtime://local/docker/container/demo-api",
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
    relationships: [
      { kind: "application", id: "app-demo", name: "demo" },
      { kind: "component", id: "api", name: "api" },
      { kind: "target", id: "local", name: "local" },
    ],
    metrics: {
      cpuPercent: 2.8,
      memoryBytes: 184_549_376,
      networkRxBytes: 12_382_443,
      networkTxBytes: 4_931_144,
    },
  },
  {
    id: "runtime://local/docker/container/postgres",
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
    relationships: [
      { kind: "provider", id: "baseharbor/postgresql", name: "PostgreSQL" },
      { kind: "target", id: "local", name: "local" },
    ],
    metrics: { cpuPercent: 1.3, memoryBytes: 289_406_976 },
  },
  {
    id: "runtime://local/docker/container/manual-nginx",
    kind: "container",
    runtime: "docker",
    target: "local",
    displayName: "manual-nginx",
    ownership: "unmanaged",
    observedState: "running",
    health: "unknown",
    readiness: "unknown",
    relationships: [{ kind: "target", id: "local", name: "local" }],
    metrics: { cpuPercent: 0.1, memoryBytes: 19_398_656 },
  },
];
