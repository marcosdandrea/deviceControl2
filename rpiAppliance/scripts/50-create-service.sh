#!/usr/bin/env bash
# 50-create-service.sh - Create systemd service for DeviceControl2

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root

log_info "===== Step 5: Creating DeviceControl2 Service ====="
echo ""

SERVICE_FILE="/etc/systemd/system/devicecontrol.service"

log_step "Creating systemd service file..."

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=DeviceControl 2 Headless Service
After=network.target

[Service]
Type=simple
User=$DC2_USER
WorkingDirectory=$DC2_INSTALL_DIR
ExecStart=$NODE_BIN $DC2_INSTALL_DIR/main.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

log_step "Reloading systemd daemon..."
systemctl daemon-reload

log_step "Enabling service to start on boot..."
systemctl enable devicecontrol.service

log_step "Starting service..."
systemctl start devicecontrol.service

# Wait a moment and check status
sleep 2
if systemctl is-active --quiet devicecontrol.service; then
  log_info "DeviceControl2 service is running"
else
  log_warn "Service may not have started correctly"
  systemctl status devicecontrol.service --no-pager || true
fi

echo ""
