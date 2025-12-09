#!/usr/bin/env bash
# run-all.sh - Main installation script for DeviceControl2 on Raspberry Pi

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force-download)
      export FORCE_DOWNLOAD="true"
      shift
      ;;
    --version=*)
      export DC2_VERSION="${1#*=}"
      shift
      ;;
    --beta)
      export DC2_VERSION="beta"
      shift
      ;;
    *)
      echo "Usage: $0 [--force-download] [--beta] [--version=X.Y.Z]"
      echo ""
      echo "Options:"
      echo "  --force-download     Force re-download even if DC2 is installed"
      echo "  --beta               Install latest beta/pre-release"
      echo "  --version=X.Y.Z      Install specific version"
      exit 1
      ;;
  esac
done

# Welcome message
clear
echo ""
echo "======================================================================="
echo ""
echo "         DeviceControl2 - Raspberry Pi Installer"
echo ""
echo "======================================================================="
echo ""

require_root
check_os_version
check_required_user

log_info "Starting installation process..."
echo ""

# Run installation scripts
"$SCRIPT_DIR/10-install-base.sh"
"$SCRIPT_DIR/20-install-node.sh"
"$SCRIPT_DIR/30-download-dc2.sh"
"$SCRIPT_DIR/40-configure-autologin.sh"
"$SCRIPT_DIR/50-create-service.sh"
"$SCRIPT_DIR/60-install-xserver.sh"
"$SCRIPT_DIR/70-configure-plymouth.sh"

# Final message
echo ""
echo "======================================================================="
echo ""
log_info "Installation completed successfully!"
echo ""
log_info "Next steps:"
log_info "  1. Reboot the system: sudo reboot"
log_info "  2. After reboot, the system will:"
log_info "     - Show Plymouth splash screen during boot"
log_info "     - Auto-login as '$DC2_USER' on TTY1"
log_info "     - Start X Server automatically"
log_info "     - Launch Chromium in kiosk mode"
log_info "     - Display DeviceControl2 interface"
echo ""
echo "======================================================================="
echo ""
