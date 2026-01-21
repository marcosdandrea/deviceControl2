#!/usr/bin/env bash
# test-audio-kiosk.sh - Test audio configuration for kiosk mode

set -euo pipefail

echo "=========================================="
echo "   Testing Kiosk Audio Configuration"
echo "=========================================="
echo ""

# Test ALSA
echo "Testing ALSA configuration..."
if aplay -l &>/dev/null; then
    echo "✓ ALSA audio devices detected:"
    aplay -l | grep -E "^card [0-9]+" | head -3
else
    echo "✗ No ALSA audio devices found"
fi
echo ""

# Test ALSA mixer
echo "Testing ALSA mixer..."
if amixer scontrols &>/dev/null; then
    echo "✓ ALSA mixer controls available:"
    amixer scontrols | head -3
    
    echo ""
    echo "Current volume levels:"
    amixer sget Master 2>/dev/null | grep -E "Playback.*\[" | head -1 || echo "  Master: Not found"
    amixer sget PCM 2>/dev/null | grep -E "Playback.*\[" | head -1 || echo "  PCM: Not found" 
else
    echo "✗ ALSA mixer not available"
fi
echo ""

# Test PulseAudio
echo "Testing PulseAudio..."
if pulseaudio --check; then
    echo "✓ PulseAudio daemon is running"
    
    if pactl info &>/dev/null; then
        echo "✓ PulseAudio server accessible"
        echo "  Server info:"
        pactl info | grep -E "Server String|Server Name|Default Sink|Default Source" | sed 's/^/    /'
    else
        echo "✗ Cannot access PulseAudio server"
    fi
else
    echo "! PulseAudio daemon not running (may start automatically)"
fi
echo ""

# Test audio files/devices
echo "Testing audio output..."
if [ -f /usr/share/sounds/alsa/Front_Left.wav ]; then
    echo "✓ Test audio file found: /usr/share/sounds/alsa/Front_Left.wav"
    echo "  You can test audio with: aplay /usr/share/sounds/alsa/Front_Left.wav"
else
    echo "! No standard test audio file found"
fi
echo ""

# Check user permissions
if [ -n "${DC2_USER:-}" ]; then
    echo "Checking audio permissions for user: $DC2_USER"
    if groups "$DC2_USER" | grep -q audio; then
        echo "✓ User $DC2_USER is in audio group"
    else
        echo "✗ User $DC2_USER is NOT in audio group"
    fi
else
    echo "! DC2_USER not set, checking current user"
    if groups | grep -q audio; then
        echo "✓ Current user is in audio group"
    else
        echo "✗ Current user is NOT in audio group"
    fi
fi
echo ""

# Check kiosk audio init script
echo "Checking kiosk audio initialization..."
if [ -x /usr/local/bin/init-kiosk-audio ]; then
    echo "✓ Kiosk audio init script exists and is executable"
    echo "  Testing script execution..."
    if /usr/local/bin/init-kiosk-audio; then
        echo "✓ Kiosk audio init script executed successfully"
    else
        echo "✗ Kiosk audio init script failed"
    fi
else
    echo "✗ Kiosk audio init script not found or not executable"
fi
echo ""

# Check browser audio flags
echo "Checking browser configuration..."
BROWSER_CMD="${BROWSER_CMD:-chromium}"
if command -v "$BROWSER_CMD" &>/dev/null; then
    echo "✓ Browser command available: $BROWSER_CMD"
    echo "  Audio-related flags that should be used:"
    echo "    --autoplay-policy=no-user-gesture-required"
    echo "    --disable-gesture-requirement-for-media-playback"
    echo "    --allow-running-insecure-content"
else
    echo "✗ Browser command not found: $BROWSER_CMD"
fi
echo ""

echo "=========================================="
echo "   Audio Configuration Test Complete"
echo "=========================================="