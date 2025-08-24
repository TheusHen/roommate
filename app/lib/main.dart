import 'package:flutter/material.dart';
import 'api_password_manager.dart';
import 'pages/password_prompt.dart';
import 'pages/chat_roommate.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Roommate Chat',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: PasswordGate(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class PasswordGate extends StatefulWidget {
  const PasswordGate({super.key});
  @override
  State<PasswordGate> createState() => _PasswordGateState();
}

class _PasswordGateState extends State<PasswordGate> {
  bool _hasPassword = false;

  @override
  void initState() {
    super.initState();
    _checkPassword();
  }

  Future<void> _checkPassword() async {
    final pwd = await ApiPasswordManager.getPassword();
    setState(() => _hasPassword = pwd != null && pwd.isNotEmpty);
  }

  void _onPasswordSet() {
    setState(() => _hasPassword = true);
  }

  @override
  Widget build(BuildContext context) {
    return _hasPassword
        ? ChatRoommateScreen()
        : PasswordPromptScreen(onSuccess: _onPasswordSet);
  }
}