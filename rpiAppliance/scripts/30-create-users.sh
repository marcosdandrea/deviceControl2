#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

log_info "Creating DC2 system user: $DC2_USER"
if ! id -u "$DC2_USER" >/dev/null 2>&1; then
  adduser --system --group --home "$DC2_INSTALL_DIR" "$DC2_USER"
else
  log_warn "User $DC2_USER already exists, skipping."
fi

log_info "Creating kiosk user: $KIOSK_USER"
if ! id -u "$KIOSK_USER" >/dev/null 2>&1; then
  adduser "$KIOSK_USER"
else
  log_warn "User $KIOSK_USER already exists, skipping."
fi
