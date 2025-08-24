#!/bin/bash
set -e

if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing..."
    sudo apt install gnome-terminal
    curl https://desktop.docker.com/linux/main/amd64/docker-desktop-amd64.deb --output docker-desktop-amd64.deb
    sudo apt-get update
    sudo apt-get install ./docker-desktop-amd64.deb
    systemctl --user enable docker-desktop
    echo "Docker already installed: $(docker --version)"
else
    echo "Docker already installed: $(docker --version)"
fi