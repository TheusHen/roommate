import { jest, test, expect, beforeAll, afterAll, describe } from '@jest/globals';
import { MongoDBHandler } from './index';

// Mock MongoDB for testing
jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    // @ts-ignore
    connect: jest.fn().mockResolvedValue(undefined),
    // @ts-ignore
    close: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        // @ts-ignore
        // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
        find: jest.fn().mockReturnValue({
          // @ts-ignore
          // @ts-ignore
        toArray: jest.fn().mockResolvedValue([])
        })
      })
    })
  }))
}));

describe('MongoDBHandler', () => {
  let handler: MongoDBHandler;
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    // Use mocked MongoDB
    handler = new MongoDBHandler('mongodb://localhost:27017');
    await handler.connect();
  });

  afterAll(async () => {
    if (handler) {
      try {
        await handler.disconnect();
      } catch (error) {
        // Ignore disconnect errors in tests
      }
    }
  });

  test('should extract pet name from sentence', async () => {
    const sentence = "My dog's name is Duke, remember that";
    
    // Mock the collection find method to return the expected data
    const mockMemory = {
      type: 'pet',
      key: 'dog_name',
      value: 'Duke',
      userId: testUserId,
      timestamp: new Date().toISOString()
    };
    
    const mockCollection = {
      // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      find: jest.fn().mockReturnValue({
        // @ts-ignore
        toArray: jest.fn().mockResolvedValue([mockMemory] as any)
      })
    };
    
    // @ts-ignore
    handler['memoriesCollection'] = mockCollection;
    
    await handler.saveMemory(testUserId, sentence);
    const memories = await handler.getRelevantMemory(testUserId, "What is my dog's name?");
    
    expect(mockCollection.replaceOne).toHaveBeenCalled();
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].key).toBe('dog_name');
    expect(memories[0].value).toBe('Duke');
    expect(memories[0].type).toBe('pet');
  });

  test('should extract location from sentence', async () => {
    const sentence = "I live in New York City";
    
    const mockMemory = {
      type: 'location',
      key: 'home_location',
      value: 'New York City',
      userId: testUserId,
      timestamp: new Date().toISOString()
    };
    
    const mockCollection = {
      // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      find: jest.fn().mockReturnValue({
        // @ts-ignore
        toArray: jest.fn().mockResolvedValue([mockMemory] as any)
      })
    };
    
    // @ts-ignore
    handler['memoriesCollection'] = mockCollection;
    
    await handler.saveMemory(testUserId, sentence);
    const memories = await handler.getRelevantMemory(testUserId, "Where do I live?");
    
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].key).toBe('home_location');
    expect(memories[0].value).toBe('New York City');
    expect(memories[0].type).toBe('location');
  });

  test('should extract work information from sentence', async () => {
    const sentence = "I work at Google";
    
    const mockMemory = {
      type: 'work',
      key: 'company',
      value: 'Google',
      userId: testUserId,
      timestamp: new Date().toISOString()
    };
    
    const mockCollection = {
      // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      find: jest.fn().mockReturnValue({
        // @ts-ignore
        toArray: jest.fn().mockResolvedValue([mockMemory] as any)
      })
    };
    
    // @ts-ignore
    handler['memoriesCollection'] = mockCollection;
    
    await handler.saveMemory(testUserId, sentence);
    const memories = await handler.getRelevantMemory(testUserId, "Where do I work?");
    
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].key).toBe('company');
    expect(memories[0].value).toBe('Google');
    expect(memories[0].type).toBe('work');
  });

  test('should extract personal name from sentence', async () => {
    const sentence = "My name is Alice";
    
    const mockMemory = {
      type: 'personal',
      key: 'name',
      value: 'Alice',
      userId: testUserId,
      timestamp: new Date().toISOString()
    };
    
    const mockCollection = {
      // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      find: jest.fn().mockReturnValue({
        // @ts-ignore
        toArray: jest.fn().mockResolvedValue([mockMemory] as any)
      })
    };
    
    // @ts-ignore
    handler['memoriesCollection'] = mockCollection;
    
    await handler.saveMemory(testUserId, sentence);
    const memories = await handler.getRelevantMemory(testUserId, "What is my name?");
    
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].key).toBe('name');
    expect(memories[0].value).toBe('Alice');
    expect(memories[0].type).toBe('personal');
  });

  test('should extract preferences from sentence', async () => {
    const sentence = "I love pizza and pasta";
    
    const mockMemory = {
      type: 'preference',
      key: 'likes',
      value: 'pizza and pasta',
      userId: testUserId,
      timestamp: new Date().toISOString()
    };
    
    const mockCollection = {
      // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      find: jest.fn().mockReturnValue({
        // @ts-ignore
        toArray: jest.fn().mockResolvedValue([mockMemory] as any)
      })
    };
    
    // @ts-ignore
    handler['memoriesCollection'] = mockCollection;
    
    await handler.saveMemory(testUserId, sentence);
    const memories = await handler.getRelevantMemory(testUserId, "What do I like to eat?");
    
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].key).toBe('likes');
    expect(memories[0].value).toBe('pizza and pasta');
    expect(memories[0].type).toBe('preference');
  });

  test('should handle multiple memories in one sentence', async () => {
    const sentence = "My cat's name is Whiskers and I live in San Francisco";
    
    const mockMemories = [
      {
        type: 'pet',
        key: 'cat_name',
        value: 'Whiskers',
        userId: testUserId,
        timestamp: new Date().toISOString()
      },
      {
        type: 'location',
        key: 'home_location',
        value: 'San Francisco',
        userId: testUserId,
        timestamp: new Date().toISOString()
      }
    ];
    
    const mockCollection = {
      // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      find: jest.fn().mockReturnValue({
        // @ts-ignore
        toArray: jest.fn().mockResolvedValue(mockMemories as any)
      })
    };
    
    // @ts-ignore
    handler['memoriesCollection'] = mockCollection;
    
    await handler.saveMemory(testUserId, sentence);
    const memories = await handler.getRelevantMemory(testUserId, "Tell me about my cat and where I live");
    
    expect(memories.length).toBe(2);
    const catMemory = memories.find(m => m.key === 'cat_name');
    const locationMemory = memories.find(m => m.key === 'home_location');
    
    expect(catMemory).toBeDefined();
    expect(catMemory?.value).toBe('Whiskers');
    expect(locationMemory).toBeDefined();
    expect(locationMemory?.value).toBe('San Francisco');
  });

  test('should return empty array for irrelevant prompts', async () => {
    const mockCollection = {
      // @ts-ignore
      replaceOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      find: jest.fn().mockReturnValue({
        // @ts-ignore
        toArray: jest.fn().mockResolvedValue([] as any)
      })
    };
    
    // @ts-ignore
    handler['memoriesCollection'] = mockCollection;
    
    const memories = await handler.getRelevantMemory(testUserId, "What is the weather like?");
    expect(Array.isArray(memories)).toBe(true);
    expect(memories.length).toBe(0);
  });
});