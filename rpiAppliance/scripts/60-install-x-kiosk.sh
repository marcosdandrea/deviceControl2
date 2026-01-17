#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

log_info "Installing minimal X, Openbox, unclutter and browser..."

apt install -y --no-install-recommends   xserver-xorg   x11-xserver-utils   xinit   openbox   unclutter

# Try to ensure browser is installed
if ! command -v "$BROWSER_CMD" >/dev/null 2>&1; then
  log_info "Browser command $BROWSER_CMD not found, installing browser..."
  # Try chromium first (Debian 12+), fallback to chromium-browser (older)
  if apt-cache show chromium >/dev/null 2>&1; then
    apt install -y chromium
  else
    apt install -y chromium-browser
  fi
fi

if ! command -v "$BROWSER_CMD" >/dev/null 2>&1; then
  log_warn "$BROWSER_CMD still not found; falling back to 'chromium' if available."
  if command -v chromium >/dev/null 2>&1; then
    BROWSER_CMD="chromium"
  fi
fi

if ! command -v "$BROWSER_CMD" >/dev/null 2>&1; then
  log_error "No suitable browser command found (chromium / chromium-browser)."
  exit 1
fi

log_info "Configuring autologin on TTY1 for user $KIOSK_USER ..."
OVERRIDE_DIR="/etc/systemd/system/getty@tty1.service.d"
mkdir -p "$OVERRIDE_DIR"

TPL="$SCRIPT_DIR/../templates/getty-autologin.conf.tpl"
CONF="$OVERRIDE_DIR/autologin.conf"

sed -e "s|{{KIOSK_USER}}|$KIOSK_USER|g" "$TPL" > "$CONF"

systemctl daemon-reload
systemctl restart getty@tty1.service

log_info "Creating .bash_profile for kiosk user..."
BASH_PROFILE_TPL="$SCRIPT_DIR/../templates/bash_profile_kiosk.tpl"
sudo -u "$KIOSK_USER" bash -c "cat > /home/$KIOSK_USER/.bash_profile" < "$BASH_PROFILE_TPL"

log_info "Creating .xinitrc for kiosk user..."
XINIT_TPL="$SCRIPT_DIR/../templates/xinitrc.tpl"
XINIT_FILE="/home/$KIOSK_USER/.xinitrc"

sed -e "s|{{BROWSER_CMD}}|$BROWSER_CMD|g"     -e "s|{{DC2_UI_URL}}|$DC2_UI_URL|g"     "$XINIT_TPL" > "$XINIT_FILE"

chown "$KIOSK_USER:$KIOSK_USER" "/home/$KIOSK_USER/.bash_profile" "$XINIT_FILE"
chmod +x "$XINIT_FILE"

log_info "X kiosk environment configured. Reboot to test the full flow."
