check_os_version() {
  if [[ ! -f /etc/os-release ]]; then
    log_error "/etc/os-release not found. Cannot determine OS version."
    exit 1
  fi

  # Parseamos los valores reales del sistema
  . /etc/os-release

  ACTUAL_VERSION_ID="${VERSION_ID:-unknown}"
  ACTUAL_CODENAME="${VERSION_CODENAME:-unknown}"

  log_info "Detected system: Debian $ACTUAL_VERSION_ID ($ACTUAL_CODENAME)"

  # Comparamos con lo soportado
  if [[ "$ACTUAL_VERSION_ID" != "$SUPPORTED_DEBIAN_VERSION" ]] || \
     [[ "$ACTUAL_CODENAME" != "$SUPPORTED_RPIOS_CODENAME" ]]; then

    log_warn "This script was designed for Debian $SUPPORTED_DEBIAN_VERSION ($SUPPORTED_RPIOS_CODENAME)."
    log_warn "You are running Debian $ACTUAL_VERSION_ID ($ACTUAL_CODENAME)."

    if [[ "$STRICT_OS_CHECK" == "true" ]]; then
      log_error "OS mismatch — aborting due to STRICT_OS_CHECK=true."
      exit 1
    else
      log_warn "Continuing anyway because STRICT_OS_CHECK=false."
    fi
  else
    log_info "OS version matches expected Debian $SUPPORTED_DEBIAN_VERSION ($SUPPORTED_RPIOS_CODENAME)."
  fi
}
