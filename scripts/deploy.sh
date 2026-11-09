#!/usr/bin/env bash
set -euo pipefail
cd /opt/thesisflow
: "${PORTAL_IMAGE:?Pass the image digest from CI}"
compose=(docker compose -f compose.production.yaml)
previous="$(cat .deployed-image 2>/dev/null || true)"
"${compose[@]}" pull app
healthy=false
if "${compose[@]}" up -d --wait --wait-timeout 120; then
  for attempt in $(seq 1 20); do
    if curl --fail --silent --max-time 5 http://127.0.0.1:3000/api/health > /dev/null; then healthy=true; break; fi
    sleep 3
  done
fi
if [ "$healthy" = true ]; then
  printf '%s\n' "$PORTAL_IMAGE" > .deployed-image
else
  if [ -n "$previous" ]; then
    export PORTAL_IMAGE="$previous"
    "${compose[@]}" up -d --wait --wait-timeout 120
  fi
  exit 1
fi
