import * as dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN || '';

try {
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development',
    });
} catch (error) {
    console.error('Failed to initialize Sentry:', error);
}

/**
 * Sends an error to Sentry.
 * @param error The error to capture.
 */
export function captureError(error: unknown): void {
    try {
        Sentry.captureException(error);
    } catch (captureErr) {
        console.error('Failed to capture error to Sentry:', captureErr);
    }
}

/**
 * Sends a message to Sentry.
 * @param message The message to capture.
 */
export function captureMessage(message: string): void {
    try {
        Sentry.captureMessage(message);
    } catch (captureErr) {
        console.error('Failed to capture message to Sentry:', captureErr);
    }
}

/**
 * Flushes Sentry events before process exit.
 * @param timeout Timeout in milliseconds.
 */
export async function flushSentry(timeout: number = 2000): Promise<void> {
    try {
        await Sentry.flush(timeout);
    } catch (flushErr) {
        console.error('Failed to flush Sentry:', flushErr);
    }
}

/**
 * Tests Sentry integration by sending a test error.
 * Only works if SENTRY_DSN is configured.
 */
export function testSentryIntegration(): void {
    const currentDsn = process.env.SENTRY_DSN || '';
    if (!currentDsn) {
        console.log('Sentry DSN not configured, skipping test');
        return;
    }
    
    console.log('Testing Sentry integration...');
    const testError = new Error('Sentry integration test - this is a test error to verify Sentry connectivity');
    Sentry.captureException(testError);
    Sentry.captureMessage('Sentry integration test - test message to verify Sentry is working correctly');
    
    console.log('Test error sent to Sentry. Check your Sentry dashboard to verify the integration is working.');
}

export default Sentry;