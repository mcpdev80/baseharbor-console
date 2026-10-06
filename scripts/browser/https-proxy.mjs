import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import path from "node:path";

const root = process.env.BASEHARBOR_BROWSER_FIXTURE;
if (!root || !path.isAbsolute(root)) throw Error("An isolated fixture directory is required");
const ca = fs.readFileSync(path.join(root, "ca.crt"));
const server = https.createServer({ cert: fs.readFileSync(path.join(root, "server.crt")), key: fs.readFileSync(path.join(root, "server.key")) }, (req, res) => {
  const route = req.url || "/";
  const identity = route.startsWith("/realms/") || route.startsWith("/resources/");
  const core = route.startsWith("/api/") || route === "/healthz" || route === "/readyz";
  const transport = core ? https : http;
  const upstream = transport.request({ hostname: "127.0.0.1", port: identity ? 18080 : core ? 19443 : 13000,
    path: route, method: req.method, ca, servername: "localhost",
    headers: { ...req.headers, host: "localhost:8443", "x-forwarded-host": "localhost:8443", "x-forwarded-proto": "https", "x-forwarded-port": "8443" },
    timeout: 120000 }, response => {
      res.writeHead(response.statusCode || 502, response.headers); response.pipe(res);
    });
  upstream.on("error", () => { if (!res.headersSent) res.writeHead(502); res.end(); });
  upstream.on("timeout", () => upstream.destroy());
  req.on("aborted", () => upstream.destroy());
  res.on("close", () => upstream.destroy());
  req.pipe(upstream);
});
server.listen(8443, "127.0.0.1");
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.close(() => process.exit(0)));
