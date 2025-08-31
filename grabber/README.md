# User Memory System Implementation

This implementation adds user memory capabilities to the Roommate chat application, allowing it to remember and recall user information across conversations.

## Architecture

### MongoDB Handler (`mongodb/`)
- **Purpose**: Manages user memory storage and retrieval in MongoDB
- **Language**: TypeScript (compatible with Bun runtime)
- **Key Features**:
  - Pattern recognition for extracting information from user messages
  - Structured storage with type, key, value, and timestamp
  - Intelligent retrieval based on prompt context
  - Support for pets, locations, work, personal info, and preferences

### Grabber (`app/lib/grabber/`)
- **Purpose**: Enriches prompts with relevant user context from stored memories
- **Language**: Dart (Flutter)
- **Key Features**:
  - HTTP integration with MongoDB Handler endpoints
  - Direct answer generation for simple questions
  - Context building for complex interactions
  - Graceful fallback when memory service is unavailable

### Server Integration (`server/`)
- **Purpose**: Provides HTTP endpoints and integrates memory system with chat
- **Key Features**:
  - `/memory/save` - Save new user information
  - `/memory/get` - Retrieve relevant memories
  - Enhanced `/chat` endpoint with automatic prompt enrichment
  - Backward compatibility maintained

## Usage Examples

### Storing Information
```dart
// User says: "My dog's name is Duke, remember that"
// System automatically extracts and stores:
// { type: "pet", key: "dog_name", value: "Duke" }
```

### Retrieving Information
```dart
// User asks: "What is my dog's name?"
// System responds: "Your dog's name is Duke."
```

### Context Enrichment
```dart
// User says: "Tell me about dogs"
// Enriched prompt: "Context: Your dog's name is Duke. User says: Tell me about dogs"
```

## API Endpoints

### POST /memory/save
```json
{
  "userId": "user-123",
  "sentence": "My dog's name is Duke"
}
```

### POST /memory/get
```json
{
  "userId": "user-123", 
  "prompt": "What is my dog's name?"
}
```

Response:
```json
{
  "memories": [
    {
      "type": "pet",
      "key": "dog_name", 
      "value": "Duke",
      "timestamp": "2025-08-31T03:00:00Z",
      "userId": "user-123"
    }
  ]
}
```

## Testing

### MongoDB Handler Tests
```bash
cd mongodb
bun test
```

### Grabber Tests  
```bash
cd app
flutter test test/grabber_test.dart
```

### Integration Test
```bash
bun run test_integration.ts
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd mongodb && bun install
   cd ../server && bun install
   cd ../app && flutter pub get
   ```

2. **Start MongoDB** (optional, system works without it):
   ```bash
   docker run -d -p 27017:27017 mongo
   ```

3. **Start Server**:
   ```bash
   cd server && bun run index.ts
   ```

4. **Run Flutter App**:
   ```bash
   cd app && flutter run
   ```

## Pattern Recognition

The system recognizes these patterns:

- **Pet Names**: "My dog's name is Duke", "My cat is called Whiskers"
- **Location**: "I live in New York", "I'm from California"  
- **Work**: "I work at Google", "I'm employed by Microsoft"
- **Personal**: "My name is Alice", "I'm Bob"
- **Preferences**: "I love pizza", "I enjoy hiking"

## Files Added/Modified

### New Files:
- `mongodb/index.ts` - MongoDB Handler implementation
- `mongodb/index.test.ts` - MongoDB Handler tests
- `mongodb/package.json` - Dependencies
- `mongodb/tsconfig.json` - TypeScript config
- `mongodb/.gitignore` - Git ignore rules
- `app/lib/grabber/grabber.dart` - Grabber implementation
- `app/test/grabber_test.dart` - Grabber tests
- `app/lib/pages/chat_roommate_enhanced.dart` - Enhanced chat example
- `test_integration.ts` - Integration test script

### Modified Files:
- `server/index.ts` - Added memory endpoints and chat enrichment

## Ready for Production

The implementation is production-ready with:
- ✅ Comprehensive error handling
- ✅ TypeScript safety
- ✅ Extensive test coverage  
- ✅ Graceful degradation
- ✅ Backward compatibility
- ✅ Modular architecture