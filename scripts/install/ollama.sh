#!/bin/bash
set -e

# Note: This script should be run with sudo for system-wide installation
# Usage: sudo ./scripts/install/ollama.sh

echo "Installing Ollama..."

# Install Ollama using the official installation script
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
if command -v ollama &> /dev/null; then
    echo "Ollama installed successfully: $(ollama -v)"
else
    echo "Error: Ollama installation failed"
    exit 1
fi