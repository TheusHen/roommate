#!/bin/bash

# Note: This script should be run with sudo to install system dependencies
# Usage: sudo ./scripts/check_dependencies.sh

find . -type f -name "*.sh" -exec chmod +x {} \;

if ! command -v python3 &> /dev/null; then
    echo "Python not found. Installing..."
    sudo ./scripts/install/python.sh
else
    echo "Python already installed: $(python3 --version)"
fi

if ! command --version bun &> /dev/null; then
    echo "Bun not found. Installing..."
    sudo ./scripts/install/bun.sh
else
    echo "Bun already installed: $(bun --version)"
fi

if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    sudo ./scripts/install/node.sh
else
    echo "Node.js already installed: $(node -v)"
fi

if ! command -v php &> /dev/null; then
    echo "PHP not found. Installing..."
    sudo ./scripts/install/php.sh
else
    echo "PHP already installed: $(php -v | head -n 1)"
fi

if ! command -v nginx &> /dev/null; then
    echo "Nginx not found. Installing..."
    sudo ./scripts/install/nginx.sh
else
    echo "Nginx already installed: $(nginx -v 2>&1)"
fi

if ! command -v varnishd &> /dev/null; then
    echo "Varnish not found. Installing..."
    sudo ./scripts/install/varnish.sh
else
    echo "Varnish already installed: $(varnishd -V | head -n 1)"
fi

if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Installing..."
    sudo ./scripts/install/ollama.sh
else
    echo "Ollama already installed: $(ollama -v)"
fi
