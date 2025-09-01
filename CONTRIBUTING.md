# Contributing to Roommate 🤝

Thank you for your interest in contributing to the Roommate project! This guide will help you get started and ensure a smooth contribution process.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Community Guidelines](#community-guidelines)

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Python 3.11+** for analytics and fine-tuning
- **Node.js 20+** and **Bun** for JavaScript/TypeScript components
- **Flutter 3.24+** for mobile app development
- **PHP 8.2+** for Nightwatch monitoring
- **MongoDB** for database operations
- **Docker** (optional, for containerized development)

### Initial Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YourUsername/roommate.git
   cd roommate
   ```

2. **Install dependencies**
   ```bash
   ./scripts/check_dependencies.sh
   ```

3. **Set up development environment**
   ```bash
   # Install project packages
   cd mongodb && bun install
   cd ../server && bun install
   cd ../app && flutter pub get
   cd ../nightwatch && composer install
   ```

4. **Verify installation**
   ```bash
   ./run-tests.sh
   ```

## 🔄 Development Workflow

### Branch Strategy

We follow a **Git Flow** approach:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes

### Workflow Steps

1. **Create a branch** from `main` or `develop`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test thoroughly**
   ```bash
   ./run-tests.sh
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add user memory persistence feature"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Coding Standards

### General Principles

- **Write clean, readable code** with meaningful variable and function names
- **Follow DRY (Don't Repeat Yourself)** principles
- **Add comprehensive comments** for complex logic
- **Ensure type safety** where applicable
- **Handle errors gracefully** with proper exception handling

### Language-Specific Guidelines

#### TypeScript/JavaScript
```typescript
// Use strict types and interfaces
interface UserMemory {
  userId: string;
  type: 'preference' | 'location' | 'personal';
  key: string;
  value: string;
  timestamp: Date;
}

// Use async/await for asynchronous operations
async function saveUserMemory(memory: UserMemory): Promise<boolean> {
  try {
    await mongoClient.collection('memories').insertOne(memory);
    return true;
  } catch (error) {
    console.error('Failed to save memory:', error);
    return false;
  }
}
```

**Standards:**
- Use ESLint configuration provided in the project
- Prefer `const` over `let`, avoid `var`
- Use meaningful function and variable names
- Add JSDoc comments for public APIs
- Handle promises with async/await, not `.then()`

#### Dart/Flutter
```dart
// Follow Dart style guide
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  
  const ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

// Use proper error handling
Future<List<ChatMessage>> loadChatHistory() async {
  try {
    final response = await http.get(Uri.parse('$baseUrl/chat/history'));
    if (response.statusCode == 200) {
      return parseMessages(response.body);
    }
    throw HttpException('Failed to load chat history');
  } catch (e) {
    debugPrint('Error loading chat history: $e');
    return [];
  }
}
```

**Standards:**
- Use `flutter analyze` to check code quality
- Follow Dart naming conventions (camelCase, PascalCase)
- Use `const` constructors where possible
- Prefer composition over inheritance
- Add comprehensive widget tests

#### Python
```python
"""Module for fine-tuning analytics and ML operations."""

from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class AnalyticsProcessor:
    """Handles analytics processing and ML fine-tuning."""
    
    def __init__(self, config: Dict[str, str]) -> None:
        """Initialize with configuration parameters."""
        self.config = config
        self.model = None
    
    async def process_feedback(self, feedback_data: List[Dict]) -> Optional[Dict]:
        """Process user feedback for model improvement.
        
        Args:
            feedback_data: List of feedback dictionaries
            
        Returns:
            Processing results or None if failed
        """
        try:
            results = await self._analyze_feedback(feedback_data)
            logger.info("Feedback processing completed successfully")
            return results
        except Exception as e:
            logger.error(f"Failed to process feedback: {e}")
            return None
```

**Standards:**
- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Add comprehensive docstrings using Google style
- Use `flake8` and `black` for linting and formatting
- Handle exceptions appropriately with logging

#### PHP
```php
<?php
declare(strict_types=1);

namespace Roommate\Nightwatch;

/**
 * Handles monitoring and health checks for the application
 */
class NightwatchController 
{
    private array $config;
    
    public function __construct(array $config)
    {
        $this->config = $config;
    }
    
    /**
     * Perform health check on all system components
     * 
     * @return array Health check results
     */
    public function performHealthCheck(): array
    {
        try {
            $results = [
                'database' => $this->checkDatabase(),
                'server' => $this->checkServer(),
                'timestamp' => date('c')
            ];
            
            return $results;
        } catch (Exception $e) {
            error_log("Health check failed: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
}
```

**Standards:**
- Use PHP 8.2+ features and strict typing
- Follow PSR-12 coding standard
- Add comprehensive PhpDoc comments
- Use dependency injection where appropriate
- Handle exceptions with proper logging

## 🧪 Testing Guidelines

### Test Coverage Requirements

- **Unit Tests**: All new functions/methods must have unit tests
- **Integration Tests**: API endpoints and cross-module interactions
- **End-to-End Tests**: Critical user workflows
- **Minimum Coverage**: 80% code coverage for new features

### Testing Commands

```bash
# Run all tests
./run-tests.sh

# Component-specific tests
cd mongodb && bun test          # MongoDB Handler
cd server && npx jest           # Server tests  
cd app && flutter test          # Flutter app tests
cd fine-tuning && python -m pytest  # Python tests
cd nightwatch && ./vendor/bin/phpunit  # PHP tests
```

### Writing Tests

#### TypeScript/Jest Tests
```typescript
describe('Memory Handler', () => {
  test('should save user memory successfully', async () => {
    const memory: UserMemory = {
      userId: 'test-user',
      type: 'preference',
      key: 'theme',
      value: 'dark'
    };
    
    const result = await memoryHandler.save(memory);
    expect(result).toBe(true);
  });
  
  test('should handle save failures gracefully', async () => {
    const invalidMemory = { userId: null };
    const result = await memoryHandler.save(invalidMemory);
    expect(result).toBe(false);
  });
});
```

#### Flutter Widget Tests
```dart
testWidgets('ChatMessage displays correctly', (WidgetTester tester) async {
  const message = ChatMessage(
    text: 'Hello World',
    isUser: true,
    timestamp: DateTime.now(),
  );
  
  await tester.pumpWidget(MaterialApp(
    home: Scaffold(body: MessageWidget(message: message)),
  ));
  
  expect(find.text('Hello World'), findsOneWidget);
  expect(find.byType(MessageWidget), findsOneWidget);
});
```

#### Python Tests
```python
import pytest
from analytics import AnalyticsProcessor

@pytest.mark.asyncio
async def test_feedback_processing():
    """Test that feedback processing works correctly."""
    processor = AnalyticsProcessor({'model': 'test'})
    feedback_data = [{'rating': 5, 'comment': 'Great response'}]
    
    result = await processor.process_feedback(feedback_data)
    
    assert result is not None
    assert 'processed_count' in result
    assert result['processed_count'] == 1
```

## 🔄 Pull Request Process

### PR Checklist

Before submitting a Pull Request, ensure:

- [ ] **Code follows style guidelines** for all languages used
- [ ] **All tests pass** (`./run-tests.sh` succeeds)
- [ ] **New features have comprehensive tests**
- [ ] **Documentation is updated** if necessary
- [ ] **Commit messages follow conventional commits**
- [ ] **No merge conflicts** with target branch
- [ ] **PR description is clear and detailed**

### PR Template

```markdown
## 🎯 Purpose
Brief description of what this PR accomplishes.

## 🔍 Changes Made
- List specific changes
- Include any breaking changes
- Mention new dependencies

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📸 Screenshots
Include screenshots for UI changes.

## 📝 Additional Notes
Any additional context or considerations.
```

### Commit Message Format

We use [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(memory): add user preference storage
fix(server): resolve memory leak in chat handler
docs(api): update endpoint documentation
test(flutter): add widget tests for chat interface
```

## 👀 Code Review Guidelines

### For Reviewers

- **Be constructive and respectful** in feedback
- **Test the changes** locally when possible
- **Check for edge cases** and error handling
- **Verify documentation** is accurate and complete
- **Ensure security best practices** are followed

### For Contributors

- **Respond promptly** to review feedback
- **Ask questions** if feedback is unclear
- **Make requested changes** in separate commits
- **Be open to suggestions** and alternative approaches

## 🌟 Community Guidelines

### Getting Help

- **Discord/Discussions**: Join our community discussions
- **Issues**: Create issues for bugs or feature requests  
- **Documentation**: Check existing docs before asking questions
- **Code of Conduct**: Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

### Recognition

Contributors who make significant contributions will be:
- Added to the contributors list
- Mentioned in release notes
- Invited to join the core team (for ongoing contributors)

### Communication

- **Be respectful** and professional in all interactions
- **Use clear, concise language** in issues and PRs
- **Provide context** when reporting bugs or requesting features
- **Help others** when you can assist with their questions

## 🆘 Getting Support

If you need help contributing:

1. **Check the documentation** in the `docs/` folder
2. **Search existing issues** for similar problems
3. **Join our community discussions**
4. **Create a new issue** with detailed information
5. **Contact maintainers** for urgent matters

---

**Thank you for contributing to Roommate! 🎉**

Your contributions help make this project better for everyone. We appreciate your time and effort in improving the codebase and documentation.
