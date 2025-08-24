#!/usr/bin/env node
/**
 * Standalone script to test Sentry integration from TypeScript/Node.js
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    try {
        // Dynamic import to ensure environment is loaded first
        const { testSentryIntegration } = await import('../sentry/ts/sentry.js');
        testSentryIntegration();
    } catch (error) {
        console.error('Error testing Sentry:', error);
        console.error('Make sure the sentry TypeScript dependencies are installed.');
        process.exit(1);
    }
}

main();