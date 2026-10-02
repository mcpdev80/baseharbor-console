import type { BaseHarborConsoleAdapter } from "./adapter";
import {
  fixtureApplications,
  fixtureExecutions,
  fixtureOperations,
  fixtureRepositories,
  fixtureWorkspaces,
  fixtureRuntimeResources,
  fixtureSummary,
  fixtureTargets,
  fixtureProviders,
  fixtureEvidence,
  fixtureObservability,
  fixtureRuntimeImages,
  fixtureRuntimeVolumes,
  fixtureRuntimeNetworks,
  fixtureRuntimeEvents,
  fixturePlatformSettings,
  fixtureBackups,
  fixtureSecurityMaterials,
} from "./fixtures";

export const fixtureAdapter: BaseHarborConsoleAdapter = {
  async summary() {
    return fixtureSummary;
  },
  async applications() {
    return fixtureApplications;
  },
  async application(id) {
    return fixtureApplications.find((application) => application.id === id) ?? null;
  },
  async repositories() {
    return fixtureRepositories;
  },
  async workspaces() {
    return fixtureWorkspaces;
  },
  async targets() {
    return fixtureTargets;
  },
  async target(id) {
    return fixtureTargets.find((target) => target.id === id || target.name === id) ?? null;
  },
  async providers() { return fixtureProviders; },
  async provider(id) { return fixtureProviders.find((provider) => provider.id === id) ?? null; },
  async evidence() { return fixtureEvidence; },
  async observability() { return fixtureObservability; },
  async runtimeImages() { return fixtureRuntimeImages; },
  async runtimeVolumes() { return fixtureRuntimeVolumes; },
  async runtimeNetworks() { return fixtureRuntimeNetworks; },
  async runtimeEvents() { return fixtureRuntimeEvents; },
  async platformSettings() { return fixturePlatformSettings; },
  async backups() { return fixtureBackups; },
  async securityMaterials() { return fixtureSecurityMaterials; },
  async runtimeResources(target) {
    return target
      ? fixtureRuntimeResources.filter((resource) => resource.target === target)
      : fixtureRuntimeResources;
  },
  async runtimeResource(id) {
    return fixtureRuntimeResources.find((resource) => resource.id === id) ?? null;
  },
  async operations() {
    return fixtureOperations;
  },
  async executions() {
    return fixtureExecutions;
  },
};
