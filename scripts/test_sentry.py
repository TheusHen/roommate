#!/usr/bin/env python3
"""
Standalone script to test Sentry integration.
"""
import os
import sys

# Add the parent directory to the path to import sentry module
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'sentry', 'py'))

try:
    from sentry import test_sentry_integration
    test_sentry_integration()
except ImportError as e:
    print(f"Error importing Sentry module: {e}")
    print("Make sure the sentry Python dependencies are installed.")
    sys.exit(1)
except Exception as e:
    print(f"Error testing Sentry: {e}")
    sys.exit(1)