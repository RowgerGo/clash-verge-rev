#!/bin/bash
/usr/bin/dayup-link-service-uninstall

. /etc/os-release

if [ "$ID" = "deepin" ]; then
    if [ -f "/usr/share/applications/dayup-link.desktop" ]; then
        echo "Removing deepin desktop file"
        rm -vf "/usr/share/applications/dayup-link.desktop"
    fi
fi

