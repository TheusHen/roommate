# Contributing to Roommate

Thank you for your interest in contributing to Roommate! This document provides guidelines and information for contributors.

## 🎯 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🤝 How to Contribute

### Types of Contributions

We welcome the following types of contributions:

- **🐛 Bug fixes** - Help us identify and fix issues
- **✨ New features** - Add functionality to enhance the project
- **📚 Documentation** - Improve or add to our documentation
- **🧪 Tests** - Add or improve test coverage
- **🎨 UI/UX improvements** - Enhance the user experience
- **🔧 Performance optimizations** - Make the system faster and more efficient

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/roommate.git
   cd roommate
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up your development environment** (see [Development Setup](#development-setup))

## 🛠️ Development Setup

### Prerequisites

Ensure you have the following installed:

- **Bun** >= 1.0.0
- **Flutter** >= 3.5.0
- **Docker** (for MongoDB and testing)
- **Git**
- **Node.js** (for some tooling)

### Environment Setup

1. **Install dependencies**:
   ```bash
   # MongoDB handler
   cd mongodb && bun install
   
   # Server
   cd ../server && bun install
   
   # Flutter app
   cd ../app && flutter pub get
   ```

2. **Set up MongoDB** (optional but recommended):
   ```bash
   docker run -d -p 27017:27017 --name roommate-mongo mongo
   ```

3. **Install Ollama and GPT-OSS model**:
   ```bash
   # Install Ollama (visit https://ollama.ai for platform-specific instructions)
   ollama pull gpt-oss:20b
   ```

4. **Configure environment variables**:
   ```bash
   # Copy example environment file
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development Workflow

1. **Start the development environment**:
   ```bash
   ./scripts/start/run.sh
   # Select option 3 (Local development)
   ```

2. **Run tests to ensure everything works**:
   ```bash
   ./run-tests.sh
   ```

3. **Start developing**!

## 📏 Coding Standards

### General Principles

- **Write clean, readable code** with meaningful variable and function names
- **Follow the principle of least surprise** - code should behave as expected
- **Keep functions small and focused** on a single responsibility
- **Add comments for complex logic** but prefer self-documenting code
- **Handle errors gracefully** with proper error messages and logging

### Language-Specific Standards

#### TypeScript (Server & MongoDB Handler)

```typescript
// Use explicit types
interface UserMemory {
  type: string;
  key: string;
  value: string;
  timestamp: string;
  userId: string;
}

// Use async/await for promises
async function saveMemory(userId: string, sentence: string): Promise<void> {
  try {
    // Implementation
  } catch (error) {
    console.error('Error saving memory:', error);
    throw error;
  }
}

// Use proper error handling
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
```

#### Dart (Flutter App)

```dart
// Use proper null safety
class ApiPasswordManager {
  static Future<String?> getPassword() async {
    // Implementation
  }
}

// Follow Flutter naming conventions
class ChatRoommateScreen extends StatefulWidget {
  const ChatRoommateScreen({super.key});
  
  @override
  State<ChatRoommateScreen> createState() => _ChatRoommateScreenState();
}

// Use proper error handling
try {
  final result = await apiCall();
  // Handle success
} catch (e) {
  debugPrint('API Error: $e');
  // Handle error
}
```

#### Shell Scripts

```bash
#!/bin/bash

# Use proper error handling
set -e

# Use meaningful variable names
DEPLOYMENT_TYPE="local"
SERVER_PORT="3000"

# Add helpful comments
echo "Starting Roommate server on port $SERVER_PORT"

# Check prerequisites
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed"
    exit 1
fi
```

### Code Formatting

- **TypeScript/JavaScript**: Use Prettier with the project configuration
- **Dart**: Use `dart format` (built into Flutter)
- **Shell**: Use consistent indentation (2 spaces)

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:
   ```bash
   ./run-tests.sh
   ```

2. **Format your code**:
   ```bash
   # TypeScript
   cd server && bun run format
   
   # Dart
   cd app && dart format .
   ```

3. **Update documentation** if needed
4. **Add tests** for new functionality

### Pull Request Guidelines

1. **Create a descriptive title** following this format:
   ```
   feat: Add voice chat pause/resume functionality
   fix: Resolve MongoDB connection timeout issue
   docs: Update API documentation
   test: Add unit tests for memory pattern recognition
   ```

2. **Fill out the PR template** completely:
   - **Description**: Clear explanation of changes
   - **Motivation**: Why these changes are needed
   - **Testing**: How the changes were tested
   - **Screenshots**: For UI changes

3. **Link related issues** using keywords:
   ```
   Fixes #123
   Closes #456
   Related to #789
   ```

4. **Keep PRs focused** - one feature or fix per PR

5. **Respond to feedback** promptly and constructively

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing verification** on different platforms if applicable
4. **Documentation review** for user-facing changes

## 🧪 Testing Guidelines

### Test Structure

We maintain comprehensive test coverage across all components:

```
tests/
├── unit/          # Individual function/class tests
├── integration/   # Component interaction tests
├── e2e/          # End-to-end user scenarios
└── performance/   # Performance and load tests
```

### Writing Tests

#### TypeScript Tests (Jest)

```typescript
import { MongoDBHandler } from '../src/mongodb-handler';

describe('MongoDBHandler', () => {
  let handler: MongoDBHandler;

  beforeEach(() => {
    handler = new MongoDBHandler();
  });

  it('should extract pet information correctly', () => {
    const sentence = "My dog's name is Duke";
    const memories = handler.extractMemoriesFromSentence(sentence);
    
    expect(memories).toHaveLength(1);
    expect(memories[0]).toEqual({
      type: 'pet',
      key: 'dog_name',
      value: 'Duke'
    });
  });
});
```

#### Dart Tests (Flutter)

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:app/grabber/grabber.dart';

void main() {
  group('Grabber', () {
    late Grabber grabber;

    setUp(() {
      grabber = Grabber();
    });

    test('should enrich prompt with user context', () async {
      final enrichedPrompt = await grabber.enrichPrompt(
        'Tell me about dogs',
        'user123'
      );
      
      expect(enrichedPrompt, contains('Context'));
    });
  });
}
```

### Running Tests

```bash
# All tests
./run-tests.sh

# Specific components
cd server && bun test
cd app && flutter test
cd mongodb && bun test

# Integration tests
bun run test:integration

# With coverage
cd server && bun test --coverage
cd app && flutter test --coverage
```

### Test Coverage Requirements

- **Unit tests**: Aim for 80%+ coverage on core functionality
- **Integration tests**: Cover all API endpoints and major workflows
- **E2E tests**: Cover critical user journeys
- **New features**: Must include appropriate tests

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the FAQ** in [docs/faq.md](./docs/faq.md)
3. **Try the latest version** to see if the issue persists

### Issue Templates

Use the appropriate template:

- **🐛 Bug Report**: For functionality that doesn't work as expected
- **✨ Feature Request**: For new functionality suggestions
- **📚 Documentation**: For documentation improvements
- **❓ Question**: For general questions and support

### Bug Report Guidelines

Include the following information:

```markdown
## Bug Description
Clear description of what's wrong

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. iOS 16, Android 13, Ubuntu 22.04]
- Flutter version: [e.g. 3.5.0]
- Bun version: [e.g. 1.0.0]
- App version: [e.g. 1.0.0]

## Additional Context
Screenshots, logs, or other relevant information
```

## 📚 Documentation

### Documentation Types

1. **Code Documentation**: Inline comments and docstrings
2. **API Documentation**: Endpoint descriptions and examples
3. **User Documentation**: Installation and usage guides
4. **Developer Documentation**: Architecture and contribution guides

### Writing Guidelines

- **Be clear and concise** - avoid jargon when possible
- **Include examples** for complex concepts
- **Update docs with code changes** - keep them in sync
- **Use proper markdown formatting** for readability
- **Include diagrams** (preferably Mermaid) for complex flows

### Documentation Structure

```markdown
# Clear, descriptive title

Brief description of what this document covers.

## Section 1: Overview
High-level explanation

## Section 2: Details
Step-by-step instructions with examples

```bash
# Code examples with proper syntax highlighting
./scripts/start/run.sh
```

## Section 3: Advanced Topics
More complex scenarios
```

## 🎉 Recognition

Contributors will be recognized in the following ways:

- **README.md**: Listed in the contributors section
- **Release Notes**: Mentioned for significant contributions
- **GitHub**: Contributor status and statistics
- **Special Recognition**: For outstanding contributions

## 📞 Getting Help

If you need help with contributing:

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For specific problems
- **Discord/Slack**: Real-time chat (if applicable)
- **Email**: Direct contact for sensitive issues

## 🏷️ Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes

## 📋 Release Process

1. **Create a release branch**: `git checkout -b release/v1.2.0`
2. **Update version numbers** in relevant files
3. **Update CHANGELOG.md** with new features and fixes
4. **Run full test suite** and ensure everything passes
5. **Create pull request** for the release
6. **Tag the release** after merge: `git tag v1.2.0`

---

Thank you for contributing to Roommate! Your efforts help make this project better for everyone. 🚀