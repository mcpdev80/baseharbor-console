export const consoleRuntimeInfo = {
  dataMode: "fixture" as const,
  adapter: "BaseHarborConsoleAdapter",
  contracts: {
    httpApi: {
      issue: 767,
      shape: "ready" as const,
      ui: "ready" as const,
      liveBinding: "pending" as const,
    },
    machineAuthorization: {
      issue: 770,
      shape: "ready" as const,
      ui: "ready" as const,
      liveBinding: "pending" as const,
    },
    runtimeExplorer: {
      issue: 768,
      shape: "ready" as const,
      ui: "ready" as const,
      liveBinding: "pending" as const,
    },
    targetAccess: {
      issue: 769,
      shape: "ready" as const,
      ui: "ready" as const,
      liveBinding: "pending" as const,
    },
  },
  directRuntimeControl: false,
  directConnectorControl: false,
};

export function configuredCoreEndpoint() {
  return process.env.NEXT_PUBLIC_BASEHARBOR_API_URL || "not configured";
}
