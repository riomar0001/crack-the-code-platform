#!/usr/bin/env bash
# Start, stop and inspect the CTFd stack for a local (LAN) event.
#
#   ./start-event.sh            build + start everything
#   ./start-event.sh status     container status + URLs
#   ./start-event.sh logs       follow CTFd logs
#   ./start-event.sh restart    restart CTFd (after code/plugin changes)
#   ./start-event.sh stop       stop everything (data is kept in .data)
#
# Env: WORKERS=8 ./start-event.sh   (only used when .event.env is first created)
#      NO_BUILD=1 ./start-event.sh  (skip image rebuild)
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE=".event.env"
ACTION="${1:-start}"
WORKERS="${WORKERS:-4}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.event.yml)

step() { printf '\033[36m==> %s\033[0m\n' "$*"; }

compose() {
    docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" "$@"
}

lan_ips() {
    hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | grep -vE '^(127|169\.254|172\.17)\.' || true
}

show_urls() {
    echo
    printf '\033[32mCTFd is reachable at:\033[0m\n'
    echo "  This machine : http://localhost"
    for ip in $(lan_ips); do echo "  Participants : http://$ip"; done
    echo
}

command -v docker >/dev/null || { echo "docker not found. Install Docker Engine first." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Cannot talk to Docker. Is it running, and is your user in the 'docker' group (or use sudo)?" >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "The 'docker compose' plugin is missing." >&2; exit 1; }

if [ -f docker-compose.instances.yml ]; then
    DOCKER_SOCKET_GID="$(docker run --rm -v /var/run/docker.sock:/var/run/docker.sock alpine:3.23 stat -c '%g' /var/run/docker.sock)"
    [[ "$DOCKER_SOCKET_GID" =~ ^[0-9]+$ ]] || { echo "Could not determine the Docker socket group." >&2; exit 1; }
    export DOCKER_SOCKET_GID
    COMPOSE_FILES+=(-f docker-compose.instances.yml)
fi

# Secret key: generate once, reuse afterwards (changing it logs everyone out)
if [ ! -f "$ENV_FILE" ]; then
    step "Generating SECRET_KEY in $ENV_FILE"
    KEY="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    umask 077
    printf 'SECRET_KEY=%s\nWORKERS=%s\n' "$KEY" "$WORKERS" > "$ENV_FILE"
fi

case "$ACTION" in
    stop)    step "Stopping CTFd stack"; compose down; exit 0 ;;
    status)  compose ps; show_urls; exit 0 ;;
    logs)    compose logs -f --tail 100 ctfd; exit 0 ;;
    restart) step "Restarting CTFd"; compose restart ctfd; exit 0 ;;
    start)   ;;
    *)       echo "Usage: $0 [start|stop|status|logs|restart]" >&2; exit 1 ;;
esac

step "Starting CTFd stack"
if [ -n "${NO_BUILD:-}" ]; then compose up -d; else compose up -d --build; fi

step "Waiting for CTFd to respond (first start can take a minute)"
ready=0
for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null --max-time 3 http://localhost/healthcheck 2>/dev/null; then ready=1; break; fi
    sleep 2
done
[ "$ready" = 1 ] || echo "WARNING: CTFd did not answer in time. Check: $0 logs" >&2

# Firewall: only hint, since firewall tooling varies by distro
if command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw status | grep -qE '(^|\s)80(/tcp)?\s+ALLOW' || echo "NOTE: ufw is active and port 80 may be blocked. Run: sudo ufw allow 80/tcp"
elif command -v firewall-cmd >/dev/null && firewall-cmd --state >/dev/null 2>&1; then
    firewall-cmd --list-services 2>/dev/null | grep -qw http || echo "NOTE: firewalld is active and port 80 may be blocked. Run: sudo firewall-cmd --add-service=http --permanent && sudo firewall-cmd --reload"
fi

show_urls
echo "First run? Open the URL and complete the CTFd setup wizard."
echo "Stop with: $0 stop"
