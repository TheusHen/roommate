#!/bin/bash

chmod +x ./* ./scripts/*.sh ./gpt-oss/*.sh

# Check dependencies
echo "Checking dependencies..."
./scripts/check_dependencies.sh
if [ $? -ne 0 ]; then
    echo "Dependency check failed."
    exit 1
fi

# Run analytics
echo "Running analytics..."
python3 ./config/analytics.py
if [ $? -ne 0 ]; then
    echo "Analytics script failed."
    exit 1
fi

# Set environment
echo "Setting environment..."
python3 ./config/set_env.py
if [ $? -ne 0 ]; then
    echo "Failed to set environment."
    exit 1
fi

# Start the application
echo "Starting the application..."
./gpt-oss/start.sh
if [ $? -ne 0 ]; then
    echo "Failed to start the application."
    exit 1
fi