import test from "node:test";
import assert from "node:assert/strict";
import { verifiedManagedRotation } from "../src/lib/baseharbor/core-rotation.ts";
import type { MachineExecution } from "../src/lib/baseharbor/machine-wire.ts";

test("rotation completion requires authoritative succeeded result and every readiness flag", () => {
  const completed = { operation_id: "openbao.rotate", state: "succeeded", context: { target: "installation", environment: "dev" },
    result: { initialized: true, unsealed: true, manager_ready: true } } as unknown as MachineExecution;
  assert.equal(verifiedManagedRotation(completed), true);
  for (const change of [{ state: "running" }, { state: "failed" }, { operation_id: "control-plane.up" }, { context: { environment: "dev" } },
    { result: { initialized: true, unsealed: true } }, { result: { initialized: true, unsealed: false, manager_ready: true } },
    { result: { initialized: true, unsealed: true, manager_ready: false } }]) {
    assert.equal(verifiedManagedRotation({ ...completed, ...change } as MachineExecution), false);
  }
});
