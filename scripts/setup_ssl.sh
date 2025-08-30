#!/bin/bash
set -e

echo -e "\033[1;36m=== SSL Certificate Setup ===\033[0m"

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo -e "\033[1;34m[INFO]\033[0m Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    echo -e "\033[1;32m[OK]\033[0m Certbot installed successfully."
else
    echo -e "\033[1;32m[OK]\033[0m Certbot already installed."
fi

# Get domain name from user
echo ""
echo -e "\033[1;36mSSL Certificate Configuration\033[0m"
echo "Enter the domain name that will point to this server:"
echo "Example: yourdomain.com or subdomain.yourdomain.com"
read -p "Domain: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "\033[1;31m[ERROR]\033[0m Domain name cannot be empty."
    exit 1
fi

echo -e "\033[1;34m[INFO]\033[0m Domain set to: $DOMAIN"

# Store domain for nginx configuration
echo "$DOMAIN" > /tmp/ssl_domain.txt

echo -e "\033[1;34m[INFO]\033[0m Generating SSL certificate for $DOMAIN..."
echo "Make sure your domain points to this server's IP address before proceeding."
echo "Press Enter to continue or Ctrl+C to abort..."
read

# Generate SSL certificate
if sudo certbot certonly --standalone --preferred-challenges http -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" --keep-until-expiring; then
    echo -e "\033[1;32m[OK]\033[0m SSL certificate generated successfully for $DOMAIN"
    
    # Store paths for nginx configuration
    SSL_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    SSL_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
    
    echo "$SSL_CERT" > /tmp/ssl_cert_path.txt
    echo "$SSL_KEY" > /tmp/ssl_key_path.txt
    
    echo -e "\033[1;32m[OK]\033[0m SSL certificate paths stored:"
    echo "  Certificate: $SSL_CERT"
    echo "  Private Key: $SSL_KEY"
else
    echo -e "\033[1;31m[ERROR]\033[0m Failed to generate SSL certificate."
    echo "Please make sure:"
    echo "1. Your domain points to this server's IP address"
    echo "2. Port 80 is not blocked by firewall"
    echo "3. You have root permissions"
    exit 1
fi

echo -e "\033[1;32m[OK]\033[0m SSL setup completed successfully."