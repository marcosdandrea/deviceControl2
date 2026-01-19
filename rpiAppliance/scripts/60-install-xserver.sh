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

log_step "Configuring X Server to hide cursor completely..."
# Create Xorg configuration to hide cursor at system level
mkdir -p /etc/X11/xorg.conf.d

# Configure input devices to not show cursor
cat > /etc/X11/xorg.conf.d/20-nocursor.conf << 'EOF'
Section "ServerFlags"
    Option "BlankTime" "0"
    Option "StandbyTime" "0" 
    Option "SuspendTime" "0"
    Option "OffTime" "0"
    Option "DontZap" "true"
    Option "DontVTSwitch" "true"
EndSection

Section "InputClass"
    Identifier "Touchscreen"
    MatchIsTouchscreen "on"
    Driver "libinput"
    Option "Cursor" "none"
EndSection

Section "InputClass"
    Identifier "Mouse"
    MatchIsPointer "on"
    Driver "libinput"
    Option "Cursor" "none"
EndSection
EOF

# Create invisible cursor theme
mkdir -p /usr/share/icons/blank/cursors
echo "Create blank cursor files for X11"

# Create empty cursor file
cat > /tmp/create_blank_cursor.c << 'EOF'
#include <X11/Xcursor/Xcursor.h>
#include <stdio.h>

int main() {
    XcursorImage *image = XcursorImageCreate(1, 1);
    if (!image) return 1;
    
    image->xhot = 0;
    image->yhot = 0;
    image->delay = 0;
    
    // Fill with transparent pixels
    for (int i = 0; i < image->width * image->height; i++) {
        image->pixels[i] = 0x00000000; // Transparent
    }
    
    XcursorImageDestroy(image);
    return 0;
}
EOF

# Alternative: Create simple invisible cursor using existing tools
mkdir -p /usr/share/pixmaps
cat > /usr/share/pixmaps/blank.xpm << 'EOF'
/* XPM */
static char * blank_xpm[] = {
"1 1 1 1",
" 	c None",
" "};
EOF

# Create blank cursor theme
mkdir -p /usr/share/icons/blank/{cursors,index.theme}
echo '[Icon Theme]
Name=Blank
Comment=Invisible cursor theme' > /usr/share/icons/blank/index.theme

# Create actual blank cursor files
for cursor in default arrow left_ptr hand2 watch xterm; do
    printf '\x00\x00\x00\x00\x00\x00\x00\x00' > /usr/share/icons/blank/cursors/$cursor
done

log_step "Configuring LightDM to use invisible cursor..."
# Configure LightDM to use blank cursor theme
mkdir -p /etc/lightdm/lightdm.conf.d
cat > /etc/lightdm/lightdm.conf.d/90-nocursor.conf << 'EOF'
[Seat:*]
greeter-setup-script=/usr/bin/numlockx on
greeter-session=lightdm-gtk-greeter
user-session=openbox
session-setup-script=/usr/local/bin/setup-kiosk-session

[LightDM]
minimum-display-number=0
minimum-vt=7
EOF

# Create session setup script to configure cursor
cat > /usr/local/bin/setup-kiosk-session << 'EOF'
#!/bin/bash
# Set invisible cursor theme for the session
export XCURSOR_THEME=blank
export XCURSOR_SIZE=1

# Create blank cursor bitmap
printf '\000\000\000\000\000\000\000\000' > /tmp/blank_cursor.xbm
printf '\000\000\000\000\000\000\000\000' > /tmp/blank_mask.xbm

# Apply blank cursor to root window
if [ -n "$DISPLAY" ]; then
    /usr/bin/xsetroot -cursor /tmp/blank_cursor.xbm /tmp/blank_mask.xbm 2>/dev/null || true
    # Also try alternative method
    echo "* { cursor: none !important; }" > /tmp/nocursor.css
fi
EOF

chmod +x /usr/local/bin/setup-kiosk-session

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

# Hide cursor completely using multiple methods
# Method 1: Set cursor theme to blank
export XCURSOR_THEME=blank
export XCURSOR_SIZE=1

# Method 2: Create and apply blank cursor
printf '\\000\\000\\000\\000\\000\\000\\000\\000' > /tmp/blank_cursor.xbm
printf '\\000\\000\\000\\000\\000\\000\\000\\000' > /tmp/blank_mask.xbm
xsetroot -cursor /tmp/blank_cursor.xbm /tmp/blank_mask.xbm 2>/dev/null || true

# Method 3: CSS for browser
echo "* { cursor: none !important; }" > /tmp/nocursor.css

# Method 4: Fallback with unclutter
unclutter -idle 1 -root &

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
  --user-stylesheet=file:///tmp/nocursor.css \\
  --noerrdialogs \\
  --kiosk \\
  --disable-infobars \\
  --disable-session-crashed-bubble \\
  --disable-features=TranslateUI \\
  --incognito \\
  --touch-events=enabled \\
  --disable-gesture-requirement-for-media-playbook \\
  --autoplay-policy=no-user-gesture-required \\
  $DC2_UI_URL
EOF

chmod +x "$AUTOSTART"
chown -R "$DC2_USER:$DC2_USER" "$OPENBOX_DIR"

log_info "Openbox kiosk session configured"
log_info "Browser URL: $DC2_UI_URL"
echo ""
