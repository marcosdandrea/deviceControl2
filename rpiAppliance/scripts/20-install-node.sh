#!/usr/bin/env bash
# 20-install-node.sh - Install Node.js via NVM

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root

log_info "===== Step 2: Installing Node.js v$NODE_VERSION ====="
echo ""

if [[ -f "$NODE_BIN" ]]; then
  CURRENT_VERSION=$("$NODE_BIN" --version)
  log_info "Node.js already installed: $CURRENT_VERSION"
  if [[ "$CURRENT_VERSION" == "v$NODE_VERSION"* ]]; then
    log_info "Version matches, skipping installation"
    exit 0
  fi
fi

log_step "Installing NVM (Node Version Manager)..."
mkdir -p "$NVM_DIR"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | NVM_DIR="$NVM_DIR" bash

log_step "Loading NVM..."
export NVM_DIR="$NVM_DIR"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

log_step "Installing Node.js v$NODE_VERSION..."
nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"
nvm alias default "$NODE_VERSION"

log_step "Creating global symlink..."
NODE_PATH="$NVM_DIR/versions/node/v$NODE_VERSION"
# Find the actual installed version directory
if [[ ! -d "$NODE_PATH" ]]; then
  # Find the directory that matches v20.*
  NODE_PATH=$(find "$NVM_DIR/versions/node" -maxdepth 1 -name "v${NODE_VERSION}*" | head -1)
fi

if [[ -z "$NODE_PATH" || ! -d "$NODE_PATH" ]]; then
  log_error "Could not find Node.js installation directory"
  exit 1
fi

ln -sf "$NODE_PATH/bin/node" "$NODE_BIN"
ln -sf "$NODE_PATH/bin/npm" /usr/local/bin/npm

INSTALLED_VERSION=$("$NODE_BIN" --version)
log_info "Node.js $INSTALLED_VERSION installed successfully"
echo ""
