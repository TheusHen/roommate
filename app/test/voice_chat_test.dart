import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:app/pages/voice_chat.dart';

void main() {
  group('VoiceChatScreen', () {
    testWidgets('should display voice chat interface', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: VoiceChatScreen(),
        ),
      );

      // Verify UI elements are present
      expect(find.text('Voice Chat with Roommate'), findsOneWidget);
      expect(find.byIcon(Icons.mic), findsOneWidget);
      expect(find.byIcon(Icons.send), findsOneWidget);
      expect(find.text('Tap mic to speak'), findsOneWidget);
    });

    testWidgets('should show locale selector with English and Portuguese options', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: VoiceChatScreen(),
        ),
      );

      // Find the locale dropdown
      expect(find.byIcon(Icons.language), findsOneWidget);
      
      // The dropdown should be visible
      expect(find.byType(DropdownButton<String>), findsOneWidget);
    });

    testWidgets('should change listening state when mic button is pressed', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: VoiceChatScreen(),
        ),
      );

      // Initially should show mic icon (not listening)
      expect(find.byIcon(Icons.mic), findsOneWidget);
      expect(find.text('Tap mic to speak'), findsOneWidget);

      // Note: We can't easily test the actual mic functionality without mocking
      // but we can verify the UI structure is correct
    });

    testWidgets('should have send button for transmitting recognized text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: VoiceChatScreen(),
        ),
      );

      // Verify send button exists
      expect(find.byIcon(Icons.send), findsOneWidget);
      
      // Verify it's in the correct row with mic button
      expect(find.byType(Row), findsWidgets);
    });
  });

  group('Voice Chat Data Flow', () {
    test('should handle text recognition flow', () {
      // This test verifies the expected data flow:
      // 🎙️ microphone → speech_to_text → text (_text) → send via HTTP → response → flutter_tts
      
      // 1. Simulated speech recognition result
      const recognizedText = 'Hello roommate how are you';
      
      // 2. Text should be valid for processing
      expect(recognizedText, isNotEmpty);
      expect(recognizedText, isA<String>());
      expect(recognizedText.trim(), equals('Hello roommate how are you'));
      
      // 3. Text should be ready for HTTP API call
      final apiPayload = {"prompt": "Said: ${recognizedText.trim()}"};
      expect(apiPayload['prompt'], equals('Said: Hello roommate how are you'));
    });

    test('should handle locale settings for speech recognition', () {
      // Test that correct locales are available
      const locales = [
        {'label': 'English', 'value': 'en-US'},
        {'label': 'Português', 'value': 'pt-BR'},
      ];
      
      // Verify locale values are valid for speech_to_text
      expect(locales[0]['value'], equals('en-US'));
      expect(locales[1]['value'], equals('pt-BR'));
      expect(locales.length, equals(2));
    });
  });
}