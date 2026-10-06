#!/usr/bin/env bash
set -euo pipefail
: "${BASEHARBOR_BROWSER_FIXTURE:?isolated fixture directory required}"
: "${BASEHARBOR_BROWSER_CORE_SOURCE:?exact Core checkout required}"
root="$BASEHARBOR_BROWSER_FIXTURE"
[[ "$root" == /* ]]
export XDG_DATA_HOME="$root/data"
export XDG_CONFIG_HOME="$root/config"
mkdir -p "$BASEHARBOR_BROWSER_CORE_SOURCE/scripts/browser-terminal-fixture"
cp scripts/browser/terminal-fixture.go "$BASEHARBOR_BROWSER_CORE_SOURCE/scripts/browser-terminal-fixture/main.go"
project="$(cd "$BASEHARBOR_BROWSER_CORE_SOURCE"; go run ./scripts/browser-terminal-fixture)"
[[ "$project" =~ ^[a-zA-Z0-9_-]+$ ]]
container="baseharbor-browser-terminal-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
echo "$container" > "$root/terminal.container"
docker pull docker.io/library/alpine:3.22 >/dev/null
image="$(docker image inspect docker.io/library/alpine:3.22 --format '{{index .RepoDigests 0}}')"
[[ "$image" == *@sha256:* ]]
echo "$image" > "$root/terminal.image"
docker run --detach --name "$container" --memory 64m --cpus 0.5 \
 --user 1000:1000 --read-only --tmpfs /tmp:rw,nosuid,nodev,noexec,size=1m,mode=1777 --cap-drop ALL --security-opt no-new-privileges \
 --label baseharbor.browser-qualification=true \
 --label "com.docker.compose.project=$project" --label com.docker.compose.service=shell \
 "$image" /bin/sh -c 'printf "browser-log-ready\n"; while test ! -f /tmp/next-log; do sleep 1; done; printf "browser-log-next\n"; exec sleep 600' >/dev/null
