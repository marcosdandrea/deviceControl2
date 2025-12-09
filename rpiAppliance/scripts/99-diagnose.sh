#!/usr/bin/env bash
# 99-diagnose.sh - Diagnostic script for DeviceControl2 installation

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

echo ""
echo "======================================================================="
echo ""
echo "         DeviceControl2 - Installation Diagnostic"
echo ""
echo "======================================================================="
echo ""

# System Information
log_info "=== System Information ==="
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  echo "  OS: $PRETTY_NAME"
  echo "  Version: $VERSION_ID ($VERSION_CODENAME)"
fi
echo ""

# User Check
log_info "=== User Configuration ==="
if id "$DC2_USER" &>/dev/null; then
  log_info "[OK] User '$DC2_USER' exists"
  echo "  Home: $(eval echo ~$DC2_USER)"
  echo "  Shell: $(getent passwd "$DC2_USER" | cut -d: -f7)"
else
  log_error "[FAIL] User '$DC2_USER' does NOT exist"
fi
echo ""

# Node.js
log_info "=== Node.js Installation ==="
if [[ -f "$NODE_BIN" ]]; then
  VERSION=$("$NODE_BIN" --version)
  log_info "[OK] Node.js installed: $VERSION"
else
  log_error "[FAIL] Node.js NOT found at $NODE_BIN"
fi
echo ""

# DeviceControl2
log_info "=== DeviceControl2 Installation ==="
if [[ -d "$DC2_INSTALL_DIR" ]]; then
  log_info "[OK] Directory exists: $DC2_INSTALL_DIR"
  if [[ -f "$DC2_INSTALL_DIR/main.js" ]]; then
    log_info "[OK] main.js found"
  else
    log_error "[FAIL] main.js NOT found"
  fi
  echo "  Size: $(du -sh "$DC2_INSTALL_DIR" | cut -f1)"
  echo "  Owner: $(stat -c '%U:%G' "$DC2_INSTALL_DIR")"
else
  log_error "[FAIL] Directory does NOT exist: $DC2_INSTALL_DIR"
fi
echo ""

# Service
log_info "=== DeviceControl2 Service ==="
if systemctl list-unit-files | grep -q "devicecontrol.service"; then
  log_info "[OK] Service is registered"
  
  if systemctl is-enabled --quiet devicecontrol.service; then
    log_info "[OK] Service is enabled"
  else
    log_warn "[WARN] Service is NOT enabled"
  fi
  
  if systemctl is-active --quiet devicecontrol.service; then
    log_info "[OK] Service is RUNNING"
  else
    log_error "[FAIL] Service is NOT running"
  fi
  
  echo ""
  echo "  Recent logs:"
  journalctl -u devicecontrol.service -n 10 --no-pager | sed 's/^/    /'
else
  log_error "[FAIL] Service NOT registered"
fi
echo ""

# Autologin
log_info "=== Autologin Configuration ==="
if [[ -f "/etc/systemd/system/getty@tty1.service.d/autologin.conf" ]]; then
  log_info "[OK] Autologin configured"
else
  log_error "[FAIL] Autologin NOT configured"
fi
echo ""

# X Server
log_info "=== X Server Configuration ==="
USER_HOME=$(eval echo ~$DC2_USER)

if command -v startx >/dev/null; then
  log_info "[OK] X Server installed"
else
  log_error "[FAIL] X Server NOT installed"
fi

if [[ -f "$USER_HOME/.xinitrc" ]]; then
  log_info "[OK] .xinitrc exists"
else
  log_error "[FAIL] .xinitrc NOT found"
fi

if [[ -f "$USER_HOME/.bash_profile" ]]; then
  log_info "[OK] .bash_profile exists"
else
  log_error "[FAIL] .bash_profile NOT found"
fi

if command -v $BROWSER_CMD >/dev/null; then
  log_info "[OK] Browser installed: $BROWSER_CMD"
else
  log_error "[FAIL] Browser NOT found: $BROWSER_CMD"
fi

if pgrep -x Xorg >/dev/null; then
  log_info "[OK] X Server is RUNNING"
else
  log_warn "[WARN] X Server is NOT running (will start after reboot/login on TTY1)"
fi
echo ""

# Plymouth
log_info "=== Plymouth Configuration ==="
if command -v plymouth-set-default-theme >/dev/null; then
  THEME=$(plymouth-set-default-theme)
  log_info "[OK] Plymouth installed"
  echo "  Current theme: $THEME"
  
  if [[ "$THEME" == "$PLYMOUTH_THEME_NAME" ]]; then
    log_info "[OK] DeviceControl2 theme active"
    if [[ -f "$PLYMOUTH_THEME_DIR/splash.png" ]]; then
      log_info "[OK] Splash image installed"
    else
      log_warn "[WARN] Splash image NOT found"
    fi
  else
    log_warn "[WARN] Custom theme NOT set"
  fi
else
  log_warn "[WARN] Plymouth NOT installed (splash screen disabled)"
fi
echo ""

# Network
log_info "=== Network Status ==="
if curl -s --max-time 5 http://localhost:8080 >/dev/null 2>&1; then
  log_info "[OK] DeviceControl2 UI responding on port 8080"
else
  log_warn "[WARN] UI not responding (service may be starting)"
fi
echo ""

log_info "=== Diagnostic Complete ==="
echo ""
