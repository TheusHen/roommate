# Testing Infrastructure for Roommate Project

This document describes the comprehensive testing infrastructure implemented for all components of the Roommate project.

## Overview

The project now includes test suites for all major components:

- **MongoDB Handler** (TypeScript/Node.js)
- **Server** (TypeScript/Node.js)
- **Fine-tuning** (Python)
- **Flutter App** (Dart/Flutter)
- **Sentry Integration** (TypeScript)
- **Scheduled Module** (Node.js)
- **Nightwatch Controller** (PHP)
- **ESP32 Module** (Arduino/C++)

## Error Tracking Implementation

### Sentry Integration

#### TypeScript (sentry/ts/sentry.ts)
```typescript
import { captureError, captureMessage, testSentryIntegration } from './sentry/ts/sentry';

// Capture errors
captureError(new Error('Something went wrong'));

// Capture messages
captureMessage('Info message');

// Test integration
testSentryIntegration();
```

#### Dart/Flutter (sentry/dart/sentry.dart)
```dart
import '../sentry/dart/sentry.dart';

// Initialize Sentry
SentryConfig.init(dsn: 'your-sentry-dsn');

// Capture errors
await Sentry.captureException(exception);

// Capture messages
await Sentry.captureMessage('Info message');
```

### Nightwatch Integration

Both TypeScript and Dart implementations support Nightwatch error reporting:

```dart
// Initialize Nightwatch
Nightwatch.init(
  apiUrl: 'https://api.nightwatch.example',
  apiKey: 'your-api-key'
);

// Send errors
await Nightwatch.sendError(error);
```

### Grabber Error Tracking

The Grabber class now includes comprehensive error tracking:

```dart
// Initialize error tracking
Grabber.initErrorTracking(
  analyticsOption: 'Both', // 'Sentry', 'Nightwatch', 'Both', or 'None'
  sentryDsn: 'your-sentry-dsn',
  nightwatchApiUrl: 'https://api.nightwatch.example',
  nightwatchApiKey: 'your-api-key',
);
```

## Running Tests

### Prerequisites

Ensure you have the following tools installed:
- Node.js 20+
- Python 3.11+
- Flutter 3.24.3+
- PHP 8.2+
- MongoDB (for integration tests)

### Individual Module Tests

#### MongoDB Handler
```bash
cd mongodb
npm install
npm test
```

#### Server
```bash
cd server
npm install
npm install --save-dev @types/jest jest ts-jest typescript
npx jest index.test.ts
```

#### Fine-tuning (Python)
```bash
cd fine-tuning
pip install pytest python-dotenv requests
python -m pytest test_fine.py -v
```

#### Flutter App
```bash
cd app
flutter pub get
flutter test
```

#### TypeScript Sentry
```bash
cd sentry/ts
npm install
npm install --save-dev @types/jest jest ts-jest typescript
npx jest sentry.test.ts
```

#### Scheduled Module
```bash
cd scheduled
npm install
npm install --save-dev @types/jest jest ts-jest typescript
npx jest index.test.ts
```

#### PHP Nightwatch
```bash
cd nightwatch
composer install
composer require --dev phpunit/phpunit
./vendor/bin/phpunit tests/NightwatchControllerTest.php
```

### GitHub Actions CI/CD

The project includes a comprehensive CI/CD pipeline that automatically runs all tests on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The pipeline includes:
- **11 test jobs** for different components
- **Security scanning** with Trivy
- **Code quality checks** with ESLint and flake8
- **Docker build testing**
- **Integration tests**
- **Deployment readiness checks**

## Test Coverage

### MongoDB Handler Tests
- Pattern recognition for extracting user information
- Memory storage and retrieval
- Error handling and graceful degradation
- Database connection management

### Server Tests
- Error handling (Sentry and Nightwatch integration)
- CORS headers validation
- Authorization checks
- MongoDB integration
- Memory endpoint structure validation

### Fine-tuning Tests
- Nightwatch error reporting
- Sentry integration
- Analytics configuration loading
- Data processing functions
- Error handling scenarios

### Flutter App Tests
- UserMemory JSON serialization
- Grabber context building
- Error tracking integration
- HTTP communication
- Memory management

### Sentry Integration Tests
- Initialization with different configurations
- Error and message capturing
- Event flushing
- Environment configuration
- Error handling and graceful degradation

### Scheduled Module Tests
- MongoDB connection handling
- Feedback data validation
- Job scheduling structure
- Environment configuration
- Data processing workflows

### PHP Nightwatch Tests
- API request validation
- Error handling and network failures
- Environment configuration
- Authorization headers
- Response structure validation

### ESP32 Tests
- WiFi connection capability
- GPIO functionality
- Memory management
- Sensor and actuator pin configuration
- Communication protocols
- Security measures

## Error Tracking Configuration

### Environment Variables

Set the following environment variables for error tracking:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production

# Nightwatch Configuration
NIGHTWATCH_API_URL=https://api.nightwatch.example/events
NIGHTWATCH_API_KEY=your-nightwatch-api-key
```

### Analytics Configuration

Create `config/analytics_config.json`:

```json
{
  "analytics": "Both"
}
```

Options:
- `"Sentry"` - Only Sentry error tracking
- `"Nightwatch"` - Only Nightwatch error tracking  
- `"Both"` - Both Sentry and Nightwatch
- `"None"` - No error tracking (not recommended)

## Best Practices

1. **Always initialize error tracking** before using any component
2. **Test error handling** in your application code
3. **Use appropriate error levels** (error vs info messages)
4. **Monitor error tracking dashboards** regularly
5. **Keep credentials secure** using environment variables
6. **Run tests locally** before pushing changes
7. **Review CI/CD results** for each pull request

## Troubleshooting

### Common Issues

1. **Tests failing due to missing dependencies**
   - Ensure all package.json dependencies are installed
   - Check Python requirements are satisfied

2. **MongoDB connection errors**
   - Ensure MongoDB is running locally for integration tests
   - Check connection strings and credentials

3. **Flutter test issues**
   - Ensure Flutter SDK is properly installed
   - Run `flutter doctor` to check setup

4. **Error tracking not working**
   - Verify environment variables are set correctly
   - Check network connectivity to Sentry/Nightwatch APIs
   - Validate DSN and API key formats

### Getting Help

If you encounter issues:
1. Check the CI/CD logs for detailed error messages
2. Run tests locally with verbose output
3. Verify all environment variables are configured
4. Ensure all dependencies are properly installed