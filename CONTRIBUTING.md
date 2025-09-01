# Contributing to Roommate

🎉 **Thank you for your interest in contributing to Roommate!** 

We welcome contributions from developers of all skill levels. Whether you're fixing bugs, adding features, improving documentation, or enhancing tests, your contributions help make Roommate better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## 🤝 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🚀 How to Contribute

### Types of Contributions We Welcome

- 🐛 **Bug Reports** - Help us identify and fix issues
- ✨ **Feature Requests** - Propose new functionality
- 🔧 **Code Contributions** - Implement features, fix bugs, improve performance
- 📖 **Documentation** - Improve guides, tutorials, and API documentation
- 🧪 **Testing** - Add test coverage, improve existing tests
- 🌐 **Translations** - Help internationalize the project
- 🎨 **UI/UX** - Enhance user interface and experience

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/roommate.git
   cd roommate
   ```
3. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up the development environment** (see [Development Setup](#development-setup))
5. **Make your changes** following our [Coding Standards](#coding-standards)
6. **Add tests** for your changes
7. **Run the test suite** to ensure everything passes
8. **Commit your changes** with clear, descriptive messages
9. **Push to your fork** and **submit a pull request**

## 🛠️ Development Setup

### Prerequisites

Ensure you have the following installed:

```bash
# Required tools
- Python 3.11+ 
- Node.js 20+
- Bun (latest)
- Flutter 3.24+
- PHP 8.2+ (for Nightwatch components)
- MongoDB 6.0+
- Docker 20.10+ (optional but recommended)

# Development tools
- Git
- VS Code or your preferred IDE
```

### Quick Setup

```bash
# 1. Install dependencies automatically
./scripts/check_dependencies.sh

# 2. Install project packages
cd mongodb && bun install
cd ../server && npm install
cd ../app && flutter pub get
cd ../nightwatch && composer install
cd ../fine-tuning && pip install -r requirements.txt

# 3. Start development environment
./scripts/start/run.sh
```

### Development Environment Options

#### Option 1: Local Development
```bash
# Start only the core services for development
./scripts/start/run.sh
# Select option 3 (Local) when prompted
```

#### Option 2: Docker Development
```bash
# Use Docker for consistent environment
./scripts/start/docker_run.sh
```

#### Option 3: Manual Setup
See [docs/advanced_installation.md](docs/advanced_installation.md) for detailed manual setup instructions.

## 📝 Coding Standards

### General Principles
- **Clarity over cleverness** - Write code that's easy to understand
- **Consistency** - Follow existing patterns in the codebase
- **Modularity** - Keep components small and focused
- **Documentation** - Comment complex logic and update docs
- **Testing** - All new code must include appropriate tests

### Language-Specific Guidelines

#### TypeScript/JavaScript
```typescript
// Use strict TypeScript settings
// File: tsconfig.json already configured

// Prefer async/await over promises
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch user data', { userId, error });
    throw new UserDataError('Unable to fetch user data');
  }
}

// Use descriptive variable names
const userMemories = await memoryService.getMemories(userId);

// Export interfaces and types
export interface UserMemory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  timestamp: Date;
}
```

**Linting & Formatting:**
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Check TypeScript compilation
npx tsc --noEmit
```

#### Dart/Flutter
```dart
// Follow Flutter style guide
// Use descriptive widget names
class UserMemoryCard extends StatelessWidget {
  const UserMemoryCard({
    super.key,
    required this.memory,
    this.onTap,
  });

  final UserMemory memory;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(memory.content),
        subtitle: Text(memory.type.toString()),
        onTap: onTap,
      ),
    );
  }
}

// Use async/await for asynchronous operations
Future<List<UserMemory>> fetchMemories() async {
  try {
    final response = await http.get(Uri.parse('$baseUrl/memories'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => UserMemory.fromJson(json)).toList();
    }
    throw HttpException('Failed to fetch memories');
  } catch (e) {
    debugPrint('Error fetching memories: $e');
    rethrow;
  }
}
```

**Linting & Formatting:**
```bash
# Run Flutter analyzer
flutter analyze

# Format code
flutter format .

# Run tests
flutter test
```

#### Python
```python
"""
Module for handling user memory operations.

This module provides functionality for storing and retrieving
user conversation context and preferences.
"""

from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

# Use type hints
def extract_user_info(sentence: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Extract user information from a sentence.
    
    Args:
        sentence: The input sentence to analyze
        user_id: The user's unique identifier
        
    Returns:
        Dictionary containing extracted information or None
        
    Raises:
        ValueError: If sentence is empty or user_id is invalid
    """
    if not sentence.strip():
        raise ValueError("Sentence cannot be empty")
    
    # Implementation here
    return extracted_info

# Use dataclasses for structured data
from dataclasses import dataclass

@dataclass
class UserMemory:
    """Represents a stored user memory."""
    user_id: str
    memory_type: str
    key: str
    value: str
    timestamp: datetime
    confidence: float = 1.0
```

**Linting & Formatting:**
```bash
# Run flake8 linting
flake8 .

# Run black formatting
black .

# Run mypy type checking
mypy .

# Run tests
python -m pytest
```

#### PHP
```php
<?php

declare(strict_types=1);

namespace Roommate\Nightwatch;

use Psr\Log\LoggerInterface;

/**
 * Handles error tracking and monitoring for Roommate services.
 */
class ErrorTracker
{
    private LoggerInterface $logger;
    
    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }
    
    /**
     * Track an error with context information.
     *
     * @param string $message Error message
     * @param array<string, mixed> $context Additional context
     */
    public function trackError(string $message, array $context = []): void
    {
        $this->logger->error($message, [
            'timestamp' => time(),
            'service' => 'roommate',
            ...$context,
        ]);
    }
}
```

**Linting & Standards:**
```bash
# Run PHP CodeSniffer
./vendor/bin/phpcs

# Run PHPStan static analysis
./vendor/bin/phpstan analyze

# Run tests
./vendor/bin/phpunit
```

#### Shell Scripts
```bash
#!/bin/bash
# Use strict error handling
set -euo pipefail

# Use descriptive variable names
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="${SCRIPT_DIR}/.."

# Function definitions
install_dependencies() {
    local platform="$1"
    
    echo "Installing dependencies for platform: ${platform}"
    
    case "$platform" in
        "linux")
            install_linux_deps
            ;;
        "macos")
            install_macos_deps
            ;;
        *)
            echo "Error: Unsupported platform: ${platform}" >&2
            return 1
            ;;
    esac
}

# Use POSIX-compliant syntax when possible
```

## 🧪 Testing Guidelines

### Test Requirements
- **All new features** must include comprehensive tests
- **Bug fixes** must include regression tests
- **Maintain or improve** existing test coverage
- **Tests must be deterministic** and not rely on external services

### Running Tests

```bash
# Run all tests
./run-tests.sh

# Run specific test suites
cd mongodb && bun test
cd server && npm test
cd app && flutter test
cd nightwatch && ./vendor/bin/phpunit
cd fine-tuning && python -m pytest

# Run integration tests
npm run test:integration
```

### Test Types

#### Unit Tests
- Test individual functions/methods in isolation
- Mock external dependencies
- Fast execution (< 1 second per test)

#### Integration Tests
- Test component interactions
- Use test databases/services
- Verify API contracts

#### End-to-End Tests
- Test complete user workflows
- Use real services in test environment
- Verify system behavior

### Writing Good Tests

```typescript
// Example: Good test structure
describe('UserMemoryService', () => {
  let memoryService: UserMemoryService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    memoryService = new UserMemoryService(mockDatabase);
  });

  describe('saveMemory', () => {
    it('should save user memory with correct structure', async () => {
      // Arrange
      const userId = 'user-123';
      const memory = { type: 'preference', key: 'color', value: 'blue' };

      // Act
      const result = await memoryService.saveMemory(userId, memory);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(mockDatabase.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'preference',
          key: 'color',
          value: 'blue',
          timestamp: expect.any(Date),
        })
      );
    });

    it('should throw error for invalid user ID', async () => {
      // Arrange
      const invalidUserId = '';
      const memory = { type: 'preference', key: 'color', value: 'blue' };

      // Act & Assert
      await expect(memoryService.saveMemory(invalidUserId, memory))
        .rejects
        .toThrow('User ID cannot be empty');
    });
  });
});
```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure your code follows** our coding standards
2. **Add or update tests** for your changes
3. **Run the full test suite** and ensure all tests pass
4. **Update documentation** if you've changed APIs or functionality
5. **Rebase your branch** on the latest `main` branch
6. **Write a clear commit message** describing your changes

### PR Requirements

#### PR Title Format
Use one of these prefixes:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test improvements
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Examples:
- `feat: add user memory persistence to MongoDB`
- `fix: resolve race condition in context grabber`
- `docs: update API reference with new endpoints`

#### PR Description Template
```markdown
## Description
Brief description of the changes and why they were made.

## Changes Made
- [ ] Added new feature X
- [ ] Fixed bug Y
- [ ] Updated documentation Z

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
```

### Review Process

1. **Automated checks** run on all PRs (linting, tests, builds)
2. **Code review** by at least one maintainer
3. **Address feedback** promptly and professionally
4. **Merge requirements**:
   - All CI checks pass
   - At least one approving review
   - No unresolved conversations
   - Branch is up to date with main

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the FAQ** and documentation
3. **Try the latest version** of the project
4. **Gather relevant information** (logs, environment details, steps to reproduce)

### Issue Templates

#### Bug Reports
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Environment:**
- OS: [e.g. Ubuntu 20.04]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Logs**
Add any relevant log files or error messages.
```

#### Feature Requests
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request.
```

## 📖 Documentation

### Documentation Standards

- **Keep it current** - Update docs when changing functionality
- **Be comprehensive** - Include examples and use cases
- **Use clear language** - Avoid jargon, explain technical terms
- **Include code examples** - Show how to use features
- **Test documentation** - Ensure examples work

### Types of Documentation

#### Code Documentation
```typescript
/**
 * Retrieves user memories based on context relevance.
 * 
 * @param userId - The unique identifier for the user
 * @param context - The current conversation context
 * @param limit - Maximum number of memories to return (default: 10)
 * @returns Promise resolving to array of relevant memories
 * 
 * @throws {UserNotFoundError} When user ID doesn't exist
 * @throws {DatabaseError} When database is unavailable
 * 
 * @example
 * ```typescript
 * const memories = await getRelevantMemories('user123', 'talking about pets', 5);
 * console.log(memories); // [{ type: 'pet', key: 'dog_name', value: 'Rex' }]
 * ```
 */
async function getRelevantMemories(
  userId: string, 
  context: string, 
  limit: number = 10
): Promise<UserMemory[]> {
  // Implementation
}
```

#### API Documentation
Keep `docs/api_reference.md` updated with:
- Endpoint descriptions
- Request/response examples
- Error codes and messages
- Authentication requirements

#### User Guides
Update relevant files in `docs/`:
- Installation procedures
- Configuration options
- Troubleshooting guides
- Tutorial notebooks

## 🌍 Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and community discussions
- **Pull Requests** - Code review and technical discussions
- **Wiki** - Community-maintained documentation

### Getting Help

1. **Check the documentation** first
2. **Search existing issues** and discussions
3. **Ask in GitHub Discussions** for general questions
4. **Create an issue** for bugs or specific problems

### Helping Others

- **Answer questions** in discussions and issues
- **Review pull requests** from other contributors
- **Improve documentation** based on common questions
- **Share your experience** using Roommate

## 📊 Maintainer Guidelines

### For Project Maintainers

#### Code Review Standards
- **Be constructive** and helpful in feedback
- **Check for** coding standards compliance
- **Verify** test coverage and quality
- **Ensure** documentation is updated
- **Test** changes locally when needed

#### Release Process
1. Update version numbers
2. Update CHANGELOG.md
3. Create release notes
4. Tag the release
5. Deploy to staging
6. Announce the release

#### Community Management
- **Respond promptly** to issues and PRs
- **Welcome new contributors** warmly
- **Maintain a positive** community atmosphere
- **Recognize contributions** in release notes

---

## 🙏 Thank You

Your contributions make Roommate better for everyone. Whether you're fixing typos, adding features, or helping other users, every contribution matters.

**Happy coding!** 🚀

---

*For technical questions about contributing, please open a GitHub issue or discussion. For community questions, see our [Code of Conduct](CODE_OF_CONDUCT.md).*
