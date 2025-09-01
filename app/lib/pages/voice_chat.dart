import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:vosk_flutter/vosk_flutter.dart';
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
  // Vosk recognition components
  SpeechService? _speechService;
  Model? _model;
  Recognizer? _recognizer;
  VoskFlutterPlugin? _vosk;

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
  void initState() {
    super.initState();
    // Vosk models are loaded on-demand when starting speech recognition
  }

  @override
  void dispose() {
    // Clean up vosk resources
    _speechService?.stop();
    _recognizer?.dispose();
    _model?.dispose();
    _tts.stop();
    super.dispose();
  }

  /// Load Vosk model based on selected locale
  /// This method loads the appropriate offline STT model for the current language
  Future<void> _loadModel() async {
    try {
      // Initialize vosk plugin lazily when first needed
      _vosk ??= VoskFlutterPlugin.instance();
      
      // Select model based on locale
      final modelPath = _selectedLocale == 'pt-BR'
          ? 'assets/models/vosk-model-small-pt-0.3.zip'
          : 'assets/models/vosk-model-small-en-us-0.15.zip';

      // Load model from assets using vosk ModelLoader
      final modelLoader = ModelLoader();
      final loadedModelPath = await modelLoader.loadFromAssets(modelPath);

      // Create vosk model
      _model = await _vosk!.createModel(loadedModelPath);
    } catch (e) {
      debugPrint('Error loading vosk model: $e');
    }
  }

  /// Start listening for speech using Vosk offline recognition
  /// This initializes the speech service and subscribes to partial and final results
  Future<void> _startListening() async {
    // Ensure model is loaded for current locale
    if (_model == null) {
      await _loadModel();
    }

    if (_model == null) return;

    try {
      // Create recognizer from model
      _recognizer = await _vosk!.createRecognizer(model: _model!, sampleRate: 16000);

      // Initialize vosk speech service with the recognizer
      _speechService = await _vosk!.initSpeechService(_recognizer!);

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
    final theme = Theme.of(context);
    
    return DropdownButton<String>(
      value: _selectedLocale,
      items: _locales
          .map((loc) => DropdownMenuItem<String>(
                value: loc['value'],
                child: Text(
                  loc['label'] ?? '',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ))
          .toList(),
      onChanged: (val) {
        setState(() {
          _selectedLocale = val ?? 'en-US';
        });
      },
      icon: const Icon(Icons.language_rounded, color: Colors.white, size: 20),
      underline: Container(),
      dropdownColor: Colors.deepPurple.shade700,
    );
  }

  Widget _buildInputControls() {
    final theme = Theme.of(context);
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.surfaceVariant,
            theme.colorScheme.surfaceVariant.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: _isListening 
                            ? Colors.red.withOpacity(0.2)
                            : Colors.deepPurple.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.hearing_rounded,
                        color: _isListening ? Colors.red : Colors.deepPurple,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _isListening ? 'Listening...' : 'Tap mic to speak',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                if (_text.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: theme.colorScheme.outline.withOpacity(0.2),
                      ),
                    ),
                    child: Text(
                      _text,
                      style: TextStyle(
                        fontSize: 14,
                        color: theme.colorScheme.onSurface,
                        fontStyle: _isListening ? FontStyle.italic : FontStyle.normal,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 16),
          Column(
            children: [
              AnimatedScale(
                duration: const Duration(milliseconds: 200),
                scale: _isListening ? 1.1 : 1.0,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _isListening ? _stopListening : _startListening,
                    borderRadius: BorderRadius.circular(25),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: _isListening 
                              ? [Colors.red, Colors.red.withOpacity(0.8)]
                              : [Colors.deepPurple, Colors.deepPurple.withOpacity(0.8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: (_isListening ? Colors.red : Colors.deepPurple)
                                .withOpacity(0.4),
                            blurRadius: _isListening ? 12 : 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Icon(
                        _isListening ? Icons.stop_rounded : Icons.mic_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              AnimatedScale(
                duration: const Duration(milliseconds: 150),
                scale: _loading ? 0.9 : 1.0,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _loading ? null : _sendToRoommate,
                    borderRadius: BorderRadius.circular(25),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.primary,
                            theme.colorScheme.primary.withOpacity(0.8),
                          ],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.primary.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.send_rounded,
                        color: theme.colorScheme.onPrimary,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistory() {
    final theme = Theme.of(context);
    
    return Expanded(
      child: ListView.separated(
        reverse: true,
        padding: const EdgeInsets.all(16),
        itemCount: _history.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, idx) {
          final index = _history.length - 1 - idx;
          final item = _history[index];
          final feedback = _feedbacks[index];
          
          return TweenAnimationBuilder<double>(
            duration: Duration(milliseconds: 400 + (idx * 50)),
            tween: Tween(begin: 0.0, end: 1.0),
            curve: Curves.easeOutBack,
            builder: (context, value, child) {
              return Transform.translate(
                offset: Offset(0, 30 * (1 - value)),
                child: Opacity(
                  opacity: value,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // User message
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.person_rounded,
                                color: theme.colorScheme.primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      theme.colorScheme.primary,
                                      theme.colorScheme.primary.withOpacity(0.8),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.1),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Text(
                                  item.userPrompt,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w500,
                                    color: theme.colorScheme.onPrimary,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.surfaceVariant,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                "${item.timestamp.hour.toString().padLeft(2, '0')}:${item.timestamp.minute.toString().padLeft(2, '0')}",
                                style: TextStyle(
                                  color: theme.colorScheme.onSurfaceVariant,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Roommate response
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.secondaryContainer,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.smart_toy_rounded,
                                color: theme.colorScheme.onSecondaryContainer,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      theme.colorScheme.secondaryContainer,
                                      theme.colorScheme.secondaryContainer.withOpacity(0.8),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.1),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Text(
                                  item.roommateResponse,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w500,
                                    color: theme.colorScheme.onSecondaryContainer,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => _speak(item.roommateResponse),
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.deepPurple.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Icon(
                                    Icons.volume_up_rounded,
                                    color: Colors.deepPurple,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Feedback buttons
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.only(left: 52),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            _buildFeedbackButton(
                              icon: Icons.thumb_up_rounded,
                              isSelected: feedback == "positive",
                              selectedColor: Colors.green,
                              onPressed: feedback == null
                                  ? () => _sendFeedback(index, "positive")
                                  : null,
                              tooltip: 'Helpful response',
                            ),
                            const SizedBox(width: 12),
                            _buildFeedbackButton(
                              icon: Icons.thumb_down_rounded,
                              isSelected: feedback == "negative",
                              selectedColor: Colors.red,
                              onPressed: feedback == null
                                  ? () => _sendFeedback(index, "negative")
                                  : null,
                              tooltip: 'Needs improvement',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildFeedbackButton({
    required IconData icon,
    required bool isSelected,
    required Color selectedColor,
    required VoidCallback? onPressed,
    required String tooltip,
  }) {
    final theme = Theme.of(context);
    
    return AnimatedScale(
      duration: const Duration(milliseconds: 150),
      scale: isSelected ? 1.1 : 1.0,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(20),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isSelected 
                  ? selectedColor.withOpacity(0.1)
                  : theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected 
                    ? selectedColor.withOpacity(0.3)
                    : theme.colorScheme.outline.withOpacity(0.2),
                width: 1,
              ),
              boxShadow: isSelected ? [
                BoxShadow(
                  color: selectedColor.withOpacity(0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ] : [],
            ),
            child: Icon(
              icon,
              size: 18,
              color: isSelected 
                  ? selectedColor
                  : theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.deepPurple,
                Colors.deepPurple.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.mic_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Voice Chat',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 20,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: _buildLocaleSelector(),
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.surface,
              theme.colorScheme.surfaceVariant.withOpacity(0.3),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: 16),
            _buildInputControls(),
            const SizedBox(height: 16),
            if (_loading)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.deepPurple.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(
                    color: Colors.deepPurple.withOpacity(0.2),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.deepPurple),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Processing voice input...',
                      style: TextStyle(
                        color: Colors.deepPurple,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
            _buildHistory(),
          ],
        ),
      ),
    );
  }
}
