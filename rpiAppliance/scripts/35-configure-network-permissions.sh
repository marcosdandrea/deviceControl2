#!/usr/bin/env bash
# 35-configure-network-permissions.sh - Configure network management permissions for DC2

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

log_info "===== Step 3.5: Configuring Network Management Permissions ====="
echo ""

log_step "Configuring network permissions for user: $DC2_USER"

# Add user to netdev group if it exists (Debian/Ubuntu)
if getent group netdev >/dev/null 2>&1; then
    log_step "Adding $DC2_USER to netdev group..."
    usermod -a -G netdev "$DC2_USER"
    log_info "User $DC2_USER added to netdev group"
else
    log_info "netdev group not found, skipping group assignment"
fi

# Configure sudoers for nmcli commands
SUDOERS_FILE="/etc/sudoers.d/devicecontrol-network"
log_step "Creating sudoers configuration for network commands..."

cat > "$SUDOERS_FILE" << EOF
# DeviceControl2 - Allow network configuration commands without password
# This file allows the DC2 user to execute specific network management commands
# without requiring a password prompt

# Allow nmcli commands for network configuration
$DC2_USER ALL=(ALL) NOPASSWD: /usr/bin/nmcli connection modify *, /usr/bin/nmcli connection up *, /usr/bin/nmcli connection down *, /usr/bin/nmcli connection reload

# Allow ip commands for network status (read-only operations)
$DC2_USER ALL=(ALL) NOPASSWD: /usr/bin/ip addr show, /usr/bin/ip route show, /usr/bin/ip link show

# Allow systemctl for network services if needed
$DC2_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart NetworkManager, /usr/bin/systemctl reload NetworkManager
EOF

# Set proper permissions for sudoers file
chmod 440 "$SUDOERS_FILE"
log_info "Sudoers configuration created: $SUDOERS_FILE"

# Test the sudoers configuration
log_step "Validating sudoers configuration..."
if visudo -c -f "$SUDOERS_FILE"; then
    log_info "Sudoers configuration is valid"
else
    log_error "Sudoers configuration is invalid, removing file"
    rm -f "$SUDOERS_FILE"
    exit 1
fi

# Install and configure PolicyKit if available
if command -v pkaction >/dev/null 2>&1; then
    log_step "Configuring PolicyKit for NetworkManager..."
    
    POLKIT_FILE="/etc/polkit-1/localauthority/50-local.d/devicecontrol-network.pkla"
    mkdir -p "$(dirname "$POLKIT_FILE")"
    
    cat > "$POLKIT_FILE" << EOF
[DeviceControl2 Network Management]
Identity=unix-user:$DC2_USER
Action=org.freedesktop.NetworkManager.network-control;org.freedesktop.NetworkManager.settings.modify.system
ResultAny=yes
ResultInactive=yes
ResultActive=yes
EOF

    log_info "PolicyKit configuration created: $POLKIT_FILE"
    
    # Restart polkit if it's running
    if systemctl is-active --quiet polkit; then
        systemctl restart polkit
        log_info "PolicyKit service restarted"
    fi
else
    log_info "PolicyKit not available, relying on sudoers configuration"
fi

# Create a test script to verify permissions work
TEST_SCRIPT="/tmp/test-network-permissions.sh"
cat > "$TEST_SCRIPT" << 'EOF'
#!/bin/bash
# Test script to verify network permissions
echo "Testing network permissions for user: $USER"
echo ""

echo "Testing nmcli access..."
if timeout 5 nmcli connection show >/dev/null 2>&1; then
    echo "✓ nmcli connection show - OK"
else
    echo "✗ nmcli connection show - FAILED"
fi

echo ""
echo "Testing sudo nmcli access..."
if timeout 5 sudo -n nmcli connection show >/dev/null 2>&1; then
    echo "✓ sudo nmcli (no password) - OK"
else
    echo "✗ sudo nmcli (no password) - FAILED"
fi

echo ""
echo "Network permissions test completed"
EOF

chmod +x "$TEST_SCRIPT"

log_info "Network permissions configured successfully"
log_info "Test script created at: $TEST_SCRIPT"
log_info "After installation, you can test with: sudo -u $DC2_USER $TEST_SCRIPT"

echo ""