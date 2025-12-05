#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

NVM_DIR="/usr/local/nvm"

log_info "Installing nvm into $NVM_DIR (system-wide)..."

if [[ ! -d "$NVM_DIR" ]]; then
  mkdir -p "$NVM_DIR"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh -o /tmp/nvm-install.sh
  NVM_DIR="$NVM_DIR" PROFILE="/etc/profile.d/nvm.sh" bash /tmp/nvm-install.sh
  rm -f /tmp/nvm-install.sh
else
  log_info "nvm directory already exists at $NVM_DIR, skipping installation."
fi

# Ensure nvm is available in this shell
export NVM_DIR="$NVM_DIR"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

log_info "Installing Node.js v$NODE_VERSION via nvm..."
nvm install "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
nvm use "$NODE_VERSION"

NODE_PATH="$(nvm which "$NODE_VERSION")"
log_info "Node installed at $NODE_PATH"

log_info "Creating global symlink for node at $NODE_BIN ..."
ln -sf "$NODE_PATH" "$NODE_BIN"

log_info "Node and npm versions:"
"$NODE_BIN" -v
npm -v
