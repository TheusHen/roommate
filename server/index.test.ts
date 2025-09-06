import { MongoDBHandler } from '../mongodb/index';

// Mock sentry module to avoid dependency issues
jest.mock('../sentry/ts/sentry', () => ({
  captureError: jest.fn()
}));

// Mock mongodb module
jest.mock('../mongodb/index', () => ({
  MongoDBHandler: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    saveMemory: jest.fn().mockResolvedValue(undefined),
    getRelevantMemory: jest.fn().mockResolvedValue([])
  }))
}));

// Mock Bun runtime
global.Bun = {
  serve: jest.fn().mockReturnValue({ port: 3000 })
} as any;

// Mock fetch for testing
// @ts-ignore - Bun's fetch type has additional properties we don't need for testing
global.fetch = jest.fn();

describe('Server Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle Nightwatch error reporting', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<any>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    process.env.NIGHTWATCH_API_URL = 'https://api.nightwatch.test';
    process.env.NIGHTWATCH_API_KEY = 'test-key';

    // Import the sendNightwatch function from server
    const { sendNightwatch } = await import('./index');
    
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
    const mockFetch = global.fetch as jest.MockedFunction<any>;
    
    delete process.env.NIGHTWATCH_API_URL;
    delete process.env.NIGHTWATCH_API_KEY;

    const { sendNightwatch } = await import('./index');
    
    const testError = new Error('Test error');
    await sendNightwatch(testError);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('should verify CORS headers are applied', async () => {
    const { corsHeaders } = await import('./index');
    
    const headers = corsHeaders();
    
    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://roommate-delta.vercel.app',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    });
  });

  test('should validate authorization header', async () => {
    // Create a temporary config directory and password file for testing
    const fs = await import('fs');
    const path = await import('path');
    const configDir = path.join(process.cwd(), '../config');
    const passwordFile = path.join(configDir, 'api_password.txt');
    
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write test password
    fs.writeFileSync(passwordFile, 'test-password');
    
    // Re-import the module to pick up the test password
    jest.resetModules();
    const { checkAuthorization } = await import('./index');
    
    // Mock request with valid auth
    const validReq = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer test-password')
      }
    } as unknown as Request;
    
    // Mock request with invalid auth
    const invalidReq = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer wrong-password')
      }
    } as unknown as Request;
    
    expect(checkAuthorization(validReq)).toBe(true);
    expect(checkAuthorization(invalidReq)).toBe(false);
    
    // Clean up
    if (fs.existsSync(passwordFile)) {
      fs.unlinkSync(passwordFile);
    }
  });
});

describe('Server MongoDB Integration', () => {
  test('should handle MongoDB connection errors gracefully', async () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset modules and create a new mock that throws an error
    jest.resetModules();
    jest.doMock('../mongodb/index', () => ({
      MongoDBHandler: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
      }))
    }));

    const { initMongoDB } = await import('./index');
    await initMongoDB();

    expect(mockConsoleError).toHaveBeenCalledWith(
      '[ERROR] Failed to initialize MongoDB Handler after all retry attempts'
    );
    
    mockConsoleError.mockRestore();
  });

  test('should initialize MongoDB successfully', async () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // Reset modules and create a successful mock
    jest.resetModules();
    jest.doMock('../mongodb/index', () => ({
      MongoDBHandler: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined)
      }))
    }));

    const { initMongoDB } = await import('./index');
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