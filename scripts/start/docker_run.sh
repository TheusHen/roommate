#!/bin/bash

# Note: This script should be run with sudo for Docker operations
# Usage: sudo ./scripts/start/docker_run.sh

# The project can be run on Windows using Docker, but manual installation will be required
chmod +x ./scripts/install/docker.sh
sudo ./scripts/install/docker.sh

docker compose up -d