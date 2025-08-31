import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;
import '../api_password_manager.dart';

// Use speech_to_text as fallback since vosk_flutter_2 API is causing issues
import 'package:speech_to_text/speech_to_text.dart' as stt;

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
  // Speech recognition components
  final stt.SpeechToText _speech = stt.SpeechToText();
  
  final FlutterTts _tts = FlutterTts();

  bool _isListening = false;
  String _text = '';
  bool _loading = false;
  bool _speechAvailable = false;

  String _selectedLocale = 'en-US';
  final List<Map<String, String>> _locales = [
    {'label': 'English', 'value': 'en-US'},
    {'label': 'Português', 'value': 'pt-BR'},
  ];

  final List<VoiceMessage> _history = [];
  final Map<int, String?> _feedbacks = {}; // index -> feedback ("positive"|"negative")

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  /// Initialize speech recognition
  Future<void> _initSpeech() async {
    _speechAvailable = await _speech.initialize(
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          setState(() => _isListening = false);
        }
      },
      onError: (errorNotification) {
        debugPrint('Speech recognition error: ${errorNotification.errorMsg}');
        setState(() => _isListening = false);
      },
    );
    setState(() {});
  }

  @override
  void dispose() {
    _speech.stop();
    _tts.stop();
    super.dispose();
  }

  /// Start listening for speech using speech_to_text
  Future<void> _startListening() async {
    if (!_speechAvailable) return;
    
    try {
      await _speech.listen(
        onResult: (result) {
          setState(() {
            _text = result.recognizedWords;
            if (result.finalResult) {
              _isListening = false;
            }
          });
        },
        localeId: _selectedLocale,
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 5),
        partialResults: true,
        cancelOnError: true,
      );
      setState(() => _isListening = true);
    } catch (e) {
      debugPrint('Error starting speech recognition: $e');
    }
  }

  /// Stop listening and clean up speech service
  Future<void> _stopListening() async {
    try {
      await _speech.stop();
    } catch (e) {
      debugPrint('Error stopping speech recognition: $e');
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
              title: Text(_isListening 
                  ? 'Listening...' 
                  : _speechAvailable 
                      ? 'Tap mic to speak'
                      : 'Speech not available'),
              subtitle: Text(_text),
            ),
          ),
        ),
        IconButton(
          icon: Icon(
            _isListening ? Icons.stop : Icons.mic,
            color: _speechAvailable ? Colors.deepPurple : Colors.grey,
            size: 32,
          ),
          onPressed: _speechAvailable 
              ? (_isListening ? _stopListening : _startListening)
              : null,
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
