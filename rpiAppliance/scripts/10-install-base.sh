#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root

log_info "Updating system packages..."
apt update
apt full-upgrade -y

log_info "Installing base tools (git, curl, wget, unzip, jq, build-essential)..."
apt install -y git curl wget unzip jq ca-certificates build-essential
