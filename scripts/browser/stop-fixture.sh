#!/usr/bin/env bash
set -euo pipefail
: "${BASEHARBOR_BROWSER_FIXTURE:?isolated fixture directory required}"
root="$BASEHARBOR_BROWSER_FIXTURE"
for name in core next proxy; do
  if test -f "$root/$name.pid"; then
    pid="$(cat "$root/$name.pid")"
    [[ "$pid" =~ ^[0-9]+$ ]] && kill "$pid" 2>/dev/null || true
  fi
done
if test -f "$root/terminal.container"; then
  container="$(cat "$root/terminal.container")"
  [[ "$container" =~ ^baseharbor-browser-terminal-[a-zA-Z0-9-]+$ ]]
  docker container rm --force "$container" >/dev/null
  test -z "$(docker ps -aq --filter name="^${container}$")"
fi
if test -f "$root/keycloak.container"; then
  container="$(cat "$root/keycloak.container")"
  [[ "$container" =~ ^baseharbor-browser-keycloak-[a-zA-Z0-9-]+$ ]]
  docker container rm --force "$container" >/dev/null
  test -z "$(docker ps -aq --filter name="^${container}$")"
fi
if test -f "$root/browser-receipt.json"; then
  node -e 'const fs=require("node:fs"),p=process.argv[1];const r=JSON.parse(fs.readFileSync(p));r.cleanup="success";fs.writeFileSync(p,JSON.stringify(r,null,2)+"\n")' "$root/browser-receipt.json"
fi
python3 - <<'PY'
import os,pathlib
root=pathlib.Path(os.environ['BASEHARBOR_BROWSER_FIXTURE']).resolve()
for name in ['ca.key','server.key','server.csr','ca.srl','server.ext','realm/baseharbor-browser-realm.json']:
 (root/name).unlink(missing_ok=True)
if (root/'realm').exists(): (root/'realm').rmdir()
PY
