[Unit]
Description=DeviceControl 2 Headless Service
After=network-online.target
Wants=network-online.target

[Service]
User={{DC2_USER}}
Group={{DC2_USER}}
WorkingDirectory={{DC2_INSTALL_DIR}}

ExecStart={{NODE_BIN}} {{DC2_INSTALL_DIR}}/main.js

Restart=always
RestartSec=3

Environment=NODE_ENV=production
Environment=DC2_HARDWARE=rpi

[Install]
WantedBy=multi-user.target
