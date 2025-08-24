import os
from dotenv import load_dotenv
import sentry_sdk

load_dotenv()

SENTRY_DSN = os.environ.get("SENTRY_DSN", "")

sentry_sdk.init(
    dsn=SENTRY_DSN,
    traces_sample_rate=1.0,
    environment=os.environ.get("NODE_ENV", "development"),
)

def capture_error(error):
    sentry_sdk.capture_exception(error)

def capture_message(message):
    sentry_sdk.capture_message(message)

async def flush_sentry(timeout=2.0):
    sentry_sdk.flush(timeout)

def test_sentry_integration():
    """
    Tests Sentry integration by sending a test error.
    Only works if SENTRY_DSN is configured.
    """
    if not SENTRY_DSN:
        print('Sentry DSN not configured, skipping test')
        return
    
    print('Testing Sentry integration...')
    test_error = Exception('Sentry integration test - this is a test error to verify Sentry connectivity')
    sentry_sdk.capture_exception(test_error)
    sentry_sdk.capture_message('Sentry integration test - test message to verify Sentry is working correctly')
    
    print('Test error sent to Sentry. Check your Sentry dashboard to verify the integration is working.')