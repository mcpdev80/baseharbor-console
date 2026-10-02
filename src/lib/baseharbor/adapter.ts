import type {
  ApplicationSummary,
  RepositorySummary,
  WorkspaceSummary,
  ConsoleSummary,
  MachineOperation,
  OperationExecution,
  RuntimeResource,
  TargetSummary,
} from "./types";

export interface BaseHarborConsoleAdapter {
  summary(): Promise<ConsoleSummary>;
  applications(): Promise<ApplicationSummary[]>;
  application(id: string): Promise<ApplicationSummary | null>;
  repositories(): Promise<RepositorySummary[]>;
  workspaces(): Promise<WorkspaceSummary[]>;
  targets(): Promise<TargetSummary[]>;
  target(id: string): Promise<TargetSummary | null>;
  runtimeResources(target?: string): Promise<RuntimeResource[]>;
  runtimeResource(id: string): Promise<RuntimeResource | null>;
  operations(): Promise<MachineOperation[]>;
  executions(): Promise<OperationExecution[]>;
}
