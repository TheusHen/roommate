# Roommate Deployment Architecture

## Overview
The Roommate application uses a multi-tier architecture for optimal performance, security, and caching.

## Architecture Flow
```
Browser → Nginx (Port 443/80) → Varnish (Port 6081) → Bun Server (Port 3000)
```

## Component Details

### Bun Server (Port 3000)
- **Purpose**: Core application server
- **Technology**: Bun.js TypeScript runtime
- **Port**: 3000 (internal)
- **Logs**: `./bun.log`

### Varnish Cache (Port 6081)
- **Purpose**: HTTP acceleration and caching layer
- **User**: `varnish` (non-root for security)
- **Port**: 6081 (non-privileged)
- **Configs**: 
  - HTTP: `varnish/default.vcl`
  - HTTPS: `varnish/default_https.vcl`
- **Logs**: `./varnish.log`

### Nginx (Port 443/80)
- **Purpose**: Frontend proxy and SSL termination
- **User**: `www-data`
- **Ports**: 
  - HTTP: 80
  - HTTPS: 443
- **Configs**:
  - HTTP: `nginx/nginx.conf`
  - HTTPS: `nginx/nginx_https_configured.conf` (generated)
- **Logs**: `./nginx.log`

## Security Features

1. **Non-root Varnish**: Runs on port 6081 as `varnish` user
2. **Proper file permissions**: VCL files owned by `varnish:varnish`
3. **SSL termination**: Handled by Nginx
4. **Directory permissions**: Configured for service access

## Deployment Modes

### Local Mode
- Only Bun server on port 3000
- Direct access: `http://localhost:3000`

### HTTP Mode  
- Full stack: Nginx (80) → Varnish (6081) → Bun (3000)
- Access: `http://your-domain.com`

### HTTPS Mode
- Full stack with SSL: Nginx (443/80) → Varnish (6081) → Bun (3000)  
- Access: `https://your-domain.com`
- HTTP automatically redirects to HTTPS

## Log Files
- **Bun**: `./bun.log`
- **Varnish**: `./varnish.log`
- **Nginx**: `./nginx.log`
- **Scheduler**: `./output.log`

## Starting the Application
Run the startup script with appropriate permissions:
```bash
sudo ./scripts/start/run.sh
```

The script will prompt for deployment mode and configure all services accordingly.