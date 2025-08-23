import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN || '';

Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
});

/**
 * Sends an error to Sentry.
 * @param error The error to capture.
 */
export function captureError(error: unknown): void {
    Sentry.captureException(error);
}

/**
 * Sends a message to Sentry.
 * @param message The message to capture.
 */
export function captureMessage(message: string): void {
    Sentry.captureMessage(message);
}

/**
 * Flushes Sentry events before process exit.
 * @param timeout Timeout in milliseconds.
 */
export async function flushSentry(timeout: number = 2000): Promise<void> {
    await Sentry.flush(timeout);
}

export default Sentry;