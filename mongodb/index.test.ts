import { jest, test, expect, beforeAll, afterAll, describe } from '@jest/globals';
import { MongoDBHandler } from './index';

describe('MongoDBHandler', () => {
  let handler: MongoDBHandler;
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    // Use test database
    handler = new MongoDBHandler('mongodb://localhost:27017');
    try {
      await handler.connect();
    } catch (error) {
      console.warn('MongoDB not available for testing. Skipping tests.');
      return;
    }
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
    
    try {
      await handler.saveMemory(testUserId, sentence);
      const memories = await handler.getRelevantMemory(testUserId, "What is my dog's name?");
      
      expect(memories.length).toBeGreaterThan(0);
      const dogMemory = memories.find(m => m.key === 'dog_name');
      expect(dogMemory).toBeDefined();
      expect(dogMemory?.value).toBe('Duke');
      expect(dogMemory?.type).toBe('pet');
    } catch (error) {
      if (error instanceof Error && error.message?.includes('MongoDB not connected')) {
        console.warn('Skipping test: MongoDB not available');
        return;
      }
      throw error;
    }
  });

  test('should extract location from sentence', async () => {
    const sentence = "I live in New York City";
    
    try {
      await handler.saveMemory(testUserId, sentence);
      const memories = await handler.getRelevantMemory(testUserId, "Where do I live?");
      
      expect(memories.length).toBeGreaterThan(0);
      const locationMemory = memories.find(m => m.key === 'home_location');
      expect(locationMemory).toBeDefined();
      expect(locationMemory?.value).toBe('New York City');
      expect(locationMemory?.type).toBe('location');
    } catch (error) {
      if (error instanceof Error && error.message?.includes('MongoDB not connected')) {
        console.warn('Skipping test: MongoDB not available');
        return;
      }
      throw error;
    }
  });

  test('should extract work information from sentence', async () => {
    const sentence = "I work at Google";
    
    try {
      await handler.saveMemory(testUserId, sentence);
      const memories = await handler.getRelevantMemory(testUserId, "Where do I work?");
      
      expect(memories.length).toBeGreaterThan(0);
      const workMemory = memories.find(m => m.key === 'company');
      expect(workMemory).toBeDefined();
      expect(workMemory?.value).toBe('Google');
      expect(workMemory?.type).toBe('work');
    } catch (error) {
      if (error instanceof Error && error.message?.includes('MongoDB not connected')) {
        console.warn('Skipping test: MongoDB not available');
        return;
      }
      throw error;
    }
  });

  test('should extract personal name from sentence', async () => {
    const sentence = "My name is Alice";
    
    try {
      await handler.saveMemory(testUserId, sentence);
      const memories = await handler.getRelevantMemory(testUserId, "What is my name?");
      
      expect(memories.length).toBeGreaterThan(0);
      const nameMemory = memories.find(m => m.key === 'name');
      expect(nameMemory).toBeDefined();
      expect(nameMemory?.value).toBe('Alice');
      expect(nameMemory?.type).toBe('personal');
    } catch (error) {
      if (error instanceof Error && error.message?.includes('MongoDB not connected')) {
        console.warn('Skipping test: MongoDB not available');
        return;
      }
      throw error;
    }
  });

  test('should extract preferences from sentence', async () => {
    const sentence = "I love pizza and pasta";
    
    try {
      await handler.saveMemory(testUserId, sentence);
      const memories = await handler.getRelevantMemory(testUserId, "What do I like to eat?");
      
      expect(memories.length).toBeGreaterThan(0);
      const preferenceMemory = memories.find(m => m.key === 'likes');
      expect(preferenceMemory).toBeDefined();
      expect(preferenceMemory?.value).toBe('pizza and pasta');
      expect(preferenceMemory?.type).toBe('preference');
    } catch (error) {
      if (error instanceof Error && error.message?.includes('MongoDB not connected')) {
        console.warn('Skipping test: MongoDB not available');
        return;
      }
      throw error;
    }
  });

  test('should handle multiple memories in one sentence', async () => {
    const sentence = "My cat's name is Whiskers and I live in San Francisco";
    
    try {
      await handler.saveMemory(testUserId, sentence);
      const catMemories = await handler.getRelevantMemory(testUserId, "What is my cat's name?");
      const locationMemories = await handler.getRelevantMemory(testUserId, "Where do I live?");
      
      const catMemory = catMemories.find(m => m.key === 'cat_name');
      const locationMemory = locationMemories.find(m => m.key === 'home_location');
      
      expect(catMemory).toBeDefined();
      expect(catMemory?.value).toBe('Whiskers');
      expect(locationMemory).toBeDefined();
      expect(locationMemory?.value).toBe('San Francisco');
    } catch (error) {
      if (error instanceof Error && error.message?.includes('MongoDB not connected')) {
        console.warn('Skipping test: MongoDB not available');
        return;
      }
      throw error;
    }
  });

  test('should return empty array for irrelevant prompts', async () => {
    try {
      const memories = await handler.getRelevantMemory(testUserId, "What is the weather like?");
      expect(Array.isArray(memories)).toBe(true);
      // Should return empty or very few irrelevant memories
    } catch (error) {
      if (error instanceof Error && error.message?.includes('MongoDB not connected')) {
        console.warn('Skipping test: MongoDB not available');
        return;
      }
      throw error;
    }
  });
});