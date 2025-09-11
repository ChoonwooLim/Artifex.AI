#!/bin/bash
# Auto login setup script for Pop!_OS

# Backup original file
sudo cp /etc/gdm3/custom.conf /etc/gdm3/custom.conf.backup

# Create new config with auto login
sudo tee /etc/gdm3/custom.conf > /dev/null << 'EOF'
# GDM configuration storage
#
# See /usr/share/gdm/gdm.schemas for a list of available options.

[daemon]
# Enabling automatic login
AutomaticLoginEnable = true
AutomaticLogin = stevenlim

# Enabling timed login
TimedLoginEnable = true
TimedLogin = stevenlim
TimedLoginDelay = 3

WaylandEnable=false

[security]

[xdmcp]

[chooser]

[debug]
# Uncomment the line below to turn on debugging
# More verbose logs
# Additionally lets the X server dump core if it crashes
#Enable=true
EOF

echo "Auto login configured successfully!"
echo "Current settings:"
grep -E "AutomaticLogin|TimedLogin" /etc/gdm3/custom.conf

echo ""
echo "To apply changes, please reboot:"
echo "sudo reboot"