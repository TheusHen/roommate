#!/bin/bash
set -e

sudo apt update
sudo apt install -y varnish

echo "Varnish installed successfully and ready to run."