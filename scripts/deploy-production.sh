#!/usr/bin/env bash
set -euo pipefail

deploy_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$deploy_dir"

docker_config_dir="$deploy_dir/.docker"
install -d -m 700 "$docker_config_dir"
export DOCKER_CONFIG="$docker_config_dir"
cleanup() {
	rm -f "$docker_config_dir/config.json"
}
trap cleanup EXIT

chmod 600 production.env
compose=(docker compose --env-file production.env -f docker-compose.production.yml)

"${compose[@]}" pull
"${compose[@]}" up -d --remove-orphans

web_port=$(sed -n 's/^WEB_PORT=//p' production.env)
for attempt in $(seq 1 30); do
	if curl --fail --silent --show-error --max-time 3 "http://127.0.0.1:${web_port}/" >/dev/null; then
		"${compose[@]}" ps
		exit 0
	fi
	if [ "$attempt" -eq 30 ]; then
		break
	fi
	sleep 2
done

"${compose[@]}" ps -a
"${compose[@]}" logs --tail=100 web
exit 1
