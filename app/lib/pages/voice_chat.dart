import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:vosk_flutter_2/vosk_flutter.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;
import '../api_password_manager.dart';

const String apiUrl = "http://localhost:3000/chat";
const String feedbackUrl = "http://localhost:3000/feedback";

class VoiceMessage {
  final String userPrompt;
  final String roommateResponse;
  final DateTime timestamp;
  VoiceMessage({
    required this.userPrompt,
    required this.roommateResponse,
    required this.timestamp,
  });
}

class VoiceChatScreen extends StatefulWidget {
  const VoiceChatScreen({super.key});

  @override
  State<VoiceChatScreen> createState() => _VoiceChatScreenState();
}

class _VoiceChatScreenState extends State<VoiceChatScreen> {
  // Vosk recognition components - replaces speech_to_text
  Recognizer? _recognizer;
  SpeechService? _speechService;
  final VoskFlutterPlugin _vosk = VoskFlutterPlugin.instance();
  final ModelLoader _modelLoader = ModelLoader();
  
  final FlutterTts _tts = FlutterTts();

  bool _isListening = false;
  String _text = '';
  bool _loading = false;

  String _selectedLocale = 'en-US';
  final List<Map<String, String>> _locales = [
    {'label': 'English', 'value': 'en-US'},
    {'label': 'Português', 'value': 'pt-BR'},
  ];

  final List<VoiceMessage> _history = [];
  final Map<int, String?> _feedbacks = {}; // index -> feedback ("positive"|"negative")

  @override
  void dispose() {
    // Clean up vosk resources
    _speechService?.stop();
    _recognizer?.dispose();
    _tts.stop();
    super.dispose();
  }

  /// Load Vosk model based on selected locale
  /// This method loads the appropriate offline STT model for the current language
  Future<void> _loadModel() async {
    try {
      // Select model based on locale
      final modelPath = _selectedLocale == 'pt-BR'
          ? 'assets/models/vosk-model-small-pt-0.3.zip'
          : 'assets/models/vosk-model-small-en-us-0.15.zip';
      
      // Load model from assets using vosk ModelLoader
      final loadedModelPath = await _modelLoader.loadFromAssets(modelPath);
      
      // Create vosk model and recognizer
      final model = await _vosk.createModel(loadedModelPath);
      _recognizer = await _vosk.createRecognizer(
        model: model, 
        sampleRate: 16000
      );
    } catch (e) {
      debugPrint('Error loading vosk model: $e');
    }
  }

  /// Start listening for speech using Vosk offline recognition
  /// This initializes the speech service and subscribes to partial and final results
  Future<void> _startListening() async {
    // Ensure model is loaded for current locale
    if (_recognizer == null) {
      await _loadModel();
    }
    
    if (_recognizer == null) return;
    
    try {
      // Initialize vosk speech service with the recognizer
      _speechService = await _vosk.initSpeechService(_recognizer!);

      // Subscribe to partial results (updates as user speaks)
      _speechService!.onPartial().forEach((partial) {
        setState(() => _text = partial);
      });

      // Subscribe to final results (when speech segment is complete)
      _speechService!.onResult().forEach((result) {
        setState(() => _text = result);
      });

      // Start the speech recognition service
      await _speechService!.start();
      setState(() => _isListening = true);
    } catch (e) {
      debugPrint('Error starting vosk speech recognition: $e');
    }
  }

  /// Stop listening and clean up speech service
  Future<void> _stopListening() async {
    if (_speechService != null) {
      await _speechService!.stop();
      _speechService = null;
    }
    setState(() => _isListening = false);
  }

  Future<void> _sendToRoommate() async {
    if (_text.trim().isEmpty) return;
    setState(() => _loading = true);
    final apiPassword = await ApiPasswordManager.getPassword();
    try {
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $apiPassword",
        },
        body: jsonEncode({"prompt": "Said: ${_text.trim()}"}),
      );
      final js = jsonDecode(response.body);
      String roommateResp = "";
      if (js['result'] != null && js['result']['message'] != null) {
        roommateResp = js['result']['message']['content'] ?? "";
      } else {
        roommateResp = js['result']?['response'] ?? js['result'].toString();
      }
      setState(() {
        _history.add(VoiceMessage(
          userPrompt: _text.trim(),
          roommateResponse: roommateResp,
          timestamp: DateTime.now(),
        ));
        _text = '';
        _loading = false;
      });
      _speak(roommateResp);
    } catch (err) {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _sendFeedback(int index, String feedbackType) async {
    final item = _history[index];
    setState(() {
      _feedbacks[index] = feedbackType;
    });
    final apiPassword = await ApiPasswordManager.getPassword();
    await http.post(
      Uri.parse(feedbackUrl),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $apiPassword",
      },
      body: jsonEncode({
        "prompt": item.userPrompt,
        "response": item.roommateResponse,
        "feedback": feedbackType,
        "ideal": null,
      }),
    );
  }

  Future _speak(String text) async {
    await _tts.setLanguage(_selectedLocale);
    await _tts.speak(text);
  }

  Widget _buildLocaleSelector() {
    return DropdownButton<String>(
      value: _selectedLocale,
      items: _locales
          .map((loc) => DropdownMenuItem<String>(
                value: loc['value'],
                child: Text(loc['label'] ?? ''),
              ))
          .toList(),
      onChanged: (val) {
        setState(() {
          _selectedLocale = val ?? 'en-US';
          // When locale changes, we need to reload the model
          _recognizer?.dispose();
          _recognizer = null;
        });
      },
      icon: const Icon(Icons.language),
      underline: Container(height: 1, color: Colors.grey),
    );
  }

  Widget _buildInputControls() {
    return Row(
      children: [
        Expanded(
          child: Card(
            color: Colors.grey[100],
            child: ListTile(
              leading: const Icon(Icons.hearing, color: Colors.deepPurple),
              title: Text(_isListening ? 'Listening...' : 'Tap mic to speak'),
              subtitle: Text(_text),
            ),
          ),
        ),
        IconButton(
          icon: Icon(
            _isListening ? Icons.stop : Icons.mic,
            color: Colors.deepPurple,
            size: 32,
          ),
          onPressed: _isListening ? _stopListening : _startListening,
        ),
        IconButton(
          icon: const Icon(Icons.send, color: Colors.blue, size: 32),
          onPressed: _loading ? null : _sendToRoommate,
        ),
      ],
    );
  }

  Widget _buildHistory() {
    return Expanded(
      child: ListView.separated(
        reverse: true,
        itemCount: _history.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, idx) {
          final index = _history.length - 1 - idx;
          final item = _history[index];
          final feedback = _feedbacks[index];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                color: Colors.white,
                child: ListTile(
                  leading: const Icon(Icons.person, color: Colors.blue),
                  title: const Text('You',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(item.userPrompt),
                  trailing: Text(
                    "${item.timestamp.hour.toString().padLeft(2, '0')}:${item.timestamp.minute.toString().padLeft(2, '0')}",
                    style: const TextStyle(color: Colors.grey),
                  ),
                ),
              ),
              Card(
                color: Colors.blue[50],
                child: ListTile(
                  leading: const Icon(Icons.smart_toy, color: Colors.blue),
                  title: const Text('Roommate',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(item.roommateResponse),
                  trailing: IconButton(
                    icon: const Icon(Icons.volume_up, color: Colors.deepPurple),
                    tooltip: 'Listen',
                    onPressed: () => _speak(item.roommateResponse),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: Icon(Icons.thumb_up,
                        color: feedback == "positive"
                            ? Colors.green
                            : Colors.grey),
                    tooltip: 'Positive Feedback',
                    onPressed: feedback == null
                        ? () => _sendFeedback(index, "positive")
                        : null,
                  ),
                  IconButton(
                    icon: Icon(Icons.thumb_down,
                        color: feedback == "negative"
                            ? Colors.red
                            : Colors.grey),
                    tooltip: 'Negative Feedback',
                    onPressed: feedback == null
                        ? () => _sendFeedback(index, "negative")
                        : null,
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: const [
            Icon(Icons.mic),
            SizedBox(width: 8),
            Text('Voice Chat with Roommate'),
          ],
        ),
        actions: [
          _buildLocaleSelector(),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            _buildInputControls(),
            const SizedBox(height: 10),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(8.0),
                child: LinearProgressIndicator(),
              ),
            const Divider(),
            _buildHistory(),
          ],
        ),
      ),
    );
  }
}
