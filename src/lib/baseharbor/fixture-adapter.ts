import type { BaseHarborConsoleAdapter } from "./adapter";
import {
  fixtureApplications,
  fixtureExecutions,
  fixtureOperations,
  fixtureRuntimeResources,
  fixtureSummary,
  fixtureTargets,
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
  async targets() {
    return fixtureTargets;
  },
  async target(id) {
    return fixtureTargets.find((target) => target.id === id || target.name === id) ?? null;
  },
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
