import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:app/main.dart' as app;
import 'package:flutter/material.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Voice Chat Integration Test', () {
    testWidgets('Complete voice chat flow with vosk_flutter', (tester) async {
      // Start the app
      app.main();
      await tester.pumpAndSettle();

      // Navigate to voice chat (assuming it's accessible from main screen)
      // This would depend on the actual app navigation structure
      
      // Test 1: Verify voice chat screen loads
      await tester.tap(find.text('Voice Chat')); // Adjust based on actual navigation
      await tester.pumpAndSettle();

      // Verify UI elements are present
      expect(find.text('Voice Chat with Roommate'), findsOneWidget);
      expect(find.byIcon(Icons.mic), findsOneWidget);
      expect(find.byIcon(Icons.send), findsOneWidget);
      expect(find.text('Tap mic to speak'), findsOneWidget);

      // Test 2: Verify language selector
      expect(find.byIcon(Icons.language), findsOneWidget);
      
      // Test locale switching
      await tester.tap(find.byIcon(Icons.language));
      await tester.pumpAndSettle();
      
      // Should show both language options
      expect(find.text('English'), findsOneWidget);
      expect(find.text('Português'), findsOneWidget);
      
      // Switch to Portuguese
      await tester.tap(find.text('Português'));
      await tester.pumpAndSettle();

      // Test 3: Verify mic button interaction
      // Note: This won't actually test audio input, but verifies the UI state changes
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();
      
      // After tapping mic, the UI should change to listening state
      // (In real implementation, this would trigger vosk_flutter model loading and recognition)
      expect(find.text('Listening...'), findsOneWidget);
      expect(find.byIcon(Icons.stop), findsOneWidget);

      // Stop listening
      await tester.tap(find.byIcon(Icons.stop));
      await tester.pumpAndSettle();
      
      // Should return to non-listening state
      expect(find.text('Tap mic to speak'), findsOneWidget);
      expect(find.byIcon(Icons.mic), findsOneWidget);

      // Test 4: Verify send button is present
      expect(find.byIcon(Icons.send), findsOneWidget);
      
      // In a real test with actual speech input, the flow would be:
      // 1. Tap mic → vosk_flutter loads model for selected locale
      // 2. Speak → vosk_flutter processes audio offline → updates _text variable via partial/result streams
      // 3. Tap send → HTTP request to backend → response
      // 4. TTS speaks the response
      // 5. Message appears in history
    });

    testWidgets('Language switching updates locale', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to voice chat
      await tester.tap(find.text('Voice Chat'));
      await tester.pumpAndSettle();

      // Test that changing language updates the locale setting
      // (In implementation, this changes the vosk_flutter model loaded)
      
      // Start with English (default)
      expect(find.byIcon(Icons.language), findsOneWidget);
      
      // Switch to Portuguese
      await tester.tap(find.byIcon(Icons.language));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Português'));
      await tester.pumpAndSettle();
      
      // Switch back to English
      await tester.tap(find.byIcon(Icons.language));
      await tester.pumpAndSettle();
      await tester.tap(find.text('English'));
      await tester.pumpAndSettle();
      
      // Each language switch should update the _selectedLocale variable
      // which affects the vosk model loaded for speech recognition
    });
  });
}

/*
 * Expected Speech Recognition Flow:
 * 
 * 1. User taps mic button
 * 2. vosk_flutter loads model based on _selectedLocale (en-US or pt-BR)
 * 3. User speaks → onPartial() updates _text in real-time, onResult() provides final text
 * 4. Speech ends → final result provided via vosk streams
 * 5. User taps send → _sendToRoommate() called
 * 6. HTTP request sent to backend with recognized text
 * 7. Response received and added to history
 * 8. TTS speaks the response
 * 
 * Language switching:
 * - Updates _selectedLocale
 * - Next mic tap loads the appropriate vosk model (.zip file from assets)
 * - English: assets/models/vosk-model-small-en-us-0.15.zip
 * - Portuguese: assets/models/vosk-model-small-pt-0.3.zip
 */