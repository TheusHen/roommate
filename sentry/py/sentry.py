import os
import sentry_sdk

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