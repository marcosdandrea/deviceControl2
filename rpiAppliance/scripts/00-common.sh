
#!/usr/bin/env bash
# 00-common.sh - Common functions and variables for DeviceControl2 RPI setup

# Supported OS
SUPPORTED_DEBIAN_VERSION="12"
SUPPORTED_CODENAME="bookworm"

# Required user (must exist in base OS)
REQUIRED_USER="devicecontrol"

# Node.js configuration
NODE_VERSION="20"
NODE_BIN="/usr/local/bin/node"
NVM_DIR="/usr/local/nvm"

# DeviceControl2 configuration
DC2_USER="devicecontrol"
DC2_INSTALL_DIR="/opt/devicecontrol2"
GITHUB_OWNER="marcosdandrea"
GITHUB_REPO="deviceControl2"
DC2_VERSION="${DC2_VERSION:-latest}"

# Kiosk user configuration (same as DC2_USER for simplicity)
KIOSK_USER="$DC2_USER"
KIOSK_HOME="/home/$KIOSK_USER"

# UI configuration
ENV_FILE="/mnt/pendrive/rpiAppliance/.env"
DEFAULT_UI_URL="http://localhost:8080/#/control"
DC2_UI_URL=""

# Browser
BROWSER_CMD="chromium"

# Splash screen
SPLASH_SOURCE="$DC2_INSTALL_DIR/resources/splash/splash.png"
PLYMOUTH_THEME_NAME="dc2-theme"
PLYMOUTH_THEME_DIR="/usr/share/plymouth/themes/$PLYMOUTH_THEME_NAME"

# Force download
FORCE_DOWNLOAD="${FORCE_DOWNLOAD:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_step() {
  echo -e "${BLUE}  -> ${NC}$*"
}

# Check if running as root
require_root() {
  if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
  fi
}

# Check OS version
check_os_version() {
  if [[ ! -f /etc/os-release ]]; then
    log_error "/etc/os-release not found"
    exit 1
  fi

  . /etc/os-release
  
  if [[ "$VERSION_ID" != "$SUPPORTED_DEBIAN_VERSION" ]] || [[ "$VERSION_CODENAME" != "$SUPPORTED_CODENAME" ]]; then
    log_error "This script requires Debian $SUPPORTED_DEBIAN_VERSION ($SUPPORTED_CODENAME)"
    log_error "Current system: Debian $VERSION_ID ($VERSION_CODENAME)"
    exit 1
  fi
  
  log_info "OS: Debian $VERSION_ID ($VERSION_CODENAME) - OK"
}

# Check required user exists or create it
check_required_user() {
  if ! id "$REQUIRED_USER" &>/dev/null; then
    log_warn "User '$REQUIRED_USER' does not exist, creating it..."
    
    # Create the user with home directory
    useradd -m -s /bin/bash "$REQUIRED_USER"
    
    # Set password
    echo "$REQUIRED_USER:pesp1102" | chpasswd
    
    # Add to sudo group for administrative tasks
    usermod -aG sudo "$REQUIRED_USER"
    
    # Configure SSH access
    log_step "Configuring SSH access for user '$REQUIRED_USER'"
    
    # Ensure SSH service is installed and enabled
    if ! command -v sshd &>/dev/null; then
      log_step "Installing SSH server..."
      apt-get update -qq
      apt-get install -y openssh-server
    fi
    
    # Enable and start SSH service
    systemctl enable ssh
    systemctl start ssh
    
    # Create .ssh directory and set proper permissions
    USER_HOME=$(eval echo ~$REQUIRED_USER)
    mkdir -p "$USER_HOME/.ssh"
    chown "$REQUIRED_USER:$REQUIRED_USER" "$USER_HOME/.ssh"
    chmod 700 "$USER_HOME/.ssh"
    
    log_info "User '$REQUIRED_USER' created successfully with SSH access"
    log_info "Password set to: pesp1102"
  else
    log_info "User '$REQUIRED_USER' exists - OK"
  fi
}

# Load UI URL from .env if exists
load_ui_url() {
  if [[ -f "$ENV_FILE" ]]; then
    # Try to extract DC2_UI_URL from .env
    local url_from_env=$(grep -E "^DC2_UI_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [[ -n "$url_from_env" ]]; then
      DC2_UI_URL="$url_from_env"
      log_info "Loaded UI URL from .env: $DC2_UI_URL"
    else
      DC2_UI_URL="$DEFAULT_UI_URL"
      log_info "Using default UI URL: $DC2_UI_URL"
    fi
  else
    DC2_UI_URL="$DEFAULT_UI_URL"
    log_info "No .env file found, using default UI URL: $DC2_UI_URL"
  fi
}
