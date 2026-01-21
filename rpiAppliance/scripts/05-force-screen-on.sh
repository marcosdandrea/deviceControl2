#!/usr/bin/env bash
# 05-force-screen-on.sh - Force screen to turn on at boot to prevent leaving it off from previous shutdown

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root

log_info "===== Step 0.5: Force Screen On at Boot ====="
echo ""

log_step "Creating screen force-on service..."

# Create the script that will force the screen on at boot
cat > /usr/local/bin/force-screen-on << 'EOF'
#!/bin/bash
# Force screen on at boot - prevents screen staying off from previous devicecontrol shutdown

# Wait for GPIO to be available
timeout=30
counter=0
while [ $counter -lt $timeout ]; do
    if [ -e /dev/gpiochip0 ]; then
        echo "GPIO available, forcing screen on"
        break
    fi
    sleep 1
    counter=$((counter + 1))
done

# Force screen on using the same command as devicecontrol
if command -v pinctrl >/dev/null 2>&1; then
    pinctrl set 18 op dh
    echo "Screen forced on successfully"
else
    echo "Warning: pinctrl command not found, cannot force screen on"
    # Fallback: try to turn on screen using vcgencmd
    if command -v vcgencmd >/dev/null 2>&1; then
        vcgencmd display_power 1
        echo "Screen forced on using vcgencmd fallback"
    fi
fi
EOF

chmod +x /usr/local/bin/force-screen-on

# Create systemd service that runs very early in the boot process
cat > /etc/systemd/system/force-screen-on.service << 'EOF'
[Unit]
Description=Force Screen On at Boot
After=local-fs.target
Before=multi-user.target
DefaultDependencies=no

[Service]
Type=oneshot
ExecStart=/usr/local/bin/force-screen-on
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable the service to run at boot
systemctl daemon-reload
systemctl enable force-screen-on.service

# Also add it to rc.local as a backup method (runs earlier than systemd services)
if [ -f /etc/rc.local ]; then
    # Check if our script is already in rc.local
    if ! grep -q "force-screen-on" /etc/rc.local; then
        # Insert before exit 0
        sed -i '/^exit 0/i # Force screen on at boot\n/usr/local/bin/force-screen-on &\n' /etc/rc.local
    fi
else
    # Create rc.local if it doesn't exist
    cat > /etc/rc.local << 'EOF'
#!/bin/bash
# rc.local - executed at the end of each multiuser runlevel

# Force screen on at boot
/usr/local/bin/force-screen-on &

exit 0
EOF
    chmod +x /etc/rc.local
fi

log_info "Screen force-on service created and enabled"
log_info "Screen will be automatically turned on at every boot"
log_info "This prevents the screen from staying off if devicecontrol was shut down with screen off"
echo ""