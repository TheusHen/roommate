#!/bin/bash
set -e

URL="https://varnish-cache.org/downloads/varnish-7.7.3.tgz"
FILENAME="varnish-7.7.3.tgz"
INSTALL_DIR="/opt/varnish-7.7.3"
PROFILE_FILE="/etc/profile.d/varnish.sh"

# Download the tarball
wget -O "$FILENAME" "$URL"

# Create installation directory
sudo mkdir -p "$INSTALL_DIR"

# Extract to installation directory
sudo tar -xzf "$FILENAME" -C "$INSTALL_DIR" --strip-components=1

# Add to PATH (assuming bin directory exists after build/install)
echo "export PATH=\"$INSTALL_DIR/bin:\$PATH\"" | sudo tee "$PROFILE_FILE" > /dev/null

echo "Varnish 7.7.3 downloaded and extracted to $INSTALL_DIR"
echo "PATH updated via $PROFILE_FILE."