#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage: $0 {full|update-dc2}"
  exit 1
}

ACTION="${1:-full}"

case "$ACTION" in
  full)
    "$SCRIPT_DIR/10-install-base.sh"
    "$SCRIPT_DIR/20-install-node-nvm.sh"
    "$SCRIPT_DIR/30-create-users.sh"
    "$SCRIPT_DIR/40-download-release.sh"
    "$SCRIPT_DIR/50-configure-dc2-service.sh"
    "$SCRIPT_DIR/60-install-x-kiosk.sh"
    "$SCRIPT_DIR/70-configure-plymouth.sh"
    "$SCRIPT_DIR/80-hardening.sh"
    ;;
  update-dc2)
    "$SCRIPT_DIR/40-download-release.sh"
    systemctl restart devicecontrol.service
    ;;
  *)
    usage
    ;;
esac
