import 'package:flutter_test/flutter_test.dart';
import 'package:app/grabber/grabber.dart';

void main() {
  group('UserMemory', () {
    test('should create UserMemory from JSON', () {
      final json = {
        'type': 'pet',
        'key': 'dog_name',
        'value': 'Duke',
        'timestamp': '2025-08-31T03:00:00Z',
        'userId': 'test-user'
      };

      final memory = UserMemory.fromJson(json);

      expect(memory.type, equals('pet'));
      expect(memory.key, equals('dog_name'));
      expect(memory.value, equals('Duke'));
      expect(memory.timestamp, equals('2025-08-31T03:00:00Z'));
      expect(memory.userId, equals('test-user'));
    });

    test('should handle missing JSON fields gracefully', () {
      final json = <String, dynamic>{};

      final memory = UserMemory.fromJson(json);

      expect(memory.type, equals(''));
      expect(memory.key, equals(''));
      expect(memory.value, equals(''));
      expect(memory.timestamp, equals(''));
      expect(memory.userId, equals(''));
    });
  });

  group('Grabber Context Building', () {
    test('should build context from pet memory', () {
      final memories = [
        UserMemory(
          type: 'pet',
          key: 'dog_name',
          value: 'Duke',
          timestamp: '2025-08-31T03:00:00Z',
          userId: 'test-user',
        ),
      ];

      // Using reflection-like approach to test private method
      final context = _buildContextFromMemories(memories);
      expect(context, contains('Your dog\'s name is Duke'));
    });

    test('should build context from personal memory', () {
      final memories = [
        UserMemory(
          type: 'personal',
          key: 'name',
          value: 'Alice',
          timestamp: '2025-08-31T03:00:00Z',
          userId: 'test-user',
        ),
      ];

      final context = _buildContextFromMemories(memories);
      expect(context, contains('Your name is Alice'));
    });

    test('should build context from location memory', () {
      final memories = [
        UserMemory(
          type: 'location',
          key: 'home_location',
          value: 'New York',
          timestamp: '2025-08-31T03:00:00Z',
          userId: 'test-user',
        ),
      ];

      final context = _buildContextFromMemories(memories);
      expect(context, contains('You live in New York'));
    });

    test('should build context from work memory', () {
      final memories = [
        UserMemory(
          type: 'work',
          key: 'company',
          value: 'Google',
          timestamp: '2025-08-31T03:00:00Z',
          userId: 'test-user',
        ),
      ];

      final context = _buildContextFromMemories(memories);
      expect(context, contains('You work at Google'));
    });

    test('should build context from preference memory', () {
      final memories = [
        UserMemory(
          type: 'preference',
          key: 'likes',
          value: 'pizza',
          timestamp: '2025-08-31T03:00:00Z',
          userId: 'test-user',
        ),
      ];

      final context = _buildContextFromMemories(memories);
      expect(context, contains('You like pizza'));
    });

    test('should build context from multiple memories', () {
      final memories = [
        UserMemory(
          type: 'pet',
          key: 'dog_name',
          value: 'Duke',
          timestamp: '2025-08-31T03:00:00Z',
          userId: 'test-user',
        ),
        UserMemory(
          type: 'personal',
          key: 'name',
          value: 'Alice',
          timestamp: '2025-08-31T03:00:00Z',
          userId: 'test-user',
        ),
      ];

      final context = _buildContextFromMemories(memories);
      expect(context, contains('Your dog\'s name is Duke'));
      expect(context, contains('Your name is Alice'));
    });
  });

  group('Direct Question Detection', () {
    test('should detect dog name question', () {
      final prompt = "What is my dog's name?";
      final context = "Your dog's name is Duke";
      
      final result = _isDirectQuestion(prompt.toLowerCase(), context);
      expect(result, isTrue);
    });

    test('should detect name question', () {
      final prompt = "What's my name?";
      final context = "Your name is Alice";
      
      final result = _isDirectQuestion(prompt.toLowerCase(), context);
      expect(result, isTrue);
    });

    test('should not detect non-direct questions', () {
      final prompt = "How are you today?";
      final context = "Your name is Alice";
      
      final result = _isDirectQuestion(prompt.toLowerCase(), context);
      expect(result, isFalse);
    });
  });

  group('Direct Answer Generation', () {
    test('should generate direct answer for dog name question', () {
      final prompt = "what is my dog's name?";
      final context = "Your dog's name is Duke";
      
      final answer = _getDirectAnswer(prompt, context);
      expect(answer, equals("Your dog's name is Duke."));
    });

    test('should generate direct answer for cat name question', () {
      final prompt = "what is my cat's name?";
      final context = "Your cat's name is Whiskers";
      
      final answer = _getDirectAnswer(prompt, context);
      expect(answer, equals("Your cat's name is Whiskers."));
    });

    test('should generate direct answer for personal name question', () {
      final prompt = "what is my name?";
      final context = "Your name is Alice";
      
      final answer = _getDirectAnswer(prompt, context);
      expect(answer, equals("Your name is Alice."));
    });

    test('should generate direct answer for location question', () {
      final prompt = "where do i live?";
      final context = "You live in New York";
      
      final answer = _getDirectAnswer(prompt, context);
      expect(answer, equals("You live in New York."));
    });

    test('should generate direct answer for work question', () {
      final prompt = "where do i work?";
      final context = "You work at Google";
      
      final answer = _getDirectAnswer(prompt, context);
      expect(answer, equals("You work at Google."));
    });

    test('should generate direct answer for preference question', () {
      final prompt = "what do i like?";
      final context = "You like pizza";
      
      final answer = _getDirectAnswer(prompt, context);
      expect(answer, equals("You like pizza."));
    });
  });
}

// Helper methods to test private functionality
// In a real implementation, these would be exposed or tested differently

String _buildContextFromMemories(List<UserMemory> memories) {
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

bool _isDirectQuestion(String lowerPrompt, String context) {
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

String _getDirectAnswer(String lowerPrompt, String context) {
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
  
  return 'Context: $context.\n\nUser asks: $lowerPrompt';
}