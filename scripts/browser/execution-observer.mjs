const terminalStates = new Set(["succeeded", "failed", "cancelled"]);

// A late diagnostic read must never satisfy a subsequent operation's waiter.
export function createExecutionObservationGuard() {
  const completed = new Set();
  return {
    accept(value) {
      if (completed.has(value.execution_id)) return false;
      if (value.execution_id && terminalStates.has(value.state)) completed.add(value.execution_id);
      return true;
    },
    isTerminal(executionId) { return completed.has(executionId); },
    newTerminalMatcher(operation) {
      const earlier = new Set(completed);
      return value => Boolean(value.execution_id) && !earlier.has(value.execution_id)
        && value.operation_id === operation && terminalStates.has(value.state);
    },
  };
}
