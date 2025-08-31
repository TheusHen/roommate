import * as Sentry from '@sentry/node';
import { captureError, captureMessage, flushSentry, testSentryIntegration } from './sentry';

// Mock Sentry
jest.mock('@sentry/node');

describe('Sentry TypeScript Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.SENTRY_DSN;
    delete process.env.NODE_ENV;
  });

  test('should initialize Sentry with correct configuration', () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
    process.env.NODE_ENV = 'test';
    
    // Re-import to trigger initialization
    jest.isolateModules(() => {
      require('./sentry');
    });

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: 'https://test@sentry.io/123',
      tracesSampleRate: 1.0,
      environment: 'test',
    });
  });

  test('should capture error correctly', () => {
    const testError = new Error('Test error');
    captureError(testError);
    
    expect(Sentry.captureException).toHaveBeenCalledWith(testError);
  });

  test('should capture message correctly', () => {
    const testMessage = 'Test message';
    captureMessage(testMessage);
    
    expect(Sentry.captureMessage).toHaveBeenCalledWith(testMessage);
  });

  test('should flush Sentry events', async () => {
    const mockFlush = Sentry.flush as jest.MockedFunction<typeof Sentry.flush>;
    mockFlush.mockResolvedValue(true);
    
    const result = await flushSentry(3000);
    
    expect(Sentry.flush).toHaveBeenCalledWith(3000);
  });

  test('should use default timeout for flush', async () => {
    const mockFlush = Sentry.flush as jest.MockedFunction<typeof Sentry.flush>;
    mockFlush.mockResolvedValue(true);
    
    await flushSentry();
    
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
  });

  test('should test Sentry integration when DSN is configured', () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    testSentryIntegration();
    
    expect(consoleSpy).toHaveBeenCalledWith('Testing Sentry integration...');
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Test error sent to Sentry. Check your Sentry dashboard to verify the integration is working.'
    );
    
    consoleSpy.mockRestore();
  });

  test('should skip test when DSN is not configured', () => {
    // Ensure SENTRY_DSN is not set
    delete process.env.SENTRY_DSN;
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    testSentryIntegration();
    
    expect(consoleSpy).toHaveBeenCalledWith('Sentry DSN not configured, skipping test');
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('should handle empty DSN', () => {
    process.env.SENTRY_DSN = '';
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    testSentryIntegration();
    
    expect(consoleSpy).toHaveBeenCalledWith('Sentry DSN not configured, skipping test');
    
    consoleSpy.mockRestore();
  });

  test('should use development environment as default', () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
    // Don't set NODE_ENV
    
    jest.isolateModules(() => {
      require('./sentry');
    });

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: 'https://test@sentry.io/123',
      tracesSampleRate: 1.0,
      environment: 'development',
    });
  });

  test('should handle Sentry initialization errors gracefully', () => {
    const mockInit = Sentry.init as jest.MockedFunction<typeof Sentry.init>;
    mockInit.mockImplementation(() => {
      throw new Error('Sentry initialization failed');
    });
    
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
    
    // Should not throw when initializing
    expect(() => {
      jest.isolateModules(() => {
        require('./sentry');
      });
    }).not.toThrow();
  });

  test('should handle capture errors gracefully', () => {
    const mockCaptureException = Sentry.captureException as jest.MockedFunction<typeof Sentry.captureException>;
    mockCaptureException.mockImplementation(() => {
      throw new Error('Capture failed');
    });
    
    const testError = new Error('Test error');
    
    // Should not throw when capturing fails
    expect(() => captureError(testError)).not.toThrow();
  });

  test('should handle capture message errors gracefully', () => {
    const mockCaptureMessage = Sentry.captureMessage as jest.MockedFunction<typeof Sentry.captureMessage>;
    mockCaptureMessage.mockImplementation(() => {
      throw new Error('Capture failed');
    });
    
    // Should not throw when capturing fails
    expect(() => captureMessage('Test message')).not.toThrow();
  });

  test('should handle flush errors gracefully', async () => {
    const mockFlush = Sentry.flush as jest.MockedFunction<typeof Sentry.flush>;
    mockFlush.mockRejectedValue(new Error('Flush failed'));
    
    // Should not throw when flush fails
    await expect(flushSentry()).resolves.not.toThrow();
  });
});