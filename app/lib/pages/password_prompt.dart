import 'package:flutter/material.dart';
import '../api_password_manager.dart';

class PasswordPromptScreen extends StatefulWidget {
  final Function() onSuccess;
  const PasswordPromptScreen({required this.onSuccess, super.key});

  @override
  State<PasswordPromptScreen> createState() => _PasswordPromptScreenState();
}

class _PasswordPromptScreenState extends State<PasswordPromptScreen> {
  final TextEditingController _controller = TextEditingController();
  String? _error;

  Future<void> _submit() async {
    final pwd = _controller.text.trim();
    if (pwd.isEmpty) {
      setState(() => _error = "Please enter the API password.");
      return;
    }
    // TODO: add a check to test password against backend
    await ApiPasswordManager.setPassword(pwd);
    widget.onSuccess();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Enter API Password')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "Please enter your Roommate API password to continue.",
              style: TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 24),
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                labelText: "API Password",
                errorText: _error,
                border: OutlineInputBorder(),
              ),
              obscureText: true,
              onSubmitted: (_) => _submit(),
            ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              icon: Icon(Icons.vpn_key),
              label: Text("Continue"),
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}