import 'package:flutter/material.dart';
import 'voice_chat.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../api_password_manager.dart';

const feedbackUrl = "http://localhost:3000/feedback";
const apiUrl = "http://localhost:3000/chat";

class ChatMessage {
  final String text;
  final bool isUser;
  ChatMessage({required this.text, required this.isUser});
}

class ChatRoommateScreen extends StatefulWidget {
  const ChatRoommateScreen({super.key});

  @override
  ChatRoommateScreenState createState() => ChatRoommateScreenState();
}

class ChatRoommateScreenState extends State<ChatRoommateScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<ChatMessage> _messages = [];
  final Map<int, String?> _feedbacks = {}; // index -> feedback
  bool _loading = false;

  Future<void> _sendMessage() async {
    String input = _controller.text.trim();
    if (input.isEmpty) return;
    setState(() {
      _messages.add(ChatMessage(text: input, isUser: true));
      _controller.clear();
      _loading = true;
    });

    final apiPassword = await ApiPasswordManager.getPassword();

    try {
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $apiPassword",
        },
        body: jsonEncode({
          "prompt": "Said: $input"
        }),
      );

      final js = jsonDecode(response.body);
      String roommateResp = "";
      if (js['result'] != null && js['result']['message'] != null) {
        roommateResp = js['result']['message']['content'] ?? "";
      } else {
        roommateResp = js['result']?['response'] ?? js['result'].toString();
      }
      setState(() {
        _messages.add(ChatMessage(text: roommateResp, isUser: false));
      });
    } catch (err) {
      setState(() {
        _messages.add(ChatMessage(text: "Roommate: Sorry, something went wrong.", isUser: false));
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  void _openVoiceChat() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => VoiceChatScreen()),
    );
  }

  Future<void> _sendFeedback(int index, String feedbackType) async {
    final msg = _messages[index];
    final prevUserMsg = index > 0 ? _messages[index - 1].text : "";
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
        "prompt": prevUserMsg,
        "response": msg.text,
        "feedback": feedbackType,
        "ideal": null,
      }),
    );
  }

  Widget _buildMessage(ChatMessage msg, int index) {
    final feedback = _feedbacks[index];
    final isRoommate = !msg.isUser;
    final theme = Theme.of(context);
    
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
      child: Column(
        crossAxisAlignment:
            msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment:
                msg.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isRoommate)
                Container(
                  margin: const EdgeInsets.only(right: 12, top: 4),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.smart_toy_rounded,
                    color: theme.colorScheme.primary,
                    size: 20,
                  ),
                ),
              Flexible(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: msg.isUser
                        ? LinearGradient(
                            colors: [
                              theme.colorScheme.primary,
                              theme.colorScheme.primary.withOpacity(0.8),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : LinearGradient(
                            colors: [
                              theme.colorScheme.surfaceVariant,
                              theme.colorScheme.surfaceVariant.withOpacity(0.8),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: msg.isUser ? const Radius.circular(20) : const Radius.circular(4),
                      bottomRight: msg.isUser ? const Radius.circular(4) : const Radius.circular(20),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    msg.text,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w400,
                      color: msg.isUser 
                          ? theme.colorScheme.onPrimary
                          : theme.colorScheme.onSurfaceVariant,
                      height: 1.4,
                    ),
                  ),
                ),
              ),
              if (msg.isUser)
                Container(
                  margin: const EdgeInsets.only(left: 12, top: 4),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.person_rounded,
                    color: theme.colorScheme.primary,
                    size: 20,
                  ),
                ),
            ],
          ),
          if (isRoommate)
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.only(left: 52, top: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildFeedbackButton(
                    icon: Icons.thumb_up_rounded,
                    isSelected: feedback == "positive",
                    selectedColor: Colors.green,
                    onPressed: feedback == null ? () => _sendFeedback(index, "positive") : null,
                    tooltip: 'Helpful response',
                  ),
                  const SizedBox(width: 8),
                  _buildFeedbackButton(
                    icon: Icons.thumb_down_rounded,
                    isSelected: feedback == "negative", 
                    selectedColor: Colors.red,
                    onPressed: feedback == null ? () => _sendFeedback(index, "negative") : null,
                    tooltip: 'Needs improvement',
                  ),
                ],
              ),
            ),
        ],
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
                theme.colorScheme.primary,
                theme.colorScheme.primary.withOpacity(0.8),
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
              child: Icon(
                Icons.smart_toy_rounded,
                color: theme.colorScheme.onPrimary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Roommate Chat',
              style: TextStyle(
                color: theme.colorScheme.onPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 20,
              ),
            ),
          ],
        ),
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
            Expanded(
              child: ListView.builder(
                reverse: true,
                padding: const EdgeInsets.symmetric(vertical: 16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[_messages.length - 1 - index];
                  final realIdx = _messages.length - 1 - index;
                  return TweenAnimationBuilder<double>(
                    duration: Duration(milliseconds: 300 + (index * 50)),
                    tween: Tween(begin: 0.0, end: 1.0),
                    curve: Curves.easeOutBack,
                    builder: (context, value, child) {
                      return Transform.translate(
                        offset: Offset(0, 20 * (1 - value)),
                        child: Opacity(
                          opacity: value,
                          child: _buildMessage(msg, realIdx),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            if (_loading)
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Roommate is thinking...',
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            _buildInputArea(),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(
                    color: theme.colorScheme.outline.withOpacity(0.2),
                  ),
                ),
                child: TextField(
                  controller: _controller,
                  onSubmitted: (_) => _sendMessage(),
                  style: TextStyle(
                    fontSize: 16,
                    color: theme.colorScheme.onSurface,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Type your message...',
                    hintStyle: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            AnimatedScale(
              duration: const Duration(milliseconds: 150),
              scale: _loading ? 0.9 : 1.0,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _loading ? null : _sendMessage,
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
                      borderRadius: BorderRadius.circular(25),
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
            const SizedBox(width: 8),
            AnimatedScale(
              duration: const Duration(milliseconds: 150),
              scale: 1.0,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _openVoiceChat,
                  borderRadius: BorderRadius.circular(25),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.deepPurple,
                          Colors.deepPurple.withOpacity(0.8),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.deepPurple.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.mic_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}