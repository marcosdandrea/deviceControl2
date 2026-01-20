#!/bin/sh

# Log file for debugging
LOGFILE="/tmp/kiosk-session.log"
exec > "$LOGFILE" 2>&1
echo "=== Kiosk session started at $(date) ==="

# Configure screen blanking based on user choice
if [[ "{{ENABLE_SCREEN_BLANKING}}" == "true" ]]; then
  # Enable screensaver and power management
  xset s {{SCREEN_BLANKING_TIME}} {{SCREEN_BLANKING_TIME}}
  xset +dpms
  xset dpms {{SCREEN_BLANKING_TIME}} {{SCREEN_BLANKING_TIME}} {{SCREEN_BLANKING_TIME}}
else
  # Disable screensaver and power management
  xset s off
  xset -dpms
  xset s noblank
fi

# Hide cursor completely using multiple methods
# Method 1: Create invisible cursor using xsetroot
printf '\x00\x00\x00\x00\x00\x00\x00\x00' > /tmp/blank_cursor.bits
printf '\x00\x00\x00\x00\x00\x00\x00\x00' > /tmp/blank_mask.bits
xsetroot -cursor /tmp/blank_cursor.bits /tmp/blank_mask.bits

# Method 2: Also try with unclutter as fallback (hide after 1 second, but invisible cursor should work)
unclutter -idle 1 -root &

# Start Openbox window manager
openbox-session &

echo "Waiting for DeviceControl2 service to be ready..."

# Wait for DC2 service to be running (max 60 seconds)
MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
  if systemctl is-active --quiet devicecontrol.service; then
    echo "DeviceControl2 service is running!"
    break
  fi
  echo "Waiting for service... ($COUNTER/$MAX_WAIT)"
  sleep 1
  COUNTER=$((COUNTER + 1))
done

if [ $COUNTER -ge $MAX_WAIT ]; then
  echo "WARNING: DeviceControl2 service did not start within ${MAX_WAIT}s"
  echo "Service status:"
  systemctl status devicecontrol.service || true
fi

# Wait additional time for HTTP server to be ready
echo "Waiting for HTTP server on {{DC2_UI_URL}}..."
sleep 5

MAX_WAIT=30
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
  if curl -s -o /dev/null -w "%{http_code}" {{DC2_UI_URL}} | grep -q "200\|301\|302"; then
    echo "HTTP server is responding!"
    break
  fi
  echo "Waiting for HTTP server... ($COUNTER/$MAX_WAIT)"
  sleep 1
  COUNTER=$((COUNTER + 1))
done

# Small delay to allow Openbox to start
sleep 2

echo "Launching browser: {{BROWSER_CMD}}"
echo "Target URL: {{DC2_UI_URL}}"

# Launch browser in kiosk mode pointing to DC2 UI
{{BROWSER_CMD}} \
  --noerrdialogs \
  --kiosk \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --incognito \
  --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT' \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --disable-background-networking \
  --force-color-profile=srgb \
  --disable-ipc-flooding-protection \
  --touch-events=enabled \
  --disable-gesture-requirement-for-media-playbook \
  --autoplay-policy=no-user-gesture-required \
  --user-data-dir=/tmp/chrome-kiosk \
  --app={{DC2_UI_URL}}
