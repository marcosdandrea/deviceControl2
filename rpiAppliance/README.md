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
- Create a dedicated `admin` user for remote SSH console access (see [Remote SSH Access](#remote-ssh-access))

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
2. **15-create-admin-user.sh** - Create the `admin` user for remote SSH console access
3. **20-install-node.sh** - Node.js v20 via NVM  
4. **25-configure-audio.sh** - Audio system configuration for kiosk mode
5. **30-download-dc2.sh** - Download DeviceControl2 from GitHub
6. **40-configure-autologin.sh** - Configure passwordless auto-login
7. **50-create-service.sh** - Create systemd service for DC2
8. **60-install-xserver.sh** - Install X Server, Openbox, and Chromium
9. **70-configure-plymouth.sh** - Configure boot splash screen

## Kiosk Optimizations

The installer now includes optimizations specifically for kiosk mode:

### Audio Configuration
- **Automatic audio playback** without user interaction required
- **ALSA and PulseAudio** configured for immediate audio output
- **Audio permissions** properly set for the kiosk user
- **Volume levels** automatically set to 80% on startup

### Browser Optimizations
- **Hardware acceleration** enabled for better performance
- **Audio autoplay** policy set to allow media without user gestures
- **Screen blanking disabled** by default for continuous display
- **Cursor completely hidden** using multiple methods
- **Touch events** enabled for touchscreen interfaces
- **Kiosk mode** with all distractions removed

### Menu Changes
- **Update option** now automatically forces download (equivalent to --force-download)
- **Screen blanking configuration** removed from interactive setup
- **Simplified installation** process focused on kiosk deployment

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

Test audio configuration:

```bash
sudo ./test-audio-kiosk.sh
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

- **User**: devicecontrol (created automatically with password `pesp1102`; ends up passwordless after autologin is configured, see [SSH Access](#ssh-access))
- **User**: admin (created for remote SSH console access with password `hgcibm/e`, see [Remote SSH Access](#remote-ssh-access))
- **SSH Access**: Enabled for remote connections via the `admin` user
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

> ⚠️ **Note**: `40-configure-autologin.sh` removes the password of `devicecontrol`
> (`passwd -d`) so LightDM can auto-login without a prompt. After a full
> installation this account has **no usable password**, so it cannot log in
> over SSH (and `sudo` cannot be authenticated either). Use the `admin` user
> below for remote access instead.

## Remote SSH Access

`15-create-admin-user.sh` creates a dedicated `admin` user, separate from
`devicecontrol`, meant to be your permanent way of getting a remote console
on the appliance:

- Created with a home directory and `/bin/bash` shell
- Added to the `sudo` group
- Password set to `hgcibm/e` (hardcoded in `00-common.sh` as `ADMIN_PASSWORD`)
- Ensures `openssh-server` is installed and the `ssh` service is enabled

Connect with:
```bash
ssh admin@<raspberry-pi-ip>
# Password: hgcibm/e
```

If the installer is re-run and `admin` already exists, user creation is
skipped (its password is left untouched). To change the password later:
```bash
sudo passwd admin
```

## Notes

- The installer creates the `devicecontrol` user automatically if it doesn't exist
- The installer creates a separate `admin` user with sudo, meant for remote SSH console access (see [Remote SSH Access](#remote-ssh-access))
- SSH server is installed and configured for remote access
- If splash.png is not found in the DC2 package, Plymouth configuration is skipped
- All installation is done in `/opt/devicecontrol2`
- The system is configured for headless kiosk operation
