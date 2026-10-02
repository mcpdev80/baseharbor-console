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
  targets(): Promise<TargetSummary[]>;
  runtimeResources(target?: string): Promise<RuntimeResource[]>;
  runtimeResource(id: string): Promise<RuntimeResource | null>;
  operations(): Promise<MachineOperation[]>;
  executions(): Promise<OperationExecution[]>;
}
