#!/usr/bin/env bash
# run-all.sh - Main installation script for DeviceControl2 on Raspberry Pi

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

# Initialize variables
CLEAN_INSTALL="false"
INSTALL_TYPE=""
# Screen blanking deshabilitado por defecto para optimización kiosk
ENABLE_SCREEN_BLANKING="false"
SCREEN_BLANKING_TIME="0"

# Function to show main menu
show_main_menu() {
  clear
  echo ""
  echo "======================================================================="
  echo ""
  echo "         DeviceControl 2 - Raspberry Pi Installer"
  echo ""
  echo "======================================================================="
  echo ""
  echo "¿Qué desea hacer?"
  echo ""
  echo "  1) Actualizar DeviceControl 2 (Solo si ya ejecutó la instalación completa)"
  echo "  2) Instalar/Reinstalar toda la configuración completa desde cero"
  echo "  3) Salir"
  echo ""
  echo -n "Seleccione una opción (1-3): "
}



# Parse arguments (for backward compatibility)
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
    --clean-install)
      CLEAN_INSTALL="true"
      export FORCE_DOWNLOAD="true"
      INSTALL_TYPE="full"
      shift
      ;;
    --non-interactive)
      INSTALL_TYPE="full"
      shift
      ;;
    *)
      echo "Usage: $0 [--force-download] [--beta] [--version=X.Y.Z] [--clean-install] [--non-interactive]"
      echo ""
      echo "Options:"
      echo "  --force-download     Force re-download even if DC2 is installed"
      echo "  --beta               Install latest beta/pre-release"
      echo "  --version=X.Y.Z      Install specific version"
      echo "  --clean-install      Remove all existing installation (logs, license, etc) and reinstall"
      echo "  --non-interactive    Skip interactive menu (full installation)"
      exit 1
      ;;
  esac
done

# Show interactive menu only if no install type specified
if [[ -z "$INSTALL_TYPE" ]]; then
  show_main_menu
  read -r choice
  
  case "$choice" in
    1)
      INSTALL_TYPE="update"
      export FORCE_DOWNLOAD="true"
      ;;
    2)
      INSTALL_TYPE="full"
      CLEAN_INSTALL="true"
      export FORCE_DOWNLOAD="true"
      # Screen blanking deshabilitado por defecto para kiosk
      ENABLE_SCREEN_BLANKING="false"
      SCREEN_BLANKING_TIME="300"
      ;;
    3)
      echo ""
      echo "Saliendo..."
      exit 0
      ;;
    *)
      echo ""
      echo "Opción inválida. Saliendo..."
      exit 1
      ;;
  esac
fi

# Welcome message
clear
echo ""
echo "======================================================================="
echo ""
echo "         DeviceControl 2 - Raspberry Pi Installer"
echo ""
echo "======================================================================="
echo ""

require_root
check_os_version
check_required_user

# Export screen blanking configuration for scripts
export ENABLE_SCREEN_BLANKING
export SCREEN_BLANKING_TIME

# Handle different installation types
if [[ "$INSTALL_TYPE" == "update" ]]; then
  log_info "Modo: Solo actualización de DeviceControl2"
  echo ""
  
  # Only run DC2 download and service restart
  "$SCRIPT_DIR/30-download-dc2.sh"
  
  log_info "Reiniciando servicio DeviceControl2..."
  systemctl restart devicecontrol.service 2>/dev/null || true
  
  echo ""
  log_info "Actualización completada!"
  log_info "DeviceControl2 ha sido actualizado y el servicio reiniciado."
  echo ""
  exit 0
  
elif [[ "$INSTALL_TYPE" == "full" ]]; then
  log_info "Modo: Instalación/Reinstalación completa"
  log_info "Configuración optimizada para kiosk (screen blanking deshabilitado)"
  echo ""
fi

# Clean installation if requested
if [[ "$CLEAN_INSTALL" == "true" ]]; then
  log_info "Clean installation requested"
  if [[ -d "$DC2_INSTALL_DIR" ]]; then
    log_warn "Removing existing installation directory: $DC2_INSTALL_DIR"
    log_warn "This will delete all logs, license, and configuration files"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      log_step "Stopping DeviceControl2 service if running..."
      systemctl stop devicecontrol.service 2>/dev/null || true
      log_step "Removing installation directory..."
      rm -rf "$DC2_INSTALL_DIR"
      log_info "Clean installation directory removed"
    else
      log_error "Clean installation cancelled by user"
      exit 1
    fi
  else
    log_info "No existing installation found at $DC2_INSTALL_DIR"
  fi
  echo ""
fi

log_info "Starting installation process..."
echo ""

# Run installation scripts
"$SCRIPT_DIR/05-force-screen-on.sh"
"$SCRIPT_DIR/10-install-base.sh"
"$SCRIPT_DIR/20-install-node.sh"
"$SCRIPT_DIR/30-create-users.sh"
"$SCRIPT_DIR/30-download-dc2.sh"
"$SCRIPT_DIR/35-configure-network-permissions.sh"
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
log_info "After reboot, the system will:"
log_info "  - Force screen on at boot (prevents staying off from previous shutdown)"
log_info "  - Show Plymouth splash screen during boot"
log_info "  - Auto-login as '$DC2_USER' on TTY1"
log_info "  - Start X Server automatically"
log_info "  - Launch Chromium in kiosk mode"
log_info "  - Display DeviceControl2 interface"
echo ""
echo "======================================================================="
echo ""
echo -n "Press ENTER to reboot now, or Ctrl+C to cancel..."
read -r
echo ""
log_info "Rebooting system..."
sudo reboot
