# Advanced Installation Guide

This guide covers manual and advanced setup for the Roommate project, including environment configuration, dependency installation, and troubleshooting.

## Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- **Bun**
- **PHP 8.2+**
- **MongoDB**
- **Nginx**
- **Docker** (optional)

## Manual Setup Steps

### 1. Install Dependencies
Run the dependency checker:
```sh
sudo ./scripts/check_dependencies.sh
```
Or install manually:
- Python: `sudo ./scripts/install/python.sh`
- Bun: `sudo ./scripts/install/bun.sh`
- Node.js: `sudo ./scripts/install/node.sh`
- PHP: `sudo ./scripts/install/php.sh`
- Nginx: `sudo ./scripts/install/nginx.sh`

### 2. Install Project Packages
```sh
cd mongodb && bun install
cd ../server && bun install
cd ../web && npm install
cd ../nightwatch && composer install
```

### 3. Start Services
- **MongoDB**: `docker run -d -p 27017:27017 mongo`
- **Server**: `cd server && bun run index.ts`
- **Web App**: `cd web && npm run dev`
- **Nightwatch (PHP)**: `cd nightwatch && ./vendor/bin/phpunit tests/NightwatchControllerTest.php`

### 4. Docker Setup
```sh
sudo ./scripts/start/docker_run.sh
```

## Troubleshooting
- See [FAQ](faq.md) for common issues.
- Validate fixes: `sudo ./scripts/validate_fixes.sh`
- For CI/CD, see `.github/workflows/ci.yml`.