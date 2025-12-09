#!/usr/bin/env bash
# 30-download-dc2.sh - Download DeviceControl2 from GitHub

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root

log_info "===== Step 3: Downloading DeviceControl2 ====="
echo ""

# Check if already installed
if [[ -f "$DC2_INSTALL_DIR/main.js" ]] && [[ "$FORCE_DOWNLOAD" != "true" ]]; then
  log_info "DeviceControl2 already installed at $DC2_INSTALL_DIR"
  log_info "Use --force-download to reinstall"
  exit 0
fi

log_step "Fetching release information from GitHub..."

# Determine which release to download
if [[ "$DC2_VERSION" == "latest" || "$DC2_VERSION" == "beta" ]]; then
  # Get all releases (including pre-releases)
  API_URL="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases"
  if [[ "$DC2_VERSION" == "latest" ]]; then
    log_info "Downloading most recent release..."
  else
    log_info "Downloading latest beta/pre-release..."
  fi
else
  API_URL="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases/tags/v$DC2_VERSION"
  log_info "Downloading version $DC2_VERSION..."
fi

# Fetch release data
log_step "Fetching from: $API_URL"
RELEASE_DATA=$(curl -sL "$API_URL")

if [[ -z "$RELEASE_DATA" ]]; then
  log_error "Failed to fetch release data from GitHub"
  log_error "Check internet connection and GitHub API availability"
  exit 1
fi

# Check for API errors
if echo "$RELEASE_DATA" | grep -q "rate limit exceeded"; then
  log_error "GitHub API rate limit exceeded"
  log_error "Please wait a few minutes and try again"
  exit 1
fi

if echo "$RELEASE_DATA" | grep -q "Not Found"; then
  log_error "Release not found on GitHub"
  log_error "Repository: $GITHUB_OWNER/$GITHUB_REPO"
  exit 1
fi

# Extract download URL for webpack.zip
log_step "Searching for webpack.zip asset..."
# Get the first release with webpack.zip (most recent)
DOWNLOAD_URL=$(echo "$RELEASE_DATA" | grep -o '"browser_download_url": *"[^"]*webpack\.zip"' | head -1 | sed 's/"browser_download_url": *"//' | sed 's/"$//')
RELEASE_TAG=$(echo "$RELEASE_DATA" | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/"tag_name": *"//' | sed 's/"$//')

if [[ -z "$DOWNLOAD_URL" ]]; then
  log_error "Could not find webpack.zip in release"
  log_error "Release data preview:"
  echo "$RELEASE_DATA" | head -20
  exit 1
fi

log_info "Found release: $RELEASE_TAG"
log_info "Download URL: $DOWNLOAD_URL"

# Create install directory
log_step "Creating installation directory..."
mkdir -p "$DC2_INSTALL_DIR"

# Download and extract
TEMP_FILE="/tmp/devicecontrol-webpack.zip"
log_step "Downloading webpack.zip..."
curl -L -o "$TEMP_FILE" "$DOWNLOAD_URL"

log_step "Extracting to $DC2_INSTALL_DIR..."
unzip -o "$TEMP_FILE" -d "$DC2_INSTALL_DIR"
rm "$TEMP_FILE"

# Check if files were extracted to a webpack/ subdirectory
if [[ -f "$DC2_INSTALL_DIR/webpack/main.js" ]]; then
  log_step "Moving files from webpack/ subdirectory..."
  # Use cp and rm instead of mv to ensure all files including hidden ones are moved
  cp -r "$DC2_INSTALL_DIR/webpack/." "$DC2_INSTALL_DIR/"
  rm -rf "$DC2_INSTALL_DIR/webpack"
fi

# Verify installation
if [[ ! -f "$DC2_INSTALL_DIR/main.js" ]]; then
  log_error "Installation failed: main.js not found"
  exit 1
fi

if [[ ! -f "$DC2_INSTALL_DIR/.env" ]]; then
  log_warn ".env file not found in package"
  log_warn "Creating default .env file..."
  cat > "$DC2_INSTALL_DIR/.env" << 'EOF'
# DeviceControl2 Configuration
NODE_ENV=production
PORT=8080
EOF
fi

# Set ownership
log_step "Setting ownership to $DC2_USER..."
chown -R "$DC2_USER:$DC2_USER" "$DC2_INSTALL_DIR"

log_info "DeviceControl2 installed successfully"
log_info "Location: $DC2_INSTALL_DIR"
if [[ -f "$DC2_INSTALL_DIR/.env" ]]; then
  log_info ".env file present"
fi

echo ""
