import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/annonces_screen.dart';
import 'screens/top_screen.dart';
import 'screens/categories_screen.dart';
import 'screens/mes_annonces_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/account_screen.dart';
import 'screens/compose_screen.dart';
import 'services/auth_provider.dart';
import 'theme/colors.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const SnapyApp(),
    ),
  );
}

class SnapyApp extends StatelessWidget {
  const SnapyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Snapy',
      debugShowCheckedModeBanner: false,
      theme: buildSnapyTheme(),
      home: const HomeShell(),
    );
  }
}

const _titles = ['Snapy', 'Top annonces', 'Catégories', 'Mes annonces'];

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  final _screens = const [AnnoncesScreen(), TopScreen(), CategoriesScreen(), MesAnnoncesScreen()];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>().auth;

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
            icon: const Text('＋', style: TextStyle(fontSize: 20, color: SnapyColors.paper)),
            onPressed: () {
              if (auth != null) {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ComposeScreen()));
              } else {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen()));
              }
            },
          ),
          IconButton(
            icon: Text(auth != null ? '🏪' : '👤', style: const TextStyle(fontSize: 18)),
            onPressed: () {
              if (auth != null) {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AccountScreen()));
              } else {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen()));
              }
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Text('📰'), label: 'Annonces'),
          BottomNavigationBarItem(icon: Text('🔥'), label: 'Top'),
          BottomNavigationBarItem(icon: Text('🗂️'), label: 'Catégories'),
          BottomNavigationBarItem(icon: Text('🏪'), label: 'Mes annonces'),
        ],
      ),
    );
  }
}
