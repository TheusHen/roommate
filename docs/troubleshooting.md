# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Roommate system.

## 🔍 Diagnostic Flow

```mermaid
graph TD
    A[🚨 Issue Reported] --> B{What Component?}
    B -->|Server| C[🖥️ Server Diagnostics]
    B -->|Database| D[🗄️ Database Diagnostics]
    B -->|Client| E[📱 Client Diagnostics]
    B -->|IoT| F[🏠 IoT Diagnostics]
    B -->|Network| G[🌐 Network Diagnostics]
    
    C --> C1[Check Port 3000]
    C --> C2[Verify API Password]
    C --> C3[Check Logs]
    C1 --> H{Issue Resolved?}
    C2 --> H
    C3 --> H
    
    D --> D1[MongoDB Connection]
    D --> D2[Memory Collection]
    D --> D3[Data Integrity]
    D1 --> H
    D2 --> H
    D3 --> H
    
    E --> E1[App Installation]
    E --> E2[Network Connectivity]
    E --> E3[Authentication]
    E1 --> H
    E2 --> H
    E3 --> H
    
    F --> F1[Device Connection]
    F --> F2[Sensor Readings]
    F --> F3[WebSocket Status]
    F1 --> H
    F2 --> H
    F3 --> H
    
    G --> G1[DNS Resolution]
    G --> G2[Firewall Rules]
    G --> G3[SSL Certificates]
    G1 --> H
    G2 --> H
    G3 --> H
    
    H -->|Yes| I[✅ Issue Resolved]
    H -->|No| J[📞 Advanced Support]
    
    style A fill:#ffebee
    style I fill:#e8f5e8
    style J fill:#fff3e0
```

## 🚨 Quick Diagnostic Tools

### System Health Check Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant D as 🔍 Diagnostic Script
    participant S as 🖥️ Server
    participant DB as 🗄️ MongoDB
    participant N as 🌐 Network
    
    U->>D: Run diagnostic script
    D->>N: Check network connectivity
    N-->>D: Network status
    D->>S: Check server health
    S-->>D: Server status
    D->>DB: Test database connection
    DB-->>D: Database status
    D->>S: Test API endpoints
    S-->>D: API responses
    D-->>U: Generate diagnostic report
```

### Automated Diagnostics
```bash
# Run the comprehensive diagnostic script
./scripts/validate_fixes.sh

# Check system dependencies
./scripts/check_dependencies.sh

# Test all components
./run-tests.sh
```

### Health Check Commands
```bash
# Check server health
curl http://localhost:3000/health

# Verify database connection
cd mongodb && bun test

# Test API endpoints
curl -X POST http://localhost:3000/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_PASSWORD" \
  -d '{"message": "test", "userId": "test"}'
```

## 🔧 Common Issues & Solutions

### Installation Problems

#### Issue: Dependencies Not Found
```bash
# Symptoms
./scripts/start/run.sh
# Error: command not found: bun/flutter/php/etc.

# Solution
./scripts/check_dependencies.sh
# Install missing dependencies individually:
./scripts/install/bun.sh
./scripts/install/python.sh
./scripts/install/node.sh
./scripts/install/php.sh
./scripts/install/nginx.sh
```

#### Issue: Permission Denied
```bash
# Symptoms
bash: ./scripts/start/run.sh: Permission denied

# Solution
chmod +x ./scripts/start/run.sh
chmod +x ./scripts/*.sh
chmod +x ./gpt-oss/*.sh
```

#### Issue: Port Already in Use
```bash
# Symptoms
Error: EADDRINUSE: address already in use :::3000

# Solution - Find and kill process
lsof -ti:3000 | xargs kill -9
# Or use a different port
export PORT=3001
```

### Database Issues

#### Issue: MongoDB Connection Failed
```mermaid
flowchart TD
    A[🔍 MongoDB Connection Error] --> B{Is MongoDB Running?}
    B -->|No| C[🚀 Start MongoDB]
    B -->|Yes| D{Correct Connection String?}
    
    C --> E[🐳 Docker: docker run -d -p 27017:27017 mongo]
    C --> F[🖥️ Local: brew services start mongodb-community]
    
    D -->|No| G[📝 Check MONGODB_URI in .env]
    D -->|Yes| H{Network/Firewall Issues?}
    
    G --> I[✅ Update connection string]
    H --> J[🔧 Check firewall settings]
    
    E --> K[✅ Try connection again]
    F --> K
    I --> K
    J --> K
```

**Common MongoDB Solutions:**
```bash
# Start MongoDB with Docker
docker run -d -p 27017:27017 --name roommate-mongo mongo

# Check if MongoDB is accessible
mongosh --host localhost:27017

# Verify connection string in .env
echo $MONGODB_URI
# Should be: mongodb://localhost:27017/roommate
```

#### Issue: Database Access Denied
```bash
# Symptoms
MongoServerError: Authentication failed

# Solution - Check credentials
# Update .env with correct credentials:
MONGODB_URI=mongodb://username:password@localhost:27017/roommate

# Or use MongoDB without authentication (development only):
MONGODB_URI=mongodb://localhost:27017/roommate
```

### Server Issues

#### Issue: Server Won't Start
```mermaid
flowchart TD
    A[🚨 Server Startup Error] --> B{Check Error Type}
    B -->|Port Issue| C[📡 Port Already Used]
    B -->|Module Error| D[📦 Missing Dependencies]
    B -->|Config Error| E[⚙️ Configuration Issue]
    
    C --> F[🔍 Find process: lsof -ti:3000]
    F --> G[🔥 Kill process: kill -9 PID]
    
    D --> H[📦 Install dependencies: bun install]
    H --> I[🔧 Update packages: bun update]
    
    E --> J[📝 Check .env file]
    J --> K[🔑 Verify API_PASSWORD set]
    
    G --> L[✅ Restart server]
    I --> L
    K --> L
```

**Server Debugging Steps:**
```bash
# Check server logs
cd server
bun run index.ts

# Enable debug logging
DEBUG=* bun run index.ts

# Test with minimal config
API_PASSWORD=test PORT=3001 bun run index.ts
```

#### Issue: API Authentication Errors
```bash
# Symptoms
401 Unauthorized / Invalid API key

# Solutions
# 1. Check if API_PASSWORD is set
echo $API_PASSWORD

# 2. Generate new API password
cd server && bun run generate-password.ts

# 3. Use correct header format
curl -H "Authorization: Bearer YOUR_API_PASSWORD" http://localhost:3000/health

# 4. Check server logs for the generated password
grep "API password" server/logs/*.log
```

### Flutter App Issues

#### Issue: Flutter Build Failures
```bash
# Symptoms
flutter run fails / flutter build fails

# Diagnostics
flutter doctor -v
flutter clean
flutter pub get

# Common solutions
rm -rf build/
flutter pub deps
flutter upgrade
```

#### Issue: Network Connection Errors
```mermaid
flowchart TD
    A[📱 Flutter Network Error] --> B{Server Running?}
    B -->|No| C[🚀 Start server: bun run index.ts]
    B -->|Yes| D{Correct API URL?}
    
    D -->|No| E[📝 Update lib/config.dart]
    D -->|Yes| F{CORS Issues?}
    
    E --> G[✅ Set correct endpoint]
    F --> H[🔧 Check server CORS config]
    
    C --> I[✅ Try app again]
    G --> I
    H --> I
```

**Flutter Configuration Check:**
```dart
// lib/config.dart - Update API endpoint
class Config {
  static const String apiUrl = 'http://localhost:3000'; // or your server URL
  static const String apiPassword = 'your-api-password';
}
```

### Memory System Issues

#### Issue: Memory Not Saving
```bash
# Test memory endpoint directly
curl -X POST http://localhost:3000/memory/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_PASSWORD" \
  -d '{"userId": "test", "sentence": "My name is John"}'

# Check MongoDB for saved data
mongosh roommate --eval "db.user_memories.find()"
```

#### Issue: Memory Retrieval Problems
```bash
# Test memory retrieval
curl "http://localhost:3000/memory/get?userId=test&prompt=What is my name?" \
  -H "Authorization: Bearer YOUR_API_PASSWORD"

# Check memory pattern recognition
cd mongodb && bun test -- --grep "pattern"
```

### Performance Issues

#### Issue: Slow Response Times
```mermaid
flowchart TD
    A[🐌 Slow Performance] --> B{Check Resource Usage}
    B --> C[💾 Memory Usage]
    B --> D[🖥️ CPU Usage]
    B --> E[💽 Disk I/O]
    B --> F[🌐 Network Latency]
    
    C --> G[🔍 Check for memory leaks]
    D --> H[🔍 Identify CPU bottlenecks]
    E --> I[🔍 Database query optimization]
    F --> J[🔍 Network diagnostics]
    
    G --> K[📊 Use profiling tools]
    H --> K
    I --> K
    J --> K
    
    K --> L[🔧 Apply optimizations]
```

**Performance Monitoring:**
```bash
# Monitor system resources
top -p $(pgrep -f "bun run index.ts")

# Check memory usage
ps aux | grep bun

# Monitor database performance
mongosh roommate --eval "db.stats()"

# Enable request logging
DEBUG=express:* bun run index.ts
```

### Docker Issues

#### Issue: Docker Containers Not Starting
```bash
# Check Docker status
docker ps -a

# View container logs
docker logs roommate-server
docker logs roommate-mongo

# Restart containers
docker-compose down
docker-compose up -d

# Rebuild containers
docker-compose build --no-cache
```

#### Issue: Docker Volume Problems
```bash
# Check volumes
docker volume ls

# Remove and recreate volumes
docker-compose down -v
docker-compose up -d

# Check volume permissions
docker exec -it roommate-server ls -la /app
```

## 🔍 Advanced Diagnostics

### Log Analysis

#### Server Logs
```bash
# View real-time server logs
tail -f server/logs/app.log

# Search for specific errors
grep -i "error" server/logs/*.log

# Analyze request patterns
grep "POST\|GET" server/logs/access.log | tail -50
```

#### System Logs
```bash
# View system logs (Linux)
journalctl -u roommate-server -f

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Nginx logs
tail -f /var/log/nginx/error.log
```

### Network Diagnostics
```bash
# Test connectivity between services
curl -v http://localhost:3000/health
curl -v http://localhost:27017/

# Check DNS resolution
nslookup localhost
ping localhost

# Verify firewall rules
sudo ufw status
sudo iptables -L
```

### Database Diagnostics
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ismaster')"

# View database statistics
mongosh roommate --eval "db.stats()"

# Check collection status
mongosh roommate --eval "db.user_memories.stats()"

# Analyze slow queries
mongosh roommate --eval "db.setProfilingLevel(2)"
mongosh roommate --eval "db.system.profile.find().sort({ts:-1}).limit(5)"
```

## 📊 Monitoring Setup

### Health Check Endpoints
```bash
# Server health
curl http://localhost:3000/health

# Database connectivity
curl http://localhost:3000/health/db

# Memory system status
curl http://localhost:3000/health/memory

# All services status
curl http://localhost:3000/health/all
```

### Error Tracking

#### Sentry Configuration
```javascript
// Check Sentry configuration
if (process.env.SENTRY_DSN) {
  console.log('Sentry is configured');
} else {
  console.log('Sentry DSN not set');
}
```

#### Nightwatch PHP Monitoring
```bash
# Test Nightwatch endpoint
cd nightwatch
./vendor/bin/phpunit tests/NightwatchControllerTest.php

# Check Nightwatch logs
tail -f nightwatch/logs/nightwatch.log
```

## 🚨 Emergency Procedures

### Service Recovery
```bash
# Quick service restart
./scripts/emergency-restart.sh

# Or manual restart
pkill -f "bun run index.ts"
cd server && bun run index.ts &

# Database recovery
docker restart roommate-mongo
# or
sudo systemctl restart mongodb
```

### Data Backup
```bash
# Backup MongoDB data
mongodump --host localhost:27017 --db roommate --out backup/

# Restore from backup
mongorestore --host localhost:27017 --db roommate backup/roommate/
```

### Rollback Procedures
```bash
# Rollback to previous version
git checkout HEAD~1
./scripts/start/run.sh

# Or use Docker tags
docker pull theushen/roommate:previous
docker-compose up -d
```

## 📞 Getting Help

### Community Support
1. **GitHub Issues**: [Report bugs](https://github.com/TheusHen/roommate/issues)
2. **Discussions**: [Community forum](https://github.com/TheusHen/roommate/discussions)
3. **Documentation**: Check [FAQ](faq.md) and other docs

### Debug Information to Include
When reporting issues, include:
```bash
# System information
uname -a
node --version
bun --version
flutter --version
python3 --version
php --version

# Service status
./scripts/validate_fixes.sh > debug-info.txt

# Logs (last 50 lines)
tail -50 server/logs/app.log > server-logs.txt
```

### Log Collection Script
```bash
#!/bin/bash
# collect-debug-info.sh
echo "Collecting debug information..."

echo "=== System Info ===" > debug-report.txt
uname -a >> debug-report.txt
echo "" >> debug-report.txt

echo "=== Service Status ===" >> debug-report.txt
./scripts/validate_fixes.sh >> debug-report.txt
echo "" >> debug-report.txt

echo "=== Recent Logs ===" >> debug-report.txt
tail -50 server/logs/app.log >> debug-report.txt

echo "Debug information saved to debug-report.txt"
```

Remember: When in doubt, start with the automated diagnostic tools and work through the common issues systematically. Most problems have simple solutions once properly identified.