#!/bin/bash
set -e

# Note: This script should be run with sudo for proper system setup
# Usage: sudo ./scripts/start/run.sh

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
echo -e "\033[1;37m Architecture: Browser → Nginx (443/80) → Varnish (6081) → Bun (3000) \033[0m"

# Deployment mode selection
echo ""
echo -e "\033[1;36mSelect deployment mode:\033[0m"
echo -e "1) \033[1;32mHTTPS (Recommended)\033[0m - Secure production deployment with SSL certificates"
echo -e "2) \033[1;33mHTTP (Not Recommended)\033[0m - Standard HTTP deployment"
echo -e "3) \033[1;34mLocal\033[0m - Local development (Bun server only on port 3000)"
echo ""
read -p "Enter your choice (1-3): " DEPLOYMENT_MODE

case $DEPLOYMENT_MODE in
    1)
        DEPLOYMENT_TYPE="https"
        VARNISH_PORT="6081"
        echo -e "\033[1;32m[INFO]\033[0m Selected HTTPS mode - will configure SSL certificates"
        ;;
    2)
        DEPLOYMENT_TYPE="http"
        VARNISH_PORT="6081"
        echo -e "\033[1;33m[INFO]\033[0m Selected HTTP mode - using port 80"
        ;;
    3)
        DEPLOYMENT_TYPE="local"
        echo -e "\033[1;34m[INFO]\033[0m Selected Local mode - Bun server only on port 3000"
        ;;
    *)
        echo -e "\033[1;31m[ERROR]\033[0m Invalid choice. Defaulting to Local mode."
        DEPLOYMENT_TYPE="local"
        ;;
esac

echo ""

# --- Kill processes using required ports ---
if [ "$DEPLOYMENT_TYPE" = "local" ]; then
    PORTS_TO_CHECK="3000"
elif [ "$DEPLOYMENT_TYPE" = "https" ]; then
    PORTS_TO_CHECK="443 3000 6081"
else
    PORTS_TO_CHECK="80 3000 6081"
fi

for PORT in $PORTS_TO_CHECK; do
    if lsof -i :$PORT &> /dev/null; then
        echo -e "\033[1;33m[WARN]\033[0m Port $PORT in use, killing process..."
        lsof -i :$PORT | awk 'NR>1 {print $2}' | xargs -r kill -9
        echo -e "\033[1;32m[OK]\033[0m Port $PORT freed."
    fi
done

# Check dependencies
loading_bar "[1/7] Checking dependencies..." 7
sudo ./scripts/check_dependencies.sh
echo -e "\033[1;32m[OK]\033[0m Dependencies are satisfied."

# SSL setup for HTTPS mode
if [ "$DEPLOYMENT_TYPE" = "https" ]; then
    loading_bar "[EXTRA] Setting up SSL certificates..." 8
    ./scripts/setup_ssl.sh
    echo -e "\033[1;32m[OK]\033[0m SSL certificates configured."
fi

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

# Install PHP dependencies (Nightwatch) - only for non-local mode
if [ "$DEPLOYMENT_TYPE" != "local" ]; then
    loading_bar "[7/8] Installing PHP dependencies..." 7
    composer install --working-dir=./nightwatch &
    echo -e "\033[1;32m[OK]\033[0m PHP dependencies installation started."
fi

# Start scheduler
loading_bar "[8/8] Starting scheduler..." 5
nohup bash ./scheduled/scheduler.sh > ./output.log 2>&1 &
echo -e "\033[1;32m[OK]\033[0m Scheduler started."

# Start nginx and varnish only for HTTP/HTTPS modes
if [ "$DEPLOYMENT_TYPE" != "local" ]; then
    # Set up proper permissions for Varnish files and directories
    loading_bar "[EXTRA] Setting up Varnish permissions..." 3
    chmod o+x /home/ubuntu /home/ubuntu/roommate /home/ubuntu/roommate/varnish 2>/dev/null || true
    sudo chown varnish:varnish $(pwd)/varnish/default_https.vcl $(pwd)/varnish/default.vcl 2>/dev/null || true
    sudo chmod 644 $(pwd)/varnish/default_https.vcl $(pwd)/varnish/default.vcl 2>/dev/null || true
    echo -e "\033[1;32m[OK]\033[0m Varnish permissions configured."
    
    # Start Varnish first (as it's the backend for Nginx)
    loading_bar "[EXTRA] Starting Varnish cache..." 6
    echo "Starting Varnish on port $VARNISH_PORT"
    if [ "$DEPLOYMENT_TYPE" = "https" ]; then
        sudo -u varnish varnishd -f $(pwd)/varnish/default_https.vcl -a :$VARNISH_PORT -s malloc,256m > ./varnish.log 2>&1 &
    else
        sudo -u varnish varnishd -f $(pwd)/varnish/default.vcl -a :$VARNISH_PORT -s malloc,256m > ./varnish.log 2>&1 &
    fi
    echo -e "\033[1;32m[OK]\033[0m Varnish started on port $VARNISH_PORT."
    
    if [ "$DEPLOYMENT_TYPE" = "https" ]; then
        # Configure nginx for HTTPS
        if [ -f "/tmp/ssl_domain.txt" ] && [ -f "/tmp/ssl_cert_path.txt" ] && [ -f "/tmp/ssl_key_path.txt" ]; then
            DOMAIN=$(cat /tmp/ssl_domain.txt)
            SSL_CERT=$(cat /tmp/ssl_cert_path.txt)
            SSL_KEY=$(cat /tmp/ssl_key_path.txt)
            
            # Create HTTPS nginx config
            cp nginx/nginx_https.conf nginx/nginx_https_configured.conf
            sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx_https_configured.conf
            sed -i "s|SSL_CERT_PLACEHOLDER|$SSL_CERT|g" nginx/nginx_https_configured.conf
            sed -i "s|SSL_KEY_PLACEHOLDER|$SSL_KEY|g" nginx/nginx_https_configured.conf
            
            # Start nginx with HTTPS config
            loading_bar "[EXTRA] Starting Nginx (HTTPS frontend)..." 6
            sudo /opt/nginx-1.29.1/sbin/nginx -c $(pwd)/nginx/nginx_https_configured.conf > ./nginx.log 2>&1 &
            echo -e "\033[1;32m[OK]\033[0m Nginx started with HTTPS configuration on port 443."
        else
            echo -e "\033[1;31m[ERROR]\033[0m SSL configuration files not found. Falling back to HTTP mode."
            DEPLOYMENT_TYPE="http"
            VARNISH_PORT="6081"
        fi
    fi
    
    if [ "$DEPLOYMENT_TYPE" = "http" ]; then
        # Start nginx with HTTP config
        loading_bar "[EXTRA] Starting Nginx (HTTP frontend)..." 6
        sudo /opt/nginx-1.29.1/sbin/nginx -c $(pwd)/nginx/nginx.conf > ./nginx.log 2>&1 &
        echo -e "\033[1;32m[OK]\033[0m Nginx started with HTTP configuration on port 80."
    fi
fi

echo -e "\033[1;36m--------------------------------------\033[0m"
if [ "$DEPLOYMENT_TYPE" = "local" ]; then
    echo -e "\033[1;36m    Local development mode ready!     \033[0m"
    echo -e "\033[1;36m    Access: http://localhost:3000      \033[0m"
elif [ "$DEPLOYMENT_TYPE" = "https" ]; then
    if [ -f "/tmp/ssl_domain.txt" ]; then
        DOMAIN=$(cat /tmp/ssl_domain.txt)
        echo -e "\033[1;36m     HTTPS production mode ready!     \033[0m" 
        echo -e "\033[1;36m    Access: https://$DOMAIN            \033[0m"
    else
        echo -e "\033[1;36m     HTTPS production mode ready!     \033[0m" 
        echo -e "\033[1;36m    Access: https://your-domain.com    \033[0m"
    fi
else
    echo -e "\033[1;36m     HTTP production mode ready!      \033[0m"
    echo -e "\033[1;36m    Access: http://your-domain.com     \033[0m"
fi
echo -e "\033[1;36m--------------------------------------\033[0m"

# Clean up temporary SSL files
if [ "$DEPLOYMENT_TYPE" = "https" ]; then
    rm -f /tmp/ssl_domain.txt /tmp/ssl_cert_path.txt /tmp/ssl_key_path.txt
fi
