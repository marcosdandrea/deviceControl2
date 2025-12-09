#!/usr/bin/env bash
# 70-configure-plymouth.sh - Configure Plymouth boot splash

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root

log_info "===== Step 7: Configuring Plymouth Boot Splash ====="
echo ""

# Check if splash.png exists
if [[ ! -f "$SPLASH_SOURCE" ]]; then
  log_warn "Splash image not found at: $SPLASH_SOURCE"
  log_warn "Skipping Plymouth configuration"
  log_warn "Plymouth will be configured after DeviceControl2 includes the splash image"
  exit 0
fi

log_info "Found splash image: $SPLASH_SOURCE"

log_step "Installing Plymouth..."
apt-get install -y plymouth plymouth-themes

log_step "Creating custom Plymouth theme..."
mkdir -p "$PLYMOUTH_THEME_DIR"

# Copy splash image
cp "$SPLASH_SOURCE" "$PLYMOUTH_THEME_DIR/splash.png"

# Create theme configuration
cat > "$PLYMOUTH_THEME_DIR/$PLYMOUTH_THEME_NAME.plymouth" << EOF
[Plymouth Theme]
Name=DeviceControl2
Description=DeviceControl2 Boot Splash
ModuleName=script

[script]
ImageDir=$PLYMOUTH_THEME_DIR
ScriptFile=$PLYMOUTH_THEME_DIR/$PLYMOUTH_THEME_NAME.script
EOF

# Create script file for image display
cat > "$PLYMOUTH_THEME_DIR/$PLYMOUTH_THEME_NAME.script" << 'EOF'
# Simple script to display splash image

splash_image = Image("splash.png");
screen_width = Window.GetWidth();
screen_height = Window.GetHeight();
resized_image = splash_image.Scale(screen_width, screen_height);
sprite = Sprite(resized_image);
sprite.SetPosition(0, 0, 0);
EOF

log_step "Configuring Plymouth daemon..."
# Configure Plymouth for smooth transitions
cat > /etc/plymouth/plymouthd.conf << EOF
[Daemon]
Theme=$PLYMOUTH_THEME_NAME
ShowDelay=0
DeviceTimeout=8
EOF

log_step "Setting Plymouth theme..."
plymouth-set-default-theme -R "$PLYMOUTH_THEME_NAME"

log_step "Configuring boot parameters for Plymouth..."
# Detect cmdline.txt location
CMDLINE_FILE=""
if [[ -f "/boot/firmware/cmdline.txt" ]]; then
  CMDLINE_FILE="/boot/firmware/cmdline.txt"
elif [[ -f "/boot/cmdline.txt" ]]; then
  CMDLINE_FILE="/boot/cmdline.txt"
else
  log_error "Could not find cmdline.txt"
  exit 1
fi

log_info "Found cmdline.txt at: $CMDLINE_FILE"

# Backup original cmdline.txt
cp "$CMDLINE_FILE" "${CMDLINE_FILE}.backup"

# Read current cmdline
CMDLINE=$(cat "$CMDLINE_FILE")

# Remove duplicate console parameters and add quiet splash
# Remove all console=tty1 except one, and add quiet splash if not present
CMDLINE=$(echo "$CMDLINE" | sed 's/console=tty1//g')  # Remove all console=tty1
CMDLINE=$(echo "$CMDLINE" | sed 's/  */ /g')  # Clean multiple spaces

# Add required parameters if not present
if ! echo "$CMDLINE" | grep -q "quiet"; then
  CMDLINE="$CMDLINE quiet"
fi

if ! echo "$CMDLINE" | grep -q "splash"; then
  CMDLINE="$CMDLINE splash"
fi

if ! echo "$CMDLINE" | grep -q "plymouth.ignore-serial-consoles"; then
  CMDLINE="$CMDLINE plymouth.ignore-serial-consoles"
fi

# Add console=tty1 at the end (after quiet splash)
CMDLINE="$CMDLINE console=tty1"

# Clean up extra spaces
CMDLINE=$(echo "$CMDLINE" | sed 's/  */ /g' | sed 's/^ *//' | sed 's/ *$//')

# Write back
echo "$CMDLINE" > "$CMDLINE_FILE"

log_info "Boot parameters updated"
log_info "Parameters: quiet splash plymouth.ignore-serial-consoles"

log_step "Updating initramfs..."
update-initramfs -u

log_step "Configuring Plymouth integration with LightDM..."
# LightDM will automatically handle Plymouth quit when X is ready
# Unmask services to allow normal Plymouth behavior
systemctl unmask plymouth-quit.service 2>/dev/null || true
systemctl unmask plymouth-quit-wait.service 2>/dev/null || true

log_info "Plymouth configured successfully"
log_info "Plymouth will show during boot and LightDM will handle smooth transition"
log_info "Boot splash will be shown on next reboot"
echo ""
