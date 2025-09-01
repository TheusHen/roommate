# Roommate Project

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Flutter](https://img.shields.io/badge/Flutter-3.24+-blue.svg)
![Bun](https://img.shields.io/badge/Bun-1.0+-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)

Roommate is a comprehensive, modular, and cross-platform assistant and chat system designed for smart environments. It integrates advanced memory management, context enrichment, voice processing, and multi-language support with robust error tracking and IoT capabilities.

## 🚀 Key Features

- **🧠 Advanced Memory System** - MongoDB-powered user memory storage and context retrieval
- **💬 Cross-Platform Chat** - Flutter-based UI supporting Web, Android, iOS, Linux, macOS, and Windows
- **🎙️ Voice Processing** - Real-time voice chat with Vosk speech recognition models
- **🔧 Modular Architecture** - TypeScript server with pluggable integrations
- **🤖 AI Fine-tuning** - Python-based machine learning model customization
- **📊 Error Tracking** - Dual monitoring with Sentry and Nightwatch
- **⏰ Scheduled Tasks** - Automated background processes
- **🌐 IoT Integration** - ESP32 and smart device connectivity
- **🐳 Docker Ready** - Full containerization support with Docker Compose
- **🔒 SSL/HTTPS** - Production-ready security configuration

## 🏗️ Project Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[👤 User]
        B[📱 Flutter App<br/>Dart/Web/Mobile]
        C[🎙️ Voice Interface<br/>Vosk Models]
        D[🌐 IoT Devices<br/>ESP32]
    end
    
    subgraph "API Gateway"
        E[🔄 Load Balancer<br/>Nginx + Varnish]
    end
    
    subgraph "Application Layer"
        F[🖥️ Main Server<br/>TypeScript/Bun]
        G[📂 Context Grabber<br/>Flutter/Dart]
        H[⏰ Scheduler<br/>TypeScript]
    end
    
    subgraph "Data Layer"
        I[🗄️ MongoDB<br/>Memory Storage]
        J[📊 Analytics DB<br/>Error Tracking]
    end
    
    subgraph "AI/ML Layer"
        K[🤖 Fine-tuning<br/>Python/PyTorch]
        L[🧠 Model Training<br/>Datasets]
    end
    
    subgraph "Monitoring"
        M[🔍 Sentry<br/>Error Tracking]
        N[👁️ Nightwatch<br/>PHP Monitoring]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    C --> E
    D --> E
    E --> F
    B --> G
    F --> I
    F --> J
    F --> H
    F --> M
    F --> N
    K --> L
    F --> K
    
    style A fill:#e1f5fe
    style F fill:#f3e5f5
    style I fill:#e8f5e8
    style K fill:#fff3e0
    style M fill:#ffebee
```

## 🔧 Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        A[Flutter/Dart 3.24+]
        B[Web/Mobile/Desktop]
    end
    
    subgraph "Backend"
        C[TypeScript 5.0+]
        D[Bun Runtime]
        E[Node.js 20+]
    end
    
    subgraph "Database"
        F[MongoDB 6.0+]
        G[Memory Storage]
    end
    
    subgraph "AI/ML"
        H[Python 3.11+]
        I[PyTorch/Datasets]
        J[Vosk Speech]
    end
    
    subgraph "Infrastructure"
        K[Docker/Compose]
        L[Nginx/Varnish]
        M[SSL/HTTPS]
    end
    
    subgraph "Monitoring"
        N[Sentry SDK]
        O[Nightwatch PHP]
    end
    
    A --> C
    C --> F
    H --> I
    K --> L
    C --> N
    style A fill:#42a5f5
    style C fill:#ab47bc
    style F fill:#66bb6a
    style H fill:#ff7043
    style K fill:#26c6da
    style N fill:#ef5350
```

## 📦 Installation

### 🎯 Quick Start (Recommended)

Run everything automatically with one command:

```bash
./scripts/start/run.sh
```

**What this does:**
- ✅ Checks all dependencies
- ✅ Sets up SSL certificates (HTTPS mode)
- ✅ Configures Python virtual environment
- ✅ Runs analytics configuration
- ✅ Sets environment variables
- ✅ Installs all packages (Bun, Flutter, PHP)
- ✅ Starts all services
- ✅ Configures reverse proxy

### 🐳 Docker Installation (Windows/Cross-Platform)

For containerized deployment:

```bash
./scripts/start/docker_run.sh
```

**Benefits:**
- 🔄 Isolated environment
- 🌍 Cross-platform compatibility
- 📦 No dependency conflicts
- 🚀 One-command deployment

### ⚙️ Manual Installation

For development or custom setups, see [docs/advanced_installation.md](docs/advanced_installation.md).

## 💡 Usage Examples

### Basic Operations

```bash
# Start the complete system
./scripts/start/run.sh

# Run comprehensive tests
./run-tests.sh

# Check system dependencies
./scripts/check_dependencies.sh

# Validate installation
./scripts/validate_fixes.sh
```

### API Examples

```bash
# Save user memory
curl -X POST http://localhost:3000/memory/save \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "type": "preference", "key": "language", "value": "en"}'

# Retrieve chat history
curl -X GET http://localhost:3000/chat/history?userId=user-123

# Send chat message
curl -X POST http://localhost:3000/chat/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "message": "Hello Roommate!"}'
```

### Voice Chat Setup

```bash
# Access Flutter app voice features
cd app && flutter run

# Test voice recognition (requires Vosk models)
# Models automatically downloaded: vosk-model-small-en-us-0.15.zip
```

## 🔄 Development Workflow

```mermaid
graph LR
    A[🔧 Development] --> B[🧪 Testing]
    B --> C[🔍 Linting]
    C --> D[📦 Building]
    D --> E[🚀 Deployment]
    
    subgraph "Testing"
        F[Unit Tests]
        G[Integration Tests]
        H[E2E Tests]
    end
    
    subgraph "Quality Checks"
        I[ESLint/TypeScript]
        J[Black/Python]
        K[Flutter Analyze]
        L[PHP CS Fixer]
    end
    
    B --> F
    B --> G
    B --> H
    C --> I
    C --> J
    C --> K
    C --> L
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- 📝 **Coding Standards** - TypeScript, Python, Dart, PHP guidelines
- 🔄 **Pull Request Process** - How to submit changes
- 🧪 **Testing Requirements** - Required test coverage
- 📚 **Documentation Guidelines** - How to document your code

Quick contribution workflow:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `./run-tests.sh`
5. Submit a pull request

## 📚 Documentation

### 📖 Guides & References
- [📋 Advanced Installation Guide](docs/advanced_installation.md)
- [🔌 API Reference](docs/api_reference.md)
- [❓ Frequently Asked Questions](docs/faq.md)
- [🧪 Testing Guide](docs/testing.md)

### 📓 Interactive Tutorials
- [🚀 Getting Started Notebook](docs/getting_started_tutorial.ipynb)
- [🧠 Memory System Tutorial](docs/memory_system_tutorial.ipynb)
- [🎙️ Voice Integration Guide](docs/voice_integration_tutorial.ipynb)
- [⚙️ Fine-tuning Tutorial](docs/fine_tuning_tutorial.ipynb)

### 🔗 Quick Reference Links
- [🏗️ Architecture Overview](docs/architecture_guide.md)
- [🔧 Deployment Guide](docs/deployment_guide.md)
- [🐛 Troubleshooting](docs/troubleshooting.md)
- [🔒 Security Guidelines](docs/security_guide.md)

## 🛡️ Error Tracking & Monitoring

Roommate includes comprehensive error tracking:

- **🔍 Sentry Integration** - Real-time error monitoring for TypeScript and Python
- **👁️ Nightwatch** - PHP-based monitoring and alerting
- **📊 Analytics** - User interaction and performance metrics
- **🚨 Automated Alerts** - Instant notification of critical issues

Configure monitoring during setup or run:
```bash
python3 ./config/analytics.py
```

## 📄 License

This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vosk** - Speech recognition models
- **Flutter Team** - Cross-platform framework
- **Bun** - Fast JavaScript runtime
- **MongoDB** - Document database
- **Sentry** - Error tracking platform

## 📞 Support & Community

- 🐛 **Issues**: [GitHub Issues](https://github.com/TheusHen/roommate/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/TheusHen/roommate/discussions)
- 📧 **Contact**: See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for maintainer contact
- 📖 **Wiki**: [Project Wiki](https://github.com/TheusHen/roommate/wiki)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by the Roommate community

</div>
