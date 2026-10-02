import type {
  ApplicationSummary,
  RepositorySummary,
  WorkspaceSummary,
  ConsoleSummary,
  MachineOperation,
  OperationExecution,
  RuntimeResource,
  TargetSummary,
  ProviderSummary,
  EvidenceEntry,
  ObservabilitySignal,
  RuntimeImageSummary,
  RuntimeVolumeSummary,
  RuntimeNetworkSummary,
  RuntimeEvent,
  PlatformSetting,
  BackupSummary,
  SecurityMaterialSummary,
} from "./types";

export interface BaseHarborConsoleAdapter {
  summary(): Promise<ConsoleSummary>;
  applications(): Promise<ApplicationSummary[]>;
  application(id: string): Promise<ApplicationSummary | null>;
  repositories(): Promise<RepositorySummary[]>;
  workspaces(): Promise<WorkspaceSummary[]>;
  targets(): Promise<TargetSummary[]>;
  target(id: string): Promise<TargetSummary | null>;
  providers(): Promise<ProviderSummary[]>;
  provider(id: string): Promise<ProviderSummary | null>;
  evidence(): Promise<EvidenceEntry[]>;
  observability(): Promise<ObservabilitySignal[]>;
  runtimeImages(): Promise<RuntimeImageSummary[]>;
  runtimeVolumes(): Promise<RuntimeVolumeSummary[]>;
  runtimeNetworks(): Promise<RuntimeNetworkSummary[]>;
  runtimeEvents(): Promise<RuntimeEvent[]>;
  platformSettings(): Promise<PlatformSetting[]>;
  backups(): Promise<BackupSummary[]>;
  securityMaterials(): Promise<SecurityMaterialSummary[]>;
  runtimeResources(target?: string): Promise<RuntimeResource[]>;
  runtimeResource(id: string): Promise<RuntimeResource | null>;
  operations(): Promise<MachineOperation[]>;
  executions(): Promise<OperationExecution[]>;
}
