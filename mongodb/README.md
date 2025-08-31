# MongoDB Handler Module

This module provides user memory management capabilities using MongoDB to store and retrieve user-shared information for enriching conversations.

## Features

- **Pattern Recognition**: Automatically extracts information from user messages
- **Structured Storage**: Organizes memories by type, key, value, and timestamp  
- **Intelligent Retrieval**: Finds relevant memories based on prompt context
- **TypeScript Safety**: Full type safety with comprehensive error handling
- **Bun Runtime**: Optimized for Bun server environment

## Supported Memory Types

- **Pet Information**: Names and details about user's pets
- **Location Data**: Home location, places user has lived
- **Work Information**: Company, job details
- **Personal Details**: Name, biographical information  
- **Preferences**: Likes, dislikes, interests

## API

### saveMemory(userId: string, sentence: string): Promise<void>
Analyzes a sentence and extracts any personal information to store in the database.

### getRelevantMemory(userId: string, prompt: string): Promise<UserMemory[]>
Retrieves memories relevant to the given prompt for context enrichment.

## Example Usage

```typescript
import { MongoDBHandler } from './index';

const handler = new MongoDBHandler();
await handler.connect();

// Store information
await handler.saveMemory('user123', "My dog's name is Duke");

// Retrieve information  
const memories = await handler.getRelevantMemory('user123', "What is my dog's name?");
// Returns: [{ type: 'pet', key: 'dog_name', value: 'Duke', ... }]
```

## Database Schema

```typescript
interface UserMemory {
  type: string;      // 'pet', 'location', 'work', 'personal', 'preference'
  key: string;       // Specific identifier like 'dog_name', 'home_location'
  value: string;     // The actual information
  timestamp: string; // ISO 8601 timestamp
  userId: string;    // User identifier
}
```

## Testing

Run the test suite with:
```bash
bun test
```

Tests include pattern recognition, memory storage, retrieval, and error handling scenarios.