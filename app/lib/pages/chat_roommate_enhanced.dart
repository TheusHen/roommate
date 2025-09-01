import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../api_password_manager.dart';
import '../grabber/grabber.dart'; // Import the new Grabber module

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
  final Map<int, String?> _feedbacks = {};
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
      // Use Grabber to enrich the prompt with user context
      String enrichedPrompt;
      try {
        // Use a default user ID - in a real app this would come from authentication
        const userId = 'default-user';
        enrichedPrompt = await Grabber.enrichPrompt(userId, input, apiPassword ?? '');
        // Use error tracking instead of print for production
      } catch (grabberError) {
        // Use error tracking instead of print for production
        enrichedPrompt = input; // Fallback to original prompt
      }

      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $apiPassword",
        },
        body: jsonEncode({
          "prompt": enrichedPrompt // Use enriched prompt instead of raw input
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

  // ... rest of the existing methods remain the same ...
  
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
                    Icons.psychology_rounded,
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
                              theme.colorScheme.secondaryContainer,
                              theme.colorScheme.secondaryContainer.withOpacity(0.8),
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
                          : theme.colorScheme.onSecondaryContainer,
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
          if (isRoommate && feedback == null)
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.only(left: 52, top: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildFeedbackButton(
                    icon: Icons.thumb_up_rounded,
                    onPressed: () => _sendFeedback(index, "positive"),
                    color: Colors.green,
                    tooltip: 'Helpful response',
                  ),
                  const SizedBox(width: 8),
                  _buildFeedbackButton(
                    icon: Icons.thumb_down_rounded,
                    onPressed: () => _sendFeedback(index, "negative"),
                    color: Colors.red,
                    tooltip: 'Needs improvement',
                  ),
                ],
              ),
            ),
          if (feedback != null)
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.only(left: 52, top: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: feedback == "positive" 
                    ? Colors.green.withOpacity(0.1) 
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: feedback == "positive" 
                      ? Colors.green.withOpacity(0.3)
                      : Colors.red.withOpacity(0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    feedback == "positive" ? Icons.check_circle_rounded : Icons.cancel_rounded,
                    size: 16,
                    color: feedback == "positive" ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    "Feedback: $feedback",
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: feedback == "positive" ? Colors.green.shade700 : Colors.red.shade700,
                    ),
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
    required VoidCallback onPressed,
    required Color color,
    required String tooltip,
  }) {
    final theme = Theme.of(context);
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: theme.colorScheme.outline.withOpacity(0.2),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Icon(
            icon,
            size: 16,
            color: color.withOpacity(0.7),
          ),
        ),
      ),
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
                theme.colorScheme.secondary,
                theme.colorScheme.secondary.withOpacity(0.8),
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
                Icons.psychology_rounded,
                color: theme.colorScheme.onSecondary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Enhanced Chat',
                    style: TextStyle(
                      color: theme.colorScheme.onSecondary,
                      fontWeight: FontWeight.w600,
                      fontSize: 18,
                    ),
                  ),
                  Text(
                    'with memory & context',
                    style: TextStyle(
                      color: theme.colorScheme.onSecondary.withOpacity(0.8),
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
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
                  final msgIndex = _messages.length - 1 - index;
                  return TweenAnimationBuilder<double>(
                    duration: Duration(milliseconds: 300 + (index * 50)),
                    tween: Tween(begin: 0.0, end: 1.0),
                    curve: Curves.easeOutBack,
                    builder: (context, value, child) {
                      return Transform.translate(
                        offset: Offset(0, 20 * (1 - value)),
                        child: Opacity(
                          opacity: value,
                          child: _buildMessage(_messages[msgIndex], msgIndex),
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
                  color: theme.colorScheme.secondaryContainer.withOpacity(0.7),
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
                        valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.secondary),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Processing with enhanced context...',
                      style: TextStyle(
                        color: theme.colorScheme.onSecondaryContainer,
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
                    hintText: 'Type your message... (e.g., "My dog\'s name is Duke")',
                    hintStyle: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
                      fontSize: 14,
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
                          theme.colorScheme.secondary,
                          theme.colorScheme.secondary.withOpacity(0.8),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: [
                        BoxShadow(
                          color: theme.colorScheme.secondary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.send_rounded,
                      color: theme.colorScheme.onSecondary,
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