#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

TMP_DIR="/tmp/dc2-release"
mkdir -p "$TMP_DIR"

log_info "Fetching GitHub release v$DC2_VERSION for $GITHUB_OWNER/$GITHUB_REPO ..."

API_URL="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases/tags/v$DC2_VERSION"
RELEASE_JSON="$TMP_DIR/release.json"

curl -fsSL "$API_URL" -o "$RELEASE_JSON"

ASSET_URL=$(jq -r --arg pattern "$DC2_WEBPACK_ASSET_PATTERN" '
  .assets[] | select(.name | test($pattern)) | .browser_download_url
' "$RELEASE_JSON" | head -n1)

if [[ -z "$ASSET_URL" || "$ASSET_URL" == "null" ]]; then
  log_error "Could not find an asset matching pattern '$DC2_WEBPACK_ASSET_PATTERN' in release v$DC2_VERSION"
  exit 1
fi

ASSET_NAME=$(basename "$ASSET_URL")
DOWNLOAD_PATH="$TMP_DIR/$ASSET_NAME"

log_info "Downloading asset $ASSET_NAME from $ASSET_URL ..."
curl -fsSL "$ASSET_URL" -o "$DOWNLOAD_PATH"

log_info "Clearing previous DC2 installation at $DC2_INSTALL_DIR ..."
rm -rf "$DC2_INSTALL_DIR"
mkdir -p "$DC2_INSTALL_DIR"

log_info "Unzipping asset into $DC2_INSTALL_DIR ..."
unzip -q "$DOWNLOAD_PATH" -d "$TMP_DIR/unpacked"

# If the zip has a top-level directory, move its contents
TOP_DIR="$(find "$TMP_DIR/unpacked" -mindepth 1 -maxdepth 1 -type d | head -n1 || true)"

if [[ -n "$TOP_DIR" ]]; then
  rsync -a "$TOP_DIR"/ "$DC2_INSTALL_DIR"/
else
  rsync -a "$TMP_DIR/unpacked"/ "$DC2_INSTALL_DIR"/
fi

chown -R "$DC2_USER:$DC2_USER" "$DC2_INSTALL_DIR"

log_info "DC2 release v$DC2_VERSION installed to $DC2_INSTALL_DIR"

if [[ -f "$DC2_INSTALL_DIR/splash.png" ]]; then
  log_info "Found splash.png at $DC2_INSTALL_DIR/splash.png (will be used by Plymouth)."
else
  log_warn "splash.png not found at $DC2_INSTALL_DIR/splash.png"
fi
