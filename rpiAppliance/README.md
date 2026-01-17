# DeviceControl2 - Raspberry Pi Installer

Automated installation script for DeviceControl2 on Raspberry Pi OS 12 (Bookworm).

## Requirements

- **Clean Raspberry Pi OS 12 (Bookworm) installation**
- **User `devicecontrol` will be created automatically if it doesn't exist**
- Internet connection for downloading packages and DC2

The installer will automatically:
- Create the `devicecontrol` user if it doesn't exist
- Set password to `pesp1102` 
- Configure SSH access for remote connections
- Add user to sudo group for administrative tasks

## Quick Start

1. Copy the entire `rpiAppliance` folder to a USB drive
2. Insert the USB drive into your Raspberry Pi
3. Mount the drive (usually auto-mounted at `/media/devicecontrol/...`)
4. Run the installer:

```bash
cd /media/devicecontrol/YOUR_USB_NAME/rpiAppliance/scripts
sudo ./run-all.sh
```

5. Reboot when complete:

```bash
sudo reboot
```

## Installation Steps

The installer performs these steps automatically:

1. **10-install-base.sh** - System updates and base packages
2. **20-install-node.sh** - Node.js v20 via NVM
3. **30-download-dc2.sh** - Download DeviceControl2 from GitHub
4. **40-configure-autologin.sh** - Configure passwordless auto-login
5. **50-create-service.sh** - Create systemd service for DC2
6. **60-install-xserver.sh** - Install X Server, Openbox, and Chromium
7. **70-configure-plymouth.sh** - Configure boot splash screen

## Options

```bash
# Install latest stable version (default)
sudo ./run-all.sh

# Install latest beta/pre-release
sudo ./run-all.sh --beta

# Install specific version
sudo ./run-all.sh --version=1.2.3

# Force re-download (useful for updates)
sudo ./run-all.sh --force-download
```

## Configuration

### Custom UI URL

Create a `.env` file at `/mnt/pendrive/rpiAppliance/.env`:

```env
DC2_UI_URL=http://localhost:8080/#/control
```

The installer will read this file and configure the kiosk browser accordingly.

## After Installation

After reboot, the system will:

1. Show Plymouth splash screen during boot (if splash.png exists)
2. Auto-login as `devicecontrol` user on TTY1
3. Automatically start X Server
4. Launch Chromium browser in kiosk mode
5. Display DeviceControl2 interface

## Diagnostics

Run the diagnostic script to check installation status:

```bash
cd /media/devicecontrol/YOUR_USB_NAME/rpiAppliance/scripts
sudo ./99-diagnose.sh
```

## Troubleshooting

### Service not starting

```bash
sudo systemctl status devicecontrol.service
sudo journalctl -u devicecontrol.service -n 50
```

### X Server not starting

Check logs:
```bash
cat /tmp/kiosk-session.log
```

Manually start X:
```bash
sudo -u devicecontrol startx
```

### Reinstall/Update

Run the installer with `--force-download`:

```bash
sudo ./run-all.sh --force-download
```

## System Details

- **User**: devicecontrol (created automatically with password `pesp1102`)
- **SSH Access**: Enabled for remote connections
- **Install Directory**: /opt/devicecontrol2
- **Service**: devicecontrol.service
- **UI Port**: 8080
- **Browser**: Chromium (kiosk mode)
- **Display**: X Server on TTY1

## SSH Access

After installation, you can connect remotely:
```bash
ssh devicecontrol@<raspberry-pi-ip>
# Password: pesp1102
```

## Notes

- The installer creates the `devicecontrol` user automatically if it doesn't exist
- SSH server is installed and configured for remote access
- If splash.png is not found in the DC2 package, Plymouth configuration is skipped
- All installation is done in `/opt/devicecontrol2`
- The system is configured for headless kiosk operation
