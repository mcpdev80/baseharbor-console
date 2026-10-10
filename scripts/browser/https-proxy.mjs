import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import path from "node:path";

const root = process.env.BASEHARBOR_BROWSER_FIXTURE;
if (!root || !path.isAbsolute(root)) throw Error("An isolated fixture directory is required");
const ca = fs.readFileSync(path.join(root, "ca.crt"));
const logStreams = [];
function recordLogStreams() {
  const destination = path.join(root, "log-stream-observations.json");
  fs.writeFileSync(destination + ".tmp", JSON.stringify(logStreams), { mode: 0o600 });
  fs.renameSync(destination + ".tmp", destination);
}
const server = https.createServer({ cert: fs.readFileSync(path.join(root, "server.crt")), key: fs.readFileSync(path.join(root, "server.key")) }, (req, res) => {
  const route = req.url || "/";
  const identity = route.startsWith("/realms/") || route.startsWith("/resources/");
  const core = route.startsWith("/api/") || route === "/healthz" || route === "/readyz";
  const transport = core ? https : http;
  // The managed Core listener is enabled after first-installation bootstrap.
  // Preserve its real managed trust alongside the initial isolated API CA.
  const managedCA = path.join(root, "connector-ca.pem");
  const upstreamCA = core && fs.existsSync(managedCA) ? Buffer.concat([ca, Buffer.from("\n"), fs.readFileSync(managedCA)]) : ca;
  const upstream = transport.request({ hostname: "127.0.0.1", port: identity ? 18080 : core ? 19443 : 13000,
    path: route, method: req.method, ca: upstreamCA, servername: "localhost",
    headers: { ...req.headers, host: "localhost:8443", "x-forwarded-host": "localhost:8443", "x-forwarded-proto": "https", "x-forwarded-port": "8443" },
    timeout: 120000 }, response => {
      if (core && route === "/api/v1/machine/streams/logs" && response.statusCode === 200) {
        const observation = { stream: response.headers["x-baseharbor-stream-id"], resource: response.headers["x-baseharbor-resource-id"], downstream_closed: false, upstream_closed: false };
        logStreams.push(observation); recordLogStreams();
        res.on("close", () => { observation.downstream_closed = true; recordLogStreams(); });
        response.on("close", () => { observation.upstream_closed = true; recordLogStreams(); });
      }
      res.writeHead(response.statusCode || 502, response.headers);
      if (core && (response.headers["x-baseharbor-stream-id"] || String(response.headers["content-type"]).startsWith("text/event-stream"))) res.flushHeaders();
      response.pipe(res);
    });
  upstream.on("error", () => { if (!res.headersSent) res.writeHead(502); res.end(); });
  upstream.on("timeout", () => upstream.destroy());
  req.on("aborted", () => upstream.destroy());
  res.on("close", () => upstream.destroy());
  req.pipe(upstream);
});
server.listen(8443, "127.0.0.1");
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.close(() => process.exit(0)));
