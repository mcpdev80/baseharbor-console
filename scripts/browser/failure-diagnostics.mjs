import path from "node:path";
import { execFileSync } from "node:child_process";

// Diagnostics contain public error prose and explicitly selected status flags.
// Never persist raw CLI output, configuration, recovery material or headers.
export function safeDiagnosticText(value) {
  if (typeof value !== "string") return undefined;
  return value.slice(0, 32768)
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g, "[private material]")
    .replace(/(?:[a-z][a-z0-9+.-]{0,31}):\/\/[^\s<>"']+/gi, "[endpoint]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(password|secret|token|client_secret|authorization|unseal_keys?|root_token)\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;}]+)/gi, "$1=[redacted]")
    .replace(/\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[credential]")
    .replace(/\b(?:hvs|hvb|s)\.[A-Za-z0-9_-]+\b/g, "[credential]")
    .replace(/\b[A-Za-z0-9+/=_-]{32,}\b/g, "[opaque]")
    .replace(/\/(?:[A-Za-z0-9._-]+\/)+[A-Za-z0-9._-]*/g, "[path]")
    .replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 2048);
}
export function safePublicError(error) {
  if (!error || typeof error !== "object") return undefined;
  const identifier = value => typeof value === "string" && /^[a-z][a-z0-9_-]{0,127}$/.test(value) ? value : undefined;
  return { code: identifier(error.code), cause: identifier(error.cause),
    message: safeDiagnosticText(error.message), next: safeDiagnosticText(error.next) };
}
export function observeOwnedOpenBao(root, run = execFileSync) {
  const args = ["--target", "browser-runtime", "openbao", "status", "--json"];
  const options = { cwd: path.join(root, "work"), env: { ...process.env,
    XDG_DATA_HOME: path.join(root, "data"), XDG_CONFIG_HOME: path.join(root, "config") },
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 35000, maxBuffer: 65536 };
  try {
    const value = JSON.parse(run(path.join(root, "baha"), args, options));
    const keys = ["initialized", "unsealed", "manager_ready"];
    if (!keys.every(key => typeof value[key] === "boolean")) return { outcome: "invalid-status" };
    return { outcome: "observed", ...Object.fromEntries(keys.map(key => [key, value[key]])) };
  } catch (error) {
    let publicError;
    try { publicError = safePublicError(JSON.parse(error.stderr?.toString() ?? "").error); } catch { /* Raw CLI output is never retained. */ }
    return { outcome: "unavailable", exit_status: Number.isInteger(error.status) ? error.status : undefined,
      timed_out: error.code === "ETIMEDOUT", ...(publicError ? { error: publicError } : {}) };
  }
}
