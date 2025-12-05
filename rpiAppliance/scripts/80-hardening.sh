#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root

log_info "Disabling unused services where applicable (bluetooth, avahi-daemon)..."

systemctl disable --now bluetooth 2>/dev/null || log_warn "bluetooth service not present."
systemctl disable --now avahi-daemon 2>/dev/null || log_warn "avahi-daemon service not present."

log_info "Hardening step completed (basic). Add more rules as needed (firewall, watchdog, etc.)."
