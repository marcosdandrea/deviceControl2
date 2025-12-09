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

# Configure LightDM autologin
LIGHTDM_CONF_DIR="/etc/lightdm/lightdm.conf.d"
LIGHTDM_CONF="$LIGHTDM_CONF_DIR/50-autologin.conf"

log_step "Configuring LightDM autologin..."

# Create config directory if it doesn't exist
mkdir -p "$LIGHTDM_CONF_DIR"

# Create LightDM configuration for autologin
cat > "$LIGHTDM_CONF" << EOF
[Seat:*]
autologin-user=$DC2_USER
autologin-user-timeout=0
user-session=openbox
greeter-session=lightdm-gtk-greeter
xserver-command=X -s 0 -dpms
EOF

log_info "LightDM autologin configured for $DC2_USER"
log_info "Session: openbox"
echo ""
