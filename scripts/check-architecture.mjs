import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = new URL("../src/", import.meta.url);
const violations = [];

const forbidden = [
  { pattern: /docker\.sock/gi, message: "direct Docker socket access" },
  { pattern: /podman\.sock/gi, message: "direct Podman socket access" },
  { pattern: /runtime_command/g, message: "generic runtime command channel" },
  { pattern: /workspace_command/g, message: "generic workspace command channel" },
  { pattern: /node:child_process|child_process/g, message: "CLI/subprocess orchestration from Console" },
  { pattern: /\bWebSocket\s*\(/g, message: "invented bidirectional stream transport before #767" },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (![".ts", ".tsx", ".js", ".jsx"].includes(extname(entry.name))) continue;

    const text = await readFile(path, "utf8");
    const display = relative(new URL("..", root).pathname, path);

    if (/\/api\/v1\//.test(text) && !path.endsWith(join("lib", "baseharbor", "discovery.ts"))) {
      violations.push(`${display}: machine API bootstrap outside canonical discovery module`);
    }
    if (path.endsWith(join("lib", "baseharbor", "discovery.ts"))) {
      const paths = text.match(/\/api\/v1\/[^"'\s]*/g) ?? [];
      if (paths.length !== 1 || paths[0] !== "/api/v1/machine/discovery") {
        violations.push(`${display}: only the documented discovery bootstrap may be fixed`);
      }
    }

    for (const rule of forbidden) {
      for (const match of text.matchAll(rule.pattern)) {
        violations.push(`${display}:${lineOf(text, match.index ?? 0)}: ${rule.message}`);
      }
    }

    if (!path.endsWith(join("lib", "baseharbor", "client.ts")) && /\bfetch\s*\(/.test(text)) {
      violations.push(`${display}: direct fetch outside BaseHarbor HTTP transport`);
    }

    if (!path.endsWith(join("lib", "baseharbor", "streams.ts")) && /\bEventSource\s*\(/.test(text)) {
      violations.push(`${display}: EventSource outside BaseHarbor stream transport`);
    }
  }
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

await walk(root.pathname);

if (violations.length) {
  console.error("BaseHarbor Console architecture boundary violations:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("BaseHarbor Console architecture boundaries: OK");
