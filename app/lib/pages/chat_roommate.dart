import 'package:flutter/material.dart';
import 'voice_chat.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../api_password_manager.dart';

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
  Map<int, String?> _feedbacks = {}; // index -> feedback
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
        Uri.parse(API_URL),
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

  Widget _buildMessage(ChatMessage msg, int index) {
    final feedback = _feedbacks[index];
    final isRoommate = !msg.isUser;
    return Column(
      crossAxisAlignment:
          msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment:
              msg.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isRoommate)
              Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: Icon(Icons.smart_toy, color: Colors.grey[700]),
              ),
            Flexible(
              child: Container(
                margin: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: msg.isUser ? Colors.blue[200] : Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  msg.text,
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),
            if (msg.isUser)
              Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Icon(Icons.person, color: Colors.blue[700]),
              ),
          ],
        ),
        if (isRoommate)
          Padding(
            padding: const EdgeInsets.only(left: 32.0, top: 2.0),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(Icons.thumb_up,
                      color: feedback == "positive" ? Colors.green : Colors.grey),
                  tooltip: 'Positive Feedback',
                  onPressed: feedback == null ? () => _sendFeedback(index, "positive") : null,
                ),
                IconButton(
                  icon: Icon(Icons.thumb_down,
                      color: feedback == "negative" ? Colors.red : Colors.grey),
                  tooltip: 'Negative Feedback',
                  onPressed: feedback == null ? () => _sendFeedback(index, "negative") : null,
                ),
              ],
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.smart_toy),
            SizedBox(width: 8),
            Text('Roommate Chat'),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[_messages.length - 1 - index];
                final realIdx = _messages.length - 1 - index;
                return _buildMessage(msg, realIdx);
              },
            ),
          ),
          if (_loading)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: LinearProgressIndicator(),
            ),
          Divider(height: 1),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    onSubmitted: (_) => _sendMessage(),
                    decoration: InputDecoration.collapsed(
                      hintText: 'Type your message...',
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send, color: Colors.blue),
                  onPressed: _loading ? null : _sendMessage,
                ),
                IconButton(
                  icon: Icon(Icons.mic, color: Colors.deepPurple),
                  onPressed: _openVoiceChat,
                  tooltip: 'Voice Chat',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}