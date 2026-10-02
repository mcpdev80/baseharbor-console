export const consoleRuntimeInfo = {
  dataMode: "fixture" as const,
  adapter: "BaseHarborConsoleAdapter",
  httpApi: { issue: 767, state: "contract-pending" as const },
  machineAuthorization: { issue: 770, state: "contract-pending" as const },
  runtimeExplorer: { issue: 768, state: "ui-ready" as const },
  targetAccess: { issue: 769, state: "ui-ready" as const },
  directRuntimeControl: false,
  directConnectorControl: false,
};

export function configuredCoreEndpoint() {
  return process.env.NEXT_PUBLIC_BASEHARBOR_API_URL || "not configured";
}
