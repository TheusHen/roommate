# Roommate Chat - Next.js Web Application

This is a Next.js React application that replaces the original Flutter app with the same functionality.

## Features

- 🔐 **Password Authentication**: Secure API password management with local storage
- 💬 **Basic Chat**: Clean chat interface with message history and feedback system
- 🧠 **Enhanced Chat**: Context-aware conversations with memory integration (Grabber)
- 🎤 **Voice Chat**: Speech recognition and text-to-speech support
- 🌐 **Multi-language**: Support for English and Portuguese
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and Lucide icons
- ⚡ **Real-time**: Smooth animations powered by Framer Motion

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **Web Speech API** - Speech recognition and synthesis

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

## API Integration

The application connects to the same backend API as the original Flutter app:

- **Chat API**: `http://localhost:3000/chat`
- **Feedback API**: `http://localhost:3000/feedback`
- **Memory API**: `http://localhost:3000/memory/*`

## Migrated Features

### From Flutter App

- ✅ **Password Management**: Migrated from SharedPreferences to localStorage
- ✅ **Chat Interface**: Complete chat functionality with API integration
- ✅ **Enhanced Chat**: Grabber context system fully ported
- ✅ **Voice Chat**: Web Speech API replaces Vosk for browser compatibility
- ✅ **Feedback System**: Thumbs up/down functionality preserved
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Animations**: Smooth UI transitions using Framer Motion
- ✅ **Multi-language**: Language selection for voice features

### Improvements

- 🚀 **Better Performance**: Optimized for web with React 18 features
- 📱 **Responsive Design**: Works on all screen sizes
- 🎨 **Modern UI**: Enhanced styling with Tailwind CSS
- ♿ **Accessibility**: Better keyboard navigation and screen reader support
- 🔧 **Developer Experience**: TypeScript for better code quality

## File Structure

```
components/
├── pages/           # Main page components
│   ├── password-prompt.tsx
│   ├── chat.tsx
│   ├── enhanced-chat.tsx
│   └── voice-chat.tsx
└── roommate-app.tsx # Main app component

lib/
├── api/             # API clients
│   ├── chat.ts
│   └── grabber.ts
├── types/           # TypeScript definitions
├── utils/           # Utility functions
└── password-manager.ts

public/
└── models/          # Vosk model files (preserved)
    ├── vosk-model-small-en-us-0.15.zip
    └── vosk-model-small-pt-0.3.zip
```

## Voice Recognition

The web version uses the browser's built-in Web Speech API instead of Vosk models for better compatibility and performance. The Vosk model files are preserved in the public directory for potential future use.

## Environment Requirements

- Node.js 18+
- Modern browser with Web Speech API support (Chrome, Edge, Safari)
- Backend API running on `localhost:3000`

## Development

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Turbopack** for fast development builds
