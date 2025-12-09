#!/usr/bin/env bash
# 60-install-xserver.sh - Install X Server, LightDM and chromium for UI display

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root
check_required_user
load_ui_url

log_info "===== Step 6: Installing X Server, LightDM and Browser ====="
echo ""

log_step "Installing X Server packages..."
apt-get install -y --no-install-recommends \
  xserver-xorg \
  x11-xserver-utils \
  openbox \
  unclutter

log_step "Installing LightDM display manager..."
# Set debconf selection to avoid interactive prompts
echo "lightdm shared/default-x-display-manager select lightdm" | debconf-set-selections
DEBIAN_FRONTEND=noninteractive apt-get install -y lightdm

log_step "Enabling LightDM service..."
systemctl enable lightdm.service
systemctl set-default graphical.target

log_step "Installing Chromium browser..."
if apt-cache show chromium >/dev/null 2>&1; then
  apt-get install -y chromium
else
  apt-get install -y chromium-browser
fi

# Verify browser is available
if ! command -v $BROWSER_CMD >/dev/null 2>&1; then
  log_error "Browser command '$BROWSER_CMD' not found after installation"
  exit 1
fi

log_info "X Server, LightDM and browser installed successfully"
echo ""

# Configure Openbox autostart for kiosk session
USER_HOME=$(eval echo ~$DC2_USER)
OPENBOX_DIR="$USER_HOME/.config/openbox"
AUTOSTART="$OPENBOX_DIR/autostart"

log_step "Configuring Openbox autostart for kiosk mode..."
mkdir -p "$OPENBOX_DIR"

cat > "$AUTOSTART" << EOF
#!/bin/bash

# Log file for debugging
LOGFILE="/tmp/kiosk-session.log"
exec > "\$LOGFILE" 2>&1
echo "=== Kiosk session started at \$(date) ==="

# Disable screensaver and power management
xset s off
xset -dpms
xset s noblank

# Hide cursor when idle
unclutter &

# Wait for DeviceControl2 service
echo "Waiting for DeviceControl2 service..."
MAX_WAIT=60
COUNTER=0
while [ \$COUNTER -lt \$MAX_WAIT ]; do
  if systemctl is-active --quiet devicecontrol.service; then
    echo "Service is running!"
    break
  fi
  sleep 1
  COUNTER=\$((COUNTER + 1))
done

# Wait for HTTP server to be ready
echo "Waiting for HTTP server..."
sleep 3

# Launch browser in kiosk mode
echo "Launching browser to: $DC2_UI_URL"
$BROWSER_CMD \\
  --noerrdialogs \\
  --kiosk \\
  --disable-infobars \\
  --disable-session-crashed-bubble \\
  --disable-features=TranslateUI \\
  --incognito \\
  $DC2_UI_URL
EOF

chmod +x "$AUTOSTART"
chown -R "$DC2_USER:$DC2_USER" "$OPENBOX_DIR"

log_info "Openbox kiosk session configured"
log_info "Browser URL: $DC2_UI_URL"
echo ""
