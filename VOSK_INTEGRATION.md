## Voice Chat Flow with Vosk Integration

This document demonstrates the complete flow from microphone input to TTS output using vosk_flutter for offline speech recognition.

### Flow Overview

```
🎙️ Microphone Input
    ↓
📱 Vosk Flutter (Offline STT)
    ↓
📝 Text Recognition (_text variable)
    ↓  
🌐 HTTP API Call (to roommate server)
    ↓
💬 Response from AI
    ↓
🔊 Flutter TTS (Text-to-Speech)
```

### Implementation Details

#### 1. Model Loading (Locale-Specific)
```dart
// English model: assets/models/vosk-model-small-en-us-0.15.zip
// Portuguese model: assets/models/vosk-model-small-pt-0.3.zip

Future<void> _loadModel() async {
  final modelPath = _selectedLocale == 'pt-BR'
      ? 'assets/models/vosk-model-small-pt-0.3.zip'
      : 'assets/models/vosk-model-small-en-us-0.15.zip';
  
  final loadedModelPath = await ModelLoader().loadFromAssets(modelPath);
  final model = await _vosk.createModel(loadedModelPath);
  _recognizer = await _vosk.createRecognizer(model: model, sampleRate: 16000);
}
```

#### 2. Speech Recognition Start
```dart
Future<void> _startListening() async {
  // Load model if not already loaded
  if (_recognizer == null) await _loadModel();
  
  // Initialize speech service
  _speechService = await _vosk.initSpeechService(_recognizer!);
  
  // Subscribe to partial results (real-time updates)
  _speechService!.onPartial().forEach((partial) {
    setState(() => _text = partial); // Updates UI as user speaks
  });
  
  // Subscribe to final results (complete sentences)
  _speechService!.onResult().forEach((result) {
    setState(() => _text = result); // Final recognized text
  });
  
  await _speechService!.start();
  setState(() => _isListening = true);
}
```

#### 3. HTTP API Integration
```dart
// Same as before - sends recognized text to roommate AI
Future<void> _sendToRoommate() async {
  final response = await http.post(
    Uri.parse(apiUrl),
    body: jsonEncode({"prompt": "Said: ${_text.trim()}"}),
    // ... headers, etc.
  );
  // Process response and add to history
}
```

#### 4. Language Switching
```dart
// When user changes language in dropdown:
onChanged: (val) {
  setState(() {
    _selectedLocale = val ?? 'en-US';
    // Dispose old recognizer to force reload of new model
    _recognizer?.dispose();
    _recognizer = null;
  });
}
```

### Key Benefits of Vosk Integration

1. **Offline Operation**: No internet required for speech recognition
2. **Privacy**: Audio never leaves the device
3. **Multi-language**: Supports English and Portuguese models
4. **Real-time**: Provides partial results as user speaks
5. **Accuracy**: Dedicated models for each language improve recognition

### Testing Verification

The tests verify:
- UI components are correctly displayed
- Locale switching functionality
- Data flow from recognition to API
- Model path selection logic
- Complete integration flow structure

### Model Files

Note: The actual vosk model files need to be downloaded separately:
- English: vosk-model-small-en-us-0.15.zip (~50MB)
- Portuguese: vosk-model-small-pt-0.3.zip (~50MB)

These should be placed in `app/assets/models/` directory.