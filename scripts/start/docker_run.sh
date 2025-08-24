#!/bin/bash

# The project can be run on Windows using Docker, but manual installation will be required
chmod +x ./scripts/install/docker.sh
./scripts/install/docker.sh

docker compose up -d