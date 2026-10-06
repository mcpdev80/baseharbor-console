#!/usr/bin/env bash
set -euo pipefail
: "${BASEHARBOR_BROWSER_FIXTURE:?isolated fixture directory required}"
: "${BASEHARBOR_BROWSER_CORE_SOURCE:?exact Core checkout required}"
: "${BASEHARBOR_BROWSER_CORE_COMMIT:?exact Core commit required}"
: "${BASEHARBOR_API_DATABASE_URL:?ephemeral PostgreSQL database required}"
: "${BASEHARBOR_BROWSER_KEYCLOAK_IMAGE:?immutable Keycloak image required}"
[[ "$BASEHARBOR_BROWSER_FIXTURE" == /* ]]
[[ "$BASEHARBOR_BROWSER_CORE_COMMIT" =~ ^[0-9a-f]{40}$ ]]
[[ "$BASEHARBOR_BROWSER_KEYCLOAK_IMAGE" == *@sha256:* ]]
test "$(git -C "$BASEHARBOR_BROWSER_CORE_SOURCE" rev-parse HEAD)" = "$BASEHARBOR_BROWSER_CORE_COMMIT"
root="$BASEHARBOR_BROWSER_FIXTURE"
mkdir -p "$root"
chmod 700 "$root"
node scripts/browser/prepare-realm.mjs
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -keyout "$root/ca.key" -out "$root/ca.crt" -days 1 -subj '/CN=Isolated BaseHarbor Browser Test CA' >/dev/null 2>&1
openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -keyout "$root/server.key" -out "$root/server.csr" -subj '/CN=localhost' >/dev/null 2>&1
cat > "$root/server.ext" <<'EXT'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost,IP:127.0.0.1
EXT
openssl x509 -req -in "$root/server.csr" -CA "$root/ca.crt" -CAkey "$root/ca.key" -CAcreateserial -out "$root/server.crt" -days 1 -extfile "$root/server.ext" >/dev/null 2>&1
chmod 600 "$root"/*.key
node scripts/browser/https-proxy.mjs > "$root/proxy.log" 2>&1 &
echo "$!" > "$root/proxy.pid"
container="baseharbor-browser-keycloak-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
echo "$container" > "$root/keycloak.container"
docker run -d --name "$container" --label baseharbor.browser-qualification=true --memory=1g --cpus=1 \
  -p 127.0.0.1:18080:8080 -v "$root/realm:/opt/keycloak/data/import:ro" \
  "$BASEHARBOR_BROWSER_KEYCLOAK_IMAGE" start-dev --import-realm \
  --hostname=https://localhost:8443 --proxy-headers=xforwarded >/dev/null
ready=false
for attempt in $(seq 1 120); do
  if curl --silent --fail --cacert "$root/ca.crt" https://localhost:8443/realms/baseharbor-browser/.well-known/openid-configuration > "$root/oidc-metadata.json"; then ready=true; break; fi
  sleep 1
done
$ready || { echo 'Real Keycloak issuer did not start' >&2; exit 1; }
node -e 'const fs=require("node:fs");const value=JSON.parse(fs.readFileSync(process.argv[1]));if(value.issuer!=="https://localhost:8443/realms/baseharbor-browser")throw Error("Issuer differs")' "$root/oidc-metadata.json"
export BASEHARBOR_API_OIDC_ISSUER=https://localhost:8443/realms/baseharbor-browser
export BASEHARBOR_API_OIDC_AUDIENCES=baseharbor-api
export SSL_CERT_FILE="$root/ca.crt"
mkdir -p "$BASEHARBOR_BROWSER_CORE_SOURCE/scripts/browser-test-fixture"
cp scripts/browser/seed-database.go "$BASEHARBOR_BROWSER_CORE_SOURCE/scripts/browser-test-fixture/main.go"
(
 cd "$BASEHARBOR_BROWSER_CORE_SOURCE"
 go run ./scripts/browser-test-fixture
 go build -trimpath -o "$root/baha" ./cmd/baha
)
export BASEHARBOR_API_LISTEN_ADDR=127.0.0.1:19443
export BASEHARBOR_API_TLS_CERT_FILE="$root/server.crt"
export BASEHARBOR_API_TLS_KEY_FILE="$root/server.key"
export XDG_DATA_HOME="$root/data"
export XDG_CONFIG_HOME="$root/config"
export BASEHARBOR_LOGS_ENABLED=false
mkdir -p "$root/work"
(cd "$root/work"; exec "$root/baha" serve) > "$root/core.log" 2>&1 &
echo "$!" > "$root/core.pid"
ready=false
for attempt in $(seq 1 90); do
  if curl --silent --fail --cacert "$root/ca.crt" https://localhost:19443/readyz >/dev/null; then ready=true; break; fi
  sleep 1
done
$ready || { echo 'Actual Core server did not become ready' >&2; tail -30 "$root/core.log" >&2; exit 1; }
status="$(curl --silent --cacert "$root/ca.crt" -o /dev/null -w '%{http_code}' https://localhost:19443/api/v1/machine/discovery)"
test "$status" = 401
printf '%s\n' 'Actual Core, PostgreSQL and Keycloak fixture ready'
