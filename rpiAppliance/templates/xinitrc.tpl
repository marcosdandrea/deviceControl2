#!/bin/sh

# Log file for debugging
LOGFILE="/tmp/kiosk-session.log"
exec > "$LOGFILE" 2>&1
echo "=== Kiosk session started at $(date) ==="

# Disable screensaver and power management
xset s off
xset -dpms
xset s noblank

# Hide cursor when idle
unclutter &

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
  {{DC2_UI_URL}}
