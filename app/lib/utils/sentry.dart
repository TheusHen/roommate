import 'dart:convert';
import 'package:flutter/foundation.dart';
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
  static Future<void> captureException(
    dynamic exception, {
    String? message,
    Map<String, dynamic>? extra,
  }) async {
    if (!SentryConfig.isConfigured) {
      debugPrint('[Sentry] DSN not configured, skipping error capture');
      return;
    }

    try {
      final event = _createErrorEvent(exception, message: message, extra: extra);
      await _sendToSentry(event);
    } catch (e) {
      debugPrint('[Sentry] Failed to capture exception: $e');
    }
  }

  static Future<void> captureMessage(
    String message, {
    String level = 'info',
    Map<String, dynamic>? extra,
  }) async {
    if (!SentryConfig.isConfigured) {
      debugPrint('[Sentry] DSN not configured, skipping message capture');
      return;
    }

    try {
      final event = _createMessageEvent(message, level: level, extra: extra);
      await _sendToSentry(event);
    } catch (e) {
      debugPrint('[Sentry] Failed to capture message: $e');
    }
  }

  static Future<void> testIntegration() async {
    if (!SentryConfig.isConfigured) {
      debugPrint('[Sentry] DSN not configured, skipping test');
      return;
    }

    debugPrint('[Sentry] Testing integration...');
    
    await captureException(
      Exception('Sentry integration test - this is a test error to verify Sentry connectivity'),
      message: 'Test exception from Dart/Flutter client',
    );
    
    await captureMessage(
      'Sentry integration test - test message to verify Sentry is working correctly',
      level: 'info',
    );
    
    debugPrint('[Sentry] Test events sent. Check your Sentry dashboard to verify the integration is working.');
  }

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

  static Uri _parseDsn(String dsn) {
    final uri = Uri.parse(dsn);
    final projectId = uri.pathSegments.last;
    return Uri.parse('${uri.scheme}://${uri.host}/api/$projectId/store/');
  }

  static String _buildAuthHeader(String dsn) {
    final uri = Uri.parse(dsn);
    final publicKey = uri.userInfo.split(':')[0];
    
    return 'Sentry sentry_version=7, '
           'sentry_client=custom-dart-sentry/1.0.0, '
           'sentry_timestamp=${DateTime.now().millisecondsSinceEpoch ~/ 1000}, '
           'sentry_key=$publicKey';
  }

  static String _generateEventId() {
    final bytes = List<int>.generate(16, (i) => 
        DateTime.now().millisecondsSinceEpoch + i);
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

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
    
    return frames.reversed.toList();
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

  static Future<void> sendError(dynamic error) async {
    if (!isConfigured) {
      debugPrint('[Nightwatch] API URL or key not configured, skipping error reporting');
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
        debugPrint('[Nightwatch] Failed to send error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[Nightwatch] Failed to send error to Nightwatch: $e');
    }
  }
}

class ErrorTracker {
  static String _analyticsOption = 'None';

  static void setAnalyticsOption(String option) {
    _analyticsOption = option;
  }

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
        debugPrint('[ErrorTracker] No analytics configured, error: $error');
    }
  }
}
