#!/usr/bin/env bash
# 60-install-xserver.sh - Install X Server and chromium for UI display

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root
check_required_user
load_ui_url

log_info "===== Step 6: Installing X Server and Browser ====="
echo ""

log_step "Installing X Server packages..."
apt-get install -y --no-install-recommends \
  xserver-xorg \
  x11-xserver-utils \
  xinit \
  openbox \
  unclutter

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

log_info "X Server and browser installed successfully"
echo ""

# Create .xinitrc for devicecontrol user
USER_HOME=$(eval echo ~$DC2_USER)
XINITRC="$USER_HOME/.xinitrc"

log_step "Creating .xinitrc for $DC2_USER..."

cat > "$XINITRC" << 'EOF'
#!/bin/sh

# Log file for debugging
LOGFILE="/tmp/kiosk-session.log"
exec > "$LOGFILE" 2>&1
echo "=== Kiosk session started at $(date) ==="

# Disable screensaver and power management
xset s off
xset -dpms
xset s noblank

# Hide cursor when idle
unclutter &

# Start Openbox window manager
openbox-session &

# Wait for DeviceControl2 service
echo "Waiting for DeviceControl2 service..."
MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
  if systemctl is-active --quiet devicecontrol.service; then
    echo "Service is running!"
    break
  fi
  sleep 1
  COUNTER=$((COUNTER + 1))
done

# Wait for HTTP server
echo "Waiting for HTTP server..."
sleep 5

# Launch browser in kiosk mode
echo "Launching browser to: DC2_UI_URL_PLACEHOLDER"
EOF

# Add browser command with URL
echo "$BROWSER_CMD \\" >> "$XINITRC"
echo "  --noerrdialogs \\" >> "$XINITRC"
echo "  --kiosk \\" >> "$XINITRC"
echo "  --disable-infobars \\" >> "$XINITRC"
echo "  --disable-session-crashed-bubble \\" >> "$XINITRC"
echo "  --disable-features=TranslateUI \\" >> "$XINITRC"
echo "  --incognito \\" >> "$XINITRC"
echo "  $DC2_UI_URL" >> "$XINITRC"

chmod +x "$XINITRC"
chown "$DC2_USER:$DC2_USER" "$XINITRC"

# Create .bash_profile to auto-start X on TTY1
BASH_PROFILE="$USER_HOME/.bash_profile"

log_step "Creating .bash_profile for $DC2_USER..."

cat > "$BASH_PROFILE" << 'EOF'
# Auto-start X on TTY1
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  startx
fi
EOF

chown "$DC2_USER:$DC2_USER" "$BASH_PROFILE"

log_info "X Server configured to auto-start on TTY1"
log_info "Browser URL: $DC2_UI_URL"
echo ""
