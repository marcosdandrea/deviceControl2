# Device Control 2 Raspberry Pi Appliance Setup

This repository contains scripts to turn a Raspberry Pi OS Lite (Trixie) installation into a Device Control 2 (DC2) appliance:

- DC2 headless backend running as a systemd service.
- Minimal X + Openbox + Chromium kiosk UI pointing to the DC2 control panel.
- Optional Plymouth splash screen using `splash.png` from the DC2 release.
- Basic hardening (disabling some unused services).

## Structure

- `.env` – Global configuration (version, GitHub repo, install paths, etc.)
- `scripts/`
  - `00-common.sh` – Shared helpers and `.env` loading.
  - `10-install-base.sh` – System update + base tools.
  - `20-install-node-nvm.sh` – Installs Node.js via nvm system-wide.
  - `30-create-users.sh` – Creates DC2 and kiosk users.
  - `40-download-release.sh` – Downloads the DC2 webpack/RPi release from GitHub and installs it.
  - `50-configure-dc2-service.sh` – Creates and enables the `devicecontrol.service`.
  - `60-install-x-kiosk.sh` – Minimal X + Openbox + Chromium + kiosk autologin.
  - `70-configure-plymouth.sh` – Configures a Plymouth theme using `splash.png`.
  - `80-hardening.sh` – Basic system hardening.
  - `run-all.sh` – Orchestrator script.
- `templates/`
  - `devicecontrol.service.tpl`
  - `getty-autologin.conf.tpl`
  - `bash_profile_kiosk.tpl`
  - `xinitrc.tpl`

## Usage

1. Copy this folder to your Raspberry Pi (running Raspberry Pi OS Lite Trixie).
2. Adjust `.env` to match your GitHub repo, DC2 version, and paths.
3. Make scripts executable:

   ```bash
   chmod +x scripts/*.sh
   ```

4. Run the full setup (as root):

   ```bash
   cd dc2-rpi-setup
   sudo ./scripts/run-all.sh full
   ```

5. Reboot the Raspberry Pi:

   ```bash
   sudo reboot
   ```

After reboot, DC2 should start as a systemd service and the kiosk UI should open automatically with Chromium pointing to `http://localhost:8080/control`.
