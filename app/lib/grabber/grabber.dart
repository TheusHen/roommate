import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/sentry.dart';

/// Represents a user memory retrieved from the database
class UserMemory {
  final String type;
  final String key;
  final String value;
  final String timestamp;
  final String userId;

  UserMemory({
    required this.type,
    required this.key,
    required this.value,
    required this.timestamp,
    required this.userId,
  });

  factory UserMemory.fromJson(Map<String, dynamic> json) {
    return UserMemory(
      type: json['type'] ?? '',
      key: json['key'] ?? '',
      value: json['value'] ?? '',
      timestamp: json['timestamp'] ?? '',
      userId: json['userId'] ?? '',
    );
  }

  @override
  String toString() {
    return 'UserMemory(type: $type, key: $key, value: $value)';
  }
}

/// Grabber class for enriching prompts with user context from MongoDB
class Grabber {
  static const String baseUrl = 'http://localhost:3000';
  
  /// Initialize error tracking for the Grabber
  static void initErrorTracking({
    String analyticsOption = 'None',
    String? sentryDsn,
    String? nightwatchApiUrl,
    String? nightwatchApiKey,
    String environment = 'production',
  }) {
    ErrorTracker.setAnalyticsOption(analyticsOption);
    
    if (sentryDsn != null && sentryDsn.isNotEmpty) {
      SentryConfig.init(dsn: sentryDsn, environment: environment);
    }
    
    if (nightwatchApiUrl != null && nightwatchApiKey != null) {
      Nightwatch.init(apiUrl: nightwatchApiUrl, apiKey: nightwatchApiKey);
    }
  }
  
  /// Handle errors based on configured analytics option
  static Future<void> _handleError(dynamic error) async {
    await ErrorTracker.handleError(error);
  }
  
  /// Enriches a prompt with relevant user information from the database
  /// 
  /// [userId] - The user's unique identifier
  /// [prompt] - The original user prompt
  /// [apiPassword] - The API password for authorization
  /// 
  /// Returns the enriched prompt with user context
  static Future<String> enrichPrompt(String userId, String prompt, String apiPassword) async {
    try {
      // First, save any new information from the prompt
      await _saveMemoryFromPrompt(userId, prompt, apiPassword);
      
      // Then, get relevant memories to enrich the prompt
      final memories = await _getRelevantMemories(userId, prompt, apiPassword);
      
      if (memories.isEmpty) {
        return prompt;
      }
      
      // Build context from memories
      final context = _buildContextFromMemories(memories);
      
      // Enrich the prompt with context
      return _enrichPromptWithContext(prompt, context);
      
    } catch (e) {
      await _handleError(e);
      // Log error through error tracking instead of print
      return prompt; // Return original prompt if enrichment fails
    }
  }
  
  /// Save new information from the user's prompt to memory
  static Future<void> _saveMemoryFromPrompt(String userId, String prompt, String apiPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/memory/save'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiPassword',
        },
        body: jsonEncode({
          'userId': userId,
          'sentence': prompt,
        }),
      );
      
      if (response.statusCode != 200) {
        // Log error through error tracking instead of print
      }
    } catch (e) {
      await _handleError(e);
      // Log error through error tracking instead of print
      // Don't throw - saving memory is optional
    }
  }
  
  /// Get relevant memories for the given prompt
  static Future<List<UserMemory>> _getRelevantMemories(String userId, String prompt, String apiPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/memory/get'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiPassword',
        },
        body: jsonEncode({
          'userId': userId,
          'prompt': prompt,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> memoriesJson = data['memories'] ?? [];
        return memoriesJson.map((json) => UserMemory.fromJson(json)).toList();
      } else {
        // Log error through error tracking instead of print
        return [];
      }
    } catch (e) {
      await _handleError(e);
      // Log error through error tracking instead of print
      return [];
    }
  }
  
  /// Build context string from user memories
  static String _buildContextFromMemories(List<UserMemory> memories) {
    final contextParts = <String>[];
    
    for (final memory in memories) {
      switch (memory.type) {
        case 'pet':
          if (memory.key.endsWith('_name')) {
            final petType = memory.key.replaceAll('_name', '');
            contextParts.add('Your $petType\'s name is ${memory.value}');
          }
          break;
        case 'personal':
          if (memory.key == 'name') {
            contextParts.add('Your name is ${memory.value}');
          }
          break;
        case 'location':
          if (memory.key == 'home_location') {
            contextParts.add('You live in ${memory.value}');
          }
          break;
        case 'work':
          if (memory.key == 'company') {
            contextParts.add('You work at ${memory.value}');
          }
          break;
        case 'preference':
          if (memory.key == 'likes') {
            contextParts.add('You like ${memory.value}');
          }
          break;
      }
    }
    
    return contextParts.join('. ');
  }
  
  /// Enrich the original prompt with context
  static String _enrichPromptWithContext(String prompt, String context) {
    if (context.isEmpty) {
      return prompt;
    }
    
    // Check if the prompt is asking about stored information
    final lowerPrompt = prompt.toLowerCase();
    
    // Direct answer for specific questions
    if (_isDirectQuestion(lowerPrompt, context)) {
      return _getDirectAnswer(lowerPrompt, context);
    }
    
    // Otherwise, add context to help the AI respond better
    return 'Context about the user: $context.\n\nUser says: $prompt';
  }
  
  /// Check if this is a direct question that can be answered from memory
  static bool _isDirectQuestion(String lowerPrompt, String context) {
    final questionPatterns = [
      'what is my',
      'what\'s my',
      'who is my',
      'where do i live',
      'where do i work',
      'what do i like',
    ];
    
    return questionPatterns.any((pattern) => lowerPrompt.contains(pattern));
  }
  
  /// Get direct answer from context for simple questions
  static String _getDirectAnswer(String lowerPrompt, String context) {
    if (lowerPrompt.contains('dog') && lowerPrompt.contains('name')) {
      final dogNameMatch = RegExp(r"your dog's name is (\w+)", caseSensitive: false)
          .firstMatch(context);
      if (dogNameMatch != null) {
        return 'Your dog\'s name is ${dogNameMatch.group(1)}.';
      }
    }
    
    if (lowerPrompt.contains('cat') && lowerPrompt.contains('name')) {
      final catNameMatch = RegExp(r"your cat's name is (\w+)", caseSensitive: false)
          .firstMatch(context);
      if (catNameMatch != null) {
        return 'Your cat\'s name is ${catNameMatch.group(1)}.';
      }
    }
    
    if (lowerPrompt.contains('name') && !lowerPrompt.contains('dog') && !lowerPrompt.contains('cat')) {
      final nameMatch = RegExp(r'your name is (\w+)', caseSensitive: false)
          .firstMatch(context);
      if (nameMatch != null) {
        return 'Your name is ${nameMatch.group(1)}.';
      }
    }
    
    if (lowerPrompt.contains('live') || lowerPrompt.contains('from')) {
      final locationMatch = RegExp(r'you live in ([^.]+)', caseSensitive: false)
          .firstMatch(context);
      if (locationMatch != null) {
        return 'You live in ${locationMatch.group(1)}.';
      }
    }
    
    if (lowerPrompt.contains('work')) {
      final workMatch = RegExp(r'you work at ([^.]+)', caseSensitive: false)
          .firstMatch(context);
      if (workMatch != null) {
        return 'You work at ${workMatch.group(1)}.';
      }
    }
    
    if (lowerPrompt.contains('like') || lowerPrompt.contains('prefer')) {
      final likeMatch = RegExp(r'you like ([^.]+)', caseSensitive: false)
          .firstMatch(context);
      if (likeMatch != null) {
        return 'You like ${likeMatch.group(1)}.';
      }
    }
    
    // If no specific pattern matches, add context to prompt
    return 'Context: $context.\n\nUser asks: $lowerPrompt';
  }
}
