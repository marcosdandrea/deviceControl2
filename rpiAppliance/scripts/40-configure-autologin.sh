#!/usr/bin/env bash
# 40-configure-autologin.sh - Configure devicecontrol user for passwordless autologin

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root
check_required_user

log_info "===== Step 4: Configuring Autologin for $DC2_USER ====="
echo ""

# Remove password for devicecontrol user
log_step "Removing password requirement for $DC2_USER..."
passwd -d "$DC2_USER"

# Configure autologin on TTY1
AUTOLOGIN_DIR="/etc/systemd/system/getty@tty1.service.d"
AUTOLOGIN_CONF="$AUTOLOGIN_DIR/autologin.conf"

log_step "Configuring autologin on TTY1..."
mkdir -p "$AUTOLOGIN_DIR"

cat > "$AUTOLOGIN_CONF" << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $DC2_USER --noclear %I \$TERM
Type=idle
EOF

log_info "Autologin configured for $DC2_USER on TTY1"
echo ""
