# Testing Guide

Roommate uses a comprehensive test suite covering all major components.

## How to Run All Tests
```sh
./run-tests.sh
```

## Module-Specific Tests
- **MongoDB Handler**: `cd mongodb && bun test`
- **Server**: `cd server && npx jest index.test.ts`
- **Scheduled Module**: `cd scheduled && npx jest index.test.ts`
- **Sentry (TypeScript)**: `cd sentry/ts && npx jest sentry.test.ts`
- **Flutter App**: `cd app && flutter test`
- **Fine-tuning (Python)**: `cd fine-tuning && python -m pytest test_fine.py`
- **PHP Nightwatch**: `cd nightwatch && ./vendor/bin/phpunit tests/NightwatchControllerTest.php`
- **Integration**: `bun run test_integration.ts`

## CI/CD Pipeline
- All tests run automatically on PRs and pushes (see `.github/workflows/ci.yml`).

## Coverage & Quality
- Linting: ESLint (TypeScript), flake8/black (Python), flutter analyze (Dart)
- Security: Trivy scan, Sentry, Nightwatch

---
For troubleshooting, see [FAQ](faq.md) and [docs/advanced_installation.md](advanced_installation.md).