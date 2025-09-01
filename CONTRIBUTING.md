# Contributing to Roommate

Thank you for your interest in contributing! Please follow these guidelines to ensure a smooth process.

## How to Contribute
1. **Fork the repository** and create your branch from `main` or `develop`.
2. **Write clear, modular code** following project standards:
   - TypeScript: Use strict types, async/await, and error handling.
   - Dart: Follow Flutter best practices.
   - Python: PEP8, type hints preferred.
   - Shell: Use POSIX-compliant scripts.
3. **Add/Update tests** for new features or bug fixes.
4. **Document your changes** in code and update relevant docs in `docs/`.
5. **Submit a Pull Request (PR)**:
   - Describe your changes clearly.
   - Reference related issues.
   - Ensure all CI checks pass.

## Coding Standards
- **Linting:** Use ESLint (TypeScript), flake8/black (Python), and `flutter analyze` (Dart).
- **Testing:** All code must be covered by unit/integration tests. See [Testing Instructions](#testing).
- **Commits:** Use clear, descriptive messages.

## Pull Request Process
1. Open a PR against `main` or `develop`.
2. The CI/CD pipeline will run all tests and checks.
3. Address any review comments.
4. PRs are merged after approval and passing checks.

## Testing Instructions
- Run all tests with:
  ```sh
  ./run-tests.sh
  ```
- For specific modules, see [docs/testing.md](docs/testing.md).
- Ensure your code passes all tests before submitting.

---
For questions, open an issue or contact maintainers.
