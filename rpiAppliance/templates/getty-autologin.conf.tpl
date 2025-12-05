[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin {{KIOSK_USER}} --noclear %I $TERM
Type=idle
