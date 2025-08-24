import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;
import '../api_password_manager.dart';

const API_URL = "http://localhost:3000/chat";
const FEEDBACK_URL = "http://localhost:3000/feedback";

class VoiceMessage {
  final String userPrompt;
  final String roommateResponse;
  final DateTime timestamp;
  VoiceMessage({required this.userPrompt, required this.roommateResponse, required this.timestamp});
}

class VoiceChatScreen extends StatefulWidget {
  @override
  State<VoiceChatScreen> createState() => _VoiceChatScreenState();
}

class _VoiceChatScreenState extends State<VoiceChatScreen> {
  stt.SpeechToText _speech = stt.SpeechToText();
  FlutterTts _tts = FlutterTts();

  bool _isListening = false;
  String _text = '';
  String _response = '';
  bool _loading = false;

  String _selectedLocale = 'en-US';
  final List<Map<String, String>> _locales = [
    {'label': 'English', 'value': 'en-US'},
    {'label': 'Português', 'value': 'pt-BR'},
  ];

  List<VoiceMessage> _history = [];
  Map<int, String?> _feedbacks = {}; // index -> feedback ("positive"|"negative")

  @override
  void dispose() {
    _speech.stop();
    _tts.stop();
    super.dispose();
  }

  Future<void> _startListening() async {
    bool available = await _speech.initialize();
    if (available) {
      setState(() => _isListening = true);
      await _speech.listen(
        localeId: _selectedLocale,
        listenMode: stt.ListenMode.dictation,
        onResult: (result) {
          setState(() {
            _text = result.recognizedWords;
          });
        },
      );
    }
  }

  Future<void> _stopListening() async {
    await _speech.stop();
    setState(() => _isListening = false);
  }

  Future<void> _sendToRoommate() async {
    if (_text.trim().isEmpty) return;
    setState(() => _loading = true);
    final apiPassword = await ApiPasswordManager.getPassword();
    try {
      final response = await http.post(
        Uri.parse(API_URL),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $apiPassword",
        },
        body: jsonEncode({ "prompt": "Said: ${_text.trim()}" }),
      );
      final js = jsonDecode(response.body);
      String roommateResp = "";
      if (js['result'] != null && js['result']['message'] != null) {
        roommateResp = js['result']['message']['content'] ?? "";
      } else {
        roommateResp = js['result']?['response'] ?? js['result'].toString();
      }
      setState(() {
        _response = roommateResp;
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
        _response = "Roommate: Sorry, something went wrong.";
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
      Uri.parse(FEEDBACK_URL),
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
      icon: Icon(Icons.language),
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
              leading: Icon(Icons.hearing, color: Colors.deepPurple),
              title: Text(_isListening ? 'Listening...' : 'Tap mic to speak'),
              subtitle: Text(_text),
            ),
          ),
        ),
        IconButton(
          icon: Icon(_isListening ? Icons.stop : Icons.mic, color: Colors.deepPurple, size: 32),
          onPressed: _isListening ? _stopListening : _startListening,
        ),
        IconButton(
          icon: Icon(Icons.send, color: Colors.blue, size: 32),
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
        separatorBuilder: (_, __) => SizedBox(height: 8),
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
                  leading: Icon(Icons.person, color: Colors.blue),
                  title: Text('You', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(item.userPrompt),
                  trailing: Text(
                    "${item.timestamp.hour.toString().padLeft(2, '0')}:${item.timestamp.minute.toString().padLeft(2, '0')}",
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ),
              Card(
                color: Colors.blue[50],
                child: ListTile(
                  leading: Icon(Icons.smart_toy, color: Colors.blue),
                  title: Text('Roommate', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(item.roommateResponse),
                  trailing: IconButton(
                    icon: Icon(Icons.volume_up, color: Colors.deepPurple),
                    tooltip: 'Listen',
                    onPressed: () => _speak(item.roommateResponse),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: Icon(Icons.thumb_up, color: feedback == "positive" ? Colors.green : Colors.grey),
                    tooltip: 'Positive Feedback',
                    onPressed: feedback == null ? () => _sendFeedback(index, "positive") : null,
                  ),
                  IconButton(
                    icon: Icon(Icons.thumb_down, color: feedback == "negative" ? Colors.red : Colors.grey),
                    tooltip: 'Negative Feedback',
                    onPressed: feedback == null ? () => _sendFeedback(index, "negative") : null,
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
          children: [
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
            SizedBox(height: 10),
            if (_loading)
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: LinearProgressIndicator(),
              ),
            Divider(),
            _buildHistory(),
          ],
        ),
      ),
    );
  }
}