import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const root = process.env.BASEHARBOR_BROWSER_FIXTURE;
assert.ok(root && path.isAbsolute(root));
const repository = "mcpdev80/baseharbor-console";
assert.equal(process.env.GITHUB_REPOSITORY, repository);
assert.match(process.env.GITHUB_SHA, /^[0-9a-f]{40}$/);
assert.match(process.env.GITHUB_RUN_ID, /^[1-9][0-9]*$/);
const revision = directory => execFileSync("git", ["-C", directory, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(revision("."), process.env.GITHUB_SHA);
assert.equal(revision(".browser-core-source"), process.env.BASEHARBOR_BROWSER_CORE_COMMIT);
assert.equal(revision(".release-demo-source"), process.env.BASEHARBOR_BROWSER_DEMO_COMMIT);
const source = { schema: "baseharbor.private-integration-source/v1", source_result: "success", repository,
  commit: revision("."), core_commit: revision(".browser-core-source"), demo_commit: revision(".release-demo-source") };
assert.equal(fs.readFileSync(".browser-core-source/docs/releases/v0.4.23.demo-ref", "utf8").trim(), source.demo_commit);

const digest = createHash("sha256");
let count = 0;
function hashBuild(directory, prefix = "") {
  for (const item of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix + item.name, file = path.join(directory, item.name);
    if (relative === "cache") continue;
    assert.ok(!item.isSymbolicLink(), "Build symlink is not accepted");
    if (item.isDirectory()) hashBuild(file, relative + "/");
    else {
      assert.ok(item.isFile());
      const data = fs.readFileSync(file);
      digest.update(relative + "\0" + data.length + "\0"); digest.update(data); count++;
    }
  }
}
assert.ok(fs.existsSync(".next/BUILD_ID"));
hashBuild(".next"); assert.ok(count > 0);
// Use this job's authenticated Actions origin. No private token is written to
// files, URLs, receipt fields or diagnostics.
const token = process.env.GH_TOKEN;
assert.ok(token);
const reply = await fetch(`https://api.github.com/repos/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}/jobs?per_page=100&filter=latest`, {
  headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  signal: AbortSignal.timeout(15000), redirect: "error",
});
if (!reply.ok) throw Error("Current private Actions origin could not be authenticated");
const jobs = (await reply.json()).jobs;
const matching = jobs.filter(job => job.name === "Integration · integration/static/live-console" && job.head_sha === source.commit && job.run_attempt === Number(process.env.GITHUB_RUN_ATTEMPT));
assert.equal(matching.length, 1);
const origin = { run_id: process.env.GITHUB_RUN_ID, attempt: Number(process.env.GITHUB_RUN_ATTEMPT), job_id: matching[0].id, build_sha256: digest.digest("hex") };
for (const [name, value] of [["integration-source.json", source], ["integration-origin.json", origin]]) {
  fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
}
