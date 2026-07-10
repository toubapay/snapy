import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'auth.dart';
import 'screens/root_shell.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authProvider = AuthProvider();
  await authProvider.load();
  runApp(ChangeNotifierProvider.value(value: authProvider, child: const SnapyApp()));
}

class SnapyApp extends StatelessWidget {
  const SnapyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Snapy',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const RootShell(),
    );
  }
}
