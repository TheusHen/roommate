#!/bin/bash
set -e

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

# --- Kill processes using ports 3000 and 80 ---
for PORT in 80 3000 8080; do
    if lsof -i :$PORT &> /dev/null; then
        echo -e "\033[1;33m[WARN]\033[0m Port $PORT in use, killing process..."
        lsof -i :$PORT | awk 'NR>1 {print $2}' | xargs -r kill -9
        echo -e "\033[1;32m[OK]\033[0m Port $PORT freed."
    fi
done

# Check dependencies
loading_bar "[1/7] Checking dependencies..." 7
./scripts/check_dependencies.sh
echo -e "\033[1;32m[OK]\033[0m Dependencies are satisfied."

loading_bar "[EXTRA] Setting up Python venv & installing requirements..." 7
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Run analytics
loading_bar "[2/7] Running analytics..." 6
python3 ./config/analytics.py
echo -e "\033[1;32m[OK]\033[0m Analytics completed."

# Set environment
loading_bar "[3/7] Setting environment..." 5
python3 ./config/set_env.py
echo -e "\033[1;32m[OK]\033[0m Environment set."

# Start main application (Ollama included)
loading_bar "[4/7] Starting main application..." 8
./gpt-oss/start.sh &
APP_PID=$!
echo -e "\033[1;32m[OK]\033[0m Main application started (PID $APP_PID)."

# Install Node.js dependencies
loading_bar "[5/7] Installing Node.js dependencies..." 10
npm install --prefix ./server
npm install --prefix ./sentry/ts
npm install --prefix ./scheduled
echo -e "\033[1;32m[OK]\033[0m Node.js dependencies installation completed."

# Start Bun server
loading_bar "[6/8] Starting the Bun Server.." 8
BUN_CMD="bun run ./server/index.ts"
LOG_FILE="./bun.log"
trap 'echo "Ctrl+C pressed: sending Bun server to background..."; disown %1; exit 0' SIGINT
echo "Starting Bun server... Logs will appear below. Press Ctrl+C to background it."
$BUN_CMD 2>&1 | tee "$LOG_FILE" &

# Install PHP dependencies (Nightwatch)
loading_bar "[7/8] Installing PHP dependencies..." 7
composer install --working-dir=./nightwatch &
echo -e "\033[1;32m[OK]\033[0m PHP dependencies installation started."

# Start scheduler
loading_bar "[8/8] Starting scheduler..." 5
nohup bash ./scheduled/scheduler.sh > ./output.log 2>&1 &
echo -e "\033[1;32m[OK]\033[0m Scheduler started."

# Start nginx
loading_bar "[EXTRA] Starting nginx..." 6
sudo /opt/nginx-1.29.1/sbin/nginx -c $(pwd)/nginx/nginx.conf &
echo -e "\033[1;32m[OK]\033[0m Nginx started."

# Start varnish
loading_bar "[EXTRA] Starting varnish..." 6
sudo varnishd -f $(pwd)/varnish/default.vcl -a :80 -s malloc,256m &
echo -e "\033[1;32m[OK]\033[0m Varnish started."

echo -e "\033[1;36m--------------------------------------\033[0m"
echo -e "\033[1;36m All services started in background!  \033[0m"
echo -e "\033[1;36m--------------------------------------\033[0m"
