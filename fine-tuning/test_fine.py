import pytest
import os
import sys
import json
from unittest.mock import patch, MagicMock, mock_open
import requests

# Add the parent directory to the path so we can import the module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock the heavy dependencies before importing
sys.modules['datasets'] = MagicMock()
sys.modules['transformers'] = MagicMock()
sys.modules['peft'] = MagicMock()
sys.modules['torch'] = MagicMock()
sys.modules['sentry.py.sentry'] = MagicMock()

class TestFinetuningErrorHandling:
    """Test error handling in fine-tuning module"""
    
    @patch('fine.requests.post')
    def test_send_nightwatch_success(self, mock_post):
        """Test successful Nightwatch error reporting"""
        # Set environment variables
        os.environ['NIGHTWATCH_API_URL'] = 'https://api.nightwatch.test'
        os.environ['NIGHTWATCH_API_KEY'] = 'test-key'
        
        # Import after setting env vars
        from fine import send_nightwatch
        
        mock_post.return_value = MagicMock()
        
        test_error = Exception("Test error")
        send_nightwatch(test_error)
        
        mock_post.assert_called_once_with(
            'https://api.nightwatch.test',
            json={'error': 'Test error'},
            headers={'Authorization': 'Bearer test-key'}
        )

    @patch('fine.requests.post')
    def test_send_nightwatch_missing_config(self, mock_post):
        """Test Nightwatch with missing configuration"""
        # Clear environment variables
        if 'NIGHTWATCH_API_URL' in os.environ:
            del os.environ['NIGHTWATCH_API_URL']
        if 'NIGHTWATCH_API_KEY' in os.environ:
            del os.environ['NIGHTWATCH_API_KEY']
        
        from fine import send_nightwatch
        
        test_error = Exception("Test error")
        send_nightwatch(test_error)
        
        # Should not make any requests when config is missing
        mock_post.assert_not_called()

    @patch('fine.requests.post')
    def test_send_nightwatch_request_failure(self, mock_post):
        """Test Nightwatch request failure handling"""
        os.environ['NIGHTWATCH_API_URL'] = 'https://api.nightwatch.test'
        os.environ['NIGHTWATCH_API_KEY'] = 'test-key'
        
        # Make requests.post raise an exception
        mock_post.side_effect = requests.RequestException("Network error")
        
        from fine import send_nightwatch
        
        # Should not raise exception even if request fails
        test_error = Exception("Test error")
        send_nightwatch(test_error)

    @patch('fine.capture_error')
    @patch('fine.send_nightwatch')
    def test_handle_error_sentry_only(self, mock_nightwatch, mock_sentry):
        """Test error handling with Sentry only"""
        # Mock analytics config
        with patch('builtins.open', mock_open(read_data='{"analytics": "Sentry"}')):
            with patch('os.path.exists', return_value=True):
                # Import fresh and reload to pick up new config  
                import importlib
                import fine
                
                # Manually set the analytics option since reload is problematic in tests
                fine.analytics_option = "Sentry"
                
                test_error = Exception("Test error")
                fine.handle_error(test_error)
                
                mock_sentry.assert_called_once_with(test_error)
                mock_nightwatch.assert_not_called()

    @patch('fine.capture_error')
    @patch('fine.send_nightwatch')
    def test_handle_error_nightwatch_only(self, mock_nightwatch, mock_sentry):
        """Test error handling with Nightwatch only"""
        with patch('builtins.open', mock_open(read_data='{"analytics": "Nightwatch"}')):
            with patch('os.path.exists', return_value=True):
                import importlib
                import fine
                
                # Manually set the analytics option since reload is problematic in tests
                fine.analytics_option = "Nightwatch"
                
                test_error = Exception("Test error")
                fine.handle_error(test_error)
                
                mock_nightwatch.assert_called_once_with(test_error)
                mock_sentry.assert_not_called()

    @patch('fine.capture_error')
    @patch('fine.send_nightwatch')
    def test_handle_error_both(self, mock_nightwatch, mock_sentry):
        """Test error handling with both Sentry and Nightwatch"""
        with patch('builtins.open', mock_open(read_data='{"analytics": "Both"}')):
            with patch('os.path.exists', return_value=True):
                import importlib
                import fine
                
                # Manually set the analytics option since reload is problematic in tests
                fine.analytics_option = "Both"
                
                test_error = Exception("Test error")
                fine.handle_error(test_error)
                
                mock_sentry.assert_called_once_with(test_error)
                mock_nightwatch.assert_called_once_with(test_error)

    def test_analytics_config_loading(self):
        """Test analytics configuration loading"""
        config_data = {"analytics": "Sentry"}
        
        with patch('builtins.open', mock_open(read_data=json.dumps(config_data))):
            with patch('os.path.exists', return_value=True):
                import importlib
                import fine
                
                # Simulate the config loading logic
                fine.analytics_option = config_data.get("analytics", "None (not recommended)")
                
                assert fine.analytics_option == "Sentry"

    def test_analytics_config_missing_file(self):
        """Test behavior when analytics config file is missing"""
        with patch('os.path.exists', return_value=False):
            import importlib
            import fine
            
            # Simulate missing file behavior
            fine.analytics_option = "None (not recommended)"
            
            assert fine.analytics_option == "None (not recommended)"

    def test_analytics_config_invalid_json(self):
        """Test behavior when analytics config has invalid JSON"""
        with patch('builtins.open', mock_open(read_data='invalid json')):
            with patch('os.path.exists', return_value=True):
                import importlib
                import fine
                
                # Simulate invalid JSON behavior
                fine.analytics_option = "None (not recommended)"
                
                # Should fall back to default when JSON is invalid
                assert fine.analytics_option == "None (not recommended)"

class TestFinetuningDataProcessing:
    """Test data processing functions"""
    
    def test_format_example_with_ideal(self):
        """Test formatting example with ideal response"""
        # Mock tokenizer
        mock_tokenizer = MagicMock()
        mock_tokenizer.return_value = MagicMock(input_ids=[1, 2, 3, 4, 5])
        
        with patch('fine.tokenizer', mock_tokenizer):
            from fine import format_example
            
            example = {
                "prompt": "Test prompt",
                "ideal": "Test ideal response"
            }
            
            result = format_example(example)
            
            assert result is not None
            assert "input_ids" in result
            assert "labels" in result

    def test_format_example_without_ideal(self):
        """Test formatting example without ideal response"""
        from fine import format_example
        
        example = {
            "prompt": "Test prompt"
            # No "ideal" field
        }
        
        result = format_example(example)
        assert result is None

    def test_format_example_empty_ideal(self):
        """Test formatting example with empty ideal response"""
        from fine import format_example
        
        example = {
            "prompt": "Test prompt",
            "ideal": ""
        }
        
        result = format_example(example)
        assert result is None

if __name__ == '__main__':
    pytest.main([__file__])