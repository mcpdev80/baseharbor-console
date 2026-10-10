import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Native browser diagnostic module is JavaScript.
import { createExecutionObservationGuard } from "../scripts/browser/execution-observer.mjs";

test("late reads of the first failed apply cannot complete the resumed apply", () => {
  const guard = createExecutionObservationGuard();
  const failed = { execution_id: "first", operation_id: "apply", state: "failed" };
  assert.equal(guard.accept(failed), true);
  const resumed = guard.newTerminalMatcher("apply");
  assert.equal(guard.accept(failed), false);
  assert.equal(resumed(failed), false);
  assert.equal(resumed({ ...failed, execution_id: "second", state: "pending" }), false);
  assert.equal(resumed({ ...failed, execution_id: "setup", operation_id: "control-plane.up", state: "succeeded" }), false);
  assert.equal(resumed({ ...failed, execution_id: "second", state: "succeeded" }), true);
});

test("terminal observation stops polling and is consumed once per execution", () => {
  const guard = createExecutionObservationGuard();
  assert.equal(guard.accept({ execution_id: "setup", state: "pending" }), true);
  assert.equal(guard.isTerminal("setup"), false);
  assert.equal(guard.accept({ execution_id: "setup", state: "succeeded" }), true);
  assert.equal(guard.isTerminal("setup"), true);
  assert.equal(guard.accept({ execution_id: "setup", state: "succeeded" }), false);
  assert.equal(guard.accept({ execution_id: "setup", state: "running" }), false);
});
