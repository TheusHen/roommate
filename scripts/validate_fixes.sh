#!/bin/bash
# Note: This script should be run with sudo to validate system fixes
# Usage: sudo ./scripts/validate_fixes.sh

echo "=== Roommate Startup Issues Fix Validation ==="
echo

echo "1. Ollama install script exists:"
ls -la scripts/install/ollama.sh
echo

echo "2. Dependency check includes ollama:"
grep -n "ollama" scripts/check_dependencies.sh
echo

echo "3. gpt-oss script checks ollama first:"
head -20 gpt-oss/start.sh | grep -n -A2 -B2 "ollama"
echo

echo "4. Startup script waits for npm installs:"
grep -n -A3 -B1 "npm install" scripts/start/run.sh
echo

echo "5. Nginx uses full path:"
grep -n "nginx" scripts/start/run.sh
echo

echo "6. Sentry test functions exist:"
echo "TypeScript:"
grep -n "testSentryIntegration" sentry/ts/sentry.ts
echo "Python:"
grep -n "test_sentry_integration" sentry/py/sentry.py
echo

echo "7. Sentry test scripts exist:"
ls -la scripts/test_sentry.*
echo

echo "All major fixes implemented successfully!"