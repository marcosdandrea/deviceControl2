#!/bin/sh

# Disable screensaver and power management
xset s off
xset -dpms
xset s noblank

# Hide cursor when idle
unclutter &

# Start Openbox window manager
openbox-session &

# Small delay to allow Openbox to start
sleep 2

# Launch browser in kiosk mode pointing to DC2 UI
{{BROWSER_CMD}} \
  --noerrdialogs \
  --kiosk \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --incognito \
  {{DC2_UI_URL}}
