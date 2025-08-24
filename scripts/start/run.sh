#!/bin/bash



chmod +x ./* ./scripts/*.sh ./gpt-oss/*.sh

# Helper for loading bar animation
loading_bar() {
    local msg="$1"
    local duration=${2:-3}
    echo -ne "\033[1;34m$msg\033[0m "
    for ((i=0; i<$duration; i++)); do
        echo -ne "▮"
        sleep 0.3
    done
    echo ""
}

clear
echo -e "\033[1;32m==============================\033[0m"
echo -e "\033[1;32m   Roommate Startup Script    \033[0m"
echo -e "\033[1;32m==============================\033[0m"

# Check dependencies
loading_bar "[1/7] Checking dependencies..." 7
./scripts/check_dependencies.sh
if [ $? -ne 0 ]; then
        echo -e "\033[1;31m[ERROR]\033[0m Dependency check failed."
        exit 1
fi
echo -e "\033[1;32m[OK]\033[0m Dependencies are satisfied."

# Run analytics
loading_bar "[2/7] Running analytics..." 6
python3 ./config/analytics.py
if [ $? -ne 0 ]; then
        echo -e "\033[1;31m[ERROR]\033[0m Analytics script failed."
        exit 1
fi
echo -e "\033[1;32m[OK]\033[0m Analytics completed."

# Set environment
loading_bar "[3/7] Setting environment..." 5
python3 ./config/set_env.py
if [ $? -ne 0 ]; then
        echo -e "\033[1;31m[ERROR]\033[0m Failed to set environment."
        exit 1
fi
echo -e "\033[1;32m[OK]\033[0m Environment set."

# Start main application
loading_bar "[4/7] Starting main application..." 8
./gpt-oss/start.sh &
APP_PID=$!
echo -e "\033[1;32m[OK]\033[0m Main application started (PID $APP_PID)."

# Install Node.js dependencies
loading_bar "[5/7] Installing Node.js dependencies (server/ & sentry/ts)..." 10
npm install --prefix ./server &
npm install --prefix ./sentry/ts &
echo -e "\033[1;32m[OK]\033[0m Node.js dependencies installation started."

# Install PHP dependencies (Nightwatch)
loading_bar "[6/7] Installing PHP dependencies (nightwatch)..." 7
composer install --working-dir=./nightwatch &
echo -e "\033[1;32m[OK]\033[0m PHP dependencies installation started."

# Start scheduler
loading_bar "[7/7] Starting scheduler..." 5
nohup bash ./scheduled/scheduler.sh > ./output.log 2>&1 &
echo -e "\033[1;32m[OK]\033[0m Scheduler started."

# Start nginx
loading_bar "[EXTRA] Starting nginx..." 6
sudo nginx -c $(pwd)/nginx/nginx.conf &
echo -e "\033[1;32m[OK]\033[0m Nginx started."

# Start varnish
loading_bar "[EXTRA] Starting varnish..." 6
sudo varnishd -f $(pwd)/varnish/default.vcl -a :8080 -s malloc,256m &
echo -e "\033[1;32m[OK]\033[0m Varnish started."

echo -e "\033[1;36m--------------------------------------\033[0m"
echo -e "\033[1;36m All services started in background!  \033[0m"
echo -e "\033[1;36m--------------------------------------\033[0m"