import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

/// Sentry DSN configuration
class SentryConfig {
  static String? _dsn;
  static String? _environment;
  
  static void init({
    required String dsn,
    String environment = 'production',
  }) {
    _dsn = dsn;
    _environment = environment;
  }
  
  static bool get isConfigured => _dsn != null && _dsn!.isNotEmpty;
}

/// Sentry client for Dart/Flutter error tracking
class Sentry {
  /// Captures an exception and sends it to Sentry
  static Future<void> captureException(
    dynamic exception, {
    String? message,
    Map<String, dynamic>? extra,
  }) async {
    if (!SentryConfig.isConfigured) {
      print('[Sentry] DSN not configured, skipping error capture');
      return;
    }

    try {
      final event = _createErrorEvent(exception, message: message, extra: extra);
      await _sendToSentry(event);
    } catch (e) {
      print('[Sentry] Failed to capture exception: $e');
    }
  }

  /// Captures a message and sends it to Sentry
  static Future<void> captureMessage(
    String message, {
    String level = 'info',
    Map<String, dynamic>? extra,
  }) async {
    if (!SentryConfig.isConfigured) {
      print('[Sentry] DSN not configured, skipping message capture');
      return;
    }

    try {
      final event = _createMessageEvent(message, level: level, extra: extra);
      await _sendToSentry(event);
    } catch (e) {
      print('[Sentry] Failed to capture message: $e');
    }
  }

  /// Tests Sentry integration by sending a test error
  static Future<void> testIntegration() async {
    if (!SentryConfig.isConfigured) {
      print('[Sentry] DSN not configured, skipping test');
      return;
    }

    print('[Sentry] Testing integration...');
    
    await captureException(
      Exception('Sentry integration test - this is a test error to verify Sentry connectivity'),
      message: 'Test exception from Dart/Flutter client',
    );
    
    await captureMessage(
      'Sentry integration test - test message to verify Sentry is working correctly',
      level: 'info',
    );
    
    print('[Sentry] Test events sent. Check your Sentry dashboard to verify the integration is working.');
  }

  /// Creates an error event payload
  static Map<String, dynamic> _createErrorEvent(
    dynamic exception, {
    String? message,
    Map<String, dynamic>? extra,
  }) {
    final timestamp = DateTime.now().toUtc().toIso8601String();
    final eventId = _generateEventId();
    
    return {
      'event_id': eventId,
      'timestamp': timestamp,
      'platform': 'dart',
      'sdk': {
        'name': 'custom-dart-sentry',
        'version': '1.0.0',
      },
      'environment': SentryConfig._environment,
      'level': 'error',
      'exception': {
        'values': [
          {
            'type': exception.runtimeType.toString(),
            'value': message ?? exception.toString(),
            'stacktrace': {
              'frames': _parseStackTrace(StackTrace.current),
            },
          }
        ]
      },
      'extra': extra ?? {},
    };
  }

  /// Creates a message event payload
  static Map<String, dynamic> _createMessageEvent(
    String message, {
    String level = 'info',
    Map<String, dynamic>? extra,
  }) {
    final timestamp = DateTime.now().toUtc().toIso8601String();
    final eventId = _generateEventId();
    
    return {
      'event_id': eventId,
      'timestamp': timestamp,
      'platform': 'dart',
      'sdk': {
        'name': 'custom-dart-sentry',
        'version': '1.0.0',
      },
      'environment': SentryConfig._environment,
      'level': level,
      'message': {
        'formatted': message,
      },
      'extra': extra ?? {},
    };
  }

  /// Sends event to Sentry API
  static Future<void> _sendToSentry(Map<String, dynamic> event) async {
    final dsn = SentryConfig._dsn!;
    final uri = _parseDsn(dsn);
    
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': _buildAuthHeader(dsn),
      },
      body: jsonEncode(event),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to send to Sentry: ${response.statusCode} ${response.body}');
    }
  }

  /// Parses Sentry DSN to get the API endpoint
  static Uri _parseDsn(String dsn) {
    final uri = Uri.parse(dsn);
    final projectId = uri.pathSegments.last;
    return Uri.parse('${uri.scheme}://${uri.host}/api/$projectId/store/');
  }

  /// Builds Sentry auth header
  static String _buildAuthHeader(String dsn) {
    final uri = Uri.parse(dsn);
    final publicKey = uri.userInfo.split(':')[0];
    
    return 'Sentry sentry_version=7, '
           'sentry_client=custom-dart-sentry/1.0.0, '
           'sentry_timestamp=${DateTime.now().millisecondsSinceEpoch ~/ 1000}, '
           'sentry_key=$publicKey';
  }

  /// Generates a unique event ID
  static String _generateEventId() {
    final bytes = List<int>.generate(16, (i) => 
        DateTime.now().millisecondsSinceEpoch + i);
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  /// Parses stack trace into Sentry format
  static List<Map<String, dynamic>> _parseStackTrace(StackTrace stackTrace) {
    final lines = stackTrace.toString().split('\n');
    final frames = <Map<String, dynamic>>[];
    
    for (final line in lines) {
      if (line.trim().isEmpty) continue;
      
      frames.add({
        'filename': _extractFilename(line),
        'function': _extractFunction(line),
        'lineno': _extractLineNumber(line),
        'in_app': !line.contains('dart:'),
      });
    }
    
    return frames.reversed.toList(); // Sentry expects frames in reverse order
  }

  static String _extractFilename(String line) {
    final match = RegExp(r'([\w\/\.]+\.dart)').firstMatch(line);
    return match?.group(1) ?? 'unknown';
  }

  static String _extractFunction(String line) {
    final match = RegExp(r'#\d+\s+(.+?)\s+\(').firstMatch(line);
    return match?.group(1) ?? 'unknown';
  }

  static int _extractLineNumber(String line) {
    final match = RegExp(r':(\d+):\d+\)').firstMatch(line);
    return int.tryParse(match?.group(1) ?? '0') ?? 0;
  }
}

/// Nightwatch error tracking for Dart/Flutter
class Nightwatch {
  static String? _apiUrl;
  static String? _apiKey;

  static void init({
    required String apiUrl,
    required String apiKey,
  }) {
    _apiUrl = apiUrl;
    _apiKey = apiKey;
  }

  static bool get isConfigured => 
      _apiUrl != null && _apiUrl!.isNotEmpty && 
      _apiKey != null && _apiKey!.isNotEmpty;

  /// Sends error to Nightwatch endpoint
  static Future<void> sendError(dynamic error) async {
    if (!isConfigured) {
      print('[Nightwatch] API URL or key not configured, skipping error reporting');
      return;
    }

    try {
      final response = await http.post(
        Uri.parse(_apiUrl!),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_apiKey',
        },
        body: jsonEncode({
          'error': error.toString(),
          'timestamp': DateTime.now().toUtc().toIso8601String(),
          'platform': 'dart',
        }),
      );

      if (response.statusCode != 200) {
        print('[Nightwatch] Failed to send error: ${response.statusCode}');
      }
    } catch (e) {
      print('[Nightwatch] Failed to send error to Nightwatch: $e');
    }
  }
}

/// Error handling utility that supports both Sentry and Nightwatch
class ErrorTracker {
  static String _analyticsOption = 'None';

  static void setAnalyticsOption(String option) {
    _analyticsOption = option;
  }

  /// Handles error based on configured analytics option
  static Future<void> handleError(dynamic error) async {
    switch (_analyticsOption) {
      case 'Sentry':
        await Sentry.captureException(error);
        break;
      case 'Nightwatch':
        await Nightwatch.sendError(error);
        break;
      case 'Both':
        await Sentry.captureException(error);
        await Nightwatch.sendError(error);
        break;
      default:
        print('[ErrorTracker] No analytics configured, error: $error');
    }
  }
}