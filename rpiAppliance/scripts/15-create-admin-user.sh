#!/usr/bin/env bash
# 15-create-admin-user.sh - Create a dedicated administrative user for remote SSH access
#
# This account is independent from $DC2_USER (used for kiosk autologin and the
# DC2 service), which ends up with its password removed by 40-configure-autologin.sh
# so it can auto-login without a prompt. Use this admin user for remote console access.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/00-common.sh"

require_root
check_os_version

log_info "===== Creating administrative user for SSH access: $ADMIN_USER ====="
echo ""

if id -u "$ADMIN_USER" >/dev/null 2>&1; then
  log_warn "User '$ADMIN_USER' already exists, skipping creation."
  log_warn "To change its password later, run: sudo passwd $ADMIN_USER"
else
  log_step "Creating user '$ADMIN_USER'..."
  useradd -m -s /bin/bash "$ADMIN_USER"

  echo "$ADMIN_USER:$ADMIN_PASSWORD" | chpasswd
  log_info "Password configurado para '$ADMIN_USER'"

  log_step "Agregando '$ADMIN_USER' al grupo sudo..."
  usermod -aG sudo "$ADMIN_USER"

  ADMIN_HOME=$(eval echo "~$ADMIN_USER")
  mkdir -p "$ADMIN_HOME/.ssh"
  chown "$ADMIN_USER:$ADMIN_USER" "$ADMIN_HOME/.ssh"
  chmod 700 "$ADMIN_HOME/.ssh"

  log_info "User '$ADMIN_USER' created with sudo access"
fi

log_step "Verificando servidor SSH..."
if ! command -v sshd &>/dev/null; then
  log_step "Instalando servidor SSH..."
  apt-get update -qq
  apt-get install -y openssh-server
fi

systemctl enable ssh
systemctl start ssh

log_info "SSH habilitado. Podrá conectarse con: ssh $ADMIN_USER@<ip-de-la-raspberry>"
echo ""
