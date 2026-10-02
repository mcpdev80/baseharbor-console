import type {
  ApplicationSummary,
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
  targets(): Promise<TargetSummary[]>;
  target(id: string): Promise<TargetSummary | null>;
  runtimeResources(target?: string): Promise<RuntimeResource[]>;
  runtimeResource(id: string): Promise<RuntimeResource | null>;
  operations(): Promise<MachineOperation[]>;
  executions(): Promise<OperationExecution[]>;
}
