#!/usr/bin/env bash
# 10-install-base.sh - Install base packages and system updates

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

log_info "===== Step 1: Installing Base Packages and Updates ====="
echo ""

log_step "Updating package lists..."
apt-get update

log_step "Upgrading existing packages..."
apt-get upgrade -y

log_step "Installing essential tools..."
apt-get install -y \
  curl \
  wget \
  unzip \
  git \
  build-essential \
  ca-certificates \
  inotify-tools

log_info "Base packages installed successfully"
echo ""
