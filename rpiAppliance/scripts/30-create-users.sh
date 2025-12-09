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
  adduser --disabled-password --gecos "Kiosk User" --home "$KIOSK_HOME" "$KIOSK_USER"
  log_info "Kiosk user $KIOSK_USER created with home directory $KIOSK_HOME"
else
  log_warn "User $KIOSK_USER already exists, checking configuration..."
  
  # Check and fix shell if it's nologin
  CURRENT_SHELL=$(getent passwd "$KIOSK_USER" | cut -d: -f7)
  if [[ "$CURRENT_SHELL" == "/usr/sbin/nologin" || "$CURRENT_SHELL" == "/bin/false" ]]; then
    log_info "Fixing shell for $KIOSK_USER (was: $CURRENT_SHELL)"
    usermod -s /bin/bash "$KIOSK_USER"
  fi
  
  # Check and fix home directory
  CURRENT_HOME=$(getent passwd "$KIOSK_USER" | cut -d: -f6)
  if [[ "$CURRENT_HOME" != "$KIOSK_HOME" ]]; then
    log_info "Fixing home directory for $KIOSK_USER (was: $CURRENT_HOME)"
    usermod -d "$KIOSK_HOME" -m "$KIOSK_USER" 2>/dev/null || {
      # If -m fails (home doesn't exist), create it manually
      mkdir -p "$KIOSK_HOME"
      usermod -d "$KIOSK_HOME" "$KIOSK_USER"
    }
  fi
  
  # Ensure home directory exists and has correct ownership
  if [[ ! -d "$KIOSK_HOME" ]]; then
    log_info "Creating home directory $KIOSK_HOME"
    mkdir -p "$KIOSK_HOME"
  fi
  chown -R "$KIOSK_USER:$KIOSK_USER" "$KIOSK_HOME"
fi
