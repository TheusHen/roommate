import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../api_password_manager.dart';
import '../grabber/grabber.dart'; // Import the new Grabber module

const FEEDBACK_URL = "http://localhost:3000/feedback";
const API_URL = "http://localhost:3000/chat";

class ChatMessage {
  final String text;
  final bool isUser;
  ChatMessage({required this.text, required this.isUser});
}

class ChatRoommateScreen extends StatefulWidget {
  @override
  _ChatRoommateScreenState createState() => _ChatRoommateScreenState();
}

class _ChatRoommateScreenState extends State<ChatRoommateScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<ChatMessage> _messages = [];
  Map<int, String?> _feedbacks = {};
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
        print('[ChatRoommate] Enriched prompt: $enrichedPrompt');
      } catch (grabberError) {
        print('[ChatRoommate] Grabber enrichment failed: $grabberError');
        enrichedPrompt = input; // Fallback to original prompt
      }

      final response = await http.post(
        Uri.parse(API_URL),
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
    return Column(
      crossAxisAlignment:
          msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Container(
          margin: EdgeInsets.symmetric(vertical: 4),
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: msg.isUser ? Colors.blue[100] : Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(msg.text),
        ),
        if (isRoommate && feedback == null)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: Icon(Icons.thumb_up, size: 16),
                onPressed: () => _sendFeedback(index, "positive"),
              ),
              IconButton(
                icon: Icon(Icons.thumb_down, size: 16),
                onPressed: () => _sendFeedback(index, "negative"),
              ),
            ],
          ),
        if (feedback != null)
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: feedback == "positive" ? Colors.green[100] : Colors.red[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              "Feedback: $feedback",
              style: TextStyle(fontSize: 12),
            ),
          ),
      ],
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
      Uri.parse(FEEDBACK_URL),
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
    return Scaffold(
      appBar: AppBar(
        title: Text('Chat with Roommate'),
        subtitle: Text('Enhanced with user memory'),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              padding: EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msgIndex = _messages.length - 1 - index;
                return _buildMessage(_messages[msgIndex], msgIndex);
              },
            ),
          ),
          if (_loading)
            Padding(
              padding: EdgeInsets.all(8),
              child: LinearProgressIndicator(),
            ),
          Container(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Type your message... (e.g., "My dog\'s name is Duke")',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                SizedBox(width: 8),
                FloatingActionButton(
                  onPressed: _loading ? null : _sendMessage,
                  child: Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}