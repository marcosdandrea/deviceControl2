#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

SERVICE_TEMPLATE="$SCRIPT_DIR/../templates/devicecontrol.service.tpl"
SERVICE_FILE="/etc/systemd/system/devicecontrol.service"

if [[ ! -f "$SERVICE_TEMPLATE" ]]; then
  log_error "Service template not found at $SERVICE_TEMPLATE"
  exit 1
fi

log_info "Generating systemd service for DeviceControl 2 at $SERVICE_FILE ..."

sed -e "s|{{DC2_USER}}|$DC2_USER|g"     -e "s|{{DC2_INSTALL_DIR}}|$DC2_INSTALL_DIR|g"     -e "s|{{NODE_BIN}}|$NODE_BIN|g"     "$SERVICE_TEMPLATE" > "$SERVICE_FILE"

systemctl daemon-reload
systemctl enable devicecontrol.service
systemctl restart devicecontrol.service

log_info "DeviceControl 2 service installed and restarted."
