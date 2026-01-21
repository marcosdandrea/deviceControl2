#!/usr/bin/env bash
# 25-configure-audio.sh - Configure audio system for kiosk mode

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root
check_required_user

log_info "===== Step 2.5: Configuring Audio for Kiosk Mode ====="
echo ""

log_step "Installing audio packages..."
apt-get install -y --no-install-recommends \
  alsa-utils \
  pulseaudio \
  pulseaudio-utils \
  pavucontrol

log_step "Configuring audio output for Raspberry Pi..."

# Let the OS handle audio configuration naturally
# Just enable audio in raspi-config - no custom configuration
raspi-config nonint do_audio 0  # 0 = Auto detect best audio output

# Remove any existing custom ALSA configuration to let system defaults work
if [ -f /etc/asound.conf ]; then
    log_step "Removing custom ALSA configuration..."
    rm -f /etc/asound.conf
fi

# Remove any existing custom PulseAudio configuration to use system defaults
USER_HOME=$(eval echo ~$DC2_USER)
PULSE_DIR="$USER_HOME/.config/pulse"
if [ -d "$PULSE_DIR" ]; then
    log_step "Removing custom PulseAudio configuration..."
    rm -rf "$PULSE_DIR"
fi

# Configure udev rules for audio devices
cat > /etc/udev/rules.d/99-audio-permissions.conf << EOF
# Audio device permissions for kiosk mode
SUBSYSTEM=="sound", GROUP="audio", MODE="0664"
KERNEL=="controlC[0-9]*", GROUP="audio", MODE="0664"
EOF

log_info "Audio system configured with OS defaults"
log_info "No custom configuration - letting system handle audio naturally"
echo ""