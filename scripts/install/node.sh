#!/bin/bash

# Note: This script should be run with sudo for system-wide installation
# Usage: sudo ./scripts/install/node.sh

curl -o- https://fnm.vercel.app/install | bash
fnm install 22
node -v
npm -v