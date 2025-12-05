#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

log_info "Installing Plymouth..."
apt install -y plymouth plymouth-themes

THEME_DIR="/usr/share/plymouth/themes/dc2-theme"
mkdir -p "$THEME_DIR"

if [[ ! -f "$DC2_INSTALL_DIR/splash.png" ]]; then
  log_warn "splash.png not found in $DC2_INSTALL_DIR; Plymouth theme will be created but with no custom image."
else
  cp "$DC2_INSTALL_DIR/splash.png" "$THEME_DIR/splash.png"
fi

log_info "Creating Plymouth theme files in $THEME_DIR ..."

cat > "$THEME_DIR/dc2-theme.plymouth" <<EOF
[Plymouth Theme]
Name=DeviceControl2
Description=DeviceControl2 boot splash
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/dc2-theme
ScriptFile=/usr/share/plymouth/themes/dc2-theme/dc2-theme.script
EOF

cat > "$THEME_DIR/dc2-theme.script" <<'EOF'
# Plymouth script theme for DC2 splash

# Load splash image if exists
if (file_exists("splash.png")) {
    image = Image("splash.png");
    screenW = Window.GetWidth();
    screenH = Window.GetHeight();
    imgW = image.GetWidth();
    imgH = image.GetHeight();

    xpos = (screenW - imgW) / 2;
    ypos = (screenH - imgH) / 2;

    sprite = Sprite(image);
    sprite.SetX(xpos);
    sprite.SetY(ypos);
}
EOF

log_info "Setting DC2 Plymouth theme as default..."
plymouth-set-default-theme dc2-theme

if command -v update-initramfs >/dev/null 2>&1; then
  log_info "Updating initramfs (this may take a while)..."
  update-initramfs -u
else
  log_warn "update-initramfs not found; please update initramfs manually if required."
fi

log_info "Plymouth configured with DC2 theme."
