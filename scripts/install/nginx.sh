#!/bin/bash
set -e

NGINX_VERSION="1.29.1"
NGINX_URL="https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz"
INSTALL_DIR="/opt/nginx-${NGINX_VERSION}"
PROFILE_FILE="/etc/profile.d/nginx.sh"

# Install build dependencies
sudo apt update
sudo apt install -y build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev wget

# Download and extract
wget -O /tmp/nginx.tar.gz "$NGINX_URL"
mkdir -p /tmp/nginx-src
tar -xf /tmp/nginx.tar.gz -C /tmp/nginx-src --strip-components=1

# Build and install
cd /tmp/nginx-src
./configure --prefix="$INSTALL_DIR"
make
sudo make install

# Symlink to /usr/sbin/nginx so Varnish can find it
sudo ln -sf "$INSTALL_DIR/sbin/nginx" /usr/sbin/nginx

# Add Nginx to PATH
echo "export PATH=\"$INSTALL_DIR/sbin:\$PATH\"" | sudo tee "$PROFILE_FILE" > /dev/null
chmod +x "$PROFILE_FILE"

echo "Nginx $NGINX_VERSION installed in $INSTALL_DIR."
echo "PATH updated via $PROFILE_FILE. Run 'source $PROFILE_FILE' or restart your shell."