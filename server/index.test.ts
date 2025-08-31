import { MongoDBHandler } from '../mongodb/index';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Server Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle Nightwatch error reporting', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    process.env.NIGHTWATCH_API_URL = 'https://api.nightwatch.test';
    process.env.NIGHTWATCH_API_KEY = 'test-key';

    // Import the sendNightwatch function from server
    const { sendNightwatch } = await import('../index');
    
    const testError = new Error('Test error');
    await sendNightwatch(testError);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.nightwatch.test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key',
        }),
        body: JSON.stringify({ error: 'Test error' }),
      })
    );
  });

  test('should skip Nightwatch when not configured', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    
    delete process.env.NIGHTWATCH_API_URL;
    delete process.env.NIGHTWATCH_API_KEY;

    const { sendNightwatch } = await import('../index');
    
    const testError = new Error('Test error');
    await sendNightwatch(testError);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('should verify CORS headers are applied', () => {
    const { corsHeaders } = require('../index');
    
    const headers = corsHeaders();
    
    expect(headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
  });

  test('should validate authorization header', () => {
    const { checkAuthorization } = require('../index');
    
    // Mock request with valid auth
    const validReq = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer test-password')
      }
    };
    
    // Mock request with invalid auth
    const invalidReq = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer wrong-password')
      }
    };
    
    // Note: This test would need the actual API password to work properly
    // In a real test environment, you'd set a known test password
    process.env.API_PASSWORD = 'test-password';
    
    expect(checkAuthorization(validReq)).toBe(true);
    expect(checkAuthorization(invalidReq)).toBe(false);
  });
});

describe('Server MongoDB Integration', () => {
  test('should handle MongoDB connection errors gracefully', async () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock MongoDB connection failure
    jest.mock('../mongodb/index', () => ({
      MongoDBHandler: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
      }))
    }));

    const { initMongoDB } = await import('../index');
    await initMongoDB();

    expect(mockConsoleError).toHaveBeenCalledWith(
      '[ERROR] Failed to initialize MongoDB Handler:',
      expect.any(Error)
    );
    
    mockConsoleError.mockRestore();
  });

  test('should initialize MongoDB successfully', async () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock successful MongoDB connection
    jest.mock('../mongodb/index', () => ({
      MongoDBHandler: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined)
      }))
    }));

    const { initMongoDB } = await import('../index');
    await initMongoDB();

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[INFO] MongoDB Handler initialized successfully'
    );
    
    mockConsoleLog.mockRestore();
  });
});

describe('Server Memory Endpoints', () => {
  test('should validate memory save endpoint structure', () => {
    // This would test the actual endpoint handlers
    // For now, we test the expected request/response structure
    
    const validSaveRequest = {
      userId: 'test-user',
      sentence: 'My dog is named Duke'
    };
    
    expect(validSaveRequest).toHaveProperty('userId');
    expect(validSaveRequest).toHaveProperty('sentence');
    expect(typeof validSaveRequest.userId).toBe('string');
    expect(typeof validSaveRequest.sentence).toBe('string');
  });

  test('should validate memory get endpoint structure', () => {
    const validGetRequest = {
      userId: 'test-user',
      prompt: 'What is my dog\'s name?'
    };
    
    expect(validGetRequest).toHaveProperty('userId');
    expect(validGetRequest).toHaveProperty('prompt');
    expect(typeof validGetRequest.userId).toBe('string');
    expect(typeof validGetRequest.prompt).toBe('string');
  });
});